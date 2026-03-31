import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Website Builder Agent. Given brand identity, content, and business requirements, generate a complete website specification.

You produce a structured website definition that the deployment system will render:

Respond with ONLY a JSON object:
{
  "siteType": "landing_page|ecommerce|portfolio|blog|saas",
  "framework": "nextjs",
  "pages": [
    {
      "path": "/",
      "title": "Page title",
      "sections": [
        {
          "type": "hero|features|pricing|testimonials|cta|about|contact|products|footer|header|faq",
          "props": { /* section-specific properties */ }
        }
      ]
    }
  ],
  "theme": {
    "colors": { "primary": "#hex", "secondary": "#hex", "accent": "#hex", "background": "#hex", "text": "#hex" },
    "fonts": { "heading": "font", "body": "font" },
    "borderRadius": "sm|md|lg",
    "style": "modern|minimal|bold|elegant"
  },
  "seo": {
    "title": "Site title",
    "description": "Meta description",
    "keywords": ["keyword1", "keyword2"]
  },
  "integrations": ["stripe", "analytics", "email_capture"]
}`;

export class WebsiteBuilderAgent extends BaseAgent {
  readonly agentType = "website_builder";
  readonly displayName = "Website Builder";
  readonly description = "Builds and deploys customer websites and e-commerce stores";

  protected defaultTaskCategory = "code_generation" as const;
  protected defaultComplexity = "complex" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;
    const brand = input.context?.brand_design;
    const content = input.context?.content_generation;

    this.emitEvent(input, "progress", "Designing website structure...", 20);

    let prompt = `Business goal: "${goalContext}"\nWebsite task: ${task}`;
    if (brand) prompt += `\n\nBrand: ${JSON.stringify(brand)}`;
    if (content) prompt += `\n\nContent: ${JSON.stringify(content)}`;
    prompt += "\n\nGenerate a complete website specification.";

    const response = await this.callLLM(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      category: "code_generation",
      complexity: "complex",
      maxTokens: 8192,
      temperature: 0.3,
    });

    this.emitEvent(input, "progress", "Building site components...", 60);

    try {
      const siteSpec = this.parseJSON<Record<string, unknown>>(response.content);

      return {
        success: true,
        data: { siteSpec },
        confidence: 0.8,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
        artifacts: [
          {
            type: "config",
            name: "site-spec.json",
            value: JSON.stringify(siteSpec, null, 2),
          },
        ],
      };
    } catch {
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
        error: "Failed to parse website specification",
      };
    }
  }
}
