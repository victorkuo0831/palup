import { type LLMResponse } from "../llm/types";
import { llmCall } from "../llm/router";
import type {
  TaskCategory,
  TaskComplexity,
  LLMRequest,
} from "../llm/types";

// ─── Agent Types ──────────────────────────────────────────────

export interface AgentInput {
  workflowRunId: string;
  stepId: string;
  orgId: string;
  goalId: string;
  data: Record<string, unknown>;
  context?: Record<string, unknown>; // Output from previous steps
}

export interface AgentOutput {
  success: boolean;
  data: Record<string, unknown>;
  confidence: number; // 0-1
  artifacts?: AgentArtifact[];
  costUsd: number;
  tokensUsed: number;
  error?: string;
}

export interface AgentArtifact {
  type: "file" | "url" | "config" | "code" | "document";
  name: string;
  value: string; // URL, file path, or inline content
  metadata?: Record<string, unknown>;
}

export interface AgentEvent {
  workflowRunId: string;
  stepId: string;
  agentType: string;
  status: "started" | "progress" | "completed" | "failed";
  message?: string;
  progress?: number; // 0-100
  timestamp: Date;
}

// ─── Validation Rule ──────────────────────────────────────────

export interface ValidationRule {
  name: string;
  validate: (output: AgentOutput) => Promise<{ valid: boolean; message?: string }>;
}

// ─── Base Agent Class ─────────────────────────────────────────

export abstract class BaseAgent {
  abstract readonly agentType: string;
  abstract readonly displayName: string;
  abstract readonly description: string;

  // Default task routing for this agent
  protected defaultTaskCategory: TaskCategory = "reasoning";
  protected defaultComplexity: TaskComplexity = "moderate";

  // Validation rules for output
  protected validationRules: ValidationRule[] = [];

  // Event emitter (will be connected to Redis Streams)
  private eventCallback?: (event: AgentEvent) => void;

  setEventCallback(cb: (event: AgentEvent) => void) {
    this.eventCallback = cb;
  }

  protected emitEvent(
    input: AgentInput,
    status: AgentEvent["status"],
    message?: string,
    progress?: number
  ) {
    if (this.eventCallback) {
      this.eventCallback({
        workflowRunId: input.workflowRunId,
        stepId: input.stepId,
        agentType: this.agentType,
        status,
        message,
        progress,
        timestamp: new Date(),
      });
    }
  }

  // ─── Core Execution Flow ────────────────────────────────────

  async execute(input: AgentInput): Promise<AgentOutput> {
    this.emitEvent(input, "started", `${this.displayName} starting`);

    try {
      // 1. Pre-process input
      const processedInput = await this.preProcess(input);

      // 2. Execute the agent's core logic
      const output = await this.run(processedInput);

      // 3. Validate output
      const validationResult = await this.validate(output);
      if (!validationResult.valid) {
        this.emitEvent(input, "failed", validationResult.message);
        return {
          ...output,
          success: false,
          error: validationResult.message,
        };
      }

      // 4. Post-process
      const finalOutput = await this.postProcess(output, input);

      this.emitEvent(input, "completed", `${this.displayName} completed`, 100);
      return finalOutput;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      this.emitEvent(input, "failed", errorMessage);
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: 0,
        tokensUsed: 0,
        error: errorMessage,
      };
    }
  }

  // ─── Abstract Methods (implement per agent) ─────────────────

  protected abstract run(input: AgentInput): Promise<AgentOutput>;

  // ─── Optional Hooks ─────────────────────────────────────────

  protected async preProcess(input: AgentInput): Promise<AgentInput> {
    return input;
  }

  protected async postProcess(
    output: AgentOutput,
    _input: AgentInput
  ): Promise<AgentOutput> {
    return output;
  }

  // ─── Validation ─────────────────────────────────────────────

  protected async validate(
    output: AgentOutput
  ): Promise<{ valid: boolean; message?: string }> {
    for (const rule of this.validationRules) {
      const result = await rule.validate(output);
      if (!result.valid) {
        return result;
      }
    }
    return { valid: true };
  }

  // ─── LLM Helper (uses cost-optimized router) ───────────────

  protected async callLLM(
    prompt: string,
    options?: {
      systemPrompt?: string;
      category?: TaskCategory;
      complexity?: TaskComplexity;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<LLMResponse> {
    const request: LLMRequest = {
      taskCategory: options?.category || this.defaultTaskCategory,
      complexity: options?.complexity || this.defaultComplexity,
      systemPrompt: options?.systemPrompt,
      userPrompt: prompt,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
    };

    return llmCall(request);
  }

  // ─── JSON Parse Helper ──────────────────────────────────────

  protected parseJSON<T>(text: string): T {
    // Extract JSON from markdown code blocks if present
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const jsonStr = jsonMatch ? jsonMatch[1].trim() : text.trim();
    return JSON.parse(jsonStr) as T;
  }
}
