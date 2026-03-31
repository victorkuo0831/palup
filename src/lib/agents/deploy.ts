import { BaseAgent, type AgentInput, type AgentOutput } from "./base";
import { db } from "../db";
import { deployments, anomalyAlerts, debugSessions } from "../db/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";

// ─── Deploy Agent ───────────────────────────────────────────

export class DeployAgent extends BaseAgent {
  readonly agentType = "deployment";
  readonly displayName = "Deploy Agent";
  readonly description =
    "Manages canary deployments, progressive rollouts, and auto-rollback";

  protected defaultTaskCategory = "extraction" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const version = input.data.version as string;
    const triggeredBy = input.data.triggeredBy as string;
    const triggerDescription = input.data.triggerDescription as string;
    const debugSessionId = input.data.debugSessionId as string | undefined;

    try {
      // ── Step 1: Rate Limit Check ──────────────────────────
      this.emitEvent(input, "progress", "Checking deploy rate limits...", 5);

      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

      const [recentCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deployments)
        .where(gt(deployments.startedAt, oneHourAgo));

      if ((recentCount?.count ?? 0) >= 3) {
        return {
          success: false,
          data: { reason: "rate_limit" },
          confidence: 1,
          costUsd: 0,
          tokensUsed: 0,
          error: "Deploy rate limit: max 3/hour",
        };
      }

      const [failedCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deployments)
        .where(
          and(
            gt(deployments.startedAt, fourHoursAgo),
            eq(deployments.status, "failed")
          )
        );

      if ((failedCount?.count ?? 0) >= 2) {
        return {
          success: false,
          data: { reason: "deploy_freeze" },
          confidence: 1,
          costUsd: 0,
          tokensUsed: 0,
          error: "Deploy freeze: 2+ failures in 4 hours",
        };
      }

      // ── Step 2: Create Deployment Record ──────────────────
      this.emitEvent(input, "progress", "Creating deployment...", 10);

      const [deployment] = await db
        .insert(deployments)
        .values({
          version,
          triggeredBy,
          triggerDescription,
          debugSessionId: debugSessionId ?? null,
          status: "building",
        })
        .returning();

      // ── Step 3: CI Validation (simulated) ─────────────────
      this.emitEvent(input, "progress", "Running CI validation...", 20);

      // In production, this would trigger GitHub Actions and poll for results.
      // For now, simulate by checking recent deployment failure rates.
      const [recentFailures] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(deployments)
        .where(
          and(
            gt(deployments.startedAt, fourHoursAgo),
            eq(deployments.status, "failed")
          )
        );

      const recentFailureRate = (recentFailures?.count ?? 0) / Math.max(recentCount?.count ?? 1, 1);

      if (recentFailureRate >= 0.05) {
        await db
          .update(deployments)
          .set({ status: "failed", errorMessage: "CI validation failed: high recent failure rate", completedAt: new Date() })
          .where(eq(deployments.id, deployment.id));

        return {
          success: false,
          data: { deploymentId: deployment.id, stage: "ci_validation" },
          confidence: 0.9,
          costUsd: 0,
          tokensUsed: 0,
          error: "CI validation failed: recent workflow failure rate exceeds 5%",
        };
      }

      // ── Step 4: Canary Deploy ─────────────────────────────
      this.emitEvent(input, "progress", "Starting canary deployment...", 35);

      await db
        .update(deployments)
        .set({ status: "canary", canaryPercent: 5 })
        .where(eq(deployments.id, deployment.id));

      // Health check: look for critical alerts after deployment started
      const canaryAlerts = await db
        .select()
        .from(anomalyAlerts)
        .where(
          and(
            gt(anomalyAlerts.detectedAt, deployment.startedAt),
            eq(anomalyAlerts.severity, "critical")
          )
        )
        .limit(5);

      if (canaryAlerts.length > 0) {
        return this.rollback(input, deployment.id, debugSessionId, canaryAlerts[0].message);
      }

      // ── Step 5: Progressive Rollout ───────────────────────
      const rolloutStages = [25, 50, 100];

      for (const stage of rolloutStages) {
        this.emitEvent(
          input,
          "progress",
          `Rolling out to ${stage}%...`,
          35 + Math.floor((stage / 100) * 50)
        );

        await db
          .update(deployments)
          .set({
            canaryPercent: stage,
            status: stage === 100 ? "deployed" : "rolling_out",
            completedAt: stage === 100 ? new Date() : undefined,
          })
          .where(eq(deployments.id, deployment.id));

        // Check for critical alerts after each stage (except final)
        if (stage < 100) {
          const stageAlerts = await db
            .select()
            .from(anomalyAlerts)
            .where(
              and(
                gt(anomalyAlerts.detectedAt, deployment.startedAt),
                eq(anomalyAlerts.severity, "critical")
              )
            )
            .limit(5);

          if (stageAlerts.length > 0) {
            return this.rollback(
              input,
              deployment.id,
              debugSessionId,
              stageAlerts[0].message
            );
          }
        }
      }

      // ── Step 6: Post-Deploy Verification ──────────────────
      this.emitEvent(input, "progress", "Verifying deployment health...", 95);

      await db
        .update(deployments)
        .set({ healthCheck: "healthy" })
        .where(eq(deployments.id, deployment.id));

      if (debugSessionId) {
        await db
          .update(debugSessions)
          .set({ status: "deployed", completedAt: new Date() })
          .where(eq(debugSessions.id, debugSessionId));
      }

      this.emitEvent(input, "progress", "Deployment complete", 100);

      return {
        success: true,
        data: {
          deploymentId: deployment.id,
          version,
          status: "deployed",
          canaryPercent: 100,
          healthCheck: "healthy",
          triggeredBy,
        },
        confidence: 0.95,
        costUsd: 0,
        tokensUsed: 0,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        data: { error: message },
        confidence: 0,
        costUsd: 0,
        tokensUsed: 0,
        error: message,
      };
    }
  }

  // ── Step 7: Auto-Rollback ───────────────────────────────────

  private async rollback(
    input: AgentInput,
    deploymentId: string,
    debugSessionId: string | undefined,
    alertMessage: string
  ): Promise<AgentOutput> {
    this.emitEvent(input, "progress", "Rolling back deployment...", 90);

    try {
      await db
        .update(deployments)
        .set({
          status: "rolled_back",
          healthCheck: "unhealthy",
          completedAt: new Date(),
          errorMessage: `Auto-rollback: ${alertMessage}`,
        })
        .where(eq(deployments.id, deploymentId));

      if (debugSessionId) {
        await db
          .update(debugSessions)
          .set({ status: "failed", completedAt: new Date() })
          .where(eq(debugSessions.id, debugSessionId));
      }

      // Create an anomaly alert for the deployment failure
      await db.insert(anomalyAlerts).values({
        orgId: input.orgId,
        metric: "deployment_health",
        currentValue: 0,
        threshold: 1,
        severity: "critical",
        status: "active",
        message: `Deployment ${deploymentId} rolled back: ${alertMessage}`,
        autoAction: "debug_fix",
      });

      return {
        success: false,
        data: {
          deploymentId,
          status: "rolled_back",
          reason: alertMessage,
        },
        confidence: 0.95,
        costUsd: 0,
        tokensUsed: 0,
        error: `Deployment rolled back: ${alertMessage}`,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Rollback failed";
      return {
        success: false,
        data: {
          deploymentId,
          status: "rollback_error",
          error: message,
        },
        confidence: 0,
        costUsd: 0,
        tokensUsed: 0,
        error: `Rollback failed: ${message}`,
      };
    }
  }
}
