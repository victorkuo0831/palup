"use client";

import { deals, companies, contacts, type DealStage } from "@/lib/demo-data";

// ─── Helpers ────────────────────────────────────────────────────

const STAGE_ORDER: DealStage[] = [
  "lead",
  "qualified",
  "demo",
  "proposal",
  "negotiation",
];

const STAGE_CONFIG: Record<
  string,
  { label: string; bg: string; text: string; dot: string }
> = {
  lead: {
    label: "Lead",
    bg: "bg-zinc-500/15",
    text: "text-zinc-300",
    dot: "bg-zinc-500",
  },
  qualified: {
    label: "Qualified",
    bg: "bg-blue-500/15",
    text: "text-blue-300",
    dot: "bg-blue-500",
  },
  demo: {
    label: "Demo",
    bg: "bg-indigo-500/15",
    text: "text-indigo-300",
    dot: "bg-indigo-500",
  },
  proposal: {
    label: "Proposal",
    bg: "bg-violet-500/15",
    text: "text-violet-300",
    dot: "bg-violet-500",
  },
  negotiation: {
    label: "Negotiation",
    bg: "bg-amber-500/15",
    text: "text-amber-300",
    dot: "bg-amber-500",
  },
};

function friendlyNextStep(nextAction: string): string {
  // Convert agent-speak to plain language
  return nextAction
    .replace(/^Send revised proposal with/, "Waiting to send revised pricing with")
    .replace(/^Follow up on/, "Following up on")
    .replace(/^Schedule technical deep-dive with/, "Setting up a technical walkthrough with")
    .replace(/^Send case study from/, "Sharing a success story from a")
    .replace(/^Research their current/, "Researching their current")
    .replace(/^Final contract review with/, "Contract under review by")
    .replace(/^Prepare custom demo for/, "Preparing a personalized demo for")
    .replace(/^Send intro email with/, "Sending a warm intro with")
    .replace(/^Schedule discovery call/, "Scheduling an introductory call")
    .replace(/^Prepare ROI analysis for/, "Building a value analysis for");
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function DealsPage() {
  // Filter to only active deals (not closed)
  const activeDeals = deals.filter(
    (d) => d.stage !== "closed_won" && d.stage !== "closed_lost"
  );

  const totalValue = activeDeals.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-8">
      {/* ─── Header ──────────────────────────────────────── */}
      <div>
        <h1 className="text-[22px] font-semibold text-white">Your Deals</h1>
        <p className="mt-1 text-[13px] text-zinc-400">
          {activeDeals.length} active deals worth{" "}
          <span className="font-semibold text-white tabular-nums">
            {formatAmount(totalValue)}
          </span>
        </p>
      </div>

      {/* ─── Deal Cards ──────────────────────────────────── */}
      <div className="space-y-3">
        {activeDeals.map((deal) => {
          const company = companies.find((c) => c.id === deal.companyId);
          const contact = contacts.find((c) => c.id === deal.contactId);
          const stage = STAGE_CONFIG[deal.stage] ?? STAGE_CONFIG.lead;
          const stageIndex = STAGE_ORDER.indexOf(deal.stage);

          return (
            <div
              key={deal.id}
              className="card card-hover cursor-pointer p-5 transition-all duration-150"
            >
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                {/* Left: Main info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1.5">
                    <h3 className="text-[15px] font-semibold text-white truncate">
                      {company?.name ?? "Unknown"}
                    </h3>
                    <span
                      className={`badge ${stage.bg} ${stage.text}`}
                    >
                      {stage.label}
                    </span>
                  </div>

                  <p className="text-[13px] text-zinc-400">
                    {contact?.name} &middot; {contact?.title}
                  </p>

                  <p className="mt-3 text-[13px] text-zinc-300 leading-relaxed">
                    <span className="text-zinc-500">Next step:</span>{" "}
                    {friendlyNextStep(deal.nextAction)}
                  </p>

                  {/* Stage progress dots */}
                  <div className="flex items-center gap-1.5 mt-3">
                    {STAGE_ORDER.map((s, i) => (
                      <div
                        key={s}
                        className={`h-2 w-2 rounded-full transition-colors ${
                          i <= stageIndex
                            ? STAGE_CONFIG[s].dot
                            : "bg-white/[0.08]"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Right: Amount + days */}
                <div className="flex sm:flex-col items-center sm:items-end gap-3 sm:gap-1.5 shrink-0">
                  <p className="text-[18px] font-semibold text-white tabular-nums">
                    {formatAmount(deal.amount)}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {deal.daysInStage === 1
                      ? "1 day in stage"
                      : `${deal.daysInStage} days in stage`}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
