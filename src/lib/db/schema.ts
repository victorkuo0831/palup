import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  integer,
  real,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────

export const planEnum = pgEnum("plan", [
  "trial",
  "starter",
  "growth",
  "business",
  "enterprise",
]);

export const orgRoleEnum = pgEnum("org_role", [
  "owner",
  "admin",
  "member",
  "viewer",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "draft",
  "planning",
  "approved",
  "executing",
  "paused",
  "completed",
  "failed",
]);

export const workflowStatusEnum = pgEnum("workflow_status", [
  "pending",
  "running",
  "paused",
  "completed",
  "failed",
  "rolled_back",
]);

export const stepStatusEnum = pgEnum("step_status", [
  "pending",
  "blocked",
  "running",
  "validating",
  "completed",
  "failed",
  "skipped",
]);

export const agentTypeEnum = pgEnum("agent_type", [
  "goal_interpreter",
  "market_research",
  "brand_design",
  "website_builder",
  "content_generation",
  "sales_crm",
  "payment_processing",
  "deployment",
  "debug_fix",
  "migration",
  "marketing_automation",
  "analytics_reporting",
  "legal_compliance",
  "llm_router",
  "monitor",
  "security",
  "billing_metering",
  "evolution",
]);

export const deployProviderEnum = pgEnum("deploy_provider", [
  "vercel",
  "cloudflare_pages",
  "railway",
  "custom",
]);

export const assetTypeEnum = pgEnum("asset_type", [
  "website",
  "api",
  "store",
  "landing_page",
  "email_campaign",
  "ad_campaign",
  "document",
]);

export const usageActionEnum = pgEnum("usage_action", [
  "llm_call",
  "embedding",
  "image_generation",
  "deployment",
  "storage_write",
  "api_call",
  "email_send",
  "sms_send",
]);

// ─── Organizations & Users ────────────────────────────────────

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  plan: planEnum("plan").default("trial").notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  settings: jsonb("settings").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkId: text("clerk_id").notNull().unique(),
  email: text("email").notNull(),
  name: text("name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const orgMemberships = pgTable(
  "org_memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: orgRoleEnum("role").default("member").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("org_memberships_org_user_idx").on(table.orgId, table.userId),
  ]
);

// ─── Goals ────────────────────────────────────────────────────

export const goals = pgTable(
  "goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    createdBy: uuid("created_by").references(() => users.id),
    rawInput: text("raw_input").notNull(), // The one-sentence goal
    interpretedSummary: text("interpreted_summary"),
    status: goalStatusEnum("status").default("draft").notNull(),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("goals_org_idx").on(table.orgId)]
);

// ─── Goal Plans (DAG definition) ─────────────────────────────

export const goalPlans = pgTable(
  "goal_plans",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalId: uuid("goal_id")
      .notNull()
      .references(() => goals.id, { onDelete: "cascade" }),
    version: integer("version").default(1).notNull(),
    dagJson: jsonb("dag_json").notNull(), // { nodes: [...], edges: [...] }
    estimatedCostUsd: real("estimated_cost_usd"),
    estimatedDurationMinutes: integer("estimated_duration_minutes"),
    status: workflowStatusEnum("status").default("pending").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [index("goal_plans_goal_idx").on(table.goalId)]
);

// ─── Workflow Runs ────────────────────────────────────────────

export const workflowRuns = pgTable(
  "workflow_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    goalPlanId: uuid("goal_plan_id")
      .notNull()
      .references(() => goalPlans.id, { onDelete: "cascade" }),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    status: workflowStatusEnum("status").default("pending").notNull(),
    currentStepIndex: integer("current_step_index").default(0).notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("workflow_runs_org_idx").on(table.orgId),
    index("workflow_runs_plan_idx").on(table.goalPlanId),
  ]
);

// ─── Workflow Steps ───────────────────────────────────────────

export const workflowSteps = pgTable(
  "workflow_steps",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    workflowRunId: uuid("workflow_run_id")
      .notNull()
      .references(() => workflowRuns.id, { onDelete: "cascade" }),
    agentType: agentTypeEnum("agent_type").notNull(),
    stepOrder: integer("step_order").notNull(),
    dependsOn: jsonb("depends_on").default([]).notNull(), // Array of step IDs
    input: jsonb("input").default({}).notNull(),
    output: jsonb("output"),
    status: stepStatusEnum("status").default("pending").notNull(),
    confidence: real("confidence"),
    errorMessage: text("error_message"),
    retryCount: integer("retry_count").default(0).notNull(),
    maxRetries: integer("max_retries").default(3).notNull(),
    startedAt: timestamp("started_at"),
    completedAt: timestamp("completed_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("workflow_steps_run_idx").on(table.workflowRunId),
    index("workflow_steps_agent_idx").on(table.agentType),
  ]
);

// ─── Agent Registry ───────────────────────────────────────────

export const agentRegistry = pgTable("agent_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  agentType: agentTypeEnum("agent_type").notNull().unique(),
  version: text("version").default("1.0.0").notNull(),
  queueName: text("queue_name").notNull(),
  capabilities: jsonb("capabilities").default([]).notNull(),
  concurrency: integer("concurrency").default(5).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  config: jsonb("config").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Deployed Assets ──────────────────────────────────────────

export const deployedAssets = pgTable(
  "deployed_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    goalId: uuid("goal_id").references(() => goals.id),
    assetType: assetTypeEnum("asset_type").notNull(),
    provider: deployProviderEnum("provider").notNull(),
    url: text("url"),
    deploymentId: text("deployment_id"),
    config: jsonb("config").default({}).notNull(),
    version: integer("version").default(1).notNull(),
    status: text("status").default("active").notNull(), // active, stopped, failed
    lastHealthCheck: timestamp("last_health_check"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("deployed_assets_org_idx").on(table.orgId)]
);

// ─── Integration Credentials ──────────────────────────────────

export const integrationCredentials = pgTable(
  "integration_credentials",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(), // shopify, google, meta, etc.
    encryptedTokens: text("encrypted_tokens").notNull(),
    scopes: jsonb("scopes").default([]).notNull(),
    expiresAt: timestamp("expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("integration_creds_org_provider_idx").on(
      table.orgId,
      table.provider
    ),
  ]
);

// ─── Usage Events (Billing & Metering) ────────────────────────

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    agentType: agentTypeEnum("agent_type").notNull(),
    action: usageActionEnum("action").notNull(),
    model: text("model"), // e.g., "claude-sonnet-4-6", "gpt-4o"
    units: integer("units").notNull(), // tokens, bytes, count
    unitCostMicrodollars: integer("unit_cost_microdollars").notNull(), // cost in 1/1,000,000 USD
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("usage_events_org_idx").on(table.orgId),
    index("usage_events_created_idx").on(table.createdAt),
  ]
);

// ─── Capability Registry (Auto Evolve) ────────────────────────

export const capabilityRegistry = pgTable("capability_registry", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  agentType: agentTypeEnum("agent_type"),
  version: text("version").default("1.0.0").notNull(),
  status: text("status").default("active").notNull(), // active, deprecated, proposed
  config: jsonb("config").default({}).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const evolutionProposals = pgTable(
  "evolution_proposals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    capabilityGap: text("capability_gap").notNull(),
    proposedSolution: text("proposed_solution").notNull(),
    impact: text("impact"), // high, medium, low
    evidence: jsonb("evidence").default({}).notNull(), // failed workflows, churn data
    status: text("status").default("proposed").notNull(), // proposed, approved, implementing, deployed, rejected
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [index("evolution_proposals_status_idx").on(table.status)]
);

// ─── Auto-X: Anomaly Alerts ──────────────────────────────────

export const alertSeverityEnum = pgEnum("alert_severity", [
  "critical",
  "warning",
  "info",
]);

export const alertStatusEnum = pgEnum("alert_status", [
  "active",
  "investigating",
  "resolved",
  "dismissed",
]);

export const anomalyAlerts = pgTable(
  "anomaly_alerts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    metric: text("metric").notNull(),
    currentValue: real("current_value").notNull(),
    threshold: real("threshold").notNull(),
    severity: alertSeverityEnum("severity").notNull(),
    status: alertStatusEnum("status").default("active").notNull(),
    message: text("message").notNull(),
    autoAction: text("auto_action"), // escalate, debug_fix, none
    detectedAt: timestamp("detected_at").defaultNow().notNull(),
    resolvedAt: timestamp("resolved_at"),
  },
  (table) => [
    index("anomaly_alerts_status_idx").on(table.status),
    index("anomaly_alerts_org_idx").on(table.orgId),
  ]
);

// ─── Auto-X: Debug Sessions ─────────────────────────────────

export const debugStatusEnum = pgEnum("debug_status", [
  "diagnosing",
  "fix_proposed",
  "pr_created",
  "reviewing",
  "merged",
  "deployed",
  "verified",
  "failed",
]);

export const rootCauseCategoryEnum = pgEnum("root_cause_category", [
  "prompt_drift",
  "knowledge_stale",
  "integration_error",
  "rate_limit",
  "context_overflow",
  "code_bug",
]);

export const debugSessions = pgTable(
  "debug_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    alertId: uuid("alert_id").references(() => anomalyAlerts.id),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    rootCause: text("root_cause"),
    rootCauseCategory: rootCauseCategoryEnum("root_cause_category"),
    proposedFix: text("proposed_fix"),
    confidence: real("confidence"),
    status: debugStatusEnum("status").default("diagnosing").notNull(),
    prUrl: text("pr_url"),
    metricsBeforeFix: jsonb("metrics_before_fix").default([]).notNull(),
    metricsAfterFix: jsonb("metrics_after_fix"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("debug_sessions_alert_idx").on(table.alertId),
    index("debug_sessions_status_idx").on(table.status),
  ]
);

// ─── Auto-X: Deployments ────────────────────────────────────

export const deployStatusEnum = pgEnum("deploy_status", [
  "building",
  "canary",
  "rolling_out",
  "deployed",
  "rolled_back",
  "failed",
]);

export const deployHealthEnum = pgEnum("deploy_health", [
  "healthy",
  "degraded",
  "unhealthy",
  "pending",
]);

export const deployments = pgTable(
  "deployments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    version: text("version").notNull(),
    triggeredBy: text("triggered_by").notNull(), // debug_fix, evolution, manual, dependency_update
    triggerDescription: text("trigger_description"),
    debugSessionId: uuid("debug_session_id").references(() => debugSessions.id),
    status: deployStatusEnum("status").default("building").notNull(),
    canaryPercent: integer("canary_percent").default(0).notNull(),
    healthCheck: deployHealthEnum("health_check").default("pending").notNull(),
    errorMessage: text("error_message"),
    startedAt: timestamp("started_at").defaultNow().notNull(),
    completedAt: timestamp("completed_at"),
  },
  (table) => [
    index("deployments_status_idx").on(table.status),
  ]
);

// ─── Auto-X: Prompt Versions ────────────────────────────────

export const promptStatusEnum = pgEnum("prompt_status", [
  "draft",
  "canary",
  "active",
  "retired",
]);

export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    agentType: agentTypeEnum("agent_type").notNull(),
    promptKey: text("prompt_key").notNull(), // e.g., "cold_email_system", "negotiation_system"
    version: integer("version").notNull(),
    content: text("content").notNull(),
    status: promptStatusEnum("status").default("draft").notNull(),
    canaryPercent: integer("canary_percent").default(0).notNull(),
    metricsOutcomeRate: real("metrics_outcome_rate"),
    metricsAvgConfidence: real("metrics_avg_confidence"),
    metricsAvgLatencyMs: integer("metrics_avg_latency_ms"),
    metricsCostPerInteraction: real("metrics_cost_per_interaction"),
    parentVersionId: uuid("parent_version_id"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    promotedAt: timestamp("promoted_at"),
    retiredAt: timestamp("retired_at"),
  },
  (table) => [
    index("prompt_versions_agent_idx").on(table.agentType, table.promptKey),
    index("prompt_versions_status_idx").on(table.status),
  ]
);

// ─── Auto-X: Sales Interaction Outcomes ─────────────────────

export const interactionOutcomeEnum = pgEnum("interaction_outcome", [
  "positive",
  "negative",
  "neutral",
  "pending",
]);

export const salesInteractionOutcomes = pgTable(
  "sales_interaction_outcomes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    agentType: agentTypeEnum("agent_type").notNull(),
    interactionType: text("interaction_type").notNull(), // outreach, follow_up, objection_handling, negotiation, close_attempt
    promptVersionId: uuid("prompt_version_id").references(() => promptVersions.id),
    contactId: text("contact_id"),
    dealId: text("deal_id"),
    inputSummary: text("input_summary"),
    outputSummary: text("output_summary"),
    outcome: interactionOutcomeEnum("outcome").default("pending").notNull(),
    outcomeSignalSource: text("outcome_signal_source"), // crm_sync, email_reply, meeting_booked, manual
    confidenceAtActionTime: real("confidence_at_action_time"),
    metadata: jsonb("metadata").default({}).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    outcomeRecordedAt: timestamp("outcome_recorded_at"),
  },
  (table) => [
    index("sales_outcomes_org_idx").on(table.orgId),
    index("sales_outcomes_agent_idx").on(table.agentType),
    index("sales_outcomes_outcome_idx").on(table.outcome),
  ]
);

// ─── Auto-X: Sales Patterns ─────────────────────────────────

export const salesPatterns = pgTable(
  "sales_patterns",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    patternType: text("pattern_type").notNull(), // effective, ineffective
    stage: text("stage").notNull(), // lead, qualified, demo, proposal, negotiation, etc.
    description: text("description").notNull(),
    occurrences: integer("occurrences").default(0).notNull(),
    successRate: real("success_rate"),
    evidence: jsonb("evidence").default({}).notNull(), // interaction IDs, statistics
    extractedAt: timestamp("extracted_at").defaultNow().notNull(),
  },
  (table) => [
    index("sales_patterns_org_idx").on(table.orgId),
    index("sales_patterns_type_idx").on(table.patternType),
  ]
);

// ─── Auto-X: Knowledge Base ─────────────────────────────────

export const knowledgeEntries = pgTable(
  "knowledge_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    orgId: uuid("org_id").references(() => organizations.id, { onDelete: "cascade" }),
    type: text("type").notNull(), // product, competitor, playbook, objection
    title: text("title").notNull(),
    content: text("content").notNull(),
    embedding: text("embedding"), // pgvector can be added later
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("knowledge_entries_org_idx").on(table.orgId),
    index("knowledge_entries_type_idx").on(table.type),
  ]
);

// ─── LLM Cost Matrix (Cost Down) ─────────────────────────────

export const llmCostMatrix = pgTable("llm_cost_matrix", {
  id: uuid("id").defaultRandom().primaryKey(),
  provider: text("provider").notNull(), // anthropic, openai, google, deepseek
  model: text("model").notNull(), // claude-sonnet-4-6, gpt-4o, etc.
  inputCostPer1MTokens: real("input_cost_per_1m_tokens").notNull(),
  outputCostPer1MTokens: real("output_cost_per_1m_tokens").notNull(),
  maxContextTokens: integer("max_context_tokens").notNull(),
  capabilities: jsonb("capabilities").default([]).notNull(), // ["reasoning", "code", "vision"]
  qualityScore: real("quality_score"), // 0-1, benchmarked
  latencyMs: integer("latency_ms"), // avg response time
  isActive: boolean("is_active").default(true).notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ────────────────────────────────────────────────

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(orgMemberships),
  goals: many(goals),
  workflowRuns: many(workflowRuns),
  deployedAssets: many(deployedAssets),
  integrationCredentials: many(integrationCredentials),
  usageEvents: many(usageEvents),
}));

export const usersRelations = relations(users, ({ many }) => ({
  memberships: many(orgMemberships),
  goals: many(goals),
}));

export const goalsRelations = relations(goals, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [goals.orgId],
    references: [organizations.id],
  }),
  createdByUser: one(users, {
    fields: [goals.createdBy],
    references: [users.id],
  }),
  plans: many(goalPlans),
  deployedAssets: many(deployedAssets),
}));

export const goalPlansRelations = relations(goalPlans, ({ one, many }) => ({
  goal: one(goals, {
    fields: [goalPlans.goalId],
    references: [goals.id],
  }),
  workflowRuns: many(workflowRuns),
}));

export const workflowRunsRelations = relations(
  workflowRuns,
  ({ one, many }) => ({
    goalPlan: one(goalPlans, {
      fields: [workflowRuns.goalPlanId],
      references: [goalPlans.id],
    }),
    organization: one(organizations, {
      fields: [workflowRuns.orgId],
      references: [organizations.id],
    }),
    steps: many(workflowSteps),
  })
);

export const workflowStepsRelations = relations(workflowSteps, ({ one }) => ({
  workflowRun: one(workflowRuns, {
    fields: [workflowSteps.workflowRunId],
    references: [workflowRuns.id],
  }),
}));
