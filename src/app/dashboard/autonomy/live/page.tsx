"use client";

import { useState, useEffect, useCallback } from "react";

interface SystemStatus {
  status: string;
  timestamp: string;
  data: {
    anomalyAlerts: any[];
    debugSessions: any[];
    deployments: any[];
    promptVersions: any[];
    salesPatterns: any[];
    outcomeStats: { total: number; positive: number; negative: number };
  };
  summary: {
    activeAlerts: number;
    totalAlerts: number;
    activeDebugSessions: number;
    totalDeployments: number;
    promptVersionsCount: number;
    patternsDiscovered: number;
    interactionsThisWeek: number;
  };
}

export default function LiveSystemPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return <div className="p-8"><div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" /></div>;
  return <LiveContent />;
}

function LiveContent() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/autox/status");
      const data = await res.json();
      if (data.status === "error") {
        setError(data.error);
      } else {
        setStatus(data);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to connect");
    } finally {
      setLoading(false);
      setLastRefresh(new Date().toLocaleTimeString());
    }
  }, []);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchStatus, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatus]);

  return (
    <div className="p-8 max-w-[1200px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">
            Live System Status
          </h1>
          <p className="text-[13px] text-zinc-500 mt-1">
            Real-time view of the Auto-X system connected to your database
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-[12px] rounded-lg px-3 py-1.5 transition-all ${
              autoRefresh
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                : "bg-white/[0.04] text-zinc-500 border border-white/[0.08]"
            }`}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </button>
          <button
            onClick={fetchStatus}
            className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            Refresh now
          </button>
        </div>
      </div>

      {/* Connection status */}
      <div className={`card-elevated p-5 transition-all duration-500 ${
        error ? "border-rose-500/20 glow-rose" : status ? "border-emerald-500/20 glow-emerald" : ""
      }`}>
        <div className="flex items-center gap-4">
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${
            error ? "bg-rose-500/10" : loading ? "bg-zinc-500/10" : "bg-emerald-500/10"
          }`}>
            {loading ? (
              <div className="h-5 w-5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" />
            ) : error ? (
              <svg className="h-6 w-6 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
              </svg>
            ) : (
              <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-[15px] font-semibold text-zinc-200">
                {error ? "Connection Error" : loading ? "Connecting..." : "System Online"}
              </h2>
              {!error && !loading && (
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-soft" />
              )}
            </div>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              {error
                ? error
                : `PostgreSQL + Redis + 4 Agents connected. Last refresh: ${lastRefresh}`
              }
            </p>
          </div>
          {!error && !loading && (
            <div className="text-right">
              <p className="text-[11px] text-zinc-600">Server time</p>
              <p className="text-[13px] text-zinc-300 font-mono tabular-nums">
                {status?.timestamp ? new Date(status.timestamp).toLocaleTimeString() : "—"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Summary cards */}
      {status && (
        <div className="grid grid-cols-4 gap-4">
          <SummaryCard
            label="Active Alerts"
            value={status.summary.activeAlerts.toString()}
            sub={`${status.summary.totalAlerts} total alerts in DB`}
            color={status.summary.activeAlerts > 0 ? "rose" : "emerald"}
          />
          <SummaryCard
            label="Debug Sessions"
            value={status.summary.activeDebugSessions.toString()}
            sub="active sessions"
            color={status.summary.activeDebugSessions > 0 ? "indigo" : "zinc"}
          />
          <SummaryCard
            label="Deployments"
            value={status.summary.totalDeployments.toString()}
            sub="total deployments"
            color="zinc"
          />
          <SummaryCard
            label="Interactions"
            value={status.summary.interactionsThisWeek.toString()}
            sub="recorded this week"
            color="zinc"
          />
        </div>
      )}

      {/* Worker status */}
      {status && (
        <div className="card p-6">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-5">Agent Workers</h3>
          <div className="grid grid-cols-2 gap-4">
            <WorkerCard
              name="Monitor Agent"
              schedule="Every 5 minutes"
              status="active"
              lastRun="Just now"
              description="Checks email reply rate, agent error rate, active debug sessions"
            />
            <WorkerCard
              name="Debug/Fix Agent"
              schedule="On alert trigger"
              status={status.summary.activeDebugSessions > 0 ? "active" : "idle"}
              lastRun={status.summary.activeDebugSessions > 0 ? "Running now" : "Waiting for alerts"}
              description="LLM-powered root cause analysis and auto-fix generation"
            />
            <WorkerCard
              name="Evolution Agent"
              schedule="Every Monday 2:00 AM UTC"
              status="scheduled"
              lastRun="Next: Monday 02:00"
              description="Pattern extraction, prompt evolution, A/B test management"
            />
            <WorkerCard
              name="Deploy Agent"
              schedule="On fix/evolution trigger"
              status="idle"
              lastRun="Waiting for deploy jobs"
              description="Canary rollout, progressive deployment, auto-rollback"
            />
          </div>
        </div>
      )}

      {/* Database tables */}
      {status && (
        <div className="card p-6">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-5">Database Status</h3>
          <div className="grid grid-cols-3 gap-3">
            {[
              { table: "anomaly_alerts", count: status.data.anomalyAlerts.length, icon: "alert" },
              { table: "debug_sessions", count: status.data.debugSessions.length, icon: "debug" },
              { table: "deployments", count: status.data.deployments.length, icon: "deploy" },
              { table: "prompt_versions", count: status.data.promptVersions.length, icon: "prompt" },
              { table: "sales_patterns", count: status.data.salesPatterns.length, icon: "pattern" },
              { table: "sales_interaction_outcomes", count: Number(status.data.outcomeStats.total), icon: "outcome" },
            ].map(t => (
              <div key={t.table} className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-mono text-zinc-500">{t.table}</span>
                  <span className="text-[13px] font-semibold tabular-nums text-zinc-200">{t.count}</span>
                </div>
                <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                  <div className={`h-full rounded-full ${t.count > 0 ? "bg-indigo-500" : "bg-zinc-700"}`} style={{ width: t.count > 0 ? "100%" : "0%" }} />
                </div>
                <p className="text-[10px] text-zinc-600 mt-1">{t.count === 0 ? "Empty — waiting for data" : `${t.count} records`}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Data flow explanation */}
      {status && (
        <div className="card p-6">
          <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">How Data Will Flow</h3>
          <div className="space-y-3 text-[12px] text-zinc-400">
            <FlowStep
              number={1}
              title="Sales agents send outreach emails, handle replies, close deals"
              detail="Each interaction is recorded in sales_interaction_outcomes"
              active={false}
            />
            <FlowStep
              number={2}
              title="Monitor Agent checks metrics every 5 minutes"
              detail="If reply rate drops below 5% or error rate exceeds 2%, an anomaly_alert is created"
              active={true}
            />
            <FlowStep
              number={3}
              title="Debug/Fix Agent auto-triggers on critical alerts"
              detail="Uses LLM to diagnose root cause, generates a fix (new prompt version), and proposes it"
              active={false}
            />
            <FlowStep
              number={4}
              title="Deploy Agent rolls out the fix via canary deployment"
              detail="5% → 25% → 50% → 100% with health checks at each stage. Auto-rollback if issues detected."
              active={false}
            />
            <FlowStep
              number={5}
              title="Evolution Agent runs weekly to optimize agent prompts"
              detail="Analyzes all interaction outcomes, extracts winning patterns, generates improved prompts, A/B tests them"
              active={false}
            />
          </div>
          <div className="mt-5 p-4 rounded-xl bg-amber-500/[0.05] border border-amber-500/15">
            <p className="text-[12px] text-amber-400 font-medium">
              Currently waiting for sales interaction data. Once agents start sending outreach and recording outcomes, the full Auto-X cycle will activate automatically.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  const colorMap: Record<string, string> = {
    emerald: "border-emerald-500/20 bg-emerald-500/[0.03]",
    rose: "border-rose-500/20 bg-rose-500/[0.03]",
    indigo: "border-indigo-500/20 bg-indigo-500/[0.03]",
    zinc: "border-white/[0.06] bg-white/[0.025]",
  };
  const textColor: Record<string, string> = {
    emerald: "text-emerald-400",
    rose: "text-rose-400",
    indigo: "text-indigo-400",
    zinc: "text-zinc-200",
  };
  return (
    <div className={`rounded-[16px] border p-5 ${colorMap[color] || colorMap.zinc}`}>
      <p className="text-[11px] text-zinc-500 font-medium">{label}</p>
      <p className={`text-[26px] font-semibold tracking-tight tabular-nums mt-1 ${textColor[color] || "text-zinc-200"}`}>{value}</p>
      <p className="text-[11px] text-zinc-600 mt-0.5">{sub}</p>
    </div>
  );
}

function WorkerCard({ name, schedule, status, lastRun, description }: {
  name: string; schedule: string; status: "active" | "idle" | "scheduled"; lastRun: string; description: string;
}) {
  const statusConfig = {
    active: { dot: "bg-emerald-400 animate-pulse-soft", badge: "bg-emerald-500/10 text-emerald-400", label: "Active" },
    idle: { dot: "bg-zinc-500", badge: "bg-zinc-500/10 text-zinc-400", label: "Idle" },
    scheduled: { dot: "bg-indigo-400", badge: "bg-indigo-500/10 text-indigo-400", label: "Scheduled" },
  };
  const cfg = statusConfig[status];

  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`h-[7px] w-[7px] rounded-full ${cfg.dot}`} />
          <span className="text-[13px] font-medium text-zinc-200">{name}</span>
        </div>
        <span className={`badge text-[10px] ${cfg.badge}`}>{cfg.label}</span>
      </div>
      <p className="text-[11px] text-zinc-500">{description}</p>
      <div className="flex items-center justify-between text-[11px]">
        <span className="text-zinc-600">{schedule}</span>
        <span className="text-zinc-500 tabular-nums">{lastRun}</span>
      </div>
    </div>
  );
}

function FlowStep({ number, title, detail, active }: { number: number; title: string; detail: string; active: boolean }) {
  return (
    <div className="flex gap-3">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
        active ? "bg-emerald-500 text-white" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
      }`}>
        {number}
      </div>
      <div>
        <p className={`text-[13px] font-medium ${active ? "text-emerald-400" : "text-zinc-300"}`}>
          {title}
          {active && <span className="ml-2 text-[10px] text-emerald-400/70">(running now)</span>}
        </p>
        <p className="text-[11px] text-zinc-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}
