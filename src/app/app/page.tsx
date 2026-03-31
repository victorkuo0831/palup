"use client";

import Link from "next/link";

// ─── Activity Feed Data ─────────────────────────────────────────

const RECENT_ACTIVITIES = [
  {
    icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75",
    text: "Sent personalized outreach to Maya Chen at TechVista",
    time: "2h ago",
    color: "text-indigo-400",
  },
  {
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5",
    text: "Scheduled demo with DataPulse Analytics for Apr 1",
    time: "4h ago",
    color: "text-emerald-400",
  },
  {
    icon: "M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 00-3.7-3.7 48.678 48.678 0 00-7.324 0 4.006 4.006 0 00-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3l-3-3m-12 3c0 1.232.046 2.453.138 3.662a4.006 4.006 0 003.7 3.7 48.656 48.656 0 007.324 0 4.006 4.006 0 003.7-3.7c.017-.22.032-.441.046-.662M4.5 12l3 3m-3-3l-3 3",
    text: "Followed up on proposal sent to GreenLeaf Commerce",
    time: "5h ago",
    color: "text-amber-400",
  },
  {
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
    text: "Researched 12 new prospects matching your ideal customer profile",
    time: "6h ago",
    color: "text-violet-400",
  },
  {
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
    text: "Updated competitor info: SalesBot AI launched new feature",
    time: "yesterday",
    color: "text-rose-400",
  },
];

// ─── Pipeline Stages ────────────────────────────────────────────

const PIPELINE_STAGES = [
  { label: "Lead", count: 2, color: "bg-zinc-500" },
  { label: "Qualified", count: 2, color: "bg-blue-500" },
  { label: "Demo", count: 2, color: "bg-indigo-500" },
  { label: "Proposal", count: 2, color: "bg-violet-500" },
  { label: "Negotiation", count: 2, color: "bg-amber-500" },
  { label: "Won", count: 1, color: "bg-emerald-500" },
];

// ─── Action Items ───────────────────────────────────────────────

const ACTION_ITEMS = [
  {
    title: "Approve discount",
    description:
      "TechFlow wants 10% off the Enterprise plan. Your limit is 15%.",
    question: "Approve?",
    actions: [
      { label: "Approve", style: "primary" },
      { label: "Decline", style: "secondary" },
    ],
    accent: "glow-indigo",
  },
  {
    title: "Review proposal",
    description:
      "Draft proposal ready for DataPulse ($72K). Review before we send?",
    question: "",
    actions: [
      { label: "View", style: "secondary" },
      { label: "Send", style: "primary" },
    ],
    accent: "glow-emerald",
  },
  {
    title: "New competitor mention",
    description:
      "A prospect mentioned RevenueOS. Update your battlecard?",
    question: "",
    actions: [{ label: "Update", style: "primary" }],
    accent: "glow-amber",
  },
];

// ─── Monthly Metrics ────────────────────────────────────────────

const MONTHLY_METRICS = [
  { label: "Emails Sent", value: "342", icon: "M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" },
  { label: "Meetings Booked", value: "8", icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" },
  { label: "Proposals Sent", value: "4", icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" },
  { label: "Revenue Won", value: "$36,000", icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" },
];

export default function AppHomePage() {
  const totalPipelineValue = "$445,000";

  return (
    <div className="space-y-10">
      {/* ─── Status Banner ─────────────────────────────── */}
      <div className="card-elevated glow-emerald px-6 py-5">
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
          </span>
          <h1 className="text-[22px] font-semibold text-white">
            Your AI sales team is active
          </h1>
        </div>
        <p className="mt-2 text-[13px] text-zinc-400 pl-6">
          5 agents working &middot; 3 active deals &middot; 2 actions today
        </p>
      </div>

      {/* ─── Section 1: Activity Feed ──────────────────── */}
      <section>
        <h2 className="text-[22px] font-semibold text-white mb-4">
          What your agents did today
        </h2>
        <div className="space-y-1">
          {RECENT_ACTIVITIES.map((activity, i) => (
            <div
              key={i}
              className="card card-hover flex items-start gap-3.5 px-5 py-3.5 rounded-xl"
            >
              <svg
                className={`mt-0.5 h-[18px] w-[18px] shrink-0 ${activity.color}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={activity.icon}
                />
              </svg>
              <p className="flex-1 text-[13px] text-zinc-200 leading-relaxed">
                {activity.text}
              </p>
              <span className="shrink-0 text-[12px] text-zinc-500">
                {activity.time}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 2: Pipeline Overview ──────────────── */}
      <section>
        <h2 className="text-[22px] font-semibold text-white mb-4">
          Your pipeline
        </h2>
        <div className="card-elevated px-6 py-5">
          {/* Progress bar */}
          <div className="flex gap-1 mb-4 h-3 rounded-full overflow-hidden">
            {PIPELINE_STAGES.map((stage) => (
              <div
                key={stage.label}
                className={`${stage.color} opacity-80`}
                style={{
                  flex: stage.count,
                }}
              />
            ))}
          </div>

          {/* Stage labels */}
          <div className="flex justify-between gap-2 mb-5">
            {PIPELINE_STAGES.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${stage.color}`} />
                <span className="text-[12px] text-zinc-400">
                  {stage.label}
                </span>
                <span className="text-[11px] text-zinc-500">
                  ({stage.count})
                </span>
                {i < PIPELINE_STAGES.length - 1 && (
                  <svg
                    className="ml-1 h-3 w-3 text-zinc-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                )}
              </div>
            ))}
          </div>

          <div className="divider mb-4" />

          <div className="flex items-center justify-between">
            <p className="text-[13px] text-zinc-400">
              Total pipeline value:{" "}
              <span className="font-semibold text-white tabular-nums">
                {totalPipelineValue}
              </span>
            </p>
            <Link
              href="/app/deals"
              className="text-[13px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              View all deals &rarr;
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Needs Your Input ───────────────── */}
      <section>
        <h2 className="text-[22px] font-semibold text-white mb-4">
          Needs your input
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ACTION_ITEMS.map((item, i) => (
            <div key={i} className={`card-elevated ${item.accent} p-5`}>
              <h3 className="text-[13px] font-semibold text-white mb-2">
                {item.title}
              </h3>
              <p className="text-[12px] text-zinc-400 leading-relaxed mb-4">
                {item.description}
                {item.question && (
                  <span className="text-zinc-300"> {item.question}</span>
                )}
              </p>
              <div className="flex gap-2">
                {item.actions.map((action) => (
                  <button
                    key={action.label}
                    className={`rounded-lg px-3.5 py-1.5 text-[12px] font-medium transition-all duration-150 cursor-pointer ${
                      action.style === "primary"
                        ? "bg-white/10 text-white hover:bg-white/15"
                        : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
                    }`}
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Section 4: Monthly Results ────────────────── */}
      <section>
        <h2 className="text-[22px] font-semibold text-white mb-4">
          This month&apos;s results
        </h2>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {MONTHLY_METRICS.map((metric) => (
            <div key={metric.label} className="card-elevated p-5 text-center">
              <svg
                className="mx-auto mb-3 h-6 w-6 text-zinc-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d={metric.icon}
                />
              </svg>
              <p className="text-[22px] font-semibold text-white tabular-nums">
                {metric.value}
              </p>
              <p className="mt-1 text-[12px] text-zinc-500">{metric.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
