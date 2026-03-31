"use client";

import { useState, useCallback, useEffect, useRef } from "react";

// ─── Scenario: CloudSync SaaS selling to TechVista ───────────────

interface SimMessage {
  from: "agent" | "prospect" | "system";
  name: string;
  content: string;
  channel?: string;
  time: string;
}

interface SimStage {
  id: string;
  pipelineStage: string;
  title: string;
  subtitle: string;
  agentThinking: string;
  messages: SimMessage[];
  metrics?: { label: string; value: string }[];
  duration: string;
}

const SCENARIO: SimStage[] = [
  {
    id: "setup",
    pipelineStage: "Setup",
    title: "Customer Onboarding",
    subtitle: "CloudSync founder tells PalUp about their product",
    agentThinking: "Ingesting product knowledge: CloudSync is a project management SaaS for mid-size teams (50-500 employees). Key features: real-time collaboration, Gantt charts, resource allocation, Jira/Slack integration. Pricing: $15/user/month. ICP: VP of Ops or CTO at tech companies with 100-500 employees. Building ICP model and preparing outreach templates.",
    messages: [
      { from: "prospect", name: "You (CloudSync founder)", content: "I sell a project management tool called CloudSync. Target audience is mid-size tech companies. $15/user/month. We integrate with Jira and Slack. Our main differentiator is real-time resource allocation.", channel: "Platform", time: "Day 1, 09:00" },
      { from: "system", name: "PalUp", content: "Product knowledge ingested. ICP model built: targeting VP of Operations / CTO at tech companies with 100-500 employees in US/CA. Competitive landscape mapped (Asana, Monday.com, ClickUp). 3 outreach templates generated. Ready to prospect.", channel: "Platform", time: "Day 1, 09:02" },
    ],
    duration: "2 min",
  },
  {
    id: "prospect",
    pipelineStage: "Lead",
    title: "Prospect Identified",
    subtitle: "Prospecting Agent found a high-ICP match",
    agentThinking: "Searched Apollo.io for companies matching ICP: tech industry, 100-500 employees, US-based, using Jira (signals alignment with our integration). Found TechVista Inc (180 employees, Series B, $22M ARR). VP of Operations: Maya Chen — she posted on LinkedIn last week about 'project visibility challenges'. This is a high-intent signal. ICP score: 94/100.",
    messages: [
      { from: "agent", name: "Prospecting Agent", content: "High-value prospect identified:\n\nCompany: TechVista Inc\nSize: 180 employees\nARR: ~$22M (Series B)\nTech stack: Jira, Slack, AWS\nICP Score: 94/100\n\nContact: Maya Chen, VP of Operations\nLinkedIn signal: Posted about 'project visibility challenges across 6 teams' 5 days ago.\n\nRecommendation: Prioritize outreach. Pain point aligns directly with CloudSync's real-time resource allocation feature.", channel: "Internal", time: "Day 1, 10:15" },
    ],
    metrics: [
      { label: "ICP Score", value: "94/100" },
      { label: "Intent Signal", value: "LinkedIn post" },
      { label: "Company Size", value: "180 employees" },
    ],
    duration: "1 hr",
  },
  {
    id: "outreach",
    pipelineStage: "Lead",
    title: "First Outreach",
    subtitle: "Outreach Agent sends personalized cold email",
    agentThinking: "Using value-first subject line pattern (31% open rate from A/B test data). Referencing Maya's LinkedIn post about project visibility — this makes the email feel researched, not generic. Keeping under 120 words. CTA: soft ask for a 15-min call, not a hard demo push. Sending at 9:15 AM ET (Maya's timezone, optimal open window).",
    messages: [
      { from: "agent", name: "Outreach Agent", content: "To: maya.chen@techvista.com\nSubject: Solving project visibility across 6 teams\n\nHi Maya,\n\nI saw your post about the challenge of maintaining project visibility across TechVista's 6 teams — it resonated because that's exactly what CloudSync was built to solve.\n\nWe help companies like TechVista see real-time resource allocation across all teams in one view. Since you're already on Jira and Slack, CloudSync plugs right in without disrupting existing workflows.\n\nTeams our size typically see 40% fewer status meetings within the first month.\n\nWould a 15-minute call this week make sense to see if there's a fit?\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 1, 09:15 ET" },
    ],
    duration: "15 min",
  },
  {
    id: "reply",
    pipelineStage: "Qualified",
    title: "Prospect Replied",
    subtitle: "Maya responds with interest — Agent qualifies in real-time",
    agentThinking: "Positive reply detected within 4 hours (high intent signal). Maya mentioned a specific pain point ('Jira alone isn't cutting it') and a timeline ('evaluating tools this quarter'). Auto-qualifying: Budget likely (Series B, $22M ARR), Authority (VP level), Need (confirmed pain), Timeline (this quarter). BANT score: 85. Responding within 3 minutes to maintain momentum. Asking discovery questions naturally, not as a checklist.",
    messages: [
      { from: "prospect", name: "Maya Chen", content: "Hi,\n\nThanks for reaching out — your timing is actually great. We've been struggling with exactly this. Jira alone isn't cutting it for cross-team visibility, and our weekly status meetings are eating everyone's time.\n\nWe're evaluating tools this quarter. I'd be open to a quick call.\n\nWhat does your calendar look like next week?\n\nMaya", channel: "Email", time: "Day 1, 13:22 ET" },
      { from: "agent", name: "Sales Agent", content: "Hi Maya,\n\nGreat to hear from you — and glad the timing works!\n\nBefore we hop on a call, it'd help me tailor the conversation: roughly how many people would be using this across your 6 teams? And is there a specific frustration (missed deadlines, resource conflicts, reporting gaps) that's driving the evaluation?\n\nFor scheduling, I have availability:\n• Tuesday 2-3 PM ET\n• Wednesday 10-11 AM ET\n• Thursday 3-4 PM ET\n\nWhichever works best for you.\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 1, 13:25 ET" },
    ],
    metrics: [
      { label: "Response Time", value: "3 min" },
      { label: "BANT Score", value: "85/100" },
      { label: "Sentiment", value: "Positive" },
    ],
    duration: "3 min response",
  },
  {
    id: "discovery",
    pipelineStage: "Qualified",
    title: "Discovery & Qualification",
    subtitle: "Agent uncovers key details for demo preparation",
    agentThinking: "Maya confirmed 120 users, $50K budget approved, and the main pain is resource conflicts between teams. This deal is worth $1,800/month ($21,600/year). She's the decision maker but needs CTO sign-off for security review. Mapping buying committee: Maya (champion), David Park (CTO, technical approver). Preparing demo content focused on: real-time resource view, Jira sync, and the 'fewer meetings' ROI angle.",
    messages: [
      { from: "prospect", name: "Maya Chen", content: "Good questions. We'd be looking at around 120 users across the 6 teams. The biggest pain is resource conflicts — two teams will unknowingly assign the same engineer to different projects, and we don't find out until someone misses a deadline.\n\nOur budget for this is around $50K/year. I make the call on ops tools, but our CTO David Park will want to review the security and integration side.\n\nLet's do Wednesday 10 AM.\n\nMaya", channel: "Email", time: "Day 1, 17:10 ET" },
      { from: "system", name: "PalUp", content: "Deal created: TechVista — CloudSync\nStage: Qualified\nAmount: $21,600/yr (120 users x $15/mo)\nChampion: Maya Chen (VP Ops)\nTechnical Approver: David Park (CTO)\nKey pain: Resource conflicts across teams\nBudget: $50K approved\nTimeline: This quarter\nDemo: Wednesday 10 AM ET", channel: "Internal", time: "Day 1, 17:11 ET" },
    ],
    metrics: [
      { label: "Deal Size", value: "$21,600/yr" },
      { label: "Users", value: "120" },
      { label: "Decision Maker", value: "Maya Chen" },
    ],
    duration: "4 hrs",
  },
  {
    id: "demo",
    pipelineStage: "Demo",
    title: "Demo Delivered",
    subtitle: "Demo Agent runs a tailored 20-min product demo",
    agentThinking: "Demo customized for TechVista: showing real-time resource allocation view with 6 simulated teams, demonstrating how Jira sync surfaces conflicts automatically, and presenting the ROI calculator (projected savings: 8 hours/week in status meetings x 120 people = $150K/year in time saved). Maya asked about SSO and SOC 2 — flagging for David Park follow-up. Demo went well: Maya said 'this is exactly what I've been looking for.'",
    messages: [
      { from: "agent", name: "Demo Agent", content: "Demo completed: TechVista — CloudSync\n\nAttendees: Maya Chen, + 2 team leads\nDuration: 22 minutes\n\nKey moments:\n• Real-time resource view → Maya: 'This would have saved us last month'\n• Jira conflict detection → Team lead: 'We need this yesterday'\n• ROI calculator → Projected $150K/yr in time savings\n\nQuestions raised:\n• SSO integration (SAML) → Confirmed supported\n• SOC 2 compliance → Sending report to CTO David Park\n• Data migration from Asana → Offered free migration assistance\n\nSentiment: Very positive. Maya asked about 'next steps to get started.'", channel: "Internal", time: "Day 3, 10:22 ET" },
      { from: "agent", name: "Sales Agent", content: "Hi Maya,\n\nThanks for a great demo today — your team asked excellent questions.\n\nHere's a recap:\n\n1. CloudSync would give your 6 teams real-time resource visibility — no more double-booked engineers\n2. Jira sync runs every 5 minutes, auto-flagging conflicts\n3. Based on your team size, we're projecting ~$150K/year in recovered meeting time\n\nAs discussed, I'm sending our SOC 2 report to David separately.\n\nNext step: I'll put together a proposal tailored to TechVista's 120-user deployment. Should have it to you by Friday.\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 3, 10:35 ET" },
    ],
    duration: "22 min demo",
  },
  {
    id: "proposal",
    pipelineStage: "Proposal",
    title: "Proposal Sent",
    subtitle: "Agent generates a custom proposal with ROI analysis",
    agentThinking: "Generating proposal with TechVista-specific data: 120 users, 6 teams, Jira integration, SOC 2 compliance. Including the ROI analysis from the demo ($150K time savings vs $21,600 cost = 6.9x ROI). Offering annual commitment discount (10% off = $19,440/yr). Adding free data migration and dedicated onboarding as sweeteners. Sending to Maya with a note for David's security review.",
    messages: [
      { from: "agent", name: "Sales Agent", content: "Hi Maya,\n\nAs promised, here's the CloudSync proposal for TechVista:\n\n📋 CloudSync Business Plan — TechVista\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• 120 users across 6 teams\n• Full feature set + Jira & Slack integration\n• SSO (SAML) + SOC 2 compliant\n• Dedicated onboarding specialist\n• Free data migration from Asana\n\n💰 Pricing:\n• Monthly: $15/user/month = $1,800/month\n• Annual (10% off): $13.50/user/month = $19,440/year\n  → You save $2,160 with annual commitment\n\n📊 Projected ROI:\n• Time saved: ~8 hrs/week in status meetings\n• Annual value: ~$150K in recovered productivity\n• ROI: 6.9x your investment\n\nI've also sent the SOC 2 report directly to David.\n\nHappy to jump on a quick call if you have any questions.\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 5, 09:00 ET" },
    ],
    metrics: [
      { label: "Annual Price", value: "$19,440" },
      { label: "ROI", value: "6.9x" },
      { label: "Discount", value: "10% annual" },
    ],
    duration: "2 days",
  },
  {
    id: "objection",
    pipelineStage: "Negotiation",
    title: "Price Objection",
    subtitle: "Maya pushes back on pricing — Agent handles with data",
    agentThinking: "Maya's objection is about per-user cost, not total budget (she already confirmed $50K). Playbook says: don't offer discount first. Instead, reframe as cost-per-outcome. $19,440 / $150K saved = $0.13 returned for every $1 spent. Also comparing to alternatives: Asana Business = $24.99/user, Monday.com = $19/user. CloudSync at $13.50 is already lowest. Using the 'investment vs cost' reframe.",
    messages: [
      { from: "prospect", name: "Maya Chen", content: "Hi,\n\nThe proposal looks good overall. My one concern is the per-user pricing — $13.50/user adds up quickly as we grow. We're planning to hire 40 more people next quarter.\n\nIs there flexibility on pricing for a larger deployment?\n\nMaya", channel: "Email", time: "Day 6, 14:30 ET" },
      { from: "agent", name: "Sales Agent", content: "Hi Maya,\n\nTotally fair question — and it's great that you're thinking ahead to the team growth.\n\nA few things worth considering:\n\n1. At $13.50/user, CloudSync is already 46% less than Asana Business ($24.99) and 29% less than Monday.com ($19) for comparable features.\n\n2. With 160 users (current 120 + 40 new hires), your projected time savings grow to ~$200K/year — meaning every $1 spent returns $7.80.\n\n3. For deployments over 150 users, we offer a volume tier: $12/user/month on an annual plan. That brings your total to $23,040/year for 160 users.\n\nWould the volume tier work better for your planning?\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 6, 14:38 ET" },
    ],
    metrics: [
      { label: "Objection Type", value: "Price/Growth" },
      { label: "Strategy", value: "Value reframe" },
      { label: "Response Time", value: "8 min" },
    ],
    duration: "8 min response",
  },
  {
    id: "close",
    pipelineStage: "Closed Won",
    title: "Deal Closed",
    subtitle: "Maya signs the annual contract",
    agentThinking: "Maya accepted the volume tier ($12/user). David Park approved after reviewing SOC 2 report. Generating contract with approved terms: 160 users, $12/user/month, annual billing, $23,040/year. Sending via DocuSign. Setting up auto-reminder if not signed within 48 hours. Preparing onboarding handoff package for CS Agent.",
    messages: [
      { from: "prospect", name: "Maya Chen", content: "The volume tier works perfectly. David approved the security review. Let's go with:\n\n• 160 users\n• $12/user/month\n• Annual billing\n\nPlease send the contract and we'll get it signed this week.\n\nExcited to get started!\nMaya", channel: "Email", time: "Day 8, 11:00 ET" },
      { from: "system", name: "PalUp", content: "Contract sent via DocuSign to Maya Chen\nDeal: TechVista — CloudSync Business\nAmount: $23,040/year (160 users x $12/mo)\nContract signed: Day 8, 15:42 ET\n\n🎉 DEAL CLOSED — WON\n\nHandoff initiated: Sales Agent → Customer Success Agent\nOnboarding package prepared with: Jira integration guide, SSO setup, data migration plan, kickoff meeting agenda.", channel: "Internal", time: "Day 8, 15:42 ET" },
    ],
    metrics: [
      { label: "Deal Value", value: "$23,040/yr" },
      { label: "Cycle Time", value: "8 days" },
      { label: "Users", value: "160" },
    ],
    duration: "Signed same day",
  },
  {
    id: "onboarding",
    pipelineStage: "Onboarding",
    title: "Customer Onboarding",
    subtitle: "CS Agent sends welcome and starts onboarding",
    agentThinking: "Onboarding kickoff within 5 minutes of contract signing (fast welcome reduces Day-7 churn by 60% — learned from Evolution Agent pattern). Sending personalized welcome based on sales conversation context: Maya cares about resource visibility and Jira sync, so highlighting those in the onboarding path. Scheduling 30/60/90 day check-ins automatically.",
    messages: [
      { from: "agent", name: "Customer Success Agent", content: "Hi Maya,\n\nWelcome to CloudSync! I'm your Customer Success Agent — I'll be here to make sure TechVista gets maximum value.\n\nHere's your onboarding plan (based on your priorities):\n\n📅 Week 1:\n• Day 1: SSO (SAML) setup → I'll guide your IT team\n• Day 2-3: Jira integration → auto-syncing all 6 teams\n• Day 4-5: Data migration from Asana → we handle this for you\n\n📅 Week 2:\n• Team-by-team rollout (starting with the team Maya mentioned has the worst resource conflicts)\n• Quick training sessions (15 min each)\n\n📅 Week 3-4:\n• Full deployment to all 160 users\n• First resource visibility report\n\n🎯 Success milestone: Within 30 days, you should see resource conflicts detected automatically before they become missed deadlines.\n\nKickoff call: Tomorrow 10 AM ET? I'll bring the setup checklist.\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 8, 15:47 ET" },
    ],
    duration: "5 min after close",
  },
  {
    id: "success",
    pipelineStage: "Active Customer",
    title: "30-Day Health Check",
    subtitle: "CS Agent proactively reports results to Maya",
    agentThinking: "30-day check-in triggered. Pulling TechVista usage data: 142/160 users active (89% adoption), 47 resource conflicts auto-detected and resolved, status meetings reduced from 6/week to 2/week. Health Score: 92/100. This is a great opportunity to cement value and set up the expansion conversation. Maya's team grew faster than expected — already at 155 active users.",
    messages: [
      { from: "agent", name: "Customer Success Agent", content: "Hi Maya,\n\nIt's been 30 days since TechVista went live on CloudSync — here's your first impact report:\n\n📊 TechVista x CloudSync — 30 Day Results\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n• Active users: 142/160 (89% adoption)\n• Resource conflicts detected: 47 (auto-resolved before impact)\n• Status meetings: 6/week → 2/week (67% reduction)\n• Estimated time saved: 340 hours across all teams\n• Estimated value: ~$42,500 in recovered productivity\n\n🏆 Highlight: The engineering team caught 3 double-bookings in the first week that would have delayed the Q2 release.\n\nYour annualized ROI is tracking at 7.4x — above the 6.9x we projected.\n\nWould you be open to a quick 15-min QBR to discuss what's working and what we can optimize?\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 38, 09:00 ET" },
    ],
    metrics: [
      { label: "Adoption", value: "89%" },
      { label: "Health Score", value: "92/100" },
      { label: "ROI (actual)", value: "7.4x" },
    ],
    duration: "30 days post-close",
  },
  {
    id: "expansion",
    pipelineStage: "Expansion",
    title: "Upsell Opportunity",
    subtitle: "Agent detects growth signal and proposes expansion",
    agentThinking: "Usage data shows TechVista hired 35 new people (LinkedIn Jobs API signal + Maya mentioned Q1 hiring plan). They now have 155 active users nearing the 160 cap. Additionally, 3 users attempted to access the Analytics Pro feature (premium tier). Expansion opportunity: upgrade to 200 user cap + Analytics Pro add-on = additional $8,400/year. Approaching with ROI data, not a hard sell (company.soul.md rule: only suggest when ROI is demonstrable).",
    messages: [
      { from: "agent", name: "Customer Success Agent", content: "Hi Maya,\n\nQuick heads up — your team is at 155 active users (approaching the 160 cap). I also noticed 3 team leads tried to access Analytics Pro for cross-team reporting.\n\nGiven TechVista's growth, here's what I'd recommend:\n\n📈 Expansion Proposal:\n• Increase user cap: 160 → 200 users\n• Add Analytics Pro: cross-team dashboards + forecasting\n• New annual total: $31,440/year (+$8,400)\n\n📊 Why it makes sense:\n• You're already at 7.4x ROI on the current plan\n• Analytics Pro would give you the cross-team visibility reports you originally wanted\n• Per-user cost stays at $12/month (volume tier maintained)\n\nNo rush — happy to discuss whenever it makes sense for you.\n\nBest,\nCloudSync Team", channel: "Email", time: "Day 52, 09:00 ET" },
      { from: "prospect", name: "Maya Chen", content: "Ha, you caught us! Yes, we're growing faster than expected. The Analytics Pro dashboards look really useful — my team leads have been asking for exactly that.\n\nLet's do it. Send over the updated contract.\n\nMaya", channel: "Email", time: "Day 52, 11:15 ET" },
      { from: "system", name: "PalUp", content: "🎉 EXPANSION CLOSED\n\nTechVista upgraded: $23,040 → $31,440/year (+36.5%)\nNet Revenue Retention: 136.5%\n\nFull cycle complete:\nDay 1: Prospect identified → Day 8: Deal closed → Day 52: Expansion sold\nTotal revenue: $31,440/year from a single cold email.", channel: "Internal", time: "Day 52, 11:20 ET" },
    ],
    metrics: [
      { label: "Expansion", value: "+$8,400/yr" },
      { label: "NRR", value: "136.5%" },
      { label: "Total Revenue", value: "$31,440/yr" },
    ],
    duration: "52 days total",
  },
];

const PIPELINE_STAGES = ["Setup", "Lead", "Qualified", "Demo", "Proposal", "Negotiation", "Closed Won", "Onboarding", "Active Customer", "Expansion"];

// ─── Page Component ──────────────────────────────────────────────

export default function SimulationPage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [revealedMessages, setRevealedMessages] = useState(0);
  const autoRef = useRef(false);
  const msgRef = useRef<HTMLDivElement>(null);

  const stage = SCENARIO[currentIdx];
  const totalMessages = stage.messages.length;

  useEffect(() => {
    setRevealedMessages(0);
    // Reveal messages one by one
    let i = 0;
    const timer = setInterval(() => {
      i++;
      if (i <= totalMessages) {
        setRevealedMessages(i);
      } else {
        clearInterval(timer);
      }
    }, 800);
    return () => clearInterval(timer);
  }, [currentIdx, totalMessages]);

  useEffect(() => {
    if (msgRef.current) msgRef.current.scrollTop = msgRef.current.scrollHeight;
  }, [revealedMessages]);

  const goNext = useCallback(() => {
    if (currentIdx < SCENARIO.length - 1) setCurrentIdx(i => i + 1);
  }, [currentIdx]);

  const goPrev = useCallback(() => {
    if (currentIdx > 0) setCurrentIdx(i => i - 1);
  }, [currentIdx]);

  useEffect(() => {
    if (!isAutoPlaying) return;
    autoRef.current = true;
    const timer = setTimeout(() => {
      if (autoRef.current && currentIdx < SCENARIO.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setIsAutoPlaying(false);
      }
    }, 6000);
    return () => { clearTimeout(timer); autoRef.current = false; };
  }, [isAutoPlaying, currentIdx]);

  const isLast = currentIdx === SCENARIO.length - 1;
  const pipelineIdx = PIPELINE_STAGES.indexOf(stage.pipelineStage);

  return (
    <div className="p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Sales Cycle Simulation</h1>
          <p className="text-[13px] text-zinc-500 mt-1">CloudSync SaaS selling to TechVista — from cold email to expansion, powered by AI agents</p>
        </div>
        <a href="/dashboard" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">&larr; Dashboard</a>
      </div>

      {/* Pipeline tracker */}
      <div className="card p-4">
        <div className="flex items-center gap-0 overflow-x-auto">
          {PIPELINE_STAGES.map((s, i) => {
            const isActive = i === pipelineIdx;
            const isDone = i < pipelineIdx;
            return (
              <div key={s} className="flex items-center shrink-0">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-all duration-500 text-[10px] font-bold ${
                    isActive ? "bg-indigo-500 text-white glow-indigo scale-110"
                    : isDone ? "bg-emerald-500 text-white"
                    : "bg-zinc-800 text-zinc-600 border border-zinc-700/50"
                  }`}>
                    {isDone ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (i + 1)}
                  </div>
                  <span className={`text-[9px] whitespace-nowrap font-medium ${
                    isActive ? "text-indigo-400" : isDone ? "text-emerald-400/70" : "text-zinc-600"
                  }`}>{s}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className={`h-[2px] w-5 mt-[-14px] shrink-0 rounded ${isDone ? "bg-emerald-500/50" : isActive ? "bg-indigo-500/30" : "bg-zinc-800"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[1fr_340px] gap-6">
        {/* Left: conversation */}
        <div className="space-y-5">
          {/* Stage header */}
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-2">
              <span className="badge bg-indigo-500/10 text-indigo-400 text-[11px]">Stage {currentIdx + 1}/{SCENARIO.length}</span>
              <span className="badge bg-zinc-500/10 text-zinc-400 text-[11px]">{stage.pipelineStage}</span>
              <span className="text-[11px] text-zinc-600 tabular-nums">{stage.duration}</span>
            </div>
            <h2 className="text-[17px] font-semibold text-zinc-200">{stage.title}</h2>
            <p className="text-[13px] text-zinc-500 mt-1">{stage.subtitle}</p>
          </div>

          {/* Agent thinking */}
          <div className="card p-5 border-indigo-500/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714a2.25 2.25 0 00.659 1.591L19 14.5" />
                </svg>
              </div>
              <span className="text-[12px] font-medium text-indigo-400">Agent Reasoning</span>
            </div>
            <p className="text-[12px] text-zinc-400 leading-relaxed">{stage.agentThinking}</p>
          </div>

          {/* Messages */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-4">Conversation</h3>
            <div ref={msgRef} className="space-y-4 max-h-[500px] overflow-y-auto">
              {stage.messages.slice(0, revealedMessages).map((msg, i) => (
                <MessageBubble key={i} msg={msg} />
              ))}
              {revealedMessages < totalMessages && (
                <div className="flex items-center gap-2 text-[12px] text-zinc-500">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  typing...
                </div>
              )}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={goPrev} disabled={currentIdx === 0}
              className="flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Previous
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                className={`text-[13px] font-medium rounded-lg px-4 py-2 transition-all ${
                  isAutoPlaying ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.08]"
                }`}
              >
                {isAutoPlaying ? "Pause" : "Auto-play"}
              </button>
              <button onClick={goNext} disabled={isLast}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-white text-[13px] font-medium rounded-lg px-5 py-2 transition-all shadow-lg shadow-indigo-500/20">
                Next Step
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right: context panel */}
        <div className="space-y-5">
          {/* Deal card */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Deal Info</h3>
            <div className="space-y-2.5">
              <DealRow label="Company" value="TechVista Inc" />
              <DealRow label="Contact" value="Maya Chen, VP Ops" />
              <DealRow label="Product" value="CloudSync Business" />
              <DealRow label="Stage" value={stage.pipelineStage} badge />
              <div className="divider" />
              {currentIdx >= 4 && <DealRow label="Deal Size" value={currentIdx >= 8 ? "$31,440/yr" : currentIdx >= 7 ? "$23,040/yr" : "$21,600/yr"} highlight />}
              {currentIdx >= 4 && <DealRow label="Users" value={currentIdx >= 8 ? "200" : currentIdx >= 7 ? "160" : "120"} />}
              {currentIdx >= 1 && <DealRow label="ICP Score" value="94/100" />}
            </div>
          </div>

          {/* Stage metrics */}
          {stage.metrics && (
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Stage Metrics</h3>
              <div className="space-y-2.5">
                {stage.metrics.map(m => (
                  <div key={m.label} className="flex items-center justify-between text-[12px]">
                    <span className="text-zinc-500">{m.label}</span>
                    <span className="text-zinc-200 font-medium tabular-nums">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agent roster */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Active Agents</h3>
            <div className="space-y-2">
              {[
                { name: "Prospecting Agent", active: currentIdx <= 1 },
                { name: "Outreach Agent", active: currentIdx === 2 },
                { name: "Sales Agent", active: currentIdx >= 3 && currentIdx <= 8 },
                { name: "Demo Agent", active: currentIdx === 5 },
                { name: "CS Agent", active: currentIdx >= 9 },
              ].map(a => (
                <div key={a.name} className="flex items-center gap-2">
                  <div className={`h-[6px] w-[6px] rounded-full ${a.active ? "bg-emerald-400 animate-pulse-soft" : "bg-zinc-700"}`} />
                  <span className={`text-[12px] ${a.active ? "text-zinc-200 font-medium" : "text-zinc-600"}`}>{a.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline summary */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Timeline</h3>
            <div className="space-y-2">
              {SCENARIO.slice(0, currentIdx + 1).map((s, i) => (
                <div key={s.id} className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full flex items-center justify-center shrink-0 ${i === currentIdx ? "bg-indigo-500" : "bg-emerald-500"}`}>
                    {i < currentIdx && <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <span className={`text-[11px] ${i === currentIdx ? "text-indigo-400 font-medium" : "text-zinc-500"}`}>{s.title}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Final result */}
          {isLast && revealedMessages >= totalMessages && (
            <div className="card p-5 border-emerald-500/20 glow-emerald">
              <h3 className="text-[13px] font-semibold text-emerald-400 mb-2">Full Cycle Complete</h3>
              <div className="space-y-1.5 text-[12px]">
                <p className="text-zinc-400">From cold email to expansion in <span className="text-emerald-400 font-semibold">52 days</span></p>
                <p className="text-zinc-400">Revenue: <span className="text-emerald-400 font-semibold">$31,440/year</span></p>
                <p className="text-zinc-400">NRR: <span className="text-emerald-400 font-semibold">136.5%</span></p>
                <p className="text-zinc-400">Human intervention: <span className="text-emerald-400 font-semibold">Zero</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Components ──────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: SimMessage }) {
  const isAgent = msg.from === "agent";
  const isSystem = msg.from === "system";
  const isProspect = msg.from === "prospect";

  return (
    <div className={`flex gap-3 ${isAgent ? "" : ""}`}>
      <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 text-[11px] font-bold ${
        isAgent ? "bg-indigo-500/20 text-indigo-400"
        : isSystem ? "bg-violet-500/20 text-violet-400"
        : "bg-zinc-700 text-zinc-300"
      }`}>
        {isAgent ? "AI" : isSystem ? "P" : msg.name.charAt(0)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className={`text-[12px] font-medium ${isAgent ? "text-indigo-400" : isSystem ? "text-violet-400" : "text-zinc-300"}`}>{msg.name}</span>
          {msg.channel && <span className="badge bg-zinc-500/10 text-zinc-500 text-[10px]">{msg.channel}</span>}
          <span className="text-[10px] text-zinc-600 tabular-nums">{msg.time}</span>
        </div>
        <div className={`rounded-xl p-4 text-[12px] leading-relaxed whitespace-pre-wrap ${
          isAgent ? "bg-indigo-500/[0.06] border border-indigo-500/10 text-zinc-300"
          : isSystem ? "bg-violet-500/[0.06] border border-violet-500/10 text-zinc-300"
          : "bg-white/[0.03] border border-white/[0.06] text-zinc-300"
        }`}>
          {msg.content}
        </div>
      </div>
    </div>
  );
}

function DealRow({ label, value, badge, highlight, mono }: {
  label: string; value: string; badge?: boolean; highlight?: boolean; mono?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-zinc-500">{label}</span>
      {badge ? (
        <span className="badge bg-indigo-500/10 text-indigo-400 text-[11px]">{value}</span>
      ) : (
        <span className={`font-medium tabular-nums ${highlight ? "text-emerald-400" : "text-zinc-200"} ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
      )}
    </div>
  );
}
