import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Payment Processing Agent. Given a business context, define the payment configuration:

Respond with ONLY a JSON object:
{
  "paymentModel": "one_time|subscription|usage_based|freemium",
  "currency": "usd",
  "products": [
    {
      "name": "Product/Plan name",
      "description": "Description",
      "priceAmountCents": 2999,
      "interval": "month|year|null",
      "features": ["feature1", "feature2"]
    }
  ],
  "checkoutConfig": {
    "allowPromoCodes": true,
    "collectAddress": false,
    "collectPhone": false,
    "successUrl": "/success",
    "cancelUrl": "/pricing"
  },
  "stripeConfig": {
    "connectType": "standard",
    "platformFeePercent": 2,
    "payoutSchedule": "daily"
  }
}`;

export class PaymentProcessingAgent extends BaseAgent {
  readonly agentType = "payment_processing";
  readonly displayName = "Payment Processing";
  readonly description = "Sets up Stripe payments and revenue collection";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;
    const marketResearch = input.context?.market_research;

    this.emitEvent(input, "progress", "Designing payment structure...", 20);

    let prompt = `Business goal: "${goalContext}"\nPayment task: ${task}`;
    if (marketResearch) {
      prompt += `\n\nMarket research (pricing context): ${JSON.stringify(marketResearch)}`;
    }
    prompt += "\n\nDesign the complete payment configuration.";

    const response = await this.callLLM(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      category: "reasoning",
      complexity: "moderate",
      maxTokens: 4096,
      temperature: 0.3,
    });

    this.emitEvent(input, "progress", "Configuring payment system...", 70);

    try {
      const paymentConfig = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { paymentConfig },
        confidence: 0.85,
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
        error: "Failed to parse payment configuration",
      };
    }
  }
}
