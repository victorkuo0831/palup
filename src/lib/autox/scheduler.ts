import { Queue, Worker, type Job } from "bullmq";
import IORedis from "ioredis";
import { db } from "../db";
import { anomalyAlerts, debugSessions } from "../db/schema";
import { eq, and } from "drizzle-orm";
import { agentFactory } from "../agents/registry";
import type { AgentInput } from "../agents/base";

// ─── Redis Connection ────────────────────────────────────────────

let redis: IORedis | null = null;

function getRedis(): IORedis {
  if (!redis) {
    redis = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
      maxRetriesPerRequest: null,
    });
  }
  return redis;
}

// ─── Queue Names ─────────────────────────────────────────────────

const QUEUES = {
  monitor: "palup-autox-monitor",
  debugFix: "palup-autox-debug-fix",
  evolution: "palup-autox-evolution",
  deploy: "palup-autox-deploy",
} as const;

// ─── Queue Getters ───────────────────────────────────────────────

export function getMonitorQueue(): Queue {
  return new Queue(QUEUES.monitor, { connection: getRedis() });
}

export function getDebugFixQueue(): Queue {
  return new Queue(QUEUES.debugFix, { connection: getRedis() });
}

export function getEvolutionQueue(): Queue {
  return new Queue(QUEUES.evolution, { connection: getRedis() });
}

export function getDeployQueue(): Queue {
  return new Queue(QUEUES.deploy, { connection: getRedis() });
}

// ─── Utility: Create AgentInput for Auto-X jobs ──────────────────

function makeAutoXInput(data: Record<string, unknown>): AgentInput {
  return {
    workflowRunId: `autox-${Date.now()}`,
    stepId: `autox-step-${Date.now()}`,
    orgId: "system", // Auto-X operates at platform level
    goalId: "autox",
    data,
  };
}

// ─── Workers ─────────────────────────────────────────────────────

export function startMonitorWorker(): Worker {
  return new Worker(
    QUEUES.monitor,
    async (job: Job) => {
      console.log(`[Monitor] Health check cycle starting (job ${job.id})`);
      const agent = agentFactory("monitor");
      if (!agent) throw new Error("Monitor agent not registered");

      const result = await agent.execute(makeAutoXInput(job.data || {}));

      // If monitor found critical alerts needing auto-fix, enqueue debug jobs
      if (result.success && result.data.alertsNeedingDebug) {
        const alertIds = result.data.alertsNeedingDebug as string[];
        const debugQueue = getDebugFixQueue();
        for (const alertId of alertIds) {
          await debugQueue.add("debug-fix", { alertId }, {
            attempts: 1, // Don't retry debug jobs — they handle their own logic
            removeOnComplete: 100,
          });
          console.log(`[Monitor] Enqueued debug-fix job for alert ${alertId}`);
        }
      }

      console.log(`[Monitor] Health check complete:`, {
        checksRun: result.data.checksRun,
        newAlerts: result.data.newAlerts,
        resolvedAlerts: result.data.resolvedAlerts,
      });

      return result;
    },
    {
      connection: getRedis(),
      concurrency: 1, // Only one monitor check at a time
    }
  );
}

export function startDebugFixWorker(): Worker {
  return new Worker(
    QUEUES.debugFix,
    async (job: Job) => {
      const alertId = job.data?.alertId;
      console.log(`[Debug/Fix] Starting diagnosis for alert ${alertId}`);
      const agent = agentFactory("debug_fix");
      if (!agent) throw new Error("Debug/Fix agent not registered");

      const result = await agent.execute(makeAutoXInput({ alertId }));

      // If fix was proposed and is a prompt change, enqueue a deploy job
      if (result.success && result.data.deployNeeded) {
        const deployQueue = getDeployQueue();
        await deployQueue.add("deploy", {
          version: result.data.newVersion,
          triggeredBy: "debug_fix",
          triggerDescription: result.data.fixDescription,
          debugSessionId: result.data.debugSessionId,
        }, {
          attempts: 1,
          removeOnComplete: 100,
        });
        console.log(`[Debug/Fix] Enqueued deploy job for version ${result.data.newVersion}`);
      }

      console.log(`[Debug/Fix] Session complete:`, {
        sessionId: result.data.debugSessionId,
        status: result.data.status,
        confidence: result.data.confidence,
      });

      return result;
    },
    {
      connection: getRedis(),
      concurrency: 2, // Allow 2 parallel debug sessions
    }
  );
}

export function startEvolutionWorker(): Worker {
  return new Worker(
    QUEUES.evolution,
    async (job: Job) => {
      console.log(`[Evolution] Weekly evolution cycle starting`);
      const agent = agentFactory("evolution");
      if (!agent) throw new Error("Evolution agent not registered");

      const result = await agent.execute(makeAutoXInput(job.data || {}));

      console.log(`[Evolution] Cycle complete:`, {
        patternsFound: result.data.patternsFound,
        proposalsCreated: result.data.proposalsCreated,
        promptsPromoted: result.data.promptsPromoted,
        promptsRetired: result.data.promptsRetired,
      });

      return result;
    },
    {
      connection: getRedis(),
      concurrency: 1,
    }
  );
}

export function startDeployWorker(): Worker {
  return new Worker(
    QUEUES.deploy,
    async (job: Job) => {
      console.log(`[Deploy] Deployment starting:`, job.data);
      const agent = agentFactory("deployment");
      if (!agent) throw new Error("Deploy agent not registered");

      const result = await agent.execute(makeAutoXInput(job.data || {}));

      console.log(`[Deploy] Deployment result:`, {
        version: job.data?.version,
        status: result.data.status,
        healthCheck: result.data.healthCheck,
      });

      return result;
    },
    {
      connection: getRedis(),
      concurrency: 1, // Only one deploy at a time
    }
  );
}

// ─── Schedule Setup ──────────────────────────────────────────────
// Call this once on application startup to set up recurring jobs.

export async function setupAutoXSchedules(): Promise<void> {
  const monitorQueue = getMonitorQueue();
  const evolutionQueue = getEvolutionQueue();

  // Monitor: runs every 5 minutes
  await monitorQueue.upsertJobScheduler(
    "monitor-health-check",
    { every: 5 * 60 * 1000 }, // 5 minutes
    {
      name: "health-check",
      data: {},
      opts: {
        removeOnComplete: 50,
        removeOnFail: 50,
      },
    }
  );
  console.log("[AutoX] Monitor scheduled: every 5 minutes");

  // Evolution: runs every Monday at 2:00 AM UTC
  await evolutionQueue.upsertJobScheduler(
    "evolution-weekly",
    { pattern: "0 2 * * 1" }, // Cron: Monday 2 AM
    {
      name: "weekly-evolution",
      data: {},
      opts: {
        removeOnComplete: 10,
        removeOnFail: 10,
      },
    }
  );
  console.log("[AutoX] Evolution scheduled: Monday 2:00 AM UTC");

  console.log("[AutoX] All schedules configured");
}

// ─── Start Everything ────────────────────────────────────────────
// Call this to boot the entire Auto-X system.

export async function startAutoXSystem(): Promise<{
  monitorWorker: Worker;
  debugFixWorker: Worker;
  evolutionWorker: Worker;
  deployWorker: Worker;
}> {
  console.log("[AutoX] Starting autonomous operations system...");

  // Start all workers
  const monitorWorker = startMonitorWorker();
  const debugFixWorker = startDebugFixWorker();
  const evolutionWorker = startEvolutionWorker();
  const deployWorker = startDeployWorker();

  // Set up scheduled jobs
  await setupAutoXSchedules();

  console.log("[AutoX] System online. Workers: monitor, debug-fix, evolution, deploy");
  console.log("[AutoX] Flow: Monitor (5min) → Debug/Fix (on alert) → Deploy (on fix) → Monitor (verify)");
  console.log("[AutoX] Flow: Evolution (weekly) → A/B Test → Auto-Promote → Deploy");

  return { monitorWorker, debugFixWorker, evolutionWorker, deployWorker };
}

// ─── Manual Triggers (for API/admin use) ─────────────────────────

export async function triggerMonitorCheck(): Promise<void> {
  const queue = getMonitorQueue();
  await queue.add("manual-health-check", {}, { removeOnComplete: 50 });
}

export async function triggerEvolutionCycle(): Promise<void> {
  const queue = getEvolutionQueue();
  await queue.add("manual-evolution", {}, { removeOnComplete: 10 });
}

export async function triggerDeploy(data: {
  version: string;
  triggeredBy: string;
  triggerDescription: string;
  debugSessionId?: string;
}): Promise<void> {
  const queue = getDeployQueue();
  await queue.add("manual-deploy", data, { removeOnComplete: 100 });
}
