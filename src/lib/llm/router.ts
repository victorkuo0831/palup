import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import {
  type LLMProvider,
  type TaskCategory,
  type TaskComplexity,
  type ModelConfig,
  type RoutingDecision,
  type LLMRequest,
  type LLMResponse,
} from "./types";

// ─── Model Registry (Cost-Optimized) ─────────────────────────

const MODEL_REGISTRY: ModelConfig[] = [
  // Cheapest first for each capability
  {
    provider: "google",
    model: "gemini-2.0-flash",
    inputCostPer1MTokens: 0.1,
    outputCostPer1MTokens: 0.4,
    maxContextTokens: 1_000_000,
    capabilities: ["extraction", "summarization", "content_writing"],
    qualityScore: 0.75,
    avgLatencyMs: 800,
  },
  {
    provider: "deepseek",
    model: "deepseek-chat",
    inputCostPer1MTokens: 0.14,
    outputCostPer1MTokens: 0.28,
    maxContextTokens: 128_000,
    capabilities: ["extraction", "code_generation", "reasoning"],
    qualityScore: 0.78,
    avgLatencyMs: 1200,
  },
  {
    provider: "anthropic",
    model: "claude-haiku-4-5-20251001",
    inputCostPer1MTokens: 0.8,
    outputCostPer1MTokens: 4.0,
    maxContextTokens: 200_000,
    capabilities: [
      "extraction",
      "summarization",
      "content_writing",
      "reasoning",
    ],
    qualityScore: 0.82,
    avgLatencyMs: 600,
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    inputCostPer1MTokens: 0.15,
    outputCostPer1MTokens: 0.6,
    maxContextTokens: 128_000,
    capabilities: ["extraction", "summarization", "content_writing"],
    qualityScore: 0.77,
    avgLatencyMs: 700,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4-6-20250514",
    inputCostPer1MTokens: 3.0,
    outputCostPer1MTokens: 15.0,
    maxContextTokens: 200_000,
    capabilities: [
      "extraction",
      "summarization",
      "reasoning",
      "code_generation",
      "content_writing",
    ],
    qualityScore: 0.95,
    avgLatencyMs: 1500,
  },
  {
    provider: "openai",
    model: "gpt-4o",
    inputCostPer1MTokens: 2.5,
    outputCostPer1MTokens: 10.0,
    maxContextTokens: 128_000,
    capabilities: [
      "extraction",
      "summarization",
      "reasoning",
      "code_generation",
      "content_writing",
    ],
    qualityScore: 0.92,
    avgLatencyMs: 1200,
  },
  // Embedding models
  {
    provider: "openai",
    model: "text-embedding-3-small",
    inputCostPer1MTokens: 0.02,
    outputCostPer1MTokens: 0,
    maxContextTokens: 8_191,
    capabilities: ["embedding"],
    qualityScore: 0.85,
    avgLatencyMs: 200,
  },
  // Reranking
  {
    provider: "cohere",
    model: "rerank-english-v3.0",
    inputCostPer1MTokens: 0,
    outputCostPer1MTokens: 0,
    maxContextTokens: 4_096,
    capabilities: ["reranking"],
    qualityScore: 0.9,
    avgLatencyMs: 300,
  },
];

// ─── Complexity → Quality Threshold ──────────────────────────

const QUALITY_THRESHOLDS: Record<TaskComplexity, number> = {
  simple: 0.7,
  moderate: 0.8,
  complex: 0.9,
  expert: 0.93,
};

// ─── Router Core ──────────────────────────────────────────────

export function routeRequest(
  category: TaskCategory,
  complexity: TaskComplexity
): RoutingDecision {
  const minQuality = QUALITY_THRESHOLDS[complexity];

  // Filter models that support this category and meet quality threshold
  const eligible = MODEL_REGISTRY.filter(
    (m) => m.capabilities.includes(category) && m.qualityScore >= minQuality
  );

  if (eligible.length === 0) {
    // Fallback to highest quality model available for this category
    const fallbackEligible = MODEL_REGISTRY.filter((m) =>
      m.capabilities.includes(category)
    ).sort((a, b) => b.qualityScore - a.qualityScore);

    if (fallbackEligible.length === 0) {
      throw new Error(`No model available for category: ${category}`);
    }

    return {
      primary: fallbackEligible[0],
      fallback: fallbackEligible[1] || null,
      reason: `No model meets quality threshold ${minQuality} for ${category}/${complexity}. Using best available.`,
      estimatedCostUsd: 0,
    };
  }

  // Sort by total cost (input + output) ascending — cheapest first
  const sorted = eligible.sort(
    (a, b) =>
      a.inputCostPer1MTokens +
      a.outputCostPer1MTokens -
      (b.inputCostPer1MTokens + b.outputCostPer1MTokens)
  );

  const primary = sorted[0];
  const fallback = sorted.length > 1 ? sorted[1] : null;

  return {
    primary,
    fallback,
    reason: `Cheapest model meeting quality ${minQuality} for ${category}/${complexity}`,
    estimatedCostUsd: 0,
  };
}

// ─── LLM Client Factory ──────────────────────────────────────

function getAnthropicClient(): Anthropic {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

function getDeepSeekClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });
}

function getGoogleClient(): OpenAI {
  return new OpenAI({
    apiKey: process.env.GOOGLE_AI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

// ─── Execute LLM Call ─────────────────────────────────────────

async function callProvider(
  config: ModelConfig,
  request: LLMRequest
): Promise<LLMResponse> {
  const startTime = Date.now();

  if (config.provider === "anthropic") {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: config.model,
      max_tokens: request.maxTokens || 4096,
      temperature: request.temperature,
      system: request.systemPrompt || "",
      messages: [{ role: "user", content: request.userPrompt }],
    });

    const content =
      response.content[0].type === "text" ? response.content[0].text : "";
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;
    const costUsd =
      (inputTokens * config.inputCostPer1MTokens +
        outputTokens * config.outputCostPer1MTokens) /
      1_000_000;

    return {
      content,
      model: config.model,
      provider: config.provider,
      inputTokens,
      outputTokens,
      costUsd,
      latencyMs: Date.now() - startTime,
    };
  }

  // OpenAI-compatible providers (OpenAI, DeepSeek, Google)
  let client: OpenAI;
  switch (config.provider) {
    case "deepseek":
      client = getDeepSeekClient();
      break;
    case "google":
      client = getGoogleClient();
      break;
    default:
      client = getOpenAIClient();
  }

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];
  if (request.systemPrompt) {
    messages.push({ role: "system", content: request.systemPrompt });
  }
  messages.push({ role: "user", content: request.userPrompt });

  const response = await client.chat.completions.create({
    model: config.model,
    max_tokens: request.maxTokens || 4096,
    temperature: request.temperature,
    messages,
  });

  const content = response.choices[0]?.message?.content || "";
  const inputTokens = response.usage?.prompt_tokens || 0;
  const outputTokens = response.usage?.completion_tokens || 0;
  const costUsd =
    (inputTokens * config.inputCostPer1MTokens +
      outputTokens * config.outputCostPer1MTokens) /
    1_000_000;

  return {
    content,
    model: config.model,
    provider: config.provider,
    inputTokens,
    outputTokens,
    costUsd,
    latencyMs: Date.now() - startTime,
  };
}

// ─── Main Entry Point ─────────────────────────────────────────

export async function llmCall(request: LLMRequest): Promise<LLMResponse> {
  const routing = routeRequest(request.taskCategory, request.complexity);

  try {
    const response = await callProvider(routing.primary, request);
    return response;
  } catch (error) {
    // Fallback to secondary model
    if (routing.fallback) {
      console.warn(
        `Primary model ${routing.primary.model} failed, falling back to ${routing.fallback.model}:`,
        error
      );
      return callProvider(routing.fallback, request);
    }
    throw error;
  }
}

// ─── Embedding Helper ─────────────────────────────────────────

export async function generateEmbedding(text: string): Promise<number[]> {
  const client = getOpenAIClient();
  const response = await client.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });
  return response.data[0].embedding;
}

export { MODEL_REGISTRY };
