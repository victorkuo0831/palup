import { db } from "../db";
import { usageEvents } from "../db/schema";
import type { LLMResponse } from "../llm/types";

// ─── Billing & Metering Service ───────────────────────────────
// Shared agent (C4): tracks both platform costs and customer usage.
// All LLM calls, deployments, storage, etc. flow through here.

export interface UsageEvent {
  orgId: string;
  agentType: string;
  action:
    | "llm_call"
    | "embedding"
    | "image_generation"
    | "deployment"
    | "storage_write"
    | "api_call"
    | "email_send"
    | "sms_send";
  model?: string;
  units: number; // tokens, bytes, count
  unitCostMicrodollars: number; // cost in 1/1,000,000 USD
  metadata?: Record<string, unknown>;
}

// ─── Record Usage ─────────────────────────────────────────────

export async function recordUsage(event: UsageEvent): Promise<void> {
  await db.insert(usageEvents).values({
    orgId: event.orgId,
    agentType: event.agentType as any,
    action: event.action as any,
    model: event.model,
    units: event.units,
    unitCostMicrodollars: event.unitCostMicrodollars,
    metadata: event.metadata || {},
  });
}

// ─── Record LLM Usage (convenience helper) ────────────────────

export async function recordLLMUsage(
  orgId: string,
  agentType: string,
  response: LLMResponse
): Promise<void> {
  await recordUsage({
    orgId,
    agentType,
    action: "llm_call",
    model: response.model,
    units: response.inputTokens + response.outputTokens,
    unitCostMicrodollars: Math.round(response.costUsd * 1_000_000),
    metadata: {
      provider: response.provider,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
      latencyMs: response.latencyMs,
    },
  });
}

// ─── Aggregate Usage for Billing ──────────────────────────────

export async function getOrgUsageSummary(
  orgId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalCostUsd: number;
  totalTokens: number;
  byAgent: Record<string, { costUsd: number; tokens: number; calls: number }>;
  byAction: Record<string, { costUsd: number; count: number }>;
}> {
  const events = await db
    .select()
    .from(usageEvents)
    .where(eq(usageEvents.orgId, orgId));

  // Filter by date range in application layer (for simplicity)
  const filtered = events.filter(
    (e) => e.createdAt >= startDate && e.createdAt <= endDate
  );

  const summary = {
    totalCostUsd: 0,
    totalTokens: 0,
    byAgent: {} as Record<string, { costUsd: number; tokens: number; calls: number }>,
    byAction: {} as Record<string, { costUsd: number; count: number }>,
  };

  for (const event of filtered) {
    const costUsd = event.unitCostMicrodollars / 1_000_000;
    summary.totalCostUsd += costUsd;

    if (event.action === "llm_call" || event.action === "embedding") {
      summary.totalTokens += event.units;
    }

    // By agent
    if (!summary.byAgent[event.agentType]) {
      summary.byAgent[event.agentType] = { costUsd: 0, tokens: 0, calls: 0 };
    }
    summary.byAgent[event.agentType].costUsd += costUsd;
    summary.byAgent[event.agentType].tokens += event.units;
    summary.byAgent[event.agentType].calls += 1;

    // By action
    if (!summary.byAction[event.action]) {
      summary.byAction[event.action] = { costUsd: 0, count: 0 };
    }
    summary.byAction[event.action].costUsd += costUsd;
    summary.byAction[event.action].count += 1;
  }

  return summary;
}

// Import eq for query
import { eq } from "drizzle-orm";

// ─── Plan Limits ──────────────────────────────────────────────

const PLAN_LIMITS = {
  trial: { tokensPerDay: 2_000, activeGoals: 1, storageMb: 100 },
  starter: { tokensPerDay: 5_000, activeGoals: 1, storageMb: 1_000 },
  growth: { tokensPerDay: 50_000, activeGoals: 5, storageMb: 10_000 },
  business: { tokensPerDay: 200_000, activeGoals: 25, storageMb: 100_000 },
  enterprise: { tokensPerDay: Infinity, activeGoals: Infinity, storageMb: Infinity },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export function getPlanLimits(plan: PlanType) {
  return PLAN_LIMITS[plan];
}
