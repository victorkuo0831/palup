import { Queue, Worker, FlowProducer, type Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "../db";
import { workflowRuns, workflowSteps } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { type AgentInput, type AgentOutput, type AgentEvent } from "../agents/base";
import { agentFactory } from "../agents/registry";

// ─── Redis Connection ─────────────────────────────────────────

let redisConnection: IORedis | null = null;

function getRedis(): IORedis {
  if (!redisConnection) {
    redisConnection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return redisConnection;
}

// ─── Queues ───────────────────────────────────────────────────

const WORKFLOW_QUEUE = "palup:workflow";
const AGENT_QUEUE_PREFIX = "palup:agent:";

export function getWorkflowQueue(): Queue {
  return new Queue(WORKFLOW_QUEUE, { connection: getRedis() });
}

export function getAgentQueue(agentType: string): Queue {
  return new Queue(`${AGENT_QUEUE_PREFIX}${agentType}`, {
    connection: getRedis(),
  });
}

// ─── DAG Types ────────────────────────────────────────────────

export interface DAGNode {
  id: string;
  agentType: string;
  input: Record<string, unknown>;
  dependsOn: string[]; // IDs of nodes this depends on
}

export interface DAG {
  nodes: DAGNode[];
}

// ─── Workflow Executor ────────────────────────────────────────

export async function startWorkflow(
  workflowRunId: string,
  dag: DAG,
  orgId: string,
  goalId: string
): Promise<void> {
  // Update workflow status to running
  await db
    .update(workflowRuns)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(workflowRuns.id, workflowRunId));

  // Create workflow steps in DB
  for (let i = 0; i < dag.nodes.length; i++) {
    const node = dag.nodes[i];
    const hasUnmetDeps = node.dependsOn.length > 0;

    await db.insert(workflowSteps).values({
      workflowRunId,
      agentType: node.agentType as any,
      stepOrder: i,
      dependsOn: node.dependsOn,
      input: node.input,
      status: hasUnmetDeps ? "blocked" : "pending",
    });
  }

  // Enqueue all steps that have no dependencies (ready to run)
  const readyNodes = dag.nodes.filter((n) => n.dependsOn.length === 0);
  for (const node of readyNodes) {
    await enqueueAgentStep(workflowRunId, node, orgId, goalId);
  }
}

async function enqueueAgentStep(
  workflowRunId: string,
  node: DAGNode,
  orgId: string,
  goalId: string,
  context?: Record<string, unknown>
): Promise<void> {
  const queue = getAgentQueue(node.agentType);

  // Find the step ID from the DB
  const steps = await db
    .select()
    .from(workflowSteps)
    .where(
      and(
        eq(workflowSteps.workflowRunId, workflowRunId),
        eq(workflowSteps.agentType, node.agentType as any)
      )
    );

  const step = steps[0];
  if (!step) return;

  // Update step status to running
  await db
    .update(workflowSteps)
    .set({ status: "running", startedAt: new Date() })
    .where(eq(workflowSteps.id, step.id));

  const agentInput: AgentInput = {
    workflowRunId,
    stepId: step.id,
    orgId,
    goalId,
    data: node.input,
    context,
  };

  await queue.add(node.agentType, agentInput, {
    jobId: `${workflowRunId}:${node.id}`,
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
  });
}

// ─── Step Completion Handler ──────────────────────────────────

export async function onStepComplete(
  workflowRunId: string,
  completedNodeId: string,
  output: AgentOutput,
  dag: DAG,
  orgId: string,
  goalId: string
): Promise<void> {
  // Find the step and update it
  const steps = await db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.workflowRunId, workflowRunId));

  const completedStep = steps.find((s) => s.id === completedNodeId);
  if (!completedStep) return;

  // Update step as completed
  await db
    .update(workflowSteps)
    .set({
      status: output.success ? "completed" : "failed",
      output: output.data,
      confidence: output.confidence,
      errorMessage: output.error,
      completedAt: new Date(),
    })
    .where(eq(workflowSteps.id, completedNodeId));

  if (!output.success) {
    // Check retry count
    if (completedStep.retryCount < completedStep.maxRetries) {
      await db
        .update(workflowSteps)
        .set({
          status: "pending",
          retryCount: completedStep.retryCount + 1,
        })
        .where(eq(workflowSteps.id, completedNodeId));

      const node = dag.nodes.find(
        (n) => n.agentType === completedStep.agentType
      );
      if (node) {
        await enqueueAgentStep(workflowRunId, node, orgId, goalId);
      }
      return;
    }

    // Max retries exceeded → fail the workflow
    await db
      .update(workflowRuns)
      .set({
        status: "failed",
        errorMessage: `Step ${completedStep.agentType} failed after ${completedStep.maxRetries} retries: ${output.error}`,
        completedAt: new Date(),
      })
      .where(eq(workflowRuns.id, workflowRunId));
    return;
  }

  // Check if all steps are complete
  const allSteps = await db
    .select()
    .from(workflowSteps)
    .where(eq(workflowSteps.workflowRunId, workflowRunId));

  const allComplete = allSteps.every(
    (s) => s.status === "completed" || s.status === "skipped"
  );

  if (allComplete) {
    await db
      .update(workflowRuns)
      .set({ status: "completed", completedAt: new Date() })
      .where(eq(workflowRuns.id, workflowRunId));
    return;
  }

  // Unblock dependent steps
  const completedAgentType = completedStep.agentType;
  const completedOutputs: Record<string, unknown> = {};

  // Gather outputs from all completed steps for context
  for (const step of allSteps) {
    if (step.status === "completed" && step.output) {
      completedOutputs[step.agentType] = step.output;
    }
  }

  // Find nodes that depended on the completed step and now have all deps met
  for (const node of dag.nodes) {
    if (!node.dependsOn.includes(completedAgentType)) continue;

    // Check if ALL dependencies are now complete
    const depsComplete = node.dependsOn.every((depType) =>
      allSteps.some(
        (s) => s.agentType === depType && s.status === "completed"
      )
    );

    if (depsComplete) {
      const step = allSteps.find(
        (s) => s.agentType === node.agentType && s.status === "blocked"
      );
      if (step) {
        await db
          .update(workflowSteps)
          .set({ status: "pending" })
          .where(eq(workflowSteps.id, step.id));

        await enqueueAgentStep(
          workflowRunId,
          node,
          orgId,
          goalId,
          completedOutputs
        );
      }
    }
  }
}

// ─── Agent Worker Factory ─────────────────────────────────────

export function createAgentWorker(agentType: string): Worker {
  const queueName = `${AGENT_QUEUE_PREFIX}${agentType}`;

  return new Worker(
    queueName,
    async (job: Job<AgentInput>) => {
      const agent = agentFactory(agentType);
      if (!agent) {
        throw new Error(`Unknown agent type: ${agentType}`);
      }

      // Set up event callback for real-time progress
      agent.setEventCallback(async (event: AgentEvent) => {
        // Publish to Redis Streams for real-time UI updates
        try {
          const redis = getRedis();
          await redis.xadd(
            `palup:events:${event.workflowRunId}`,
            "*",
            "data",
            JSON.stringify(event)
          );
        } catch {
          // Non-critical: log and continue
        }
      });

      const output = await agent.execute(job.data);

      // Fetch the DAG from the workflow run to advance the workflow
      const runs = await db
        .select()
        .from(workflowRuns)
        .where(eq(workflowRuns.id, job.data.workflowRunId));

      if (runs.length > 0) {
        const run = runs[0];
        // We need to get the DAG from the goal plan
        // For now, store it in the job data or fetch from DB
        // This will be enhanced when we build the full plan resolver
      }

      return output;
    },
    {
      connection: getRedis(),
      concurrency: 5,
    }
  );
}
