import { type BaseAgent } from "./base";
import { GoalInterpreterAgent } from "./goal-interpreter";
import { MarketResearchAgent } from "./market-research";
import { ContentGenerationAgent } from "./content-generation";
import { WebsiteBuilderAgent } from "./website-builder";
import { PaymentProcessingAgent } from "./payment-processing";
import { BrandDesignAgent } from "./brand-design";
import { LegalComplianceAgent } from "./legal-compliance";
import { MarketingAutomationAgent } from "./marketing-automation";
import { MonitorAgent } from "./monitor";
import { DebugFixAgent } from "./debug-fix";
import { EvolutionAgent } from "./evolution";
import { DeployAgent } from "./deploy";

// ─── Agent Factory ────────────────────────────────────────────
// Creates agent instances by type. Shared by both platform ops
// and customer-facing execution.

const AGENT_MAP: Record<string, () => BaseAgent> = {
  // Customer-facing agents
  goal_interpreter: () => new GoalInterpreterAgent(),
  market_research: () => new MarketResearchAgent(),
  content_generation: () => new ContentGenerationAgent(),
  website_builder: () => new WebsiteBuilderAgent(),
  payment_processing: () => new PaymentProcessingAgent(),
  brand_design: () => new BrandDesignAgent(),
  legal_compliance: () => new LegalComplianceAgent(),
  marketing_automation: () => new MarketingAutomationAgent(),
  // Auto-X agents (self-operating)
  monitor: () => new MonitorAgent(),
  debug_fix: () => new DebugFixAgent(),
  evolution: () => new EvolutionAgent(),
  deployment: () => new DeployAgent(),
};

export function agentFactory(agentType: string): BaseAgent | null {
  const factory = AGENT_MAP[agentType];
  if (!factory) return null;
  return factory();
}

export function getRegisteredAgentTypes(): string[] {
  return Object.keys(AGENT_MAP);
}

export function isValidAgentType(type: string): boolean {
  return type in AGENT_MAP;
}
