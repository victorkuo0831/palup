import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Marketing Automation Agent. Design marketing campaigns and strategies.

Respond with ONLY a JSON object:
{
  "strategy": {
    "channels": ["organic_social", "paid_social", "seo", "email", "content_marketing", "ppc"],
    "budget": { "monthly": number, "allocation": { "channel": percentage } },
    "timeline": "30/60/90 day plan description"
  },
  "campaigns": [
    {
      "name": "Campaign name",
      "channel": "channel_name",
      "objective": "awareness|traffic|conversion|retention",
      "content": {
        "headlines": ["headline1"],
        "descriptions": ["desc1"],
        "callToActions": ["cta1"]
      },
      "targeting": { "audience": "description", "demographics": {}, "interests": [] },
      "budget": { "daily": number, "duration_days": number }
    }
  ],
  "emailSequences": [
    {
      "name": "Sequence name",
      "trigger": "signup|purchase|abandoned_cart",
      "emails": [
        { "delay_hours": 0, "subject": "string", "preview": "first line of email" }
      ]
    }
  ],
  "seo": {
    "targetKeywords": ["keyword1"],
    "contentCalendar": [{ "week": 1, "topic": "string", "type": "blog|video|infographic" }]
  }
}`;

export class MarketingAutomationAgent extends BaseAgent {
  readonly agentType = "marketing_automation";
  readonly displayName = "Marketing Automation";
  readonly description = "Designs and manages marketing campaigns across channels";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;
    const brand = input.context?.brand_design;
    const marketResearch = input.context?.market_research;

    this.emitEvent(input, "progress", "Designing marketing strategy...", 20);

    let prompt = `Business goal: "${goalContext}"\nMarketing task: ${task}`;
    if (brand) prompt += `\n\nBrand: ${JSON.stringify(brand)}`;
    if (marketResearch) prompt += `\n\nMarket research: ${JSON.stringify(marketResearch)}`;
    prompt += "\n\nDesign a complete marketing strategy and initial campaigns.";

    const response = await this.callLLM(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      category: "reasoning",
      complexity: "moderate",
      maxTokens: 6144,
      temperature: 0.5,
    });

    this.emitEvent(input, "progress", "Setting up campaigns...", 80);

    try {
      const marketing = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { marketing },
        confidence: 0.78,
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
        error: "Failed to parse marketing strategy",
      };
    }
  }
}
