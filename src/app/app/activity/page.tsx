"use client";

import { useState } from "react";

/* ─── Types ──────────────────────────────────────────────── */

type ActivityType = "outreach" | "meeting" | "proposal" | "win" | "research" | "follow-up";
type Outcome = "positive" | "pending" | null;

interface Activity {
  id: number;
  type: ActivityType;
  text: string;
  outcome: Outcome;
  time: string;
}

/* ─── Color & Icon Maps ──────────────────────────────────── */

const BORDER_COLORS: Record<ActivityType, string> = {
  outreach: "border-l-blue-500",
  meeting: "border-l-violet-500",
  proposal: "border-l-amber-500",
  win: "border-l-emerald-500",
  research: "border-l-zinc-500",
  "follow-up": "border-l-blue-400",
};

const ICONS: Record<ActivityType, string> = {
  outreach: "\u2709\uFE0F",
  meeting: "\uD83D\uDCC5",
  proposal: "\uD83D\uDCC4",
  win: "\uD83C\uDF89",
  research: "\uD83D\uDD0D",
  "follow-up": "\u21A9\uFE0F",
};

const FILTER_PILLS = [
  { label: "All", value: "all" },
  { label: "Outreach", value: "outreach" },
  { label: "Meetings", value: "meeting" },
  { label: "Proposals", value: "proposal" },
  { label: "Follow-ups", value: "follow-up" },
] as const;

/* ─── Demo Data ──────────────────────────────────────────── */

interface DayGroup {
  label: string;
  activities: Activity[];
}

const ACTIVITY_DATA: DayGroup[] = [
  {
    label: "Today",
    activities: [
      {
        id: 1,
        type: "outreach",
        text: "Sent personalized email to Ryan Cooper at Coastal Brands about their Shopify migration",
        outcome: "pending",
        time: "2 hours ago",
      },
      {
        id: 2,
        type: "follow-up",
        text: "Followed up with Marcus Johnson at GreenLeaf Commerce about the proposal we sent Tuesday",
        outcome: null,
        time: "3 hours ago",
      },
      {
        id: 3,
        type: "meeting",
        text: "Scheduled a demo with DataPulse Analytics for April 1st at 2pm ET (Emily + 2 team members)",
        outcome: "positive",
        time: "4 hours ago",
      },
    ],
  },
  {
    label: "Yesterday",
    activities: [
      {
        id: 4,
        type: "proposal",
        text: "Sent revised pricing proposal to TechFlow Inc with 10% volume discount \u2014 Sarah opened it twice",
        outcome: "positive",
        time: "Yesterday, 4:12 PM",
      },
      {
        id: 5,
        type: "follow-up",
        text: "Alex Novak at CloudNine confirmed legal review is in progress, expects feedback by Apr 2",
        outcome: "pending",
        time: "Yesterday, 2:30 PM",
      },
      {
        id: 6,
        type: "outreach",
        text: "Sent pre-demo prep email to PixelForge Studios about indie dev workflow",
        outcome: null,
        time: "Yesterday, 11:05 AM",
      },
      {
        id: 7,
        type: "research",
        text: "Researched 12 new companies matching your target profile",
        outcome: "positive",
        time: "Yesterday, 9:00 AM",
      },
    ],
  },
  {
    label: "2 days ago",
    activities: [
      {
        id: 8,
        type: "win",
        text: "Deal closed! NorthStar Consulting signed 12-month contract ($36,000/yr)",
        outcome: "positive",
        time: "2 days ago, 3:45 PM",
      },
      {
        id: 9,
        type: "outreach",
        text: "Sent welcome email and onboarding materials to NorthStar",
        outcome: null,
        time: "2 days ago, 4:10 PM",
      },
      {
        id: 10,
        type: "meeting",
        text: "Discovery call with Apex Manufacturing \u2014 identified pain points: manual quoting, slow RFP response",
        outcome: "positive",
        time: "2 days ago, 1:00 PM",
      },
      {
        id: 11,
        type: "proposal",
        text: "Sent CFO-specific ROI deck to DataPulse (requested by Emily Rodriguez)",
        outcome: "pending",
        time: "2 days ago, 10:30 AM",
      },
    ],
  },
  {
    label: "3 days ago",
    activities: [
      {
        id: 12,
        type: "outreach",
        text: "Cold outreach to Harvest Kitchen with F&B-specific value proposition",
        outcome: "pending",
        time: "3 days ago, 2:15 PM",
      },
      {
        id: 13,
        type: "follow-up",
        text: "Follow-up #2 to BrightPath Education about AI-driven enrollment ROI",
        outcome: "pending",
        time: "3 days ago, 11:40 AM",
      },
      {
        id: 14,
        type: "outreach",
        text: "Case study email sent to MindBridge AI \u2014 they opened it 3 times in 2 hours!",
        outcome: "positive",
        time: "3 days ago, 9:20 AM",
      },
    ],
  },
];

/* ─── Component ──────────────────────────────────────────── */

export default function ActivityPage() {
  const [filter, setFilter] = useState<string>("all");

  const filteredData = ACTIVITY_DATA.map((group) => ({
    ...group,
    activities: group.activities.filter(
      (a) => filter === "all" || a.type === filter
    ),
  })).filter((g) => g.activities.length > 0);

  return (
    <div className="space-y-8">
      {/* ─── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Activity</h1>
        <p className="mt-2 text-lg text-zinc-400">
          Everything your AI sales team has been doing
        </p>
      </div>

      {/* ─── Filter Pills ───────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {FILTER_PILLS.map((pill) => (
          <button
            key={pill.value}
            onClick={() => setFilter(pill.value)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
              filter === pill.value
                ? "bg-indigo-500/20 text-indigo-300 glow-indigo"
                : "bg-white/[0.04] text-zinc-400 hover:bg-white/[0.08] hover:text-zinc-200"
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      <div className="divider" />

      {/* ─── Activity Feed ──────────────────────────────── */}
      <div className="space-y-8">
        {filteredData.map((group) => (
          <div key={group.label}>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-zinc-500">
              {group.label}
            </h2>
            <div className="space-y-3">
              {group.activities.map((activity) => (
                <div
                  key={activity.id}
                  className={`card border-l-[3px] ${BORDER_COLORS[activity.type]} pl-5 pr-5 py-4 flex items-start gap-3`}
                >
                  {/* Icon */}
                  <span className="mt-0.5 text-base leading-none shrink-0">
                    {ICONS[activity.type]}
                  </span>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] leading-relaxed text-zinc-200">
                      {activity.text}
                    </p>
                    <span className="mt-1.5 block text-xs text-zinc-500">
                      {activity.time}
                    </span>
                  </div>

                  {/* Outcome dot */}
                  {activity.outcome && (
                    <div className="shrink-0 mt-1.5" title={activity.outcome === "positive" ? "Positive signal" : "Waiting for response"}>
                      <div
                        className={`h-2.5 w-2.5 rounded-full ${
                          activity.outcome === "positive"
                            ? "bg-emerald-400 shadow-lg shadow-emerald-400/30"
                            : "bg-amber-400 shadow-lg shadow-amber-400/30 animate-pulse-soft"
                        }`}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="divider" />

      {/* ─── Stats Bar ──────────────────────────────────── */}
      <div className="card-elevated px-6 py-5 text-center">
        <p className="text-[15px] text-zinc-300">
          <span className="font-medium text-white">This week:</span>{" "}
          <span className="text-blue-400">34 emails sent</span>
          {" \u00B7 "}
          <span className="text-violet-400">8 meetings booked</span>
          {" \u00B7 "}
          <span className="text-emerald-400">1 deal closed ($36K)</span>
        </p>
      </div>
    </div>
  );
}
