# PalUp 系統架構設計文件

> **版本：** 2.0 | **日期：** 2026-03-27 | **分類：** Internal Engineering
> **定位：** 面向全球中小企業至大型企業的雲端 AI 服務 Hosting 平台
> **首要市場：** 美國 | **競品基線：** OpenClaw 企業商用升級

---

## 目錄

1. [設計原則](#1-設計原則)
2. [OpenClaw 企業缺陷分析](#2-openclaw-企業缺陷分析)
3. [自主商務引擎](#3-自主商務引擎)
4. [MoE 智慧路由引擎](#4-moe-智慧路由引擎)
5. [自主進化引擎 — Phase 1 實作規格](#5-自主進化引擎--phase-1-實作規格)
6. [基礎設施層](#6-基礎設施層)
7. [技術選型](#7-技術選型)
8. [漸進式路線圖](#8-漸進式路線圖)
9. [殘留風險](#9-殘留風險)
10. [關鍵參考檔案](#10-關鍵參考檔案)
11. [驗證方式](#11-驗證方式)

---

## 1. 設計原則

PalUp 不是 OpenClaw 的「企業加強版」— 它是一個**自主營運的 AI 平台**，OpenClaw 只是它的開源前身。三大核心設計原則：

1. **自主商務** — 平台自己獲客、定價、代管金流，不需人工營運介入
2. **MoE 智慧路由** — 自然語言輸入自動路由到專業模組，全程代理
3. **自主進化** — 平台自己修 bug、部署更新、進化新能力

OpenClaw 的根本問題不是「缺少企業功能」，而是它的架構假設（單機、單用戶、人工操作）從根本上不支援自主營運。

---

## 2. OpenClaw 企業缺陷分析

### 2.1 無法自主商務

| OpenClaw 缺陷 | 影響 |
|----------------|------|
| 無 billing / metering | 無法收費，無法追蹤用量 |
| 無客戶管理（single-tenant） | 無法同時服務多客戶 |
| 無定價引擎 | 無法根據市場動態調整價格 |
| 無金流處理 | 無法代客戶收款、分潤 |
| 無獲客管道 | 無法自動觸達、轉換潛在客戶 |
| 無 marketplace | 無法建立第三方生態系、抽成 |

### 2.2 無法智慧路由

| OpenClaw 缺陷 | 影響 |
|----------------|------|
| 單一 LLM backend，無路由邏輯 | 所有請求走同一模型，成本高、品質不一 |
| 無 intent parsing | 無法理解商業需求語意 |
| Skills 是平面列表，非 MoE | 無法根據需求複雜度組合多個專家模組 |
| 無 workflow orchestration | 無法處理多步驟、長時間商業流程 |
| 無 cost-quality optimization | 無法在成本和品質間智慧取捨 |

### 2.3 無法自主進化

| OpenClaw 缺陷 | 影響 |
|----------------|------|
| 6 週 8 CVE，無自動修復 | 每次漏洞都需人工介入 |
| 升級中斷服務，無 zero-downtime | 無法自主部署更新 |
| 無 error pattern detection | 無法識別重複問題並自動修復 |
| 無 A/B testing / canary | 無法安全地自主嘗試新版本 |
| 無 capability gap analysis | 無法發現自身能力缺口並自主補強 |
| 無 chaos engineering | 無法驗證自身韌性 |

### 2.4 基礎設施根本缺陷

| 缺陷類別 | 具體問題 |
|----------|----------|
| **Security** | 8 CVE + 無 auth + plaintext 密碼 + 17% sandbox 防禦率 + 341 惡意 skills |
| **Multi-Tenancy** | 單租戶 + 無 RLS + 共用檔案系統 |
| **Reliability** | 單節點 SPOF + Node.js 2GB OOM + 無 DR |
| **Compliance** | 零合規（無 SOC2/GDPR/HIPAA/PCI） |
| **Observability** | 僅 stdout，無 metrics/traces/SLO |

---

## 3. 自主商務引擎

### 3.1 自主商務全生命週期

```
獲客                          轉換             留存 & 增長
┌─────────────────────┐  ┌──────────┐  ┌─────────────────────────┐
│ content_generation   │  │          │  │                         │
│ marketing_automation │→│ sales_crm │→│   customer_success       │
│ (SEO/SEM/Landing)   │  │(nurture→ │  │ ├── Onboarding 引導      │
└─────────────────────┘  │ convert) │  │ ├── Usage health 監控     │
                         └──────────┘  │ ├── Churn prediction      │
                                       │ ├── Upsell/cross-sell    │
         ┌─────────────────────────────│ └── 定價 sensitivity 回饋 │
         ↓                             └─────────────────────────┘
  billing_pricing                              │
  (計量 + 定價決策)  ←─── price sensitivity ───┘
```

**Agent 職責分工：**
- **content_generation** — 自動產出 blog、case study、social media 素材
- **marketing_automation** — 自動管理 SEO/SEM campaigns、A/B test landing pages
- **sales_crm** — Lead scoring + 自動 nurture + 轉換追蹤（職責到**付費轉換**為止）
- **customer_success** — 從 onboarding 到 renewal 的全程客戶生命週期管理：onboarding 引導、usage health monitoring、churn prediction + intervention、upsell/cross-sell 推薦、price sensitivity signal 回饋給 billing_pricing
- **billing_pricing** — 用量計量 + 定價決策（計量和定價共用用量上下文）
- **技術實現：** BullMQ scheduled jobs + Resend email + Stripe checkout sessions
- **衡量指標：** CAC、conversion rate、time-to-first-value、NRR (Net Revenue Retention)、churn rate

### 3.2 自主定價 — 漸進式

> **技術風險：高。** 彈性模型冷啟動數據不足、競品數據可靠性低、B2B 客戶對價格變動敏感。

**Phase 1 (MVP) — 固定 Tier 定價：**
- 三層固定價格：Starter / Professional / Enterprise
- Usage overage 按量計費（固定單價）
- Marketplace commission 20-30%（固定費率）
- 人工季度 review usage data 決定是否調價

**Phase 2 (Scale) — AI-Assisted 定價建議：**
- AI 每週產出定價建議報告：elasticity analysis + competitive data + churn prediction
- 人工決定是否調整

**Phase 3 (Mature) — Rule-Based 動態定價：**
- 規則引擎：if utilization > 80% → suggest upgrade；if churn_risk > 0.7 → offer discount
- Starter/Professional tier 啟用自動調整
- **Enterprise tier 永遠合約鎖定價格**

**Phase 4 (Full) — Multi-Objective Optimizer（僅 Starter/Professional）：**
```
Market Intelligence + Usage Analytics + Elasticity Model
     ↓
Multi-objective Optimizer
  maximize: revenue × conversion
  minimize: churn
  constraints: margin > 60%, change < ±15%/month, 12-month grandfather
     ↓
A/B Test → 7-day observation → auto-commit or rollback
```

- **Guardrails：** 最大 ±15% 月調幅、12 個月 grandfather clause、Enterprise 合約價不受動態定價影響
- **技術實現：** Phase 1 Stripe Billing API → Phase 2+ ClickHouse usage analytics + Redis pricing cache + weekly cron optimizer

### 3.3 金流代管

```
客戶的終端消費者
     ↓ (付款)
Stripe Connect (PalUp 為 Platform)
     ↓
自動扣除: PalUp 平台費 + Marketplace agent 抽成
     ↓
自動撥款: 客戶收入 → 客戶 Stripe Connected Account
          Agent 開發者分潤 → 開發者 Connected Account
```

- **Stripe Connect Platform 模式** — PalUp 是 platform，客戶和開發者是 connected accounts
- **三方分帳：** PalUp fee + agent developer share + 客戶商務收入
- **合規：** PCI DSS via Stripe tokenization（PalUp 不碰卡號）、Stripe Tax 自動計稅、multi-currency 50+
- **Treasury 管理：** AI-driven cash flow forecasting + dunning management + revenue recognition
- **技術實現：** Stripe Connect + Stripe Billing + webhook idempotency + `transactions`/`payouts`/`refunds` tables

---

## 4. MoE 智慧路由引擎

### 4.1 Intent Router 架構

```
自然語言輸入
     ↓
┌─────────────────────────────────────────┐
│          Intent Router (MoE Gateway)     │
│  ┌──────────┐  ┌──────────┐  ┌────────┐ │
│  │ Intent   │→│ Context  │→│ Expert │ │
│  │ Parser   │  │ Builder  │  │Selector│ │
│  └──────────┘  └──────────┘  └────────┘ │
│         ↓                                │
│  ┌──────────────────────────────────┐    │
│  │    DAG Execution Planner         │    │
│  │  (多步驟、依賴關係、並行度)        │    │
│  └──────────────────────────────────┘    │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│         Workflow Engine (BullMQ DAG)     │
│  Step 1 → Step 2 ──→ Step 4            │
│              ↘ Step 3 ↗                 │
│  (retry / dependency resolution)         │
└─────────────────────────────────────────┘
     ↓
Expert Agents (並行/串行混合執行)
```

### 4.2 三層 Agent 分類（19 個 core agents）

**Tier 1: Internal Agents — 10 個（驅動平台營運，客戶不直接接觸）**

| # | Agent | 職責 | 所屬自主迴圈 |
|---|-------|------|-------------|
| 1 | **goal_interpreter** | 自然語言 → DAG 執行計畫，意圖解析 + cycle detection | MoE 路由 |
| 2 | **llm_router** | Cost-Quality 路由，model 選擇 + semantic cache + circuit breaker | MoE 路由 |
| 3 | **monitor** | 異常偵測 + error pattern clustering + SLO 監控 + agent 產出品質驗證 | 自主進化 |
| 4 | **security** | Prompt injection detection + PII filtering + threat detection | 基礎設施 |
| 5 | **billing_pricing** | 用量計量 + Stripe 同步 + overage 計算 + 定價決策 | 自主商務 |
| 6 | **customer_success** | Onboarding → usage health → churn prediction → upsell → price sensitivity 回饋 | 自主商務 |
| 7 | **evolution** | Gap analysis + evolution proposal + capability registry 更新 | 自主進化 |
| 8 | **debug_fix** | Error reproduce + root cause analysis + patch generation + PR | 自主進化 |
| 9 | **deployment** | CI/CD 觸發 + canary 觀測 + rollback 決策 | 自主進化 |
| 10 | **analytics_reporting** | 商業指標 batch 聚合 + 客戶報表 + 成本分析 | 橫跨三迴圈 |

**Tier 2: Customer-Facing Agents — 9 個（為客戶產出價值）**

| # | Agent | 職責 |
|---|-------|------|
| 1 | **market_research** | 市場規模 + 競品分析 + 定價策略 + 機會/威脅 |
| 2 | **brand_design** | 品牌命名 + 色彩 + 字體 + 品牌聲調 |
| 3 | **website_builder** | 完整網站 spec (JSON → Next.js 部署) |
| 4 | **content_generation** | 產品描述 + blog + social media + email + 廣告文案 |
| 5 | **marketing_automation** | 多通路行銷策略 + campaigns + SEO |
| 6 | **payment_processing** | Stripe 設定 + 定價模型 + checkout flow |
| 7 | **legal_compliance** | ToS + Privacy Policy + GDPR/CCPA 合規文件 |
| 8 | **sales_crm** | Lead scoring + nurture sequence + 轉換追蹤 |
| 9 | **migration** | 從 Shopify/WordPress/CSV 遷移資料到 PalUp |

**Tier 3: Marketplace Agents（Phase 2+ 開放，第三方開發者透過 `@palup/agent-sdk` 建立）**

**職責邊界釐清：**
- `monitor` 負責 real-time 異常偵測 **+** agent 產出品質驗證（不另開 agent）
- `analytics_reporting` 負責 batch 報表，**不**做 real-time 監控
- `billing_pricing` 統一計量 + 定價，**不**拆成兩個 agent
- `customer_success` 接手 `sales_crm` 轉換後的全程客戶旅程，交接點是**付費轉換完成**

### 4.3 LLM 智慧路由

```
Request → Complexity Classifier
     ↓
┌─────────────────────────────┐
│  MODEL_REGISTRY (8+ models)  │
│  Anthropic: opus/sonnet/haiku│
│  OpenAI: gpt-4o/4o-mini     │
│  Self-hosted: vLLM           │
│  Bedrock: backup pool        │
└─────────────────────────────┘
     ↓
Cost-Quality Optimizer:
  if complexity=high → opus (quality first)
  if complexity=medium → sonnet (balanced)
  if complexity=low → haiku/4o-mini (cost first)
     ↓
Semantic Cache (pgvector, >0.95 similarity → cache hit, 省 20-40%)
     ↓
Circuit Breaker per provider (>10% error → 30s open → fallback)
     ↓
Fallback chain: Primary → Fallback 1 → Fallback 2 → Template degraded
```

- **Token budget management：** Redis counter per org per day，超額降級至 cheaper model（不硬擋）
- **Cost anomaly detection：** 1hr sliding window，>3x 7-day average → alert + auto-throttle

### 4.4 Agent 完整協作圖

```
使用者自然語言輸入
     ↓
goal_interpreter ──→ DAG 執行計畫
     ↓
     ├── market_research (獨立)
     │        ↓
     ├── brand_design (← market_research)
     │        ↓
     ├── content_generation (← brand_design)
     │        ↓
     ├── website_builder (← brand_design + content_generation)
     ├── payment_processing (← market_research)
     ├── legal_compliance (獨立)
     ├── marketing_automation (← brand_design + market_research)
     └── sales_crm (← marketing_automation)
              ↓ (付費轉換完成)
     customer_success (onboarding → health → churn → upsell)
              ↓ (price sensitivity signal)
     billing_pricing (計量 + 定價決策)

migration (獨立觸發，非 DAG 內)

背景持續運作的 Internal Agents:
  llm_router ─── 每次 LLM call 都經過
  monitor ────── 持續監控 + 品質驗證
  security ───── 持續威脅偵測
  evolution ──── 週期性 gap analysis
  debug_fix ──── 被 monitor 觸發
  deployment ─── 被 evolution/debug_fix 觸發
  analytics_reporting ── 週期性 batch 報表
```

### 4.5 Workflow Orchestration

- **Phase 1：** 現有 BullMQ-based DAG engine（`src/lib/workflow/engine.ts`）
- **Phase 2：** Temporal 取代 BullMQ，提供 durable execution
- **Human-in-the-loop：** `approval_gate` node type，email notification
- **Saga compensation：** 每個 Agent 實作 `rollback()` method
- **Per-tenant concurrency：** Enterprise=20, Professional=5, Starter=1

---

## 5. 自主進化引擎 — Phase 1 實作規格

> **範圍：** 本節是工程師可直接開工的 Phase 1 實作規格。四個 agent 都繼承現有 `BaseAgent`（`src/lib/agents/base.ts`），註冊到 `agentFactory`（`src/lib/agents/registry.ts`），用現有 BullMQ queue 執行。

---

### 5.1 Monitor Agent

**檔案：** `src/lib/agents/monitor.ts`
**Queue：** `palup:agent:monitor`
**觸發方式：** BullMQ repeatable job，每 5 分鐘執行一次

**新增 DB table（`src/lib/db/schema.ts`）：**

```typescript
export const anomalyAlertStatusEnum = pgEnum("anomaly_alert_status", [
  "open", "acknowledged", "auto_resolved", "escalated"
]);

export const anomalyAlerts = pgTable("anomaly_alerts", {
  id: uuid("id").primaryKey(),
  alertType: text("alert_type"),          // "step_failure_spike" | "agent_latency" | "output_quality" | "cost_anomaly"
  agentType: agentTypeEnum("agent_type"), // 哪個 agent 出問題
  severity: text("severity"),             // "critical" | "warning" | "info"
  metric: text("metric"),                 // "failure_rate" | "p95_latency_ms" | "avg_confidence" | "cost_usd"
  currentValue: real("current_value"),
  baselineValue: real("baseline_value"),
  threshold: real("threshold"),
  status: anomalyAlertStatusEnum("status").default("open"),
  autoAction: text("auto_action"),        // "retry" | "circuit_break" | "rollback" | "escalate" | null
  context: jsonb("context").default({}),  // 觸發時的 raw data snapshot
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

**run() 邏輯：**

```typescript
// MonitorAgent 不接受外部 input，自己查 DB
// AgentInput.data 為空 {}，由 repeatable job 定期觸發

async run(input: AgentInput): Promise<AgentOutput> {
  const window = 5 * 60 * 1000; // 5 分鐘
  const now = new Date();
  const windowStart = new Date(now.getTime() - window);

  // === 1. Step Failure Rate ===
  // SQL: 過去 5 分鐘內，每個 agentType 的 failure_rate
  // SELECT agent_type,
  //        COUNT(*) FILTER (WHERE status = 'failed') AS failures,
  //        COUNT(*) AS total
  // FROM workflow_steps
  // WHERE started_at >= windowStart
  // GROUP BY agent_type

  // 閾值：failure_rate > 20% 且 total >= 5 → severity: critical
  //        failure_rate > 10% 且 total >= 5 → severity: warning

  // === 2. Agent Latency ===
  // SQL: 過去 5 分鐘內，每個 agentType 的 P95 latency
  // SELECT agent_type,
  //        PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY
  //          EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000
  //        ) AS p95_ms
  // FROM workflow_steps
  // WHERE completed_at >= windowStart AND status = 'completed'
  // GROUP BY agent_type

  // 閾值：p95 > 60000ms (60s) → critical
  //        p95 > 30000ms (30s) → warning

  // === 3. Output Quality (confidence) ===
  // SQL: 過去 5 分鐘內，每個 agentType 的 avg confidence
  // SELECT agent_type, AVG(confidence) AS avg_conf
  // FROM workflow_steps
  // WHERE completed_at >= windowStart AND status = 'completed'
  // GROUP BY agent_type

  // 閾值：avg_conf < 0.5 → critical
  //        avg_conf < 0.7 → warning

  // === 4. Cost Anomaly ===
  // SQL: 過去 1 小時 vs 過去 7 天同時段平均
  // SELECT SUM(unit_cost_microdollars) / 1000000.0 AS cost_usd
  // FROM usage_events
  // WHERE created_at >= (now - 1hr)
  //
  // vs 7-day baseline:
  // SELECT AVG(hourly_cost) FROM (
  //   SELECT DATE_TRUNC('hour', created_at) AS hr,
  //          SUM(unit_cost_microdollars) / 1000000.0 AS hourly_cost
  //   FROM usage_events
  //   WHERE created_at >= (now - 7d)
  //   GROUP BY hr
  // )

  // 閾值：current > 3x baseline → critical
  //        current > 2x baseline → warning

  // === 5. Auto-Response ===
  // 對每個偵測到的 anomaly：
  //   severity: critical + alertType: step_failure_spike
  //     → autoAction: "circuit_break"
  //     → Redis SET palup:circuit:{agentType} = "OPEN" EX 300
  //     → 寫入 anomalyAlerts table
  //
  //   severity: critical + alertType: cost_anomaly
  //     → autoAction: "escalate"
  //     → 寫入 anomalyAlerts table
  //     → (Phase 2: Resend email to ops team)
  //
  //   severity: warning (any)
  //     → autoAction: null (僅記錄)
  //     → 寫入 anomalyAlerts table

  // === 6. 回傳 ===
  return {
    success: true,
    data: {
      alertsCreated: alerts.length,
      circuitBreakersTriggered: circuitBreaks.length,
      window: { start: windowStart, end: now },
    },
    confidence: 1.0,
    costUsd: 0,
    tokensUsed: 0,
  };
}
```

**Circuit Breaker 整合（修改 `src/lib/workflow/engine.ts`）：**

```typescript
// 在 enqueueAgentStep() 開頭加：
const circuitState = await redis.get(`palup:circuit:${node.agentType}`);
if (circuitState === "OPEN") {
  // 更新 step status → "failed"
  // errorMessage: "Circuit breaker OPEN for {agentType}"
  // 觸發 onStepComplete 走 retry/failure 邏輯
  return;
}
```

**Repeatable Job 設定（`src/lib/jobs/monitor-scheduler.ts`）：**

```typescript
import { Queue } from "bullmq";

const monitorQueue = new Queue("palup:agent:monitor", { connection: redis });

await monitorQueue.add("monitor-tick", {}, {
  repeat: { every: 5 * 60 * 1000 },
  jobId: "monitor-repeatable",
  removeOnComplete: 100,
  removeOnFail: 50,
});
```

---

### 5.2 Debug & Fix Agent

**檔案：** `src/lib/agents/debug-fix.ts`
**Queue：** `palup:agent:debug_fix`
**觸發方式：** 由 Monitor Agent 偵測到 critical alert 後，enqueue 到此 queue

**Phase 1 限制：產出 PR draft，不 auto-merge。**

**新增 DB table：**

```typescript
export const debugSessionStatusEnum = pgEnum("debug_session_status", [
  "diagnosing", "patch_generated", "pr_created", "merged", "rejected", "failed"
]);

export const debugSessions = pgTable("debug_sessions", {
  id: uuid("id").primaryKey(),
  anomalyAlertId: uuid("anomaly_alert_id").references(() => anomalyAlerts.id),
  agentType: agentTypeEnum("agent_type"),
  errorPattern: text("error_pattern"),
  rootCauseAnalysis: text("root_cause_analysis"),
  proposedFix: text("proposed_fix"),
  filesModified: jsonb("files_modified").default([]),
  prUrl: text("pr_url"),
  prNumber: integer("pr_number"),
  status: debugSessionStatusEnum("status").default("diagnosing"),
  llmCostUsd: real("llm_cost_usd"),
  createdAt: timestamp("created_at").defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});
```

**Input interface：**

```typescript
interface DebugFixInput {
  anomalyAlertId: string;
  agentType: string;
  alertType: string;           // "step_failure_spike" | "agent_latency" | "output_quality"
  recentErrors: Array<{
    stepId: string;
    workflowRunId: string;
    errorMessage: string;
    input: Record<string, unknown>;
    retryCount: number;
    startedAt: string;
  }>;
}
```

**run() 邏輯：**

```typescript
async run(input: AgentInput): Promise<AgentOutput> {
  const data = input.data as DebugFixInput;

  // === Step 1: 收集 Error Context ===
  // SQL: 取最近 10 筆 failed steps of this agentType
  // SELECT ws.*, wr.status AS workflow_status, g.raw_input AS goal_input
  // FROM workflow_steps ws
  // JOIN workflow_runs wr ON ws.workflow_run_id = wr.id
  // JOIN goal_plans gp ON wr.goal_plan_id = gp.id
  // JOIN goals g ON gp.goal_id = g.id
  // WHERE ws.agent_type = data.agentType
  //   AND ws.status = 'failed'
  // ORDER BY ws.started_at DESC
  // LIMIT 10

  // === Step 2: 讀取 Agent 原始碼 ===
  // fs.readFileSync(`src/lib/agents/${agentType}.ts`)
  // fs.readFileSync(`src/lib/agents/base.ts`)

  // === Step 3: LLM Root Cause Analysis ===
  const diagnosisResponse = await this.callLLM(
    `你是 PalUp 平台的 Debug Agent。分析以下 agent 的錯誤模式並找出 root cause。

## 出問題的 Agent
Type: ${data.agentType}
原始碼:
\`\`\`typescript
${agentSourceCode}
\`\`\`

## 最近 10 筆失敗記錄
${recentErrors.map(e => `- Error: ${e.errorMessage}\n  Input: ${JSON.stringify(e.input).slice(0, 500)}\n  Retries: ${e.retryCount}`).join('\n')}

## 任務
1. 分析 error pattern（是同一個 root cause 還是不同的？）
2. 判斷 root cause（是 prompt 問題？邏輯 bug？外部 API 問題？資料格式問題？）
3. 如果是 code 可修復的問題，產出具體的 fix

回傳 JSON:
{
  "rootCause": "string - 一句話描述 root cause",
  "category": "prompt_issue" | "logic_bug" | "external_api" | "data_format" | "infrastructure",
  "fixable": boolean,
  "fix": {
    "file": "相對路徑",
    "description": "修改說明",
    "diff": "unified diff format"
  } | null,
  "confidence": 0.0-1.0
}`,
    {
      systemPrompt: "你是一個精確的 TypeScript debug 工程師。只回傳 JSON，不加其他文字。",
      category: "reasoning",
      complexity: "expert",
      maxTokens: 4000,
    }
  );

  const diagnosis = this.parseJSON<DiagnosisResult>(diagnosisResponse.content);

  // === Step 4: 寫入 debugSessions ===
  // INSERT INTO debug_sessions (...)

  // === Step 5: 如果 fixable 且 confidence >= 0.7，建立 GitHub PR ===
  if (diagnosis.fixable && diagnosis.confidence >= 0.7 && diagnosis.fix) {
    // GitHub API (octokit):
    // 1. 建立 branch: `auto-fix/${data.agentType}/${Date.now()}`
    // 2. Commit fix diff
    // 3. 建立 PR (draft mode)，body 包含：
    //    - Root cause analysis
    //    - Error pattern
    //    - Proposed fix 說明
    //    - anomalyAlertId reference
    //    - "This PR was auto-generated by DebugFixAgent. Requires human review."
    // 4. 更新 debugSessions: status → "pr_created", prUrl, prNumber
  } else {
    // 不 fixable 或 confidence 太低 → 僅記錄，等人工處理
    // 更新 anomalyAlerts: autoAction → "escalate"
  }

  return {
    success: true,
    data: {
      anomalyAlertId: data.anomalyAlertId,
      rootCause: diagnosis.rootCause,
      category: diagnosis.category,
      fixable: diagnosis.fixable,
      prUrl: prUrl || null,
      confidence: diagnosis.confidence,
    },
    confidence: diagnosis.confidence,
    costUsd: diagnosisResponse.costUsd,
    tokensUsed: diagnosisResponse.inputTokens + diagnosisResponse.outputTokens,
  };
}
```

**Phase 1 安全限制：**
- PR 必須是 **draft** mode，不能直接 merge
- fix diff 只允許修改 `src/lib/agents/*.ts` 和 `src/lib/prompts/*.ts`
- 涉及其他路徑 → 自動拒絕，status → "rejected"
- 每 24hr 最多建立 5 個 auto-fix PR（Redis counter `palup:debug_fix:daily_count`）

**新增 dependency：** `@octokit/rest`

---

### 5.3 Deployment Agent

**檔案：** `src/lib/agents/deployment.ts`
**Queue：** `palup:agent:deployment`
**觸發方式：** GitHub webhook（PR merge event）或手動 enqueue

**Phase 1 範圍：** CI pipeline + deploy to EKS + basic health check。不含 canary/shadow。

**CI Pipeline（`.github/workflows/ci.yml`）：**

```yaml
name: CI Pipeline
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

env:
  NODE_VERSION: "22"
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint-and-typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}" }
      - run: npm ci
      - run: npm run lint
      - run: npx tsc --noEmit

  test:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_DB: palup_test, POSTGRES_PASSWORD: test }
        ports: ["5432:5432"]
      redis:
        image: redis:7
        ports: ["6379:6379"]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "${{ env.NODE_VERSION }}" }
      - run: npm ci
      - run: npx vitest run
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/palup_test
          REDIS_URL: redis://localhost:6379

  security-scan:
    runs-on: ubuntu-latest
    needs: lint-and-typecheck
    steps:
      - uses: actions/checkout@v4
      - uses: returntocorp/semgrep-action@v1
        with:
          config: "p/typescript p/owasp-top-ten"

  build-and-push:
    runs-on: ubuntu-latest
    needs: [test, security-scan]
    if: github.ref == 'refs/heads/main'
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: |
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }}
            ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:latest

  deploy:
    runs-on: ubuntu-latest
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          aws-region: us-east-1
          role-to-assume: ${{ secrets.AWS_DEPLOY_ROLE_ARN }}
      - run: aws eks update-kubeconfig --name palup-cluster --region us-east-1
      - run: |
          kubectl set image deployment/palup-api \
            palup-api=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:${{ github.sha }} \
            -n palup-api
          kubectl rollout status deployment/palup-api -n palup-api --timeout=300s
```

**Dockerfile：**

```dockerfile
FROM node:22-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM base AS build
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package.json ./
USER nextjs
EXPOSE 3000
CMD ["npm", "start"]
```

**Deployment Agent run()：**

```typescript
interface DeploymentInput {
  commitSha: string;
  prNumber: number;
  imageTag: string;
  triggeredBy: "merge" | "manual" | "debug_fix" | "evolution";
}

async run(input: AgentInput): Promise<AgentOutput> {
  const data = input.data as DeploymentInput;

  // === Step 1: 等待 rollout 完成（最多 5 分鐘）===

  // === Step 2: Health Check（deploy 後 2 分鐘觀察窗口）===
  // 查 anomalyAlerts：deploy 後 2 分鐘內有無 critical alert
  // SELECT COUNT(*) FROM anomaly_alerts
  // WHERE severity = 'critical' AND created_at >= deployTime
  //
  // 查 workflowSteps：deploy 後 2 分鐘內的 failure rate
  // SELECT COUNT(*) FILTER (WHERE status = 'failed') * 100.0 / NULLIF(COUNT(*), 0)
  // FROM workflow_steps WHERE started_at >= deployTime

  // === Step 3: Rollback 決策 ===
  // if (criticalAlerts > 0 || failureRate > 25%) {
  //   kubectl rollout undo deployment/palup-api -n palup-api
  //   return { success: false, data: { action: "rollback", reason: ... } }
  // }

  // === Step 4: 記錄 ===
  // INSERT INTO deployment_history (...)

  return {
    success: true,
    data: { action: "deployed", commitSha: data.commitSha, healthCheck: { ... } },
    confidence: 1.0,
    costUsd: 0,
    tokensUsed: 0,
  };
}
```

**新增 DB table：**

```typescript
export const deploymentHistory = pgTable("deployment_history", {
  id: uuid("id").primaryKey(),
  commitSha: text("commit_sha"),
  imageTag: text("image_tag"),
  triggeredBy: text("triggered_by"),
  debugSessionId: uuid("debug_session_id"),
  evolutionProposalId: uuid("evolution_proposal_id"),
  status: text("status").default("deploying"), // "deploying" | "deployed" | "rolled_back" | "failed"
  healthCheckResult: jsonb("health_check_result").default({}),
  deployedAt: timestamp("deployed_at"),
  rolledBackAt: timestamp("rolled_back_at"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

---

### 5.4 Evolution Agent

**檔案：** `src/lib/agents/evolution.ts`
**Queue：** `palup:agent:evolution`
**觸發方式：** BullMQ repeatable job，每週一次（Monday 00:00 UTC）

**Phase 1 限制：只產出 proposal，不自動產出 code。所有 proposal 需人工 review。**

**run() 邏輯：**

```typescript
async run(input: AgentInput): Promise<AgentOutput> {

  // === Step 1: 收集 Gap Evidence ===

  // 1a. Failed workflows（過去 7 天）
  // SELECT g.raw_input, g.interpreted_summary, wr.error_message, wr.status
  // FROM workflow_runs wr
  // JOIN goal_plans gp ON wr.goal_plan_id = gp.id
  // JOIN goals g ON gp.goal_id = g.id
  // WHERE wr.status = 'failed' AND wr.created_at >= (now - 7d)
  // ORDER BY wr.created_at DESC LIMIT 50

  // 1b. Agent 成功率排名（過去 7 天）
  // SELECT agent_type,
  //        COUNT(*) AS total,
  //        COUNT(*) FILTER (WHERE status = 'completed') AS successes,
  //        AVG(confidence) AS avg_confidence,
  //        SUM((output->>'costUsd')::real) AS total_cost
  // FROM workflow_steps
  // WHERE created_at >= (now - 7d)
  // GROUP BY agent_type
  // ORDER BY successes * 1.0 / NULLIF(total, 0) ASC

  // 1c. 現有 capability registry
  // SELECT * FROM capability_registry WHERE status = 'active'

  // 1d. 已有的未處理 proposals（避免重複）
  // SELECT * FROM evolution_proposals WHERE status IN ('proposed', 'approved', 'implementing')

  // === Step 2: LLM Gap Analysis ===
  const analysisResponse = await this.callLLM(
    `你是 PalUp 平台的 Evolution Agent。分析平台過去 7 天的數據，找出能力缺口並提出進化建議。

## 失敗的 Workflows
${failedWorkflows.map(w => `- Goal: "${w.rawInput}"\n  Error: ${w.errorMessage}`).join('\n')}

## Agent 成功率排名（低到高）
${agentStats.map(a => `- ${a.agentType}: ${(a.successes/a.total*100).toFixed(1)}% success, avg confidence ${a.avgConfidence.toFixed(2)}, cost $${a.totalCost.toFixed(2)}`).join('\n')}

## 現有能力 Registry
${capabilities.map(c => `- ${c.name} (${c.agentType}) v${c.version}`).join('\n')}

## 已在處理中的 Proposals（避免重複）
${existingProposals.map(p => `- ${p.capabilityGap} [${p.status}]`).join('\n')}

## 任務
找出 3-5 個最有價值的進化方向。每個 proposal 包含：
1. 能力缺口描述
2. 建議解法（具體到修改哪個 agent 或新增什麼能力）
3. 預期影響
4. Impact 分級：low | medium | high

回傳 JSON array:
[{
  "capabilityGap": "string",
  "proposedSolution": "string",
  "impact": "low" | "medium" | "high",
  "evidence": { "failedGoals": number, "affectedAgents": ["string"], "estimatedImprovement": "string" },
  "confidence": 0.0-1.0
}]`,
    {
      systemPrompt: "你是一個嚴謹的 AI 平台架構師。只提出有充分數據支撐的建議，不憑空猜測。",
      category: "reasoning",
      complexity: "expert",
      maxTokens: 4000,
    }
  );

  const proposals = this.parseJSON<EvolutionProposal[]>(analysisResponse.content);

  // === Step 3: 寫入 evolution_proposals ===
  // Phase 1: status 一律 'proposed'，等人工 review

  return {
    success: true,
    data: {
      proposalsCreated: proposals.length,
      proposals: proposals.map(p => ({ gap: p.capabilityGap, impact: p.impact, confidence: p.confidence })),
    },
    confidence: Math.min(...proposals.map(p => p.confidence)),
    costUsd: analysisResponse.costUsd,
    tokensUsed: analysisResponse.inputTokens + analysisResponse.outputTokens,
  };
}
```

**Repeatable Job（`src/lib/jobs/evolution-scheduler.ts`）：**

```typescript
await evolutionQueue.add("evolution-weekly", {}, {
  repeat: { pattern: "0 0 * * 1" }, // 每週一 00:00 UTC
  jobId: "evolution-repeatable",
});
```

---

### 5.5 四個 Agent 的協作流程

```
┌─────────────────────────────────────────────────────┐
│ Monitor Agent (每 5 分鐘)                            │
│                                                     │
│ 查 DB: workflow_steps failure rate / latency /       │
│        confidence / usage_events cost               │
│         ↓                                           │
│ 偵測到 anomaly?                                     │
│   ├── severity: warning → 寫入 anomaly_alerts       │
│   └── severity: critical                            │
│        ├── auto_action: circuit_break               │
│        │   → Redis SET palup:circuit:{agentType}    │
│        └── auto_action: escalate                    │
│            → enqueue DebugFixAgent                  │
└──────────────────────┬──────────────────────────────┘
                       ↓
┌──────────────────────┴──────────────────────────────┐
│ Debug & Fix Agent (被 Monitor 觸發)                  │
│                                                     │
│ 1. 收集 error context (最近 10 筆 failed steps)      │
│ 2. 讀取 agent 原始碼                                 │
│ 3. LLM root cause analysis                          │
│ 4. 產出 fix diff                                    │
│ 5. 建立 GitHub Draft PR                              │
│    → 寫入 debug_sessions                             │
│    → 等待人工 review + merge                         │
└──────────────────────┬──────────────────────────────┘
                       ↓ (PR merged → GitHub webhook)
┌──────────────────────┴──────────────────────────────┐
│ Deployment Agent (被 GitHub webhook 觸發)            │
│                                                     │
│ 1. GitHub Actions CI: lint → test → security scan   │
│ 2. Build Docker image → push to GHCR               │
│ 3. kubectl set image → rollout                      │
│ 4. 等待 2 分鐘 health check 窗口                    │
│ 5. 查 anomaly_alerts + failure rate                  │
│    ├── healthy → status: "deployed"                 │
│    └── unhealthy → kubectl rollout undo             │
│    → 寫入 deployment_history                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ Evolution Agent (每週一)                             │
│                                                     │
│ 1. 收集過去 7 天: failed workflows + agent stats     │
│ 2. LLM gap analysis                                 │
│ 3. 產出 3-5 個 evolution_proposals                   │
│ 4. Phase 1: 全部等人工 review                        │
│    (Phase 2+: low-impact auto-implement)            │
└─────────────────────────────────────────────────────┘
```

### 5.6 需修改的現有檔案

| 檔案 | 變更 |
|------|------|
| `src/lib/db/schema.ts` | 新增 `anomalyAlerts`, `debugSessions`, `deploymentHistory` tables + enums；`agentTypeEnum` 加入 `customer_success`, `billing_pricing`（取代 `billing_metering`） |
| `src/lib/agents/registry.ts` | 註冊 4 個新 agent：`monitor`, `debug_fix`, `deployment`, `evolution` |
| `src/lib/workflow/engine.ts` | `enqueueAgentStep()` 加入 circuit breaker check（Redis `palup:circuit:{agentType}`） |
| `package.json` | 新增 dependency: `@octokit/rest`, `vitest` |

### 5.7 需新增的檔案

| 檔案 | 內容 |
|------|------|
| `src/lib/agents/monitor.ts` | Monitor Agent 實作 |
| `src/lib/agents/debug-fix.ts` | Debug & Fix Agent 實作 |
| `src/lib/agents/deployment.ts` | Deployment Agent 實作 |
| `src/lib/agents/evolution.ts` | Evolution Agent 實作 |
| `src/lib/jobs/monitor-scheduler.ts` | Monitor repeatable job 設定 |
| `src/lib/jobs/evolution-scheduler.ts` | Evolution repeatable job 設定 |
| `.github/workflows/ci.yml` | CI/CD pipeline |
| `Dockerfile` | Multi-stage Docker build |
| `src/lib/github/client.ts` | Octokit client 封裝（建立 branch、commit、PR） |

---

## 6. 基礎設施層

### 6.1 基礎設施拓撲 — 漸進式

**Phase 1 (MVP, <=10K tenants) — 單 Cluster + Namespace 隔離：**
```
AWS us-east-1 (Multi-AZ)
└── 1 EKS Cluster
    ├── ns: palup-api        (API + tRPC)
    ├── ns: palup-workers    (BullMQ workers)
    ├── ns: palup-system     (monitoring, jobs)
    └── ns: palup-enterprise (dedicated node pool for Enterprise tenants)

    PostgreSQL: Neon (managed, RLS for tenant isolation)
    Redis: ElastiCache (managed)
    Queue: BullMQ (in-process → separate worker)
```
- Namespace + NetworkPolicy + ResourceQuota 隔離
- Enterprise tenants 用 dedicated node pool（taint/toleration）

**Phase 2 (Scale, <=50K tenants) — Regional Clusters：**
```
Global Control Plane (us-east-1, multi-AZ HA)
├── Tenant Router (tenant → region mapping)
├── Billing & Metering (Stripe)
└── Global Analytics
     ↓
┌──────────────┐  ┌──────────────┐
│ US Cluster    │  │ EU Cluster    │
│ (us-east-1)  │  │ (eu-west-1)  │
│ EKS + Neon + │  │ EKS + Neon + │
│ ElastiCache  │  │ ElastiCache  │
└──────────────┘  └──────────────┘
```

**Phase 3 (Mature, <=500K tenants) — Cell Architecture**

**Phase 4 (Full, 1M+ tenants) — Auto Cell Provisioning**

### 6.2 Zero-Trust Security（6 層）

1. Edge WAF (CloudFlare + AWS Shield)
2. Identity (SSO/OIDC/MFA + mTLS + short-lived JWT)
3. Authorization (OPA RBAC+ABAC + tenant boundary)
4. Secrets (Vault + auto-rotation)
5. Application (input sanitization + CSRF/XSS/SQLi)
6. AI-specific (prompt injection + PII filtering + tenant data isolation)

### 6.3 Multi-Tenancy（Silo-Bridge-Pool）

- Enterprise → 專屬 namespace/DB/Redis
- Professional → 共用 cluster + schema isolation
- Starter → 共用 schema + PostgreSQL RLS

### 6.4 Compliance as Code

- SOC 2 Type II + GDPR + CCPA (Day 1)
- HIPAA + PCI DSS Level 1 (Phase 2)
- OPA policies 編碼合規規則到 CI/CD pipeline
- Audit trail: append-only, Merkle tree, 7-year retention

### 6.5 Observability

- Phase 1: Structured logging + Sentry
- Phase 2+: OpenTelemetry → Tempo (traces) + Prometheus (metrics) + Loki (logs)
- SLO: API 99.99%, Payment 99.999%, Agent success > 90%

---

## 7. 技術選型

| 層級 | Phase 1 (MVP) | Phase 2+ (Scale) | 理由 |
|------|---------------|-------------------|------|
| Frontend | Next.js 16 + tRPC | 同左 | 已有 codebase |
| API Gateway | Next.js middleware | Kong / Envoy | Phase 1 不需獨立 gateway |
| Policy Engine | Clerk RBAC | + OPA | Phase 1 用 Clerk 內建 RBAC 即可 |
| Workflow | BullMQ DAG engine | Temporal | 現有 BullMQ engine 可用 |
| Queue | BullMQ | + Kafka | 現有 BullMQ 足夠 10K tenants |
| Database | PostgreSQL (Neon) + RLS | CockroachDB (Phase 3) | Managed Neon 降複雜度 |
| Cache | ElastiCache (Redis) | Redis Cluster | Managed 降運維 |
| Vector Store | pgvector | + Pinecone (Phase 2) | pgvector 足夠初期 semantic cache |
| LLM | Anthropic + OpenAI | + Bedrock + vLLM | 初期 2 provider 夠用 |
| Secrets | env vars + Clerk | HashiCorp Vault (Phase 2) | Phase 1 不需 Vault |
| Observability | Structured logging + Sentry | OpenTelemetry + Grafana | Phase 1 用 Sentry 快速起步 |
| Payment | Stripe Connect + Billing | 同左 | Day 1 就需要 |
| Container | 1 EKS Cluster | Cell Architecture (Phase 3) | 漸進式 |
| CI/CD | GitHub Actions | + ArgoCD (Phase 2) | Phase 1 直接 deploy |
| IaC | Terraform | + Pulumi (Phase 2) | Phase 1 Terraform 足夠 |

---

## 8. 漸進式路線圖

| 維度 | Phase 1 (MVP) | Phase 2 (Scale) | Phase 3 (Mature) | Phase 4 (Full) |
|------|---------------|-----------------|------------------|----------------|
| **基礎設施** | 單 EKS Cluster + Namespace 隔離 | Regional Clusters (us/eu) | Cell Architecture | Auto Cell Provisioning |
| **自主進化** | AI 產 proposal，全部人工 review | 分級：Low auto-merge, Med 1 reviewer, High 2 reviewer | + Shadow validation 7d | Low/Med auto-merge, High 仍需 reviewer |
| **自主定價** | 固定 Tier（billing_pricing 僅做計量） | AI-assisted 定價建議報告 | Rule-based 動態定價 | AI optimizer（僅 Starter/Professional） |
| **客戶成功** | onboarding 引導 + 基礎 usage monitoring | + churn prediction + upsell | + price sensitivity 回饋 | 全自動 lifecycle |
| **自主修復** | Level 1-3 自動 + Level 5 escalate | + Level 4 Debug Agent (PR 人工 review) | Level 4 low-impact auto-merge | Level 4 分級 auto-merge |
| **自主部署** | GitHub Actions → EKS deploy | + ArgoCD canary | + Shadow deployment | + Cross-cell rolling |
| **Workflow** | BullMQ DAG engine | Temporal 引入 | Temporal + saga | + cross-cell workflow |
| **Database** | Neon PostgreSQL + RLS | + read replicas, regional | CockroachDB | + auto-sharding |
| **Observability** | Structured logs + Sentry | OpenTelemetry + Grafana | + AI-powered diagnosis | + predictive alerting |
| **Marketplace** | 無 | Developer Portal + SDK | + gVisor sandbox + vetting | + auto-scaling |
| **合規** | SOC 2 + GDPR + CCPA + PCI | + HIPAA | + EU AI Act | + industry-specific |
| **目標規模** | <=10K tenants | <=50K tenants | <=500K tenants | 1M+ tenants |

**Phase 轉換觸發條件：**
- Phase 1 → 2：tenant > 5K **或** 需要 EU data residency **或** 單 cluster utilization > 60%
- Phase 2 → 3：單 region tenant > 20K **或** 需要更細粒度故障隔離
- Phase 3 → 4：總 tenant > 200K **或** evolution velocity 穩定 > 10 auto-merged PRs/month

---

## 9. 殘留風險

| # | 風險 | 嚴重度 | 漸進式緩解 |
|---|------|--------|-----------|
| 1 | **執行複雜度** — 20+ infra components | High | Phase 1 全用 managed services；每 Phase 只新增 2-3 個 component |
| 2 | **自主進化級聯故障** — AI fix 引入新 bug | Critical | 分級自主矩陣 + evolution rate limit 3/day + error 上升即暫停 24hr |
| 3 | **自主定價客戶信任** — B2B 價格變動敏感 | Medium | Phase 1-2 人工定價；Enterprise 永遠合約鎖定 |
| 4 | **金流代管法規** — MSB 牌照因地區而異 | High | Phase 1 純走 Stripe Connect |
| 5 | **Global Control Plane SPOF** | Medium | Phase 1 不存在（單 cluster）；Phase 2+ multi-AZ HA |
| 6 | **AI Governance 成熟度** | Medium | Phase 1 human-in-the-loop 所有 AI 決策 |
| 7 | **Marketplace supply chain** | High | Phase 2 才開放；gVisor + code review + static analysis |

---

## 10. 關鍵參考檔案

| 檔案 | 用途 |
|------|------|
| `src/lib/agents/base.ts` | BaseAgent abstract class（AgentInput/AgentOutput/execute flow） |
| `src/lib/agents/registry.ts` | Agent factory（agentFactory / getRegisteredAgentTypes） |
| `src/lib/db/schema.ts` | 全部 DB tables + enums（Drizzle ORM） |
| `src/lib/workflow/engine.ts` | DAG workflow engine（startWorkflow / onStepComplete / BullMQ） |
| `src/lib/llm/router.ts` | LLM routing（MODEL_REGISTRY / routeRequest / llmCall） |
| `src/lib/llm/types.ts` | LLM types（TaskCategory / TaskComplexity / LLMRequest / LLMResponse） |
| `src/lib/billing/metering.ts` | Usage metering + Stripe integration |

---

## 11. 驗證方式

1. **Monitor Agent：** 手動建立 10 個 status='failed' 的 workflow_steps → 跑 monitor → 確認 anomaly_alerts 產出 + circuit breaker SET
2. **Circuit Breaker：** SET `palup:circuit:website_builder` = "OPEN" → 嘗試 enqueue website_builder step → 確認 step 直接 fail
3. **Debug Agent：** 手動建立 critical anomaly_alert → enqueue debug_fix → 確認 LLM 產出 root cause + GitHub Draft PR 建立
4. **Debug Agent 安全限制：** 餵入涉及 `src/lib/db/schema.ts` 修改的 fix → 確認被 reject
5. **Deployment Agent：** 模擬 PR merge → CI pipeline 完整跑完 → health check pass → deployment_history 寫入
6. **Deployment Rollback：** Deploy 後手動建立 critical anomaly_alert → 確認 rollout undo 執行
7. **Evolution Agent：** 手動建立 20 筆 failed workflow_runs → 跑 evolution → 確認 3-5 筆 evolution_proposals 寫入
8. **端到端：** 故意讓 agent prompt 產出低 confidence → monitor 偵測 → debug_fix 產出 PR → 人工 merge → deployment 部署 → monitor 確認恢復
9. **自主商務全迴圈：** 模擬 lead → trial → paid → onboarding → usage → upsell，驗證 sales_crm → customer_success 交接無斷點
10. **定價迴圈：** 驗證 customer_success 的 price sensitivity signal 能正確流入 billing_pricing 的定價決策
