import { BaseAgent, type AgentInput, type AgentOutput } from "./base";
import type { DAG, DAGNode } from "../workflow/engine";

// ─── Goal Interpreter Agent ───────────────────────────────────
// Takes a natural-language business goal and decomposes it into
// an executable DAG of sub-tasks assigned to specialized agents.

const SYSTEM_PROMPT = `You are PalUp's Goal Interpreter — an expert business strategist and execution planner.

Given a user's business goal described in one sentence, you must:
1. Understand the business intent
2. Identify all necessary steps to achieve the goal from scratch (0→1)
3. Decompose the goal into a DAG (directed acyclic graph) of executable tasks
4. Assign each task to the appropriate specialized agent
5. Define dependencies between tasks

Available agent types and their capabilities:
- market_research: Analyze market conditions, competitors, pricing, target demographics
- brand_design: Create business name, logo, color palette, brand guidelines, check domain availability
- website_builder: Build and deploy websites, e-commerce stores, landing pages
- content_generation: Create product descriptions, blog posts, social media content, email copy, ad copy, SEO
- sales_crm: Set up lead tracking, email outreach sequences, proposal generation
- payment_processing: Set up Stripe payments, product/price configuration, checkout flows
- deployment: Deploy sites/apps, configure DNS, SSL, custom domains
- marketing_automation: Set up Google Ads, Meta Ads, email campaigns, SEO monitoring
- analytics_reporting: Set up analytics dashboards, tracking, reporting
- legal_compliance: Generate Terms of Service, Privacy Policy, cookie consent, GDPR compliance
- migration: Import data from existing platforms (Shopify, WordPress, etc.)

Rules:
- Each node has a unique ID (use short descriptive IDs like "research", "brand", "store")
- dependsOn lists the IDs of nodes that must complete before this node can start
- Maximize parallelism: if two tasks are independent, they should NOT depend on each other
- Include input data for each task describing what specifically it should do
- Be comprehensive: include everything needed from idea to revenue-generating business

Respond with ONLY a JSON object (no markdown, no explanation):
{
  "summary": "Brief interpretation of the goal",
  "estimatedDurationMinutes": number,
  "nodes": [
    {
      "id": "short_id",
      "agentType": "agent_type_from_list",
      "description": "What this step does",
      "input": { "task": "specific instructions for the agent", ...any relevant params },
      "dependsOn": ["id_of_dependency"]
    }
  ]
}`;

interface GoalPlan {
  summary: string;
  estimatedDurationMinutes: number;
  nodes: Array<{
    id: string;
    agentType: string;
    description: string;
    input: Record<string, unknown>;
    dependsOn: string[];
  }>;
}

export class GoalInterpreterAgent extends BaseAgent {
  readonly agentType = "goal_interpreter";
  readonly displayName = "Goal Interpreter";
  readonly description =
    "Decomposes a natural-language business goal into an executable plan";

  protected defaultTaskCategory = "reasoning" as const;
  protected defaultComplexity = "complex" as const;

  protected async run(input: AgentInput): Promise<AgentOutput> {
    const rawGoal = input.data.rawInput as string;
    if (!rawGoal) {
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: 0,
        tokensUsed: 0,
        error: "No goal input provided",
      };
    }

    this.emitEvent(input, "progress", "Analyzing business goal...", 10);

    // Call LLM with complex reasoning (routes to Claude Sonnet)
    const response = await this.callLLM(
      `Business goal: "${rawGoal}"\n\nDecompose this into a complete execution plan.`,
      {
        systemPrompt: SYSTEM_PROMPT,
        category: "reasoning",
        complexity: "complex",
        maxTokens: 8192,
        temperature: 0.3,
      }
    );

    this.emitEvent(input, "progress", "Building execution plan...", 60);

    let plan: GoalPlan;
    try {
      plan = this.parseJSON<GoalPlan>(response.content);
    } catch {
      return {
        success: false,
        data: {},
        confidence: 0,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
        error: "Failed to parse goal decomposition",
      };
    }

    // Validate the plan structure
    const validation = this.validatePlan(plan);
    if (!validation.valid) {
      return {
        success: false,
        data: { plan },
        confidence: 0,
        costUsd: response.costUsd,
        tokensUsed: response.inputTokens + response.outputTokens,
        error: validation.message,
      };
    }

    // Convert to DAG format
    const dag: DAG = {
      nodes: plan.nodes.map((node) => ({
        id: node.id,
        agentType: node.agentType,
        input: {
          ...node.input,
          description: node.description,
          goalContext: rawGoal,
        },
        dependsOn: node.dependsOn,
      })),
    };

    this.emitEvent(input, "progress", "Plan ready for execution", 100);

    return {
      success: true,
      data: {
        summary: plan.summary,
        estimatedDurationMinutes: plan.estimatedDurationMinutes,
        dag,
        nodeCount: plan.nodes.length,
      },
      confidence: 0.85,
      costUsd: response.costUsd,
      tokensUsed: response.inputTokens + response.outputTokens,
    };
  }

  private validatePlan(plan: GoalPlan): { valid: boolean; message?: string } {
    if (!plan.nodes || plan.nodes.length === 0) {
      return { valid: false, message: "Plan has no execution nodes" };
    }

    const nodeIds = new Set(plan.nodes.map((n) => n.id));

    // Check for duplicate IDs
    if (nodeIds.size !== plan.nodes.length) {
      return { valid: false, message: "Plan has duplicate node IDs" };
    }

    // Check all dependencies reference valid nodes
    for (const node of plan.nodes) {
      for (const dep of node.dependsOn) {
        if (!nodeIds.has(dep)) {
          return {
            valid: false,
            message: `Node "${node.id}" depends on unknown node "${dep}"`,
          };
        }
      }
    }

    // Check for circular dependencies
    if (this.hasCycle(plan.nodes)) {
      return { valid: false, message: "Plan has circular dependencies" };
    }

    const validAgentTypes = new Set([
      "market_research",
      "brand_design",
      "website_builder",
      "content_generation",
      "sales_crm",
      "payment_processing",
      "deployment",
      "marketing_automation",
      "analytics_reporting",
      "legal_compliance",
      "migration",
    ]);

    for (const node of plan.nodes) {
      if (!validAgentTypes.has(node.agentType)) {
        return {
          valid: false,
          message: `Node "${node.id}" has invalid agent type "${node.agentType}"`,
        };
      }
    }

    return { valid: true };
  }

  private hasCycle(nodes: GoalPlan["nodes"]): boolean {
    const visited = new Set<string>();
    const inStack = new Set<string>();
    const adj = new Map<string, string[]>();

    for (const node of nodes) {
      adj.set(
        node.id,
        node.dependsOn
      );
    }

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      inStack.add(nodeId);

      for (const dep of adj.get(nodeId) || []) {
        if (!visited.has(dep)) {
          if (dfs(dep)) return true;
        } else if (inStack.has(dep)) {
          return true;
        }
      }

      inStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (dfs(node.id)) return true;
      }
    }

    return false;
  }
}
