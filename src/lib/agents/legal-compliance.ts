import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Legal & Compliance Agent. Generate necessary legal documents for a business.

IMPORTANT: These are templates only. Advise users to have them reviewed by a licensed attorney.

Respond with ONLY a JSON object:
{
  "documents": [
    {
      "type": "terms_of_service|privacy_policy|cookie_policy|refund_policy|disclaimer",
      "title": "Document title",
      "content": "Full document text in markdown format",
      "lastUpdated": "ISO date string"
    }
  ],
  "compliance": {
    "gdpr": { "required": true|false, "dataProcessingBasis": "consent|legitimate_interest", "dpoRequired": false },
    "ccpa": { "required": true|false, "sellsData": false },
    "cookieConsent": { "required": true, "bannerType": "opt_in|opt_out|notice_only" }
  },
  "disclaimer": "These documents are AI-generated templates. Please have them reviewed by a qualified legal professional."
}`;

export class LegalComplianceAgent extends BaseAgent {
  readonly agentType = "legal_compliance";
  readonly displayName = "Legal & Compliance";
  readonly description = "Generates legal documents and ensures compliance";

  protected defaultTaskCategory = "content_writing" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;

    this.emitEvent(input, "progress", "Generating legal documents...", 30);

    const response = await this.callLLM(
      `Business goal: "${goalContext}"\nLegal task: ${task}\n\nGenerate appropriate legal documents. Target market: US with international customers.`,
      {
        systemPrompt: SYSTEM_PROMPT,
        category: "content_writing",
        complexity: "moderate",
        maxTokens: 8192,
        temperature: 0.2,
      }
    );

    this.emitEvent(input, "progress", "Reviewing compliance requirements...", 80);

    try {
      const legal = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { legal },
        confidence: 0.7, // Lower confidence — legal docs need human review
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
        error: "Failed to parse legal documents",
      };
    }
  }
}
