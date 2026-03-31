// ─── LLM Router Types ─────────────────────────────────────────

export type LLMProvider = "anthropic" | "openai" | "google" | "deepseek" | "cohere";

export type TaskComplexity = "simple" | "moderate" | "complex" | "expert";

export type TaskCategory =
  | "extraction"      // Simple data extraction, classification
  | "summarization"   // Summarize content
  | "reasoning"       // Complex reasoning, planning, decomposition
  | "code_generation" // Generate code
  | "content_writing" // Blog posts, descriptions, marketing copy
  | "embedding"       // Vector embeddings
  | "image_generation" // Generate images
  | "reranking";      // Rerank search results

export interface ModelConfig {
  provider: LLMProvider;
  model: string;
  inputCostPer1MTokens: number;
  outputCostPer1MTokens: number;
  maxContextTokens: number;
  capabilities: TaskCategory[];
  qualityScore: number; // 0-1
  avgLatencyMs: number;
}

export interface RoutingDecision {
  primary: ModelConfig;
  fallback: ModelConfig | null;
  reason: string;
  estimatedCostUsd: number;
}

export interface LLMRequest {
  taskCategory: TaskCategory;
  complexity: TaskComplexity;
  systemPrompt?: string;
  userPrompt: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  orgId?: string; // For usage tracking
  agentType?: string; // For usage tracking
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: LLMProvider;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  latencyMs: number;
}

export interface LLMStreamChunk {
  content: string;
  done: boolean;
}
