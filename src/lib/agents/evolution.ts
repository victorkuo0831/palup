import { BaseAgent, type AgentInput, type AgentOutput } from "./base";
import { db } from "../db";
import {
  salesInteractionOutcomes,
  salesPatterns,
  promptVersions,
  evolutionProposals,
} from "../db/schema";
import { eq, and, gt, desc, sql } from "drizzle-orm";

// ─── Types ──────────────────────────────────────────────────

interface ExtractedPattern {
  patternType: "effective" | "ineffective";
  stage: string;
  description: string;
  successRate: number;
  occurrences: number;
}

interface PatternExtractionResponse {
  patterns: ExtractedPattern[];
}

interface AggregatedGroup {
  agentType: string;
  interactionType: string;
  outcome: string;
  count: number;
}

// ─── Evolution Agent ────────────────────────────────────────

export class EvolutionAgent extends BaseAgent {
  readonly agentType = "evolution";
  readonly displayName = "Evolution Agent";
  readonly description =
    "Analyzes sales interaction patterns and evolves agent prompts";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "complex" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    let totalCost = 0;
    let totalTokens = 0;
    const patternsFound: ExtractedPattern[] = [];
    const proposalsCreated: string[] = [];
    const promotions: string[] = [];
    const retirements: string[] = [];

    try {
      // ── Phase 1: Data Collection ────────────────────────────
      this.emitEvent(input, "progress", "Collecting interaction data...", 10);

      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const aggregated = await db
        .select({
          agentType: salesInteractionOutcomes.agentType,
          interactionType: salesInteractionOutcomes.interactionType,
          outcome: salesInteractionOutcomes.outcome,
          count: sql<number>`count(*)::int`.as("count"),
        })
        .from(salesInteractionOutcomes)
        .where(gt(salesInteractionOutcomes.createdAt, sevenDaysAgo))
        .groupBy(
          salesInteractionOutcomes.agentType,
          salesInteractionOutcomes.interactionType,
          salesInteractionOutcomes.outcome
        );

      const totalInteractions = aggregated.reduce(
        (sum, row) => sum + row.count,
        0
      );

      if (totalInteractions < 50) {
        return {
          success: true,
          data: {
            message: "Not enough data for pattern extraction",
            totalInteractions,
          },
          confidence: 0.3,
          costUsd: 0,
          tokensUsed: 0,
        };
      }

      // Calculate success rates per group
      const groupMap = new Map<string, { positive: number; total: number }>();
      for (const row of aggregated) {
        const key = `${row.agentType}::${row.interactionType}`;
        const entry = groupMap.get(key) ?? { positive: 0, total: 0 };
        entry.total += row.count;
        if (row.outcome === "positive") {
          entry.positive += row.count;
        }
        groupMap.set(key, entry);
      }

      const successRates = Array.from(groupMap.entries()).map(
        ([key, stats]) => ({
          group: key,
          successRate: stats.total > 0 ? stats.positive / stats.total : 0,
          total: stats.total,
        })
      );

      // ── Phase 2: Pattern Extraction ─────────────────────────
      this.emitEvent(input, "progress", "Extracting patterns...", 30);

      const patternResponse = await this.callLLM(
        `Analyze these sales interaction outcomes from the last 7 days:\n\n${JSON.stringify(
          { aggregated, successRates },
          null,
          2
        )}`,
        {
          systemPrompt:
            "You are a sales analytics agent. Analyze these interaction outcomes and identify patterns. For each pattern, state whether it's effective or ineffective, which sales stage it applies to, and the evidence. Respond in JSON: { patterns: [{ patternType: 'effective'|'ineffective', stage: string, description: string, successRate: number, occurrences: number }] }",
          category: "reasoning",
          complexity: "complex",
          maxTokens: 4096,
          temperature: 0.3,
        }
      );

      totalCost += patternResponse.costUsd;
      totalTokens +=
        patternResponse.inputTokens + patternResponse.outputTokens;

      const parsed =
        this.parseJSON<PatternExtractionResponse>(patternResponse.content);

      // Insert patterns, avoiding duplicates
      for (const pattern of parsed.patterns) {
        const existing = await db
          .select({ id: salesPatterns.id })
          .from(salesPatterns)
          .where(
            and(
              eq(salesPatterns.patternType, pattern.patternType),
              eq(salesPatterns.stage, pattern.stage),
              eq(salesPatterns.description, pattern.description)
            )
          )
          .limit(1);

        if (existing.length === 0) {
          await db.insert(salesPatterns).values({
            orgId: input.orgId,
            patternType: pattern.patternType,
            stage: pattern.stage,
            description: pattern.description,
            occurrences: pattern.occurrences,
            successRate: pattern.successRate,
            evidence: { source: "evolution_agent", extractedFrom: successRates },
          });
          patternsFound.push(pattern);
        }
      }

      // ── Phase 3: Prompt Evolution ───────────────────────────
      this.emitEvent(input, "progress", "Evaluating prompts...", 50);

      // Rate limit: max 5 proposals per week
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - 7);

      const [proposalCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(evolutionProposals)
        .where(gt(evolutionProposals.createdAt, weekStart));

      const weeklyProposals = proposalCount?.count ?? 0;

      if (weeklyProposals < 5) {
        // Get active prompt versions
        const activePrompts = await db
          .select()
          .from(promptVersions)
          .where(eq(promptVersions.status, "active"));

        // Compute overall average success rate
        const overallAvg =
          successRates.length > 0
            ? successRates.reduce((s, r) => s + r.successRate, 0) /
              successRates.length
            : 0.5;

        // Effective patterns for LLM context
        const effectivePatterns = patternsFound.filter(
          (p) => p.patternType === "effective"
        );

        for (const prompt of activePrompts) {
          // Check if this prompt's outcomes are below average
          const promptOutcomes = await db
            .select({
              outcome: salesInteractionOutcomes.outcome,
              count: sql<number>`count(*)::int`.as("count"),
            })
            .from(salesInteractionOutcomes)
            .where(
              and(
                eq(salesInteractionOutcomes.promptVersionId, prompt.id),
                gt(salesInteractionOutcomes.createdAt, sevenDaysAgo)
              )
            )
            .groupBy(salesInteractionOutcomes.outcome);

          const promptTotal = promptOutcomes.reduce(
            (s, r) => s + r.count,
            0
          );
          const promptPositive =
            promptOutcomes.find((r) => r.outcome === "positive")?.count ?? 0;
          const promptSuccessRate =
            promptTotal > 0 ? promptPositive / promptTotal : 0;

          if (promptTotal > 0 && promptSuccessRate < overallAvg) {
            const evolveResponse = await this.callLLM(
              `Current prompt (key: ${prompt.promptKey}, version: ${prompt.version}):\n\n${prompt.content}\n\nSuccessful patterns to incorporate:\n${JSON.stringify(effectivePatterns, null, 2)}\n\nCurrent success rate: ${(promptSuccessRate * 100).toFixed(1)}% vs average: ${(overallAvg * 100).toFixed(1)}%`,
              {
                systemPrompt:
                  "Based on these successful patterns, generate an improved version of this prompt. Keep the same format and intent, but incorporate the winning patterns. Return ONLY the improved prompt text, no explanation.",
                category: "reasoning",
                complexity: "complex",
                maxTokens: 4096,
                temperature: 0.5,
              }
            );

            totalCost += evolveResponse.costUsd;
            totalTokens +=
              evolveResponse.inputTokens + evolveResponse.outputTokens;

            // Insert new draft prompt version
            const [newVersion] = await db
              .insert(promptVersions)
              .values({
                agentType: prompt.agentType,
                promptKey: prompt.promptKey,
                version: prompt.version + 1,
                content: evolveResponse.content,
                status: "draft",
                parentVersionId: prompt.id,
              })
              .returning({ id: promptVersions.id });

            // Insert evolution proposal
            const [proposal] = await db
              .insert(evolutionProposals)
              .values({
                capabilityGap: `Prompt ${prompt.promptKey} v${prompt.version} underperforming (${(promptSuccessRate * 100).toFixed(1)}% vs ${(overallAvg * 100).toFixed(1)}% avg)`,
                proposedSolution: `Evolved prompt version ${prompt.version + 1} incorporating ${effectivePatterns.length} effective patterns`,
                impact: "medium",
                evidence: {
                  promptVersionId: newVersion.id,
                  parentVersionId: prompt.id,
                  currentSuccessRate: promptSuccessRate,
                  averageSuccessRate: overallAvg,
                  patternsApplied: effectivePatterns.length,
                },
                status: "proposed",
              })
              .returning({ id: evolutionProposals.id });

            proposalsCreated.push(proposal.id);
          }
        }
      }

      // ── Phase 4: A/B Test Management ────────────────────────
      this.emitEvent(input, "progress", "Managing A/B tests...", 80);

      const canaryPrompts = await db
        .select()
        .from(promptVersions)
        .where(eq(promptVersions.status, "canary"));

      for (const canary of canaryPrompts) {
        const canaryOutcomes = await db
          .select({
            outcome: salesInteractionOutcomes.outcome,
            count: sql<number>`count(*)::int`.as("count"),
          })
          .from(salesInteractionOutcomes)
          .where(
            and(
              eq(salesInteractionOutcomes.promptVersionId, canary.id),
              gt(salesInteractionOutcomes.createdAt, sevenDaysAgo)
            )
          )
          .groupBy(salesInteractionOutcomes.outcome);

        const canaryTotal = canaryOutcomes.reduce(
          (s, r) => s + r.count,
          0
        );
        const canaryPositive =
          canaryOutcomes.find((r) => r.outcome === "positive")?.count ?? 0;
        const canaryRate = canaryTotal > 0 ? canaryPositive / canaryTotal : 0;

        // Check if canary has been running 7+ days
        const canaryAge =
          Date.now() - new Date(canary.createdAt).getTime();
        const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

        if (canaryAge < sevenDaysMs || canaryTotal < 50) {
          // Not enough data yet
          continue;
        }

        // Get the parent (active) version's metrics
        let parentRate = 0;
        if (canary.parentVersionId) {
          const parentOutcomes = await db
            .select({
              outcome: salesInteractionOutcomes.outcome,
              count: sql<number>`count(*)::int`.as("count"),
            })
            .from(salesInteractionOutcomes)
            .where(
              and(
                eq(
                  salesInteractionOutcomes.promptVersionId,
                  canary.parentVersionId
                ),
                gt(salesInteractionOutcomes.createdAt, sevenDaysAgo)
              )
            )
            .groupBy(salesInteractionOutcomes.outcome);

          const parentTotal = parentOutcomes.reduce(
            (s, r) => s + r.count,
            0
          );
          const parentPositive =
            parentOutcomes.find((r) => r.outcome === "positive")?.count ?? 0;
          parentRate = parentTotal > 0 ? parentPositive / parentTotal : 0;
        }

        const improvement = parentRate > 0 ? (canaryRate - parentRate) / parentRate : 0;
        const isSignificant = improvement > 0.05 && canaryTotal >= 50;

        if (isSignificant) {
          // Promote canary to active
          await db
            .update(promptVersions)
            .set({
              status: "active",
              promotedAt: new Date(),
              metricsOutcomeRate: canaryRate,
            })
            .where(eq(promptVersions.id, canary.id));

          // Retire old active version
          if (canary.parentVersionId) {
            await db
              .update(promptVersions)
              .set({ status: "retired", retiredAt: new Date() })
              .where(eq(promptVersions.id, canary.parentVersionId));
          }

          // Update related evolution proposal
          await db
            .update(evolutionProposals)
            .set({ status: "adopted", updatedAt: new Date() })
            .where(
              sql`${evolutionProposals.evidence}->>'promptVersionId' = ${canary.id}`
            );

          promotions.push(
            `${canary.promptKey} v${canary.version} promoted (+${(improvement * 100).toFixed(1)}%)`
          );
        } else {
          // Retire canary
          await db
            .update(promptVersions)
            .set({ status: "retired", retiredAt: new Date() })
            .where(eq(promptVersions.id, canary.id));

          // Reject related proposal
          await db
            .update(evolutionProposals)
            .set({ status: "rejected", updatedAt: new Date() })
            .where(
              sql`${evolutionProposals.evidence}->>'promptVersionId' = ${canary.id}`
            );

          retirements.push(
            `${canary.promptKey} v${canary.version} retired (improvement: ${(improvement * 100).toFixed(1)}%, not significant)`
          );
        }
      }

      // ── Return Results ──────────────────────────────────────
      this.emitEvent(input, "progress", "Evolution cycle complete", 100);

      return {
        success: true,
        data: {
          totalInteractions,
          patternsFound: patternsFound.length,
          patterns: patternsFound,
          proposalsCreated: proposalsCreated.length,
          proposalIds: proposalsCreated,
          promotions,
          retirements,
          weeklyProposals,
          rateLimitSkipped: weeklyProposals >= 5,
        },
        confidence: 0.8,
        costUsd: totalCost,
        tokensUsed: totalTokens,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      return {
        success: false,
        data: {
          error: message,
          patternsFound: patternsFound.length,
          proposalsCreated: proposalsCreated.length,
        },
        confidence: 0,
        costUsd: totalCost,
        tokensUsed: totalTokens,
        error: message,
      };
    }
  }
}
