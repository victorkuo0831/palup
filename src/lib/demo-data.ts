// ─── Demo Data for Sales Agent Platform ─────────────────────────
// Realistic seed data for all dashboard views

// ─── Types ───────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  website: string;
  industry: string;
  size: string;
  icpScore: number;
  location: string;
}

export interface Contact {
  id: string;
  companyId: string;
  name: string;
  email: string;
  title: string;
  phone: string;
  source: "inbound" | "outbound" | "referral" | "event";
}

export type DealStage = "lead" | "qualified" | "demo" | "proposal" | "negotiation" | "closed_won" | "closed_lost";

export interface Deal {
  id: string;
  companyId: string;
  contactId: string;
  title: string;
  stage: DealStage;
  amount: number;
  probability: number;
  assignedAgent: string;
  nextAction: string;
  daysInStage: number;
  expectedCloseDate: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  dealId: string;
  contactId: string;
  agentType: string;
  type: "email_sent" | "email_opened" | "email_replied" | "meeting_scheduled" | "meeting_completed" | "proposal_sent" | "call_completed" | "note" | "stage_change" | "linkedin_sent";
  channel: "email" | "linkedin" | "phone" | "chat" | "internal";
  summary: string;
  outcome: "positive" | "negative" | "neutral" | "pending";
  timestamp: string;
}

export interface AgentInfo {
  id: string;
  type: string;
  name: string;
  status: "active" | "idle" | "error";
  metrics: {
    activitiesTotal: number;
    activitiesToday: number;
    successRate: number;
    avgResponseTime: string;
  };
  lastAction: string;
  lastActionTime: string;
}

export type AlertSeverity = "critical" | "warning" | "info";
export type AlertStatus = "active" | "investigating" | "resolved" | "dismissed";

export interface AnomalyAlert {
  id: string;
  metric: string;
  currentValue: number;
  threshold: number;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  detectedAt: string;
  resolvedAt: string | null;
}

export type DebugStatus = "diagnosing" | "fix_proposed" | "pr_created" | "reviewing" | "merged" | "deployed" | "verified" | "failed";

export interface DebugSession {
  id: string;
  alertId: string;
  rootCause: string;
  rootCauseCategory: "prompt_drift" | "knowledge_stale" | "integration_error" | "rate_limit" | "context_overflow";
  proposedFix: string;
  confidence: number;
  status: DebugStatus;
  prUrl: string | null;
  metricsBeforeFix: { metric: string; value: number }[];
  metricsAfterFix: { metric: string; value: number }[] | null;
  startedAt: string;
  completedAt: string | null;
}

export type DeployStatus = "building" | "canary" | "rolling_out" | "deployed" | "rolled_back" | "failed";

export interface Deployment {
  id: string;
  version: string;
  triggeredBy: "debug_fix" | "evolution" | "manual" | "dependency_update";
  triggerDescription: string;
  status: DeployStatus;
  canaryPercent: number;
  healthCheck: "healthy" | "degraded" | "unhealthy" | "pending";
  startedAt: string;
  completedAt: string | null;
}

export type PromptStatus = "active" | "canary" | "retired" | "draft";

export interface PromptVersion {
  id: string;
  agentType: string;
  promptKey: string;
  version: number;
  status: PromptStatus;
  canaryPercent: number;
  metrics: {
    outcomeRate: number;
    avgConfidence: number;
    avgLatencyMs: number;
    costPerInteraction: number;
  };
  content: string;
  createdAt: string;
  promotedAt: string | null;
}

export type ProposalStatus = "proposed" | "ab_testing" | "adopted" | "rejected";

export interface EvolutionProposal {
  id: string;
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  evidence: string;
  status: ProposalStatus;
  abTestResult: {
    controlRate: number;
    variantRate: number;
    improvement: number;
    sampleSize: number;
    significant: boolean;
  } | null;
  createdAt: string;
}

export interface SalesPattern {
  id: string;
  patternType: "effective" | "ineffective";
  stage: DealStage;
  description: string;
  occurrences: number;
  successRate: number;
  extractedAt: string;
}

export type KnowledgeType = "product" | "competitor" | "playbook" | "objection";

export interface KnowledgeEntry {
  id: string;
  type: KnowledgeType;
  title: string;
  content: string;
  updatedAt: string;
}

// ─── Health Metrics for Monitor ──────────────────────────────────

export interface HealthMetric {
  label: string;
  value: number;
  unit: string;
  trend: number; // % change
  status: "good" | "warning" | "critical";
  history: number[]; // last 7 days
}

// ─── Data ────────────────────────────────────────────────────────

export const companies: Company[] = [
  { id: "c1", name: "TechFlow Inc", website: "techflow.io", industry: "SaaS", size: "50-100", icpScore: 92, location: "San Francisco, CA" },
  { id: "c2", name: "GreenLeaf Commerce", website: "greenleaf.co", industry: "E-commerce", size: "10-50", icpScore: 88, location: "Austin, TX" },
  { id: "c3", name: "DataPulse Analytics", website: "datapulse.com", industry: "SaaS", size: "100-200", icpScore: 95, location: "New York, NY" },
  { id: "c4", name: "SwiftShip Logistics", website: "swiftship.co", industry: "Logistics", size: "50-100", icpScore: 72, location: "Chicago, IL" },
  { id: "c5", name: "MindBridge AI", website: "mindbridge.ai", industry: "SaaS", size: "10-50", icpScore: 90, location: "Toronto, CA" },
  { id: "c6", name: "Coastal Brands", website: "coastalbrands.com", industry: "D2C", size: "10-50", icpScore: 85, location: "Miami, FL" },
  { id: "c7", name: "NorthStar Consulting", website: "northstar-consulting.com", industry: "Professional Services", size: "10-50", icpScore: 78, location: "Boston, MA" },
  { id: "c8", name: "PixelForge Studios", website: "pixelforge.dev", industry: "SaaS", size: "1-10", icpScore: 82, location: "Seattle, WA" },
  { id: "c9", name: "Harvest Kitchen", website: "harvestkitchen.co", industry: "F&B", size: "10-50", icpScore: 65, location: "Portland, OR" },
  { id: "c10", name: "CloudNine Security", website: "cloudnine.security", industry: "SaaS", size: "50-100", icpScore: 91, location: "Denver, CO" },
  { id: "c11", name: "BrightPath Education", website: "brightpath.edu", industry: "Education", size: "50-100", icpScore: 70, location: "Atlanta, GA" },
  { id: "c12", name: "Apex Manufacturing", website: "apexmfg.com", industry: "Manufacturing", size: "200+", icpScore: 60, location: "Detroit, MI" },
];

export const contacts: Contact[] = [
  { id: "ct1", companyId: "c1", name: "Sarah Chen", email: "sarah@techflow.io", title: "VP of Engineering", phone: "+1-415-555-0101", source: "inbound" },
  { id: "ct2", companyId: "c2", name: "Marcus Johnson", email: "marcus@greenleaf.co", title: "CEO", phone: "+1-512-555-0202", source: "outbound" },
  { id: "ct3", companyId: "c3", name: "Emily Rodriguez", email: "emily.r@datapulse.com", title: "Head of Product", phone: "+1-212-555-0303", source: "referral" },
  { id: "ct4", companyId: "c4", name: "James Wilson", email: "jwilson@swiftship.co", title: "CTO", phone: "+1-312-555-0404", source: "event" },
  { id: "ct5", companyId: "c5", name: "Aisha Patel", email: "aisha@mindbridge.ai", title: "Co-founder", phone: "+1-416-555-0505", source: "inbound" },
  { id: "ct6", companyId: "c6", name: "Ryan Cooper", email: "ryan@coastalbrands.com", title: "Marketing Director", phone: "+1-305-555-0606", source: "outbound" },
  { id: "ct7", companyId: "c7", name: "Diana Martinez", email: "diana@northstar-consulting.com", title: "Managing Partner", phone: "+1-617-555-0707", source: "referral" },
  { id: "ct8", companyId: "c8", name: "Kevin Park", email: "kevin@pixelforge.dev", title: "Founder", phone: "+1-206-555-0808", source: "inbound" },
  { id: "ct9", companyId: "c9", name: "Lisa Thompson", email: "lisa@harvestkitchen.co", title: "Owner", phone: "+1-503-555-0909", source: "event" },
  { id: "ct10", companyId: "c10", name: "Alex Novak", email: "anovak@cloudnine.security", title: "VP Sales", phone: "+1-720-555-1010", source: "outbound" },
  { id: "ct11", companyId: "c3", name: "David Kim", email: "dkim@datapulse.com", title: "CFO", phone: "+1-212-555-0311", source: "referral" },
  { id: "ct12", companyId: "c1", name: "Mike Tanaka", email: "mike.t@techflow.io", title: "CTO", phone: "+1-415-555-0112", source: "inbound" },
];

export const deals: Deal[] = [
  { id: "d1", companyId: "c1", contactId: "ct1", title: "TechFlow Enterprise Plan", stage: "negotiation", amount: 48000, probability: 75, assignedAgent: "Sales Agent", nextAction: "Send revised proposal with 10% volume discount", daysInStage: 8, expectedCloseDate: "2026-04-15", createdAt: "2026-02-10" },
  { id: "d2", companyId: "c2", contactId: "ct2", title: "GreenLeaf Growth Plan", stage: "proposal", amount: 18000, probability: 60, assignedAgent: "Sales Agent", nextAction: "Follow up on proposal sent 3 days ago", daysInStage: 5, expectedCloseDate: "2026-04-20", createdAt: "2026-02-28" },
  { id: "d3", companyId: "c3", contactId: "ct3", title: "DataPulse Full Suite", stage: "demo", amount: 72000, probability: 45, assignedAgent: "Demo Agent", nextAction: "Schedule technical deep-dive with CTO", daysInStage: 3, expectedCloseDate: "2026-05-01", createdAt: "2026-03-15" },
  { id: "d4", companyId: "c5", contactId: "ct5", title: "MindBridge Starter", stage: "qualified", amount: 12000, probability: 30, assignedAgent: "Outreach Agent", nextAction: "Send case study from similar AI company", daysInStage: 2, expectedCloseDate: "2026-05-15", createdAt: "2026-03-22" },
  { id: "d5", companyId: "c6", contactId: "ct6", title: "Coastal Brands Marketing", stage: "lead", amount: 24000, probability: 15, assignedAgent: "Prospecting Agent", nextAction: "Research their current marketing stack", daysInStage: 1, expectedCloseDate: "2026-06-01", createdAt: "2026-03-28" },
  { id: "d6", companyId: "c10", contactId: "ct10", title: "CloudNine Scale Plan", stage: "negotiation", amount: 96000, probability: 80, assignedAgent: "Sales Agent", nextAction: "Final contract review with legal", daysInStage: 12, expectedCloseDate: "2026-04-05", createdAt: "2026-01-15" },
  { id: "d7", companyId: "c7", contactId: "ct7", title: "NorthStar Consulting", stage: "closed_won", amount: 36000, probability: 100, assignedAgent: "CS Agent", nextAction: "Onboarding kickoff scheduled for Apr 2", daysInStage: 0, expectedCloseDate: "2026-03-28", createdAt: "2026-02-01" },
  { id: "d8", companyId: "c8", contactId: "ct8", title: "PixelForge Starter", stage: "demo", amount: 6000, probability: 40, assignedAgent: "Demo Agent", nextAction: "Prepare custom demo for indie dev workflow", daysInStage: 4, expectedCloseDate: "2026-04-30", createdAt: "2026-03-18" },
  { id: "d9", companyId: "c4", contactId: "ct4", title: "SwiftShip Operations", stage: "closed_lost", amount: 42000, probability: 0, assignedAgent: "Sales Agent", nextAction: "Schedule 6-month check-in", daysInStage: 0, expectedCloseDate: "2026-03-20", createdAt: "2026-01-20" },
  { id: "d10", companyId: "c9", contactId: "ct9", title: "Harvest Kitchen F&B", stage: "lead", amount: 9000, probability: 10, assignedAgent: "Prospecting Agent", nextAction: "Send intro email with F&B case study", daysInStage: 2, expectedCloseDate: "2026-06-15", createdAt: "2026-03-27" },
  { id: "d11", companyId: "c11", contactId: "ct11", title: "BrightPath Education Suite", stage: "qualified", amount: 28000, probability: 25, assignedAgent: "Outreach Agent", nextAction: "Schedule discovery call", daysInStage: 6, expectedCloseDate: "2026-05-20", createdAt: "2026-03-10" },
  { id: "d12", companyId: "c12", contactId: "ct12", title: "Apex Manufacturing Pilot", stage: "proposal", amount: 54000, probability: 50, assignedAgent: "Sales Agent", nextAction: "Prepare ROI analysis for manufacturing vertical", daysInStage: 7, expectedCloseDate: "2026-04-25", createdAt: "2026-03-01" },
];

export const activities: Activity[] = [
  { id: "a1", dealId: "d1", contactId: "ct1", agentType: "Sales Agent", type: "email_sent", channel: "email", summary: "Sent revised pricing proposal with 10% volume discount for annual commitment", outcome: "pending", timestamp: "2026-03-30T09:15:00Z" },
  { id: "a2", dealId: "d1", contactId: "ct12", agentType: "Sales Agent", type: "meeting_completed", channel: "phone", summary: "Technical alignment call with CTO Mike Tanaka - confirmed integration requirements", outcome: "positive", timestamp: "2026-03-29T14:00:00Z" },
  { id: "a3", dealId: "d6", contactId: "ct10", agentType: "Sales Agent", type: "email_replied", channel: "email", summary: "Alex confirmed legal review is in progress, expects feedback by Apr 2", outcome: "positive", timestamp: "2026-03-30T08:30:00Z" },
  { id: "a4", dealId: "d3", contactId: "ct3", agentType: "Demo Agent", type: "meeting_scheduled", channel: "email", summary: "Demo scheduled for Apr 1 at 2pm ET - Emily + 2 team members attending", outcome: "positive", timestamp: "2026-03-29T16:45:00Z" },
  { id: "a5", dealId: "d2", contactId: "ct2", agentType: "Sales Agent", type: "email_sent", channel: "email", summary: "Follow-up on proposal: 'Just checking in on the proposal we sent Tuesday...'", outcome: "pending", timestamp: "2026-03-29T10:00:00Z" },
  { id: "a6", dealId: "d5", contactId: "ct6", agentType: "Prospecting Agent", type: "linkedin_sent", channel: "linkedin", summary: "Connection request + personalized note about their recent Shopify migration", outcome: "pending", timestamp: "2026-03-29T11:30:00Z" },
  { id: "a7", dealId: "d4", contactId: "ct5", agentType: "Outreach Agent", type: "email_sent", channel: "email", summary: "Sent AI industry case study: 'How MindSync cut CAC by 40% with PalUp'", outcome: "pending", timestamp: "2026-03-28T09:00:00Z" },
  { id: "a8", dealId: "d4", contactId: "ct5", agentType: "Outreach Agent", type: "email_opened", channel: "email", summary: "Case study email opened (3 times in 2 hours)", outcome: "positive", timestamp: "2026-03-28T14:22:00Z" },
  { id: "a9", dealId: "d7", contactId: "ct7", agentType: "Sales Agent", type: "stage_change", channel: "internal", summary: "Deal closed! NorthStar signed 12-month contract at $36,000/yr", outcome: "positive", timestamp: "2026-03-28T17:00:00Z" },
  { id: "a10", dealId: "d7", contactId: "ct7", agentType: "CS Agent", type: "email_sent", channel: "email", summary: "Welcome email sent with onboarding guide and kickoff meeting link", outcome: "positive", timestamp: "2026-03-28T17:05:00Z" },
  { id: "a11", dealId: "d9", contactId: "ct4", agentType: "Sales Agent", type: "stage_change", channel: "internal", summary: "Deal lost - SwiftShip chose competitor (price sensitivity). Added to 6-month nurture.", outcome: "negative", timestamp: "2026-03-25T12:00:00Z" },
  { id: "a12", dealId: "d8", contactId: "ct8", agentType: "Demo Agent", type: "email_sent", channel: "email", summary: "Pre-demo prep email: 'Looking forward to showing you the indie dev workflow...'", outcome: "pending", timestamp: "2026-03-29T08:00:00Z" },
  { id: "a13", dealId: "d10", contactId: "ct9", agentType: "Prospecting Agent", type: "email_sent", channel: "email", summary: "Cold outreach: F&B-specific value prop with Harvest Kitchen pain points", outcome: "pending", timestamp: "2026-03-28T10:00:00Z" },
  { id: "a14", dealId: "d6", contactId: "ct10", agentType: "Sales Agent", type: "proposal_sent", channel: "email", summary: "Sent enterprise contract: $96K/yr, 3-year commitment, dedicated support", outcome: "pending", timestamp: "2026-03-22T15:00:00Z" },
  { id: "a15", dealId: "d11", contactId: "ct11", agentType: "Outreach Agent", type: "email_sent", channel: "email", summary: "Follow-up #2: 'Education sector is seeing 3x ROI with AI-driven enrollment...'", outcome: "pending", timestamp: "2026-03-27T09:30:00Z" },
  { id: "a16", dealId: "d12", contactId: "ct12", agentType: "Sales Agent", type: "call_completed", channel: "phone", summary: "Discovery call completed - identified key pain points: manual quoting, slow RFP response", outcome: "positive", timestamp: "2026-03-26T11:00:00Z" },
  { id: "a17", dealId: "d3", contactId: "ct11", agentType: "Sales Agent", type: "email_sent", channel: "email", summary: "Sent CFO-specific ROI deck to David Kim as requested by Emily", outcome: "pending", timestamp: "2026-03-29T13:00:00Z" },
  { id: "a18", dealId: "d2", contactId: "ct2", agentType: "Sales Agent", type: "email_opened", channel: "email", summary: "Proposal email opened by Marcus (2nd time)", outcome: "neutral", timestamp: "2026-03-30T07:45:00Z" },
];

export const agents: AgentInfo[] = [
  { id: "ag1", type: "prospecting", name: "Prospecting Agent", status: "active", metrics: { activitiesTotal: 342, activitiesToday: 8, successRate: 0.23, avgResponseTime: "< 1min" }, lastAction: "Sent LinkedIn connection to Ryan Cooper @ Coastal Brands", lastActionTime: "2026-03-30T11:30:00Z" },
  { id: "ag2", type: "outreach", name: "Outreach Agent", status: "active", metrics: { activitiesTotal: 1205, activitiesToday: 15, successRate: 0.068, avgResponseTime: "< 1min" }, lastAction: "Sent follow-up #2 to BrightPath Education", lastActionTime: "2026-03-30T09:30:00Z" },
  { id: "ag3", type: "sales", name: "Sales Agent", status: "active", metrics: { activitiesTotal: 567, activitiesToday: 6, successRate: 0.34, avgResponseTime: "3min" }, lastAction: "Sent revised proposal to TechFlow Inc", lastActionTime: "2026-03-30T09:15:00Z" },
  { id: "ag4", type: "demo", name: "Demo Agent", status: "idle", metrics: { activitiesTotal: 89, activitiesToday: 1, successRate: 0.72, avgResponseTime: "5min" }, lastAction: "Scheduled demo with DataPulse Analytics", lastActionTime: "2026-03-29T16:45:00Z" },
  { id: "ag5", type: "cs", name: "Customer Success Agent", status: "active", metrics: { activitiesTotal: 234, activitiesToday: 3, successRate: 0.91, avgResponseTime: "10min" }, lastAction: "Sent onboarding welcome to NorthStar Consulting", lastActionTime: "2026-03-28T17:05:00Z" },
];

export const anomalyAlerts: AnomalyAlert[] = [
  { id: "al1", metric: "Email Reply Rate", currentValue: 2.1, threshold: 5.0, severity: "warning", status: "active", message: "Outreach Agent reply rate dropped below 5% threshold (currently 2.1%)", detectedAt: "2026-03-30T06:00:00Z", resolvedAt: null },
  { id: "al2", metric: "Deal Stage Velocity", currentValue: 18, threshold: 14, severity: "warning", status: "investigating", message: "Average days in Negotiation stage increased to 18 days (threshold: 14)", detectedAt: "2026-03-29T06:00:00Z", resolvedAt: null },
  { id: "al3", metric: "Hallucination Rate", currentValue: 0.02, threshold: 0.05, severity: "info", status: "resolved", message: "Sales Agent fact-check pass rate recovered to 98% after knowledge base update", detectedAt: "2026-03-25T06:00:00Z", resolvedAt: "2026-03-26T14:30:00Z" },
  { id: "al4", metric: "CRM Sync Health", currentValue: 94, threshold: 99, severity: "critical", status: "active", message: "HubSpot sync failing for 6% of contact updates - API rate limit exceeded", detectedAt: "2026-03-30T03:00:00Z", resolvedAt: null },
  { id: "al5", metric: "Agent Error Rate", currentValue: 0.5, threshold: 2.0, severity: "info", status: "resolved", message: "All agent error rates within normal range", detectedAt: "2026-03-27T06:00:00Z", resolvedAt: "2026-03-27T06:05:00Z" },
];

export const debugSessions: DebugSession[] = [
  {
    id: "ds1", alertId: "al1", rootCause: "Outreach email templates have become stale - same subject lines used for 3 weeks, causing recipient fatigue", rootCauseCategory: "prompt_drift",
    proposedFix: "Rotate to new A/B-tested subject line variants. Update outreach.soul.md to enforce 7-day template refresh cycle.",
    confidence: 0.82, status: "fix_proposed", prUrl: null,
    metricsBeforeFix: [{ metric: "Reply Rate", value: 2.1 }, { metric: "Open Rate", value: 18.5 }],
    metricsAfterFix: null,
    startedAt: "2026-03-30T06:05:00Z", completedAt: null,
  },
  {
    id: "ds2", alertId: "al4", rootCause: "HubSpot API rate limit (100 req/10s) exceeded due to batch contact sync running during peak hours", rootCauseCategory: "rate_limit",
    proposedFix: "Shift batch sync to off-peak window (2-4 AM ET). Implement exponential backoff with jitter. Add request pooling.",
    confidence: 0.95, status: "deployed",
    prUrl: "https://github.com/palup/palup/pull/147",
    metricsBeforeFix: [{ metric: "Sync Success Rate", value: 94 }, { metric: "Failed Updates/hr", value: 23 }],
    metricsAfterFix: [{ metric: "Sync Success Rate", value: 99.8 }, { metric: "Failed Updates/hr", value: 0.3 }],
    startedAt: "2026-03-28T10:00:00Z", completedAt: "2026-03-29T02:00:00Z",
  },
  {
    id: "ds3", alertId: "al3", rootCause: "Product knowledge base had outdated pricing info - Q1 price adjustment not reflected in agent prompts", rootCauseCategory: "knowledge_stale",
    proposedFix: "Updated pricing entries in knowledge base. Added automated weekly sync check between pricing DB and agent knowledge.",
    confidence: 0.91, status: "verified",
    prUrl: "https://github.com/palup/palup/pull/142",
    metricsBeforeFix: [{ metric: "Fact-Check Pass Rate", value: 91 }, { metric: "Pricing Accuracy", value: 85 }],
    metricsAfterFix: [{ metric: "Fact-Check Pass Rate", value: 98.5 }, { metric: "Pricing Accuracy", value: 99.2 }],
    startedAt: "2026-03-25T07:00:00Z", completedAt: "2026-03-26T14:30:00Z",
  },
];

export const deployments: Deployment[] = [
  { id: "dp1", version: "v1.4.2", triggeredBy: "debug_fix", triggerDescription: "HubSpot sync rate limit fix (PR #147)", status: "deployed", canaryPercent: 100, healthCheck: "healthy", startedAt: "2026-03-29T01:00:00Z", completedAt: "2026-03-29T01:35:00Z" },
  { id: "dp2", version: "v1.4.1", triggeredBy: "evolution", triggerDescription: "Outreach Agent prompt optimization - new follow-up cadence", status: "deployed", canaryPercent: 100, healthCheck: "healthy", startedAt: "2026-03-27T02:00:00Z", completedAt: "2026-03-27T02:28:00Z" },
  { id: "dp3", version: "v1.4.0", triggeredBy: "manual", triggerDescription: "Knowledge base pricing update + fact-check gate", status: "deployed", canaryPercent: 100, healthCheck: "healthy", startedAt: "2026-03-26T13:00:00Z", completedAt: "2026-03-26T13:42:00Z" },
  { id: "dp4", version: "v1.3.9", triggeredBy: "dependency_update", triggerDescription: "Anthropic SDK update v0.80.0 → v0.81.2", status: "rolled_back", canaryPercent: 5, healthCheck: "unhealthy", startedAt: "2026-03-24T03:00:00Z", completedAt: "2026-03-24T03:12:00Z" },
  { id: "dp5", version: "v1.3.8", triggeredBy: "evolution", triggerDescription: "Sales Agent negotiation prompt improvement", status: "deployed", canaryPercent: 100, healthCheck: "healthy", startedAt: "2026-03-22T02:00:00Z", completedAt: "2026-03-22T02:31:00Z" },
];

export const promptVersions: PromptVersion[] = [
  { id: "pv1", agentType: "Outreach Agent", promptKey: "cold_email_system", version: 3, status: "active", canaryPercent: 100, metrics: { outcomeRate: 0.068, avgConfidence: 0.72, avgLatencyMs: 1200, costPerInteraction: 0.003 }, content: "You are an expert BDR writing highly personalized cold outreach emails...", createdAt: "2026-03-20T00:00:00Z", promotedAt: "2026-03-27T02:28:00Z" },
  { id: "pv2", agentType: "Outreach Agent", promptKey: "cold_email_system", version: 4, status: "canary", canaryPercent: 10, metrics: { outcomeRate: 0.089, avgConfidence: 0.75, avgLatencyMs: 1180, costPerInteraction: 0.003 }, content: "You are a growth specialist crafting personalized outreach that leads with value...", createdAt: "2026-03-30T00:00:00Z", promotedAt: null },
  { id: "pv3", agentType: "Sales Agent", promptKey: "negotiation_system", version: 5, status: "active", canaryPercent: 100, metrics: { outcomeRate: 0.34, avgConfidence: 0.81, avgLatencyMs: 2100, costPerInteraction: 0.008 }, content: "You are a senior sales negotiator. Your approach: understand before persuading...", createdAt: "2026-03-22T00:00:00Z", promotedAt: "2026-03-22T02:31:00Z" },
  { id: "pv4", agentType: "Sales Agent", promptKey: "negotiation_system", version: 4, status: "retired", canaryPercent: 0, metrics: { outcomeRate: 0.29, avgConfidence: 0.78, avgLatencyMs: 2200, costPerInteraction: 0.009 }, content: "You are a consultative sales professional...", createdAt: "2026-03-10T00:00:00Z", promotedAt: "2026-03-10T00:00:00Z" },
];

export const evolutionProposals: EvolutionProposal[] = [
  { id: "ep1", title: "Outreach: Value-first subject lines outperform question-based", description: "Analysis of 1,205 outreach emails shows subject lines starting with a specific value metric (e.g., 'Cut your CAC by 40%') have 2.3x higher open rate than question-based subjects.", impact: "high", evidence: "1,205 emails analyzed over 30 days. Value-first: 34% open rate. Question-based: 15% open rate.", status: "ab_testing", abTestResult: { controlRate: 0.068, variantRate: 0.089, improvement: 30.8, sampleSize: 420, significant: false }, createdAt: "2026-03-28T00:00:00Z" },
  { id: "ep2", title: "Sales: 3-day follow-up outperforms 5-day for proposal stage", description: "Deals in proposal stage that receive follow-up within 3 days have 22% higher close rate than 5-day follow-up.", impact: "medium", evidence: "Analysis of 45 deals in proposal stage over 60 days.", status: "adopted", abTestResult: { controlRate: 0.52, variantRate: 0.63, improvement: 21.2, sampleSize: 45, significant: true }, createdAt: "2026-03-20T00:00:00Z" },
  { id: "ep3", title: "Prospecting: ICP score threshold should increase from 65 to 75", description: "Leads with ICP score < 75 have 3% conversion rate vs 18% for score >= 75. Current threshold wastes 40% of outreach capacity.", impact: "high", evidence: "200 leads analyzed. ICP < 75: 3% conversion. ICP >= 75: 18% conversion.", status: "proposed", abTestResult: null, createdAt: "2026-03-29T00:00:00Z" },
  { id: "ep4", title: "Demo: Pre-demo research email increases show rate", description: "Sending a personalized pre-demo email 24h before with industry-specific agenda increases demo show rate from 72% to 89%.", impact: "medium", evidence: "89 demos analyzed over 90 days.", status: "adopted", abTestResult: { controlRate: 0.72, variantRate: 0.89, improvement: 23.6, sampleSize: 89, significant: true }, createdAt: "2026-03-15T00:00:00Z" },
  { id: "ep5", title: "Sales: Competitor mention detection needs faster response", description: "When prospects mention competitors, current 3-minute response time loses engagement. Proposed: pre-loaded battlecards for instant response.", impact: "low", evidence: "12 conversations where competitor was mentioned. 8 had delayed response.", status: "rejected", abTestResult: null, createdAt: "2026-03-25T00:00:00Z" },
];

export const salesPatterns: SalesPattern[] = [
  { id: "sp1", patternType: "effective", stage: "lead", description: "Referral-sourced leads convert 4x higher than cold outbound", occurrences: 34, successRate: 0.42, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp2", patternType: "effective", stage: "qualified", description: "Sending industry-specific case study within 24h of qualification doubles demo booking rate", occurrences: 28, successRate: 0.64, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp3", patternType: "ineffective", stage: "demo", description: "Generic product demos (not customized to prospect industry) have 2x higher drop-off", occurrences: 15, successRate: 0.33, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp4", patternType: "effective", stage: "proposal", description: "Including ROI calculator in proposal increases close rate by 28%", occurrences: 22, successRate: 0.71, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp5", patternType: "ineffective", stage: "negotiation", description: "Offering discount as first response to price objection lowers final deal value by 15%", occurrences: 18, successRate: 0.55, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp6", patternType: "effective", stage: "negotiation", description: "Reframing price as cost-per-outcome (e.g., '$X per qualified lead') increases acceptance by 35%", occurrences: 12, successRate: 0.83, extractedAt: "2026-03-29T00:00:00Z" },
  { id: "sp7", patternType: "effective", stage: "closed_won", description: "Sending personalized welcome within 5 minutes of closing reduces Day-7 churn risk by 60%", occurrences: 8, successRate: 0.95, extractedAt: "2026-03-29T00:00:00Z" },
];

export const knowledgeEntries: KnowledgeEntry[] = [
  { id: "k1", type: "product", title: "PalUp Core Features", content: "PalUp is an AI-powered business agent platform. Core features:\n- Autonomous sales pipeline management\n- Multi-channel outreach (email, LinkedIn, phone)\n- AI-powered proposal generation\n- Real-time pipeline analytics\n- Auto-evolving agent behaviors\n\nPricing: Starter $99/mo, Growth $299/mo, Scale $799/mo, Enterprise custom.", updatedAt: "2026-03-28T00:00:00Z" },
  { id: "k2", type: "product", title: "Integration Capabilities", content: "Supported integrations:\n- CRM: Salesforce, HubSpot, Pipedrive\n- Email: Gmail, Outlook, custom SMTP\n- Calendar: Google Calendar, Outlook Calendar\n- Payments: Stripe, PayPal\n- E-signature: DocuSign, PandaDoc\n- Enrichment: Apollo, ZoomInfo, Clearbit", updatedAt: "2026-03-25T00:00:00Z" },
  { id: "k3", type: "competitor", title: "vs. Competitor X (SalesBot AI)", content: "Key differentiators:\n- SalesBot: Rule-based sequences only. PalUp: AI-driven adaptive conversations.\n- SalesBot: Email only. PalUp: Multi-channel (email + LinkedIn + phone + chat).\n- SalesBot: No auto-evolution. PalUp: Self-improving agents with A/B testing.\n- SalesBot: $199/mo flat. PalUp: Flexible pricing from $99/mo.\n- Weakness to acknowledge: SalesBot has deeper Salesforce native integration.", updatedAt: "2026-03-27T00:00:00Z" },
  { id: "k4", type: "competitor", title: "vs. Competitor Y (RevenueOS)", content: "Key differentiators:\n- RevenueOS: Focused on enterprise (>500 employees). PalUp: Optimized for SMB.\n- RevenueOS: 6-month implementation. PalUp: 10-minute setup.\n- RevenueOS: $2,000+/mo minimum. PalUp: Starts at $99/mo.\n- Weakness to acknowledge: RevenueOS has more robust reporting for large teams.", updatedAt: "2026-03-27T00:00:00Z" },
  { id: "k5", type: "playbook", title: "Price Objection Handling", content: "When prospect says 'too expensive':\n1. Acknowledge: 'I understand budget is a key consideration.'\n2. Reframe: 'Let me share the ROI our similar customers see...'\n3. Calculate: 'At your deal volume, PalUp typically saves X hours/week, worth $Y.'\n4. Options: Offer annual discount (15%), or suggest starting with Starter plan.\n5. Never: Don't offer discount as first response. Never go below 15% without manager approval.", updatedAt: "2026-03-26T00:00:00Z" },
  { id: "k6", type: "playbook", title: "Competitor Mention Response", content: "When prospect mentions a competitor:\n1. Stay positive: Never disparage competitors.\n2. Acknowledge: 'They're a solid option for [their strength].'\n3. Differentiate: 'Where we stand out is [our unique value for this prospect].'\n4. Evidence: Share relevant case study or metric.\n5. Ask: 'What's most important to you in making this decision?'", updatedAt: "2026-03-26T00:00:00Z" },
  { id: "k7", type: "objection", title: "'We already have a solution'", content: "Response framework:\n1. 'That makes sense - most of our customers came from an existing solution.'\n2. 'What made you take this meeting/respond to our email?'\n3. Listen for pain points with current solution.\n4. Position PalUp as complement or upgrade, not replacement.\n5. Offer side-by-side comparison or pilot program.", updatedAt: "2026-03-24T00:00:00Z" },
  { id: "k8", type: "objection", title: "'Need to check with my boss'", content: "Response framework:\n1. 'Of course. Would it help if I prepared a brief summary for them?'\n2. Ask: 'What are the key concerns they'll likely have?'\n3. Offer to join a call with the decision maker.\n4. Provide executive-ready one-pager (ROI focused).\n5. Set specific follow-up date: 'Shall I check back on Thursday?'", updatedAt: "2026-03-24T00:00:00Z" },
];

export const healthMetrics: HealthMetric[] = [
  { label: "Email Reply Rate", value: 6.8, unit: "%", trend: -1.2, status: "warning", history: [7.2, 7.5, 7.1, 6.9, 6.5, 6.3, 6.8] },
  { label: "Demo Show Rate", value: 89, unit: "%", trend: 4.5, status: "good", history: [82, 83, 85, 84, 87, 88, 89] },
  { label: "Win Rate", value: 34, unit: "%", trend: 2.1, status: "good", history: [30, 31, 29, 32, 33, 33, 34] },
  { label: "Avg Deal Cycle", value: 28, unit: "days", trend: -3.2, status: "good", history: [32, 31, 30, 30, 29, 29, 28] },
  { label: "Pipeline Value", value: 445000, unit: "$", trend: 8.3, status: "good", history: [380000, 395000, 410000, 415000, 420000, 435000, 445000] },
  { label: "Agent Error Rate", value: 0.5, unit: "%", trend: -0.3, status: "good", history: [1.2, 0.9, 0.8, 0.7, 0.6, 0.5, 0.5] },
  { label: "Fact-Check Pass", value: 98.5, unit: "%", trend: 3.2, status: "good", history: [92, 93, 94, 95, 96, 97, 98.5] },
  { label: "CRM Sync Health", value: 94, unit: "%", trend: -5.0, status: "critical", history: [99.5, 99.8, 99.2, 99.0, 97, 95, 94] },
];

// ─── Helpers ─────────────────────────────────────────────────────

export function getCompany(id: string) {
  return companies.find((c) => c.id === id);
}

export function getContact(id: string) {
  return contacts.find((c) => c.id === id);
}

export function getDealsByStage(stage: DealStage) {
  return deals.filter((d) => d.stage === stage);
}

export function getActivitiesForDeal(dealId: string) {
  return activities.filter((a) => a.dealId === dealId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export function getPipelineSummary() {
  const activeDeals = deals.filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost");
  const wonDeals = deals.filter((d) => d.stage === "closed_won");
  const lostDeals = deals.filter((d) => d.stage === "closed_lost");
  return {
    totalActive: activeDeals.length,
    totalValue: activeDeals.reduce((s, d) => s + d.amount, 0),
    weightedValue: activeDeals.reduce((s, d) => s + d.amount * (d.probability / 100), 0),
    wonThisMonth: wonDeals.length,
    wonRevenue: wonDeals.reduce((s, d) => s + d.amount, 0),
    lostThisMonth: lostDeals.length,
    stageDistribution: {
      lead: getDealsByStage("lead").length,
      qualified: getDealsByStage("qualified").length,
      demo: getDealsByStage("demo").length,
      proposal: getDealsByStage("proposal").length,
      negotiation: getDealsByStage("negotiation").length,
      closed_won: getDealsByStage("closed_won").length,
      closed_lost: getDealsByStage("closed_lost").length,
    },
  };
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(amount);
}

export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function formatDateTime(dateStr: string) {
  return `${formatDate(dateStr)} ${formatTime(dateStr)}`;
}

export function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
