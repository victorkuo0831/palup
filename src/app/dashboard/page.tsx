"use client";

import Link from "next/link";
import {
  deals, activities, agents, anomalyAlerts, healthMetrics, companies,
  getPipelineSummary, formatCurrency, timeAgo,
  type Activity, type AgentInfo,
} from "@/lib/demo-data";

export default function DashboardPage() {
  const pipeline = getPipelineSummary();
  const recentActivities = [...activities]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 6);
  const activeAlerts = anomalyAlerts.filter((a) => a.status === "active" || a.status === "investigating");
  const pendingActions = deals
    .filter((d) => d.stage !== "closed_won" && d.stage !== "closed_lost")
    .sort((a, b) => b.daysInStage - a.daysInStage)
    .slice(0, 4);

  return (
    <div className="p-8 max-w-[1400px]">
      {/* ─── Header ───────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-[22px] font-semibold tracking-tight">Sales Overview</h1>
        <p className="text-[13px] text-zinc-500 mt-1">Real-time view of your AI sales team</p>
      </div>

      {/* ─── Metric Cards ─────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Active Deals"
          value={pipeline.totalActive.toString()}
          sub={`${formatCurrency(pipeline.totalValue)} total`}
          trend="+3"
          trendUp
          icon="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
        <MetricCard
          label="Weighted Pipeline"
          value={formatCurrency(pipeline.weightedValue)}
          sub="probability-adjusted"
          trend="+8.3"
          trendUp
          icon="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <MetricCard
          label="Won This Month"
          value={pipeline.wonThisMonth.toString()}
          sub={`${formatCurrency(pipeline.wonRevenue)} revenue`}
          trend="+1"
          trendUp
          icon="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        <MetricCard
          label="Win Rate"
          value="34%"
          sub="vs. 32% last month"
          trend="+2.1"
          trendUp
          icon="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941"
        />
      </div>

      {/* ─── Pipeline Stages ──────────────────────────────── */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-[13px] font-semibold text-zinc-300">Pipeline by Stage</h2>
          <Link href="/dashboard/pipeline" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">
            View full pipeline &rarr;
          </Link>
        </div>
        {/* Stage bars */}
        <div className="flex gap-1.5 h-10 mb-4">
          {([
            { key: "lead", count: pipeline.stageDistribution.lead, color: "bg-zinc-600", label: "Lead" },
            { key: "qualified", count: pipeline.stageDistribution.qualified, color: "bg-blue-500", label: "Qualified" },
            { key: "demo", count: pipeline.stageDistribution.demo, color: "bg-violet-500", label: "Demo" },
            { key: "proposal", count: pipeline.stageDistribution.proposal, color: "bg-amber-500", label: "Proposal" },
            { key: "negotiation", count: pipeline.stageDistribution.negotiation, color: "bg-orange-500", label: "Negotiation" },
          ] as const).map((s) => {
            const pct = pipeline.totalActive > 0 ? (s.count / pipeline.totalActive) * 100 : 0;
            if (pct === 0) return null;
            return (
              <div
                key={s.key}
                className={`${s.color} rounded-lg flex items-center justify-center text-[11px] font-semibold text-white/80 relative group cursor-default transition-all hover:opacity-90`}
                style={{ width: `${pct}%` }}
              >
                {pct > 15 && s.count}
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 hidden group-hover:flex items-center gap-1.5 bg-zinc-800 border border-white/10 text-white text-[11px] px-3 py-1.5 rounded-lg shadow-xl whitespace-nowrap z-10">
                  <div className={`h-2 w-2 rounded-full ${s.color}`} />
                  {s.label}: {s.count} deals
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex gap-5">
          {[
            { label: "Lead", color: "bg-zinc-600" },
            { label: "Qualified", color: "bg-blue-500" },
            { label: "Demo", color: "bg-violet-500" },
            { label: "Proposal", color: "bg-amber-500" },
            { label: "Negotiation", color: "bg-orange-500" },
          ].map((s) => (
            <div key={s.label} className="flex items-center gap-1.5">
              <div className={`h-[6px] w-[6px] rounded-full ${s.color}`} />
              <span className="text-[11px] text-zinc-500">{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Two Column Layout ────────────────────────────── */}
      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Agent Activity Feed */}
        <div className="card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-[13px] font-semibold text-zinc-300">Recent Activity</h2>
            <Link href="/dashboard/agents" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">View all</Link>
          </div>
          <div className="space-y-0">
            {recentActivities.map((act, i) => (
              <ActivityRow key={act.id} activity={act} isLast={i === recentActivities.length - 1} />
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-5">
          {/* System Health */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-zinc-300">System Health</h2>
              <Link href="/dashboard/autonomy" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">Auto-X</Link>
            </div>
            <div className="space-y-3">
              {healthMetrics.slice(0, 4).map((m) => (
                <div key={m.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`h-[7px] w-[7px] rounded-full ${m.status === "good" ? "bg-emerald-400" : m.status === "warning" ? "bg-amber-400" : "bg-rose-400"}`} />
                    <span className="text-[12px] text-zinc-400">{m.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-medium tabular-nums">{m.value}{m.unit === "%" ? "%" : ""}</span>
                    <span className={`text-[11px] tabular-nums ${m.trend > 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {m.trend > 0 ? "+" : ""}{m.trend}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {activeAlerts.length > 0 && (
              <>
                <div className="divider my-4" />
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-4 w-4 rounded-full bg-amber-500/10 flex items-center justify-center">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-soft" />
                  </div>
                  <p className="text-[12px] font-medium text-amber-400">{activeAlerts.length} active alert{activeAlerts.length > 1 ? "s" : ""}</p>
                </div>
                {activeAlerts.slice(0, 2).map((alert) => (
                  <p key={alert.id} className="text-[11px] text-zinc-500 leading-relaxed mb-1.5 pl-6">
                    {alert.message}
                  </p>
                ))}
              </>
            )}
          </div>

          {/* Agent Status */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[13px] font-semibold text-zinc-300">Agents</h2>
              <Link href="/dashboard/agents" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">Manage</Link>
            </div>
            <div className="space-y-2">
              {agents.map((agent) => (
                <AgentRow key={agent.id} agent={agent} />
              ))}
            </div>
          </div>

          {/* Needs Attention */}
          <div className="card p-5">
            <h2 className="text-[13px] font-semibold text-zinc-300 mb-4">Needs Attention</h2>
            <div className="space-y-3">
              {pendingActions.map((deal) => {
                const company = companies.find((c) => c.id === deal.companyId);
                return (
                  <div key={deal.id} className="flex items-start gap-3 group cursor-pointer">
                    <div className="mt-0.5 h-6 w-6 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0 group-hover:bg-amber-500/15 transition-colors">
                      <svg className="h-3 w-3 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-medium text-zinc-200 truncate">{company?.name} &middot; {formatCurrency(deal.amount)}</p>
                      <p className="text-[11px] text-zinc-500 truncate mt-0.5">{deal.nextAction}</p>
                    </div>
                    <span className="text-[10px] text-zinc-600 tabular-nums shrink-0">{deal.daysInStage}d</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MetricCard ──────────────────────────────────────────────────

function MetricCard({ label, value, sub, trend, trendUp, icon }: {
  label: string; value: string; sub: string; trend: string; trendUp: boolean; icon: string;
}) {
  return (
    <div className="card p-5 group hover:bg-white/[0.04] transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="h-9 w-9 rounded-xl bg-white/[0.04] flex items-center justify-center">
          <svg className="h-[18px] w-[18px] text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
          </svg>
        </div>
        <div className={`badge ${trendUp ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"}`}>
          {trendUp ? "+" : ""}{trend}%
        </div>
      </div>
      <p className="text-[24px] font-semibold tracking-tight tabular-nums">{value}</p>
      <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>
    </div>
  );
}

// ─── ActivityRow ─────────────────────────────────────────────────

function ActivityRow({ activity, isLast }: { activity: Activity; isLast: boolean }) {
  const deal = deals.find((d) => d.id === activity.dealId);
  const company = deal ? companies.find((c) => c.id === deal.companyId) : null;

  const typeConfig: Record<string, { icon: string; color: string }> = {
    email_sent: { icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75", color: "text-blue-400 bg-blue-500/10" },
    email_opened: { icon: "M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z M15 12a3 3 0 11-6 0 3 3 0 016 0z", color: "text-violet-400 bg-violet-500/10" },
    email_replied: { icon: "M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3", color: "text-emerald-400 bg-emerald-500/10" },
    meeting_scheduled: { icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5", color: "text-indigo-400 bg-indigo-500/10" },
    meeting_completed: { icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "text-emerald-400 bg-emerald-500/10" },
    proposal_sent: { icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z", color: "text-amber-400 bg-amber-500/10" },
    call_completed: { icon: "M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z", color: "text-teal-400 bg-teal-500/10" },
    stage_change: { icon: "M4.5 12h15m0 0l-6.75-6.75M19.5 12l-6.75 6.75", color: "text-orange-400 bg-orange-500/10" },
    linkedin_sent: { icon: "M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244", color: "text-sky-400 bg-sky-500/10" },
    note: { icon: "M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10", color: "text-zinc-400 bg-zinc-500/10" },
  };

  const cfg = typeConfig[activity.type] || typeConfig.note;
  const outcomeDot = activity.outcome === "positive" ? "bg-emerald-400" : activity.outcome === "negative" ? "bg-rose-400" : "";

  return (
    <div className={`flex items-start gap-3 py-3.5 ${!isLast ? "border-b border-white/[0.04]" : ""}`}>
      <div className={`mt-0.5 h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${cfg.color.split(" ")[1]}`}>
        <svg className={`h-[15px] w-[15px] ${cfg.color.split(" ")[0]}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d={cfg.icon} />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[12px] font-medium text-indigo-400">{activity.agentType}</span>
          <span className="text-[11px] text-zinc-600">&middot;</span>
          <span className="text-[12px] font-medium text-zinc-300">{company?.name}</span>
          {outcomeDot && <div className={`h-1.5 w-1.5 rounded-full ${outcomeDot}`} />}
        </div>
        <p className="text-[12px] text-zinc-500 mt-0.5 leading-relaxed truncate">{activity.summary}</p>
      </div>
      <span className="text-[11px] text-zinc-600 shrink-0 tabular-nums">{timeAgo(activity.timestamp)}</span>
    </div>
  );
}

// ─── AgentRow ────────────────────────────────────────────────────

function AgentRow({ agent }: { agent: AgentInfo }) {
  const statusMap = {
    active: { dot: "bg-emerald-400", label: "Active", animate: true },
    idle: { dot: "bg-zinc-500", label: "Idle", animate: false },
    error: { dot: "bg-rose-400", label: "Error", animate: false },
  };
  const s = statusMap[agent.status];
  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2.5">
        <div className={`h-[7px] w-[7px] rounded-full ${s.dot} ${s.animate ? "animate-pulse-soft" : ""}`} />
        <span className="text-[12px] font-medium text-zinc-300">{agent.name}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-zinc-500 tabular-nums">{agent.metrics.activitiesToday} today</span>
        <span className="text-[11px] font-medium text-zinc-400 tabular-nums">{Math.round(agent.metrics.successRate * 100)}%</span>
      </div>
    </div>
  );
}
