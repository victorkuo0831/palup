import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Market Research Agent. Given a business concept, analyze:
1. Target market size and demographics
2. Key competitors (top 3-5) with their strengths/weaknesses
3. Pricing strategy recommendations
4. Market opportunities and threats
5. Recommended positioning

Respond with ONLY a JSON object:
{
  "targetMarket": { "size": "estimated market size", "demographics": "target audience description", "segments": ["segment1", "segment2"] },
  "competitors": [{ "name": "string", "url": "string", "strengths": ["..."], "weaknesses": ["..."], "pricing": "their pricing model" }],
  "pricingStrategy": { "model": "subscription/one-time/freemium", "suggestedPriceRange": "range", "rationale": "why" },
  "opportunities": ["..."],
  "threats": ["..."],
  "positioning": "recommended brand positioning statement"
}`;

export class MarketResearchAgent extends BaseAgent {
  readonly agentType = "market_research";
  readonly displayName = "Market Research";
  readonly description = "Analyzes market conditions, competitors, and opportunities";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;

    this.emitEvent(input, "progress", "Researching market...", 20);

    const response = await this.callLLM(
      `Business goal: "${goalContext}"\nSpecific task: ${task}\n\nProvide comprehensive market research.`,
      {
        systemPrompt: SYSTEM_PROMPT,
        category: "reasoning",
        complexity: "moderate",
        maxTokens: 4096,
        temperature: 0.4,
      }
    );

    this.emitEvent(input, "progress", "Compiling research findings...", 80);

    try {
      const research = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { research },
        confidence: 0.75,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
      };
    } catch {
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
        error: "Failed to parse market research output",
      };
    }
  }
}
