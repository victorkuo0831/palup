import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { db } from "@/lib/db";
import { goals, goalPlans, workflowRuns, workflowSteps } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { GoalInterpreterAgent } from "@/lib/agents/goal-interpreter";
import { startWorkflow, type DAG } from "@/lib/workflow/engine";

export const goalsRouter = router({
  // ─── Create a new goal ────────────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        rawInput: z.string().min(5).max(1000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // 1. Save the goal
      const [goal] = await db
        .insert(goals)
        .values({
          orgId: ctx.orgId,
          createdBy: ctx.userId,
          rawInput: input.rawInput,
          status: "planning",
        })
        .returning();

      // 2. Run the Goal Interpreter Agent to decompose into a plan
      const interpreter = new GoalInterpreterAgent();
      const result = await interpreter.execute({
        workflowRunId: "planning", // Not a real workflow yet
        stepId: "interpret",
        orgId: ctx.orgId,
        goalId: goal.id,
        data: { rawInput: input.rawInput },
      });

      if (!result.success) {
        await db
          .update(goals)
          .set({ status: "failed" })
          .where(eq(goals.id, goal.id));

        return {
          goal,
          plan: null,
          error: result.error,
        };
      }

      // 3. Save the plan
      const dag = result.data.dag as DAG;
      const [plan] = await db
        .insert(goalPlans)
        .values({
          goalId: goal.id,
          dagJson: dag,
          estimatedCostUsd: result.costUsd,
          estimatedDurationMinutes: (result.data.estimatedDurationMinutes as number) || null,
          status: "pending",
        })
        .returning();

      // 4. Update goal status
      await db
        .update(goals)
        .set({
          status: "approved", // Auto-approve for now; can add approval step later
          interpretedSummary: result.data.summary as string,
        })
        .where(eq(goals.id, goal.id));

      return {
        goal: { ...goal, status: "approved" as const, interpretedSummary: result.data.summary },
        plan,
        nodeCount: result.data.nodeCount,
      };
    }),

  // ─── Execute an approved goal ─────────────────────────────
  execute: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Get the latest plan for this goal
      const plans = await db
        .select()
        .from(goalPlans)
        .where(eq(goalPlans.goalId, input.goalId))
        .orderBy(desc(goalPlans.version));

      if (plans.length === 0) {
        throw new Error("No plan found for this goal");
      }

      const plan = plans[0];
      const dag = plan.dagJson as DAG;

      // Create a workflow run
      const [run] = await db
        .insert(workflowRuns)
        .values({
          goalPlanId: plan.id,
          orgId: ctx.orgId,
          status: "pending",
        })
        .returning();

      // Update goal status
      await db
        .update(goals)
        .set({ status: "executing" })
        .where(eq(goals.id, input.goalId));

      // Start the workflow engine
      await startWorkflow(run.id, dag, ctx.orgId, input.goalId);

      return { workflowRunId: run.id };
    }),

  // ─── List goals for the organization ──────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    return db
      .select()
      .from(goals)
      .where(eq(goals.orgId, ctx.orgId))
      .orderBy(desc(goals.createdAt));
  }),

  // ─── Get goal with workflow status ────────────────────────
  getById: protectedProcedure
    .input(z.object({ goalId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const [goal] = await db
        .select()
        .from(goals)
        .where(
          and(eq(goals.id, input.goalId), eq(goals.orgId, ctx.orgId))
        );

      if (!goal) throw new Error("Goal not found");

      // Get plans
      const plans = await db
        .select()
        .from(goalPlans)
        .where(eq(goalPlans.goalId, goal.id))
        .orderBy(desc(goalPlans.version));

      // Get workflow runs
      const runs = plans.length > 0
        ? await db
            .select()
            .from(workflowRuns)
            .where(eq(workflowRuns.goalPlanId, plans[0].id))
            .orderBy(desc(workflowRuns.createdAt))
        : [];

      // Get steps for the latest run
      const steps = runs.length > 0
        ? await db
            .select()
            .from(workflowSteps)
            .where(eq(workflowSteps.workflowRunId, runs[0].id))
        : [];

      return {
        goal,
        plan: plans[0] || null,
        latestRun: runs[0] || null,
        steps,
      };
    }),
});
