"use client";

import { useState } from "react";
import { agents, activities, type AgentInfo, type Activity } from "@/lib/demo-data";

// ─── Agent type color mapping ────────────────────────────────

const AGENT_COLORS: Record<string, { bg: string; text: string; dot: string; iconBg: string }> = {
  prospecting: { bg: "bg-blue-500/10", text: "text-blue-400", dot: "bg-blue-400", iconBg: "bg-blue-500/15" },
  outreach:    { bg: "bg-violet-500/10", text: "text-violet-400", dot: "bg-violet-400", iconBg: "bg-violet-500/15" },
  sales:       { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-400", iconBg: "bg-emerald-500/15" },
  demo:        { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-400", iconBg: "bg-amber-500/15" },
  cs:          { bg: "bg-teal-500/10", text: "text-teal-400", dot: "bg-teal-400", iconBg: "bg-teal-500/15" },
};

const AGENT_ICONS: Record<string, string> = {
  prospecting: "P",
  outreach: "O",
  sales: "S",
  demo: "D",
  cs: "C",
};

const STATUS_BADGE: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Active" },
  idle:   { bg: "bg-zinc-500/10", text: "text-zinc-400", label: "Idle" },
  error:  { bg: "bg-red-500/10", text: "text-red-400", label: "Error" },
};

const ACTIVITY_TYPE_COLORS: Record<Activity["type"], string> = {
  email_sent:        "bg-blue-400",
  email_opened:      "bg-sky-400",
  email_replied:     "bg-emerald-400",
  meeting_scheduled: "bg-violet-400",
  meeting_completed: "bg-indigo-400",
  proposal_sent:     "bg-amber-400",
  call_completed:    "bg-teal-400",
  note:              "bg-zinc-400",
  stage_change:      "bg-rose-400",
  linkedin_sent:     "bg-blue-500",
};

const ACTIVITY_TYPE_LABELS: Record<Activity["type"], string> = {
  email_sent:        "Email Sent",
  email_opened:      "Email Opened",
  email_replied:     "Email Replied",
  meeting_scheduled: "Meeting Scheduled",
  meeting_completed: "Meeting Completed",
  proposal_sent:     "Proposal Sent",
  call_completed:    "Call Completed",
  note:              "Note",
  stage_change:      "Stage Change",
  linkedin_sent:     "LinkedIn Sent",
};

function formatTime(ts: string) {
  const d = new Date(ts);
  const now = new Date("2026-03-30T12:00:00Z");
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// ─── Agent Card ──────────────────────────────────────────────

function AgentCard({ agent }: { agent: AgentInfo }) {
  const colors = AGENT_COLORS[agent.type] ?? AGENT_COLORS.sales;
  const status = STATUS_BADGE[agent.status];
  const icon = AGENT_ICONS[agent.type] ?? "A";

  return (
    <div className="card card-hover p-5 transition-all duration-200">
      <div className="flex items-start gap-4">
        {/* Icon circle */}
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${colors.iconBg}`}>
          <span className={`text-[15px] font-semibold ${colors.text}`}>{icon}</span>
        </div>

        {/* Middle: name, status, last action */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <span className="text-[15px] font-medium text-zinc-200">{agent.name}</span>
            <span className={`badge ${status.bg} ${status.text}`}>{status.label}</span>
          </div>
          <p className="mt-1 text-[12px] text-zinc-500">{agent.lastAction}</p>
          <p className="mt-0.5 text-[11px] text-zinc-600">{formatTime(agent.lastActionTime)}</p>
        </div>
      </div>

      {/* Mini-stat blocks */}
      <div className="mt-4 grid grid-cols-4 gap-2">
        <MiniStat label="Total" value={agent.metrics.activitiesTotal.toLocaleString()} />
        <MiniStat label="Today" value={String(agent.metrics.activitiesToday)} />
        <MiniStat label="Success Rate" value={`${(agent.metrics.successRate * 100).toFixed(1)}%`} />
        <MiniStat label="Avg Response" value={agent.metrics.avgResponseTime} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white/[0.03] px-3 py-2">
      <p className="text-[10px] text-zinc-500">{label}</p>
      <p className="mt-0.5 text-[13px] font-semibold tabular-nums text-zinc-200">{value}</p>
    </div>
  );
}

// ─── Activity Feed ───────────────────────────────────────────

function ActivityFeed() {
  const sorted = [...activities].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  return (
    <div className="card p-5">
      <div className="space-y-0">
        {sorted.map((act, idx) => {
          const agentInfo = agents.find((a) => a.name === act.agentType);
          const agentColors = agentInfo
            ? (AGENT_COLORS[agentInfo.type] ?? AGENT_COLORS.sales)
            : AGENT_COLORS.sales;
          const dotColor = ACTIVITY_TYPE_COLORS[act.type];

          return (
            <div key={act.id}>
              <div className="flex items-center gap-3 py-3">
                {/* Type dot */}
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />

                {/* Agent name badge */}
                <span className={`badge shrink-0 ${agentColors.bg} ${agentColors.text}`}>
                  {act.agentType}
                </span>

                {/* Summary */}
                <p className="min-w-0 flex-1 truncate text-[13px] text-zinc-300">{act.summary}</p>

                {/* Time */}
                <span className="shrink-0 text-[11px] tabular-nums text-zinc-600">
                  {formatTime(act.timestamp)}
                </span>
              </div>
              {idx < sorted.length - 1 && <div className="divider" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function AgentsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Agent Management</h1>
        <p className="mt-1 text-[13px] text-zinc-500">Monitor and configure your AI sales agents</p>
      </div>

      {/* Agent Cards */}
      <div className="grid grid-cols-1 gap-4">
        {agents.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {/* Activity Log */}
      <div>
        <h2 className="mb-4 text-[15px] font-semibold text-zinc-200">Activity Log</h2>
        <ActivityFeed />
      </div>
    </div>
  );
}
