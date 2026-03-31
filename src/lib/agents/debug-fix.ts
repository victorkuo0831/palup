import { BaseAgent, type AgentInput, type AgentOutput } from "./base";
import { db } from "../db";
import {
  anomalyAlerts,
  debugSessions,
  promptVersions,
  knowledgeEntries,
  salesInteractionOutcomes,
  workflowSteps,
} from "../db/schema";
import { eq, desc, sql } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────

type RootCauseCategory =
  | "prompt_drift"
  | "knowledge_stale"
  | "integration_error"
  | "rate_limit"
  | "context_overflow"
  | "code_bug";

interface DiagnosisResult {
  rootCause: string;
  category: RootCauseCategory;
  confidence: number;
  proposedFix: string;
}

const DAILY_AUTO_FIX_LIMIT = 5;

const DIAGNOSIS_SYSTEM_PROMPT = `You are a diagnostic agent. Analyze the anomaly and determine the root cause. Respond in JSON: { "rootCause": string, "category": "prompt_drift"|"knowledge_stale"|"integration_error"|"rate_limit"|"context_overflow"|"code_bug", "confidence": number (0-1), "proposedFix": string }`;

const PROMPT_IMPROVEMENT_SYSTEM_PROMPT = `You are a prompt engineering agent. Given the current prompt and diagnostic context, generate an improved prompt variant that addresses the identified issue. Respond with ONLY the improved prompt text, no explanation.`;

// ─── Debug/Fix Agent ────────────────────────────────────────

export class DebugFixAgent extends BaseAgent {
  readonly agentType = "debug_fix";
  readonly displayName = "Debug/Fix Agent";
  readonly description =
    "Diagnoses anomalies and generates automated fixes";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "complex" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    let totalCostUsd = 0;
    let totalTokens = 0;

    try {
      // ── Rate limiting: max 5 auto-fix sessions per day ─────
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const todaySessionsResult = await db.execute(sql`
        SELECT COUNT(*) AS session_count
        FROM debug_sessions
        WHERE started_at >= ${todayStart}
      `);

      const sessionCount = Number(
        (todaySessionsResult.rows[0] as { session_count: string })
          ?.session_count ?? 0
      );

      if (sessionCount >= DAILY_AUTO_FIX_LIMIT) {
        return {
          success: false,
          data: {
            message: `Daily auto-fix limit reached (${DAILY_AUTO_FIX_LIMIT}/day)`,
            sessionsToday: sessionCount,
          },
          confidence: 1.0,
          costUsd: 0,
          tokensUsed: 0,
          error: "Rate limit exceeded",
        };
      }

      // ── Get alert from input ───────────────────────────────
      const alertId = input.data.alertId as string | undefined;
      if (!alertId) {
        return {
          success: false,
          data: {},
          confidence: 0,
          costUsd: 0,
          tokensUsed: 0,
          error: "No alertId provided in input data",
        };
      }

      const [alert] = await db
        .select()
        .from(anomalyAlerts)
        .where(eq(anomalyAlerts.id, alertId))
        .limit(1);

      if (!alert) {
        return {
          success: false,
          data: {},
          confidence: 0,
          costUsd: 0,
          tokensUsed: 0,
          error: `Alert ${alertId} not found`,
        };
      }

      if (alert.status === "resolved") {
        return {
          success: true,
          data: {
            message: "Alert already resolved, no action needed",
            alertId,
          },
          confidence: 1.0,
          costUsd: 0,
          tokensUsed: 0,
        };
      }

      this.emitEvent(input, "progress", "Creating debug session...", 10);

      // ── Create debug session & update alert status ─────────
      const [session] = await db
        .insert(debugSessions)
        .values({
          alertId: alert.id,
          orgId: input.orgId,
          status: "diagnosing",
        })
        .returning();

      await db
        .update(anomalyAlerts)
        .set({ status: "investigating" })
        .where(eq(anomalyAlerts.id, alert.id));

      // ── Gather context for diagnosis ───────────────────────
      this.emitEvent(input, "progress", "Gathering diagnostic context...", 25);

      const [recentOutcomes, recentFailures, activePrompts] =
        await Promise.all([
          db
            .select()
            .from(salesInteractionOutcomes)
            .orderBy(desc(salesInteractionOutcomes.createdAt))
            .limit(50),
          db
            .select()
            .from(workflowSteps)
            .where(eq(workflowSteps.status, "failed"))
            .orderBy(desc(workflowSteps.createdAt))
            .limit(20),
          db
            .select()
            .from(promptVersions)
            .where(eq(promptVersions.status, "active")),
        ]);

      // ── Root Cause Analysis via LLM ────────────────────────
      this.emitEvent(input, "progress", "Performing root cause analysis...", 40);

      const diagnosticPrompt = `Analyze the following anomaly:

**Alert Details:**
- Metric: ${alert.metric}
- Current Value: ${alert.currentValue}
- Threshold: ${alert.threshold}
- Severity: ${alert.severity}
- Message: ${alert.message}

**Recent Sales Interaction Outcomes (last 50):**
${JSON.stringify(
  recentOutcomes.map((o) => ({
    outcome: o.outcome,
    interactionType: o.interactionType,
    agentType: o.agentType,
    confidence: o.confidenceAtActionTime,
    createdAt: o.createdAt,
  })),
  null,
  2
)}

**Recent Workflow Step Failures (last 20):**
${JSON.stringify(
  recentFailures.map((s) => ({
    agentType: s.agentType,
    status: s.status,
    errorMessage: s.errorMessage,
    retryCount: s.retryCount,
    createdAt: s.createdAt,
  })),
  null,
  2
)}

**Active Prompt Versions:**
${JSON.stringify(
  activePrompts.map((p) => ({
    agentType: p.agentType,
    promptKey: p.promptKey,
    version: p.version,
    outcomeRate: p.metricsOutcomeRate,
    avgConfidence: p.metricsAvgConfidence,
  })),
  null,
  2
)}

Determine the root cause and provide your diagnosis.`;

      const diagnosisResponse = await this.callLLM(diagnosticPrompt, {
        systemPrompt: DIAGNOSIS_SYSTEM_PROMPT,
        category: "reasoning",
        complexity: "complex",
        maxTokens: 2048,
        temperature: 0.3,
      });

      totalCostUsd += diagnosisResponse.costUsd;
      totalTokens +=
        diagnosisResponse.inputTokens + diagnosisResponse.outputTokens;

      // ── Parse diagnosis ────────────────────────────────────
      let diagnosis: DiagnosisResult;
      try {
        diagnosis = this.parseJSON<DiagnosisResult>(diagnosisResponse.content);
      } catch {
        await db
          .update(debugSessions)
          .set({
            status: "failed",
            proposedFix: "Failed to parse LLM diagnosis response",
            completedAt: new Date(),
          })
          .where(eq(debugSessions.id, session.id));

        return {
          success: false,
          data: { sessionId: session.id, rawResponse: diagnosisResponse.content },
          confidence: 0,
          costUsd: totalCostUsd,
          tokensUsed: totalTokens,
          error: "Failed to parse diagnosis response",
        };
      }

      // ── Update debug session with diagnosis ────────────────
      await db
        .update(debugSessions)
        .set({
          rootCause: diagnosis.rootCause,
          rootCauseCategory: diagnosis.category,
          proposedFix: diagnosis.proposedFix,
          confidence: diagnosis.confidence,
          metricsBeforeFix: [
            {
              metric: alert.metric,
              value: alert.currentValue,
              threshold: alert.threshold,
            },
          ],
        })
        .where(eq(debugSessions.id, session.id));

      this.emitEvent(input, "progress", "Diagnosis complete, generating fix...", 60);

      // ── Apply fix based on confidence and category ─────────
      if (diagnosis.confidence >= 0.7) {
        if (
          diagnosis.category === "prompt_drift" ||
          diagnosis.category === "knowledge_stale"
        ) {
          await this.handlePromptFix(
            session.id,
            alert,
            diagnosis,
            activePrompts,
            input
          );
          totalCostUsd += this.lastFixCostUsd;
          totalTokens += this.lastFixTokens;
        } else if (
          diagnosis.category === "integration_error" ||
          diagnosis.category === "rate_limit"
        ) {
          await db
            .update(debugSessions)
            .set({
              status: "fix_proposed",
              proposedFix: `Config change required: ${diagnosis.proposedFix}`,
            })
            .where(eq(debugSessions.id, session.id));
        } else {
          await db
            .update(debugSessions)
            .set({ status: "fix_proposed" })
            .where(eq(debugSessions.id, session.id));
        }
      } else {
        // Low confidence -- escalate to human review
        await db
          .update(debugSessions)
          .set({
            status: "failed",
            proposedFix:
              "Low confidence diagnosis, escalating to human review",
            completedAt: new Date(),
          })
          .where(eq(debugSessions.id, session.id));
      }

      this.emitEvent(input, "progress", "Debug session complete", 100);

      // ── Fetch the final session state ──────────────────────
      const [finalSession] = await db
        .select()
        .from(debugSessions)
        .where(eq(debugSessions.id, session.id))
        .limit(1);

      return {
        success: true,
        data: {
          sessionId: finalSession.id,
          alertId: finalSession.alertId,
          rootCause: finalSession.rootCause,
          rootCauseCategory: finalSession.rootCauseCategory,
          proposedFix: finalSession.proposedFix,
          confidence: finalSession.confidence,
          status: finalSession.status,
        },
        confidence: diagnosis.confidence,
        costUsd: totalCostUsd,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: totalCostUsd,
        tokensUsed: totalTokens,
        error: `Debug/Fix failed: ${errorMessage}`,
      };
    }
  }

  // ─── Prompt Fix Handler ────────────────────────────────────

  // Transient cost tracking for the prompt fix sub-step
  private lastFixCostUsd = 0;
  private lastFixTokens = 0;

  private async handlePromptFix(
    sessionId: string,
    alert: typeof anomalyAlerts.$inferSelect,
    diagnosis: DiagnosisResult,
    activePrompts: (typeof promptVersions.$inferSelect)[],
    input: AgentInput
  ): Promise<void> {
    this.lastFixCostUsd = 0;
    this.lastFixTokens = 0;

    // Find the current active prompt for the most relevant agent
    // Use the first active prompt as a baseline (in production, match by agent type from alert context)
    const currentPrompt = activePrompts[0];

    if (!currentPrompt) {
      await db
        .update(debugSessions)
        .set({
          status: "fix_proposed",
          proposedFix: `${diagnosis.proposedFix} (no active prompt found to auto-fix)`,
        })
        .where(eq(debugSessions.id, sessionId));
      return;
    }

    this.emitEvent(
      input,
      "progress",
      "Generating improved prompt variant...",
      75
    );

    const improvementPrompt = `Current prompt (agent: ${currentPrompt.agentType}, key: ${currentPrompt.promptKey}, version: ${currentPrompt.version}):

---
${currentPrompt.content}
---

Diagnosed issue: ${diagnosis.rootCause}
Category: ${diagnosis.category}
Proposed fix approach: ${diagnosis.proposedFix}

Metric "${alert.metric}" is at ${alert.currentValue} (threshold: ${alert.threshold}).

Generate an improved version of this prompt that addresses the identified root cause.`;

    const improvementResponse = await this.callLLM(improvementPrompt, {
      systemPrompt: PROMPT_IMPROVEMENT_SYSTEM_PROMPT,
      category: "reasoning",
      complexity: "complex",
      maxTokens: 4096,
      temperature: 0.4,
    });

    this.lastFixCostUsd = improvementResponse.costUsd;
    this.lastFixTokens =
      improvementResponse.inputTokens + improvementResponse.outputTokens;

    // Insert a new draft prompt version
    await db.insert(promptVersions).values({
      agentType: currentPrompt.agentType,
      promptKey: currentPrompt.promptKey,
      version: currentPrompt.version + 1,
      content: improvementResponse.content,
      status: "draft",
      parentVersionId: currentPrompt.id,
    });

    await db
      .update(debugSessions)
      .set({ status: "fix_proposed" })
      .where(eq(debugSessions.id, sessionId));
  }
}
