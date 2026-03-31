import { BaseAgent, type AgentInput, type AgentOutput } from "./base";

const SYSTEM_PROMPT = `You are PalUp's Content Generation Agent. Create high-quality business content based on the brand identity and business context provided.

You can generate:
- Product descriptions
- Website copy (hero, about, features sections)
- Blog posts
- Social media content
- Email templates
- Ad copy
- SEO meta tags

Respond with ONLY a JSON object containing the requested content type:
{
  "contentType": "website_copy|product_description|blog_post|social_media|email|ad_copy|seo",
  "content": {
    // Structure depends on contentType
    // website_copy: { hero: { headline, subheadline, cta }, about: { title, body }, features: [{ title, description }] }
    // product_description: { title, shortDescription, longDescription, bulletPoints }
    // blog_post: { title, excerpt, body, tags }
    // social_media: { posts: [{ platform, text, hashtags }] }
    // email: { subject, preheader, body, cta }
    // ad_copy: { headlines: [], descriptions: [], callToActions: [] }
    // seo: { title, description, keywords: [] }
  }
}`;

export class ContentGenerationAgent extends BaseAgent {
  readonly agentType = "content_generation";
  readonly displayName = "Content Generation";
  readonly description = "Creates all text and media content for customer businesses";

  protected defaultTaskCategory = "content_writing" as const;
  protected defaultComplexity = "moderate" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const task = input.data.task as string;
    const goalContext = input.data.goalContext as string;
    const brand = input.context?.brand_design;

    this.emitEvent(input, "progress", "Generating content...", 20);

    let prompt = `Business goal: "${goalContext}"\nContent task: ${task}`;
    if (brand) {
      prompt += `\n\nBrand identity: ${JSON.stringify(brand)}`;
    }
    prompt += "\n\nGenerate the requested content following the brand guidelines.";

    // Route to cheaper model for simple content, expensive for complex
    const isSimpleContent = task.toLowerCase().includes("seo") || task.toLowerCase().includes("meta");

    const response = await this.callLLM(prompt, {
      systemPrompt: SYSTEM_PROMPT,
      category: "content_writing",
      complexity: isSimpleContent ? "simple" : "moderate",
      maxTokens: 4096,
      temperature: 0.6,
    });

    this.emitEvent(input, "progress", "Polishing content...", 80);

    try {
      const content = this.parseJSON<Record<string, unknown>>(response.content);
      return {
        success: true,
        data: { content },
        confidence: 0.82,
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
        error: "Failed to parse content generation output",
      };
    }
  }
}
