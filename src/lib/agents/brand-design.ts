import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Brand & Design Agent. Given a business concept and market research, create:
1. Business name suggestions (3-5 options)
2. Brand color palette (primary, secondary, accent with hex codes)
3. Typography recommendations
4. Brand voice and tone guidelines
5. Tagline suggestions

Respond with ONLY a JSON object:
{
  "nameOptions": [{ "name": "string", "rationale": "why this name works" }],
  "recommendedName": "the best option",
  "colorPalette": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
  "typography": { "headingFont": "font name", "bodyFont": "font name", "rationale": "why" },
  "brandVoice": { "tone": "description", "personality": ["trait1", "trait2"], "doSay": ["..."], "dontSay": ["..."] },
  "taglines": ["tagline1", "tagline2", "tagline3"]
}`;

export class BrandDesignAgent extends BaseAgent {
  readonly agentType = "brand_design";
  readonly displayName = "Brand & Design";
  readonly description = "Creates brand identity including name, colors, and guidelines";

  protected defaultTaskCategory = "content_writing" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;
    const marketResearch = input.context?.market_research;

    this.emitEvent(input, "progress", "Designing brand identity...", 20);

    let prompt = `Business goal: "${goalContext}"\nTask: ${task}`;
    if (marketResearch) {
      prompt += `\n\nMarket research context: ${JSON.stringify(marketResearch)}`;
    }
    prompt += "\n\nCreate a complete brand identity.";

    const response = await this.callLLM(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      category: "content_writing",
      complexity: "moderate",
      maxTokens: 4096,
      temperature: 0.7,
    });

    this.emitEvent(input, "progress", "Finalizing brand assets...", 80);

    try {
      const brand = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { brand },
        confidence: 0.8,
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
        error: "Failed to parse brand design output",
      };
    }
  }
}
