"use client";

import { useState } from "react";
import {
  deals,
  Deal,
  DealStage,
  getCompany,
  getContact,
  getActivitiesForDeal,
  formatCurrency,
  formatDate,
  formatDateTime,
  timeAgo,
  Activity,
} from "@/lib/demo-data";

// ─── Stage Configuration ─────────────────────────────────────

const STAGES: { key: DealStage; label: string; color: string }[] = [
  { key: "lead", label: "Lead", color: "zinc" },
  { key: "qualified", label: "Qualified", color: "blue" },
  { key: "demo", label: "Demo", color: "violet" },
  { key: "proposal", label: "Proposal", color: "amber" },
  { key: "negotiation", label: "Negotiation", color: "orange" },
  { key: "closed_won", label: "Closed Won", color: "emerald" },
  { key: "closed_lost", label: "Closed Lost", color: "rose" },
];

// ─── Activity Icons (inline SVG) ─────────────────────────────

function ActivityIcon({ type }: { type: Activity["type"] }) {
  const cls = "w-3.5 h-3.5 shrink-0";
  switch (type) {
    case "email_sent":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="M22 4L12 13 2 4" />
        </svg>
      );
    case "email_opened":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    case "email_replied":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="9 14 4 9 9 4" />
          <path d="M20 20v-7a4 4 0 00-4-4H4" />
        </svg>
      );
    case "meeting_scheduled":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      );
    case "meeting_completed":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case "proposal_sent":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <polyline points="14 2 14 8 20 8" />
        </svg>
      );
    case "call_completed":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
        </svg>
      );
    case "note":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
      );
    case "stage_change":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <line x1="5" y1="12" x2="19" y2="12" />
          <polyline points="12 5 19 12 12 19" />
        </svg>
      );
    case "linkedin_sent":
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6z" />
          <rect x="2" y="9" width="4" height="12" />
          <circle cx="4" cy="4" r="2" />
        </svg>
      );
    default:
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function activityDotColor(outcome: Activity["outcome"]) {
  switch (outcome) {
    case "positive":
      return "bg-emerald-400";
    case "negative":
      return "bg-rose-400";
    case "neutral":
      return "bg-zinc-500";
    case "pending":
      return "bg-amber-400";
    default:
      return "bg-zinc-500";
  }
}

function outcomeColor(outcome: Activity["outcome"]) {
  switch (outcome) {
    case "positive":
      return "text-emerald-400";
    case "negative":
      return "text-rose-400";
    case "neutral":
      return "text-zinc-500";
    case "pending":
      return "text-amber-400";
    default:
      return "text-zinc-500";
  }
}

function cardLeftBorder(probability: number) {
  if (probability > 50) return "border-l-emerald-500/70";
  if (probability >= 25) return "border-l-amber-500/70";
  return "border-l-zinc-600";
}

function columnBg(key: DealStage) {
  if (key === "closed_won") return "bg-emerald-500/[0.02]";
  if (key === "closed_lost") return "bg-rose-500/[0.02]";
  return "bg-white/[0.015]";
}

function stageBadgeClass(key: DealStage) {
  const map: Record<string, string> = {
    lead: "bg-zinc-500/10 text-zinc-400",
    qualified: "bg-blue-500/10 text-blue-400",
    demo: "bg-violet-500/10 text-violet-400",
    proposal: "bg-amber-500/10 text-amber-400",
    negotiation: "bg-orange-500/10 text-orange-400",
    closed_won: "bg-emerald-500/10 text-emerald-400",
    closed_lost: "bg-rose-500/10 text-rose-400",
  };
  return map[key] ?? map.lead;
}

function columnDotClass(color: string) {
  const map: Record<string, string> = {
    zinc: "bg-zinc-400",
    blue: "bg-blue-400",
    violet: "bg-violet-400",
    amber: "bg-amber-400",
    orange: "bg-orange-400",
    emerald: "bg-emerald-400",
    rose: "bg-rose-400",
  };
  return map[color] ?? map.zinc;
}

// ─── Main Page Component ─────────────────────────────────────

export default function PipelinePage() {
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const totalValue = deals.reduce((s, d) => s + d.amount, 0);
  const avgDays = Math.round(
    deals.reduce((s, d) => s + d.daysInStage, 0) / deals.length
  );

  const dealsByStage = STAGES.map((stage) => {
    const stageDeals = deals.filter((d) => d.stage === stage.key);
    return {
      ...stage,
      deals: stageDeals,
      total: stageDeals.reduce((sum, d) => sum + d.amount, 0),
    };
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="px-6 pt-6 pb-0">
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">
          Sales Pipeline
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Manage and track deal progression across stages
        </p>
      </div>

      {/* Summary bar */}
      <div className="px-6 pt-4 pb-2">
        <div className="card flex items-center gap-6 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-zinc-500">Total Deals</span>
            <span className="text-[15px] font-semibold tabular-nums text-zinc-200">
              {deals.length}
            </span>
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-zinc-500">Pipeline Value</span>
            <span className="text-[15px] font-semibold tabular-nums text-zinc-200">
              {formatCurrency(totalValue)}
            </span>
          </div>
          <div className="h-4 w-px bg-white/[0.06]" />
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-zinc-500">Avg. Days in Stage</span>
            <span className="text-[15px] font-semibold tabular-nums text-zinc-200">
              {avgDays}
            </span>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto px-6 py-4 snap-x snap-mandatory">
        {dealsByStage.map((col) => (
          <div
            key={col.key}
            className={`flex w-[280px] shrink-0 flex-col rounded-2xl ${columnBg(col.key)} snap-start`}
          >
            {/* Column Header */}
            <div className="px-4 py-3.5">
              <div className="flex items-center gap-2">
                <span
                  className={`h-2 w-2 rounded-full ${columnDotClass(col.color)}`}
                />
                <span className="text-[13px] font-semibold text-zinc-200">
                  {col.label}
                </span>
                <span className="ml-auto rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-400">
                  {col.deals.length}
                </span>
              </div>
              <p className="mt-1 text-[12px] tabular-nums text-zinc-500">
                {formatCurrency(col.total)}
              </p>
            </div>

            <div className="divider" />

            {/* Cards */}
            <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-3">
              {col.deals.length === 0 && (
                <p className="py-10 text-center text-[12px] text-zinc-600">
                  No deals
                </p>
              )}
              {col.deals.map((deal) => {
                const company = getCompany(deal.companyId);
                const contact = getContact(deal.contactId);
                return (
                  <button
                    key={deal.id}
                    onClick={() => setSelectedDeal(deal)}
                    className={`cursor-pointer rounded-xl border border-l-[3px] border-white/[0.06] bg-white/[0.03] p-4 text-left transition-all hover:bg-white/[0.05] hover:border-white/[0.1] ${cardLeftBorder(deal.probability)}`}
                  >
                    <p className="text-[13px] font-medium text-zinc-200 leading-snug">
                      {company?.name ?? "Unknown"}
                    </p>
                    <p className="mt-0.5 text-[11px] text-zinc-500">
                      {contact?.name ?? "--"}
                    </p>
                    <p className="mt-2.5 text-[15px] font-semibold tabular-nums text-zinc-200">
                      {formatCurrency(deal.amount)}
                    </p>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="badge bg-indigo-500/10 text-indigo-400 text-[10px]">
                        {deal.assignedAgent}
                      </span>
                      <span className="text-[11px] tabular-nums text-zinc-600">
                        {deal.daysInStage}d
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Deal Detail Slide-over */}
      {selectedDeal && (
        <DealSlideover
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  );
}

// ─── Slide-over Component ────────────────────────────────────

function DealSlideover({
  deal,
  onClose,
}: {
  deal: Deal;
  onClose: () => void;
}) {
  const company = getCompany(deal.companyId);
  const contact = getContact(deal.contactId);
  const activities = getActivitiesForDeal(deal.id);
  const stageConfig = STAGES.find((s) => s.key === deal.stage);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-[440px] max-w-full flex-col border-l border-white/[0.06] bg-[#0f0f12] shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-white/[0.04] px-6 py-5">
          <div className="min-w-0 flex-1">
            <h2 className="text-[18px] font-semibold tracking-tight text-zinc-200 truncate">
              {company?.name ?? "Unknown"}
            </h2>
            <p className="mt-1 text-[13px] text-zinc-500">
              {contact?.name ?? "--"}{" "}
              {contact?.title ? `/ ${contact.title}` : ""}
            </p>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[18px] font-semibold tabular-nums text-zinc-200">
                {formatCurrency(deal.amount)}
              </span>
              <span
                className={`badge text-[11px] ${stageBadgeClass(deal.stage)}`}
              >
                {stageConfig?.label ?? deal.stage}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 shrink-0 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-zinc-300"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Deal Info Grid */}
          <div className="grid grid-cols-2 gap-4 border-b border-white/[0.04] px-6 py-5">
            <InfoBlock
              label="Probability"
              value={
                <span className="tabular-nums">
                  {deal.probability}%
                </span>
              }
            />
            <InfoBlock
              label="Days in Stage"
              value={
                <span className="tabular-nums">{deal.daysInStage} days</span>
              }
            />
            <InfoBlock label="Assigned Agent" value={deal.assignedAgent} />
            <InfoBlock
              label="Expected Close"
              value={formatDate(deal.expectedCloseDate)}
            />
          </div>

          {/* Next Action */}
          <div className="border-b border-white/[0.04] px-6 py-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Next Action
            </p>
            <div className="mt-2.5 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.06] px-4 py-3">
              <p className="text-[13px] font-medium text-indigo-300 leading-relaxed">
                {deal.nextAction}
              </p>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="px-6 py-5">
            <p className="text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Activity Timeline
            </p>
            {activities.length === 0 ? (
              <p className="mt-4 text-[13px] text-zinc-600">
                No activities yet.
              </p>
            ) : (
              <div className="relative mt-4">
                {/* Timeline vertical line */}
                <div className="absolute left-[9px] top-3 bottom-3 w-px bg-white/[0.06]" />

                <div className="flex flex-col gap-5">
                  {activities.map((act) => (
                    <div key={act.id} className="relative flex gap-3">
                      {/* Dot */}
                      <div
                        className={`relative z-10 mt-1 h-[18px] w-[18px] shrink-0 rounded-full border border-white/[0.08] bg-[#0f0f12] flex items-center justify-center`}
                      >
                        <div
                          className={`h-2 w-2 rounded-full ${activityDotColor(act.outcome)}`}
                        />
                      </div>
                      {/* Content */}
                      <div className="min-w-0 flex-1 pb-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`${outcomeColor(act.outcome)}`}>
                            <ActivityIcon type={act.type} />
                          </span>
                          <span className="text-[12px] font-medium text-zinc-400 capitalize">
                            {act.type.replace(/_/g, " ")}
                          </span>
                          <span className="text-[11px] text-zinc-600 ml-auto shrink-0">
                            {timeAgo(act.timestamp)}
                          </span>
                        </div>
                        <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">
                          {act.summary}
                        </p>
                        <div className="mt-1.5 flex gap-2">
                          <span className="rounded-md bg-white/[0.04] px-1.5 py-0.5 text-[10px] text-zinc-600">
                            {act.channel}
                          </span>
                          <span
                            className={`rounded-md px-1.5 py-0.5 text-[10px] font-medium ${outcomeColor(act.outcome)}`}
                          >
                            {act.outcome}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Info Block ──────────────────────────────────────────────

function InfoBlock({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-zinc-500">{label}</p>
      <div className="mt-1 text-[13px] font-medium text-zinc-200">{value}</div>
    </div>
  );
}
