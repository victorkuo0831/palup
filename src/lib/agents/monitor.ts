import { BaseAgent, type AgentInput, type AgentOutput } from "./base";
import { db } from "../db";
import {
  anomalyAlerts,
  salesInteractionOutcomes,
  workflowSteps,
  debugSessions,
} from "../db/schema";
import { eq, and, gt, sql, desc } from "drizzle-orm";

// ─── Health Check Threshold Definitions ──────────────────────

interface HealthThreshold {
  metric: string;
  threshold: number;
  operator: "above" | "below";
  severity: "critical" | "warning" | "info";
}

const HEALTH_THRESHOLDS: readonly HealthThreshold[] = [
  {
    metric: "email_reply_rate",
    threshold: 5.0,
    operator: "below",
    severity: "warning",
  },
  {
    metric: "agent_error_rate",
    threshold: 2.0,
    operator: "above",
    severity: "critical",
  },
  {
    metric: "active_debug_sessions",
    threshold: 5,
    operator: "above",
    severity: "warning",
  },
] as const;

// ─── Monitor Agent ──────────────────────────────────────────

export class MonitorAgent extends BaseAgent {
  readonly agentType = "monitor";
  readonly displayName = "Monitor Agent";
  readonly description =
    "Continuously monitors system health metrics and detects anomalies";

  protected defaultTaskCategory = "extraction" as const;
  protected defaultComplexity = "simple" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const checksPerformed: Array<{
      metric: string;
      value: number;
      threshold: number;
      status: "ok" | "violated";
    }> = [];
    const newAlerts: string[] = [];
    const resolvedAlerts: string[] = [];
    let totalCostUsd = 0;
    let totalTokens = 0;

    this.emitEvent(input, "progress", "Starting health checks...", 10);

    try {
      // ── Run each health check ────────────────────────────────
      for (const check of HEALTH_THRESHOLDS) {
        const currentValue = await this.getMetricValue(check.metric);

        const violated =
          check.operator === "above"
            ? currentValue > check.threshold
            : currentValue < check.threshold;

        checksPerformed.push({
          metric: check.metric,
          value: currentValue,
          threshold: check.threshold,
          status: violated ? "violated" : "ok",
        });

        if (violated) {
          // Check for existing active alert on this metric
          const existingAlert = await db
            .select()
            .from(anomalyAlerts)
            .where(
              and(
                eq(anomalyAlerts.metric, check.metric),
                eq(anomalyAlerts.status, "active")
              )
            )
            .limit(1);

          if (existingAlert.length === 0) {
            // Create new alert
            const direction =
              check.operator === "above" ? "exceeded" : "dropped below";
            const message = `${check.metric} ${direction} threshold: current=${currentValue.toFixed(2)}, threshold=${check.threshold}`;

            const [inserted] = await db
              .insert(anomalyAlerts)
              .values({
                orgId: input.orgId,
                metric: check.metric,
                currentValue,
                threshold: check.threshold,
                severity: check.severity,
                status: "active",
                message,
                autoAction:
                  check.severity === "critical" ? "debug_fix" : null,
              })
              .returning({ id: anomalyAlerts.id });

            newAlerts.push(
              `${check.metric} (${check.severity}): ${message} [id=${inserted.id}]`
            );

            // For critical alerts, check if a debug session already exists
            if (check.severity === "critical") {
              await this.ensureDebugSession(inserted.id);
            }
          }
        } else {
          // Check for active alerts that should be resolved
          const activeAlerts = await db
            .select()
            .from(anomalyAlerts)
            .where(
              and(
                eq(anomalyAlerts.metric, check.metric),
                eq(anomalyAlerts.status, "active")
              )
            );

          for (const alert of activeAlerts) {
            await db
              .update(anomalyAlerts)
              .set({
                status: "resolved",
                resolvedAt: new Date(),
              })
              .where(eq(anomalyAlerts.id, alert.id));

            resolvedAlerts.push(
              `${check.metric} recovered (value=${currentValue.toFixed(2)}) [id=${alert.id}]`
            );
          }
        }
      }

      this.emitEvent(input, "progress", "Health checks complete", 100);

      // ── Determine overall health status ──────────────────────
      const violations = checksPerformed.filter((c) => c.status === "violated");
      const hasCritical = violations.some(
        (v) =>
          HEALTH_THRESHOLDS.find((t) => t.metric === v.metric)?.severity ===
          "critical"
      );
      const overallStatus = hasCritical
        ? "critical"
        : violations.length > 0
          ? "degraded"
          : "healthy";

      return {
        success: true,
        data: {
          checksPerformed,
          newAlerts,
          resolvedAlerts,
          overallStatus,
          checkedAt: new Date().toISOString(),
        },
        confidence: 1.0,
        costUsd: totalCostUsd,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        data: { checksPerformed, newAlerts, resolvedAlerts },
        confidence: 0,
        costUsd: totalCostUsd,
        tokensUsed: totalTokens,
        error: `Monitor check failed: ${errorMessage}`,
      };
    }
  }

  // ─── Metric Value Queries ──────────────────────────────────

  private async getMetricValue(metric: string): Promise<number> {
    switch (metric) {
      case "email_reply_rate":
        return this.getEmailReplyRate();
      case "agent_error_rate":
        return this.getAgentErrorRate();
      case "active_debug_sessions":
        return this.getActiveDebugSessionCount();
      default:
        return 0;
    }
  }

  private async getEmailReplyRate(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE outcome = 'positive') AS positive_count,
        COUNT(*) AS total_count
      FROM sales_interaction_outcomes
      WHERE created_at > ${sevenDaysAgo}
    `);

    const row = result.rows[0] as
      | { positive_count: string; total_count: string }
      | undefined;
    if (!row || Number(row.total_count) === 0) return 0;

    return (Number(row.positive_count) / Number(row.total_count)) * 100;
  }

  private async getAgentErrorRate(): Promise<number> {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await db.execute(sql`
      SELECT
        COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
        COUNT(*) AS total_count
      FROM workflow_steps
      WHERE created_at > ${sevenDaysAgo}
    `);

    const row = result.rows[0] as
      | { failed_count: string; total_count: string }
      | undefined;
    if (!row || Number(row.total_count) === 0) return 0;

    return (Number(row.failed_count) / Number(row.total_count)) * 100;
  }

  private async getActiveDebugSessionCount(): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) AS active_count
      FROM debug_sessions
      WHERE status NOT IN ('verified', 'failed')
    `);

    const row = result.rows[0] as { active_count: string } | undefined;
    return row ? Number(row.active_count) : 0;
  }

  // ─── Debug Session Helpers ─────────────────────────────────

  /**
   * For critical alerts, ensure a debug session exists.
   * If not, the autoAction="debug_fix" flag on the alert signals
   * the scheduler to trigger DebugFixAgent.
   */
  private async ensureDebugSession(alertId: string): Promise<void> {
    const existing = await db
      .select()
      .from(debugSessions)
      .where(eq(debugSessions.alertId, alertId))
      .limit(1);

    if (existing.length > 0) {
      // Debug session already exists for this alert; nothing to do.
      // The autoAction flag is already set on the alert for the scheduler.
      return;
    }

    // No debug session yet -- the scheduler will create one
    // when it picks up the alert with autoAction="debug_fix".
  }
}
