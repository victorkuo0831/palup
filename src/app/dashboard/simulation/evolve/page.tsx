"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Evolution Cycle Simulation ──────────────────────────────────
//
// Shows a week of Auto-Evolve:
//   Day 1-7: Agents work normally, outcomes recorded
//   Monday: Evolution Agent wakes up, analyzes patterns
//   Finds: value-first subject lines 2.3x better
//   Generates new prompt variant
//   A/B tests 10% traffic for 7 days
//   Variant wins → auto-promoted
//   Metrics improve across the board

interface EvoStep {
  id: string;
  day: string;
  title: string;
  description: string;
  agentThinking: string;
  visual: "data" | "pattern" | "prompt" | "abtest" | "promote" | "result";
}

const EVO_STEPS: EvoStep[] = [
  {
    id: "collect",
    day: "Week 1 (Mon-Sun)",
    title: "Interaction Data Collection",
    description: "Agents work normally. Every outreach email, reply, meeting, and deal outcome is recorded with full context.",
    agentThinking: "Recording every interaction as a structured outcome:\n• 847 outreach emails sent\n• 58 replies received (6.8% reply rate)\n• 23 meetings booked\n• 4 proposals sent\n• 1 deal closed\n\nEach record captures: what template was used, what subject line, what time sent, recipient's ICP score, company size, industry, and the outcome (replied/ignored/unsubscribed).",
    visual: "data",
  },
  {
    id: "analyze",
    day: "Week 2, Monday 02:00 AM",
    title: "Pattern Extraction",
    description: "Evolution Agent wakes up on schedule. Analyzes past 7 days of interactions to find success/failure patterns.",
    agentThinking: "Running pattern extraction job on 847 outreach emails...\n\nGrouping by: subject_line_type × time_of_day × icp_score_range × industry\n\nStatistically significant findings:\n\n1. Subject lines starting with a specific metric ('Cut your CAC by 40%') have 15.2% reply rate vs 6.1% for question-based ('Have you considered...?') — p < 0.01\n\n2. Emails sent Tuesday-Thursday 9-10 AM local time: 9.3% reply vs 4.1% for other times — p < 0.05\n\n3. ICP score > 85 leads: 12.4% reply rate vs 3.2% for score < 85 — confirms ICP model is working\n\n4. Mentioning a specific pain point from LinkedIn: 18.7% reply rate vs 5.9% without — p < 0.01\n\nTop finding: Subject line type is the #1 controllable factor.",
    visual: "pattern",
  },
  {
    id: "generate",
    day: "Week 2, Monday 02:15 AM",
    title: "Prompt Evolution",
    description: "Evolution Agent generates a new outreach prompt variant that incorporates the discovered patterns.",
    agentThinking: "Current prompt (v3) instructs: 'Write a personalized cold email with a compelling subject line.'\n\nThis is too vague — it lets the LLM choose any subject line style. The data shows value-first subjects are 2.5x more effective.\n\nGenerating prompt v4 with specific instructions:\n1. Subject line MUST lead with a quantified value metric specific to the prospect's industry\n2. First sentence MUST reference a specific pain point from the prospect's LinkedIn/company news\n3. Send window: only queue for 9-10 AM in recipient's local timezone\n4. Skip prospects with ICP score < 75 (saves 40% of outreach capacity for negligible conversion loss)\n\nAlso updating the template refresh rule: auto-rotate templates every 7 days to prevent fatigue.",
    visual: "prompt",
  },
  {
    id: "test",
    day: "Week 2, Monday 02:20 AM",
    title: "A/B Test Deployed",
    description: "New prompt variant deployed as canary to 10% of outreach traffic. Monitor Agent watches metrics.",
    agentThinking: "A/B test configuration:\n• Control (v3): 90% of outreach traffic — current prompt, no changes\n• Variant (v4): 10% of outreach traffic — new value-first prompt\n\nTest duration: 7 days (minimum for statistical significance at this volume)\nPrimary metric: reply rate\nSecondary metrics: open rate, meeting booking rate, unsubscribe rate\nGuardrails: if variant unsubscribe rate > 2x control, auto-abort test\n\nExpected sample size: ~85 emails for variant, ~765 for control\nMinimum detectable effect: 3 percentage points at 95% confidence\n\nTest ID: AB-2026-W14-001\nStatus: RUNNING",
    visual: "abtest",
  },
  {
    id: "observe",
    day: "Week 2-3 (7-day test)",
    title: "A/B Test Running",
    description: "Both variants run in parallel. Results accumulate day by day.",
    agentThinking: "Day-by-day results:\n\nDay 1: Control 6.2% reply (48 emails) | Variant 11.1% reply (9 emails) — too early to call\nDay 2: Control 7.0% cumulative | Variant 13.3% — trending positive, not significant yet\nDay 3: Control 6.8% | Variant 12.8% — p = 0.08 (approaching significance)\nDay 4: Control 6.5% | Variant 14.1% — p = 0.03 (significant!)\nDay 5: Control 6.7% | Variant 13.6% — p = 0.02\nDay 6: Control 6.6% | Variant 13.9% — p = 0.01\nDay 7: Control 6.4% | Variant 14.2% — p = 0.007 (highly significant)\n\nFinal results:\n• Control: 6.4% reply rate (n=782)\n• Variant: 14.2% reply rate (n=91)\n• Improvement: +121.9%\n• Statistical significance: YES (p = 0.007)\n• Unsubscribe rate: variant 0.0% vs control 0.3% (guardrail safe)\n\nVerdict: VARIANT WINS",
    visual: "abtest",
  },
  {
    id: "promote",
    day: "Week 3, Monday 02:00 AM",
    title: "Auto-Promotion",
    description: "Variant v4 statistically significant. Evolution Agent promotes it to 100% traffic.",
    agentThinking: "Promotion checklist:\n\n✓ Statistical significance: p = 0.007 (threshold: 0.05)\n✓ Improvement > 5%: +121.9% (threshold: 5%)\n✓ Guardrail check: unsubscribe rate safe\n✓ Sample size adequate: 91 variant emails (minimum: 50)\n✓ No degradation in secondary metrics\n✓ Auto-fix budget: 3/5 proposals this week\n\nPromoting v4 to active:\n1. Set v4 canary_percent = 100%\n2. Set v3 status = retired\n3. Log promotion event in prompt_versions table\n4. Notify deployment pipeline (no container rebuild needed — prompt-only change)\n\nv4 is now the active prompt for all outreach emails.\n\nAlso generating evolution proposal: 'Raise ICP threshold from 65 to 75 to focus outreach capacity on high-conversion leads' — queued for next week's review.",
    visual: "promote",
  },
  {
    id: "result",
    day: "Week 4 (post-evolution)",
    title: "Impact Measured",
    description: "One week after promotion. Full-traffic results confirm the improvement.",
    agentThinking: "Full-traffic results after 1 week on v4:\n\n                    BEFORE (v3)    AFTER (v4)     CHANGE\nReply rate           6.4%          13.8%          +115.6%\nOpen rate           22.1%          34.6%          +56.6%\nMeeting booking      2.7%           5.4%          +100.0%\nAvg response time     -             -              (unchanged)\nUnsubscribe rate     0.3%           0.1%          -66.7%\n\nDownstream impact:\n• Meetings booked/week: 23 → 46 (+100%)\n• Pipeline generated/week: $84K → $168K (+100%)\n• Projected ARR impact: +$672K/year\n\nCost of evolution: $0 (automated, no human time)\nTime to impact: 2 weeks (1 week test + 1 week full traffic)\n\nPattern stored: 'Value-first subject lines with quantified metrics outperform generic subject lines by 2x+'\nThis pattern will inform all future prompt generations.",
    visual: "result",
  },
];

// ─── Data for visualizations ─────────────────────────────────────

const WEEKLY_DATA = [
  { day: "Mon", sent: 132, replied: 9, rate: 6.8 },
  { day: "Tue", sent: 148, replied: 14, rate: 9.5 },
  { day: "Wed", sent: 141, replied: 12, rate: 8.5 },
  { day: "Thu", sent: 138, replied: 10, rate: 7.2 },
  { day: "Fri", sent: 115, replied: 6, rate: 5.2 },
  { day: "Sat", sent: 42, replied: 2, rate: 4.8 },
  { day: "Sun", sent: 31, replied: 1, rate: 3.2 },
];

const PATTERN_DATA = [
  { pattern: "Value-first subject line", replyRate: 15.2, count: 187, color: "emerald" },
  { pattern: "Question-based subject", replyRate: 6.1, count: 298, color: "zinc" },
  { pattern: "Name-drop subject", replyRate: 8.4, count: 142, color: "zinc" },
  { pattern: "Curiosity gap subject", replyRate: 7.3, count: 220, color: "zinc" },
];

const AB_DAILY = [
  { day: 1, control: 6.2, variant: 11.1 },
  { day: 2, control: 7.0, variant: 13.3 },
  { day: 3, control: 6.8, variant: 12.8 },
  { day: 4, control: 6.5, variant: 14.1 },
  { day: 5, control: 6.7, variant: 13.6 },
  { day: 6, control: 6.6, variant: 13.9 },
  { day: 7, control: 6.4, variant: 14.2 },
];

// ─── Page ────────────────────────────────────────────────────────

export default function EvolvePage() {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const step = EVO_STEPS[currentIdx];

  useEffect(() => {
    if (!isPlaying) return;
    const t = setTimeout(() => {
      if (currentIdx < EVO_STEPS.length - 1) {
        setCurrentIdx(i => i + 1);
      } else {
        setIsPlaying(false);
      }
    }, 8000);
    return () => clearTimeout(t);
  }, [isPlaying, currentIdx]);

  return (
    <div className="p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Auto-Evolve Simulation</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Watch the Evolution Agent learn from data, generate a better prompt, A/B test it, and auto-promote the winner</p>
        </div>
        <a href="/dashboard/autonomy" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">&larr; Back</a>
      </div>

      {/* Timeline stepper */}
      <div className="card p-4">
        <div className="flex items-center gap-0 overflow-x-auto">
          {EVO_STEPS.map((s, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <div key={s.id} className="flex items-center shrink-0">
                <button onClick={() => setCurrentIdx(i)} className="flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                    active ? "bg-indigo-500 glow-indigo scale-110" : done ? "bg-emerald-500" : "bg-zinc-800 border border-zinc-700/50 group-hover:border-zinc-600"
                  }`}>
                    {done ? (
                      <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                    ) : (
                      <span className={`text-[11px] font-bold ${active ? "text-white" : "text-zinc-600"}`}>{i + 1}</span>
                    )}
                  </div>
                  <span className={`text-[9px] whitespace-nowrap font-medium max-w-[80px] text-center leading-tight ${
                    active ? "text-indigo-400" : done ? "text-emerald-400/70" : "text-zinc-600"
                  }`}>{s.title}</span>
                </button>
                {i < EVO_STEPS.length - 1 && (
                  <div className={`h-[2px] w-4 mt-[-16px] shrink-0 rounded ${done ? "bg-emerald-500/50" : "bg-zinc-800"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-[1fr_380px] gap-6">
        {/* Left */}
        <div className="space-y-5">
          {/* Step info */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="badge bg-indigo-500/10 text-indigo-400 text-[11px]">{step.day}</span>
              <span className="badge bg-zinc-500/10 text-zinc-400 text-[11px]">Step {currentIdx + 1}/{EVO_STEPS.length}</span>
            </div>
            <h2 className="text-[17px] font-semibold text-zinc-200">{step.title}</h2>
            <p className="text-[13px] text-zinc-500 mt-1">{step.description}</p>
          </div>

          {/* Visualization area */}
          <div className="card p-6">
            {step.visual === "data" && <DataCollectionViz />}
            {step.visual === "pattern" && <PatternViz />}
            {step.visual === "prompt" && <PromptDiffViz />}
            {step.visual === "abtest" && <ABTestViz step={currentIdx} />}
            {step.visual === "promote" && <PromotionViz />}
            {step.visual === "result" && <ResultViz />}
          </div>

          {/* Agent reasoning */}
          <div className="card p-5 border-indigo-500/10">
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <svg className="h-3.5 w-3.5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0" />
                </svg>
              </div>
              <span className="text-[12px] font-medium text-indigo-400">Evolution Agent Reasoning</span>
            </div>
            <pre className="text-[12px] text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.02] rounded-xl p-4 max-h-[300px] overflow-y-auto">
              {step.agentThinking}
            </pre>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentIdx(i => Math.max(0, i - 1))} disabled={currentIdx === 0}
              className="flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
              Previous
            </button>
            <div className="flex gap-2">
              <button onClick={() => setIsPlaying(!isPlaying)}
                className={`text-[13px] font-medium rounded-lg px-4 py-2 transition-all ${isPlaying ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-white/[0.04] text-zinc-400 border border-white/[0.08] hover:bg-white/[0.08]"}`}>
                {isPlaying ? "Pause" : "Auto-play"}
              </button>
              <button onClick={() => setCurrentIdx(i => Math.min(EVO_STEPS.length - 1, i + 1))} disabled={currentIdx === EVO_STEPS.length - 1}
                className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-[13px] font-medium rounded-lg px-5 py-2 transition-all shadow-lg shadow-indigo-500/20">
                Next <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
              </button>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-5">
          {/* Evolution cycle */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Evolution Cycle</h3>
            <div className="space-y-2">
              {["Collect Data", "Extract Patterns", "Generate Variant", "Deploy A/B Test", "Observe Results", "Auto-Promote", "Measure Impact"].map((s, i) => {
                const done = i < currentIdx;
                const active = i === currentIdx;
                return (
                  <div key={s} className="flex items-center gap-2.5">
                    <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                      done ? "bg-emerald-500" : active ? "bg-indigo-500 animate-pulse-soft" : "bg-zinc-800 border border-zinc-700"
                    }`}>
                      {done && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                    </div>
                    <span className={`text-[12px] ${done ? "text-emerald-400" : active ? "text-indigo-400 font-medium" : "text-zinc-600"}`}>{s}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Key numbers */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Key Numbers</h3>
            <div className="space-y-2.5">
              <KV label="Emails analyzed" value="847" />
              <KV label="Patterns found" value="4" />
              <KV label="Top pattern lift" value="+149%" highlight />
              <KV label="Test duration" value="7 days" />
              <KV label="Test result" value={currentIdx >= 4 ? "Variant wins" : currentIdx >= 3 ? "Running..." : "Pending"} highlight={currentIdx >= 4} />
              <div className="divider" />
              <KV label="Human involvement" value="Zero" />
              <KV label="Cost" value="$0" />
              {currentIdx >= 6 && <KV label="Projected ARR impact" value="+$672K/yr" highlight />}
            </div>
          </div>

          {/* What changed */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Prompt Version</h3>
            <div className="space-y-3">
              <div className={`rounded-xl p-3 border transition-all duration-300 ${currentIdx >= 5 ? "border-zinc-700/30 opacity-50" : "border-emerald-500/20"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`h-2 w-2 rounded-full ${currentIdx >= 5 ? "bg-zinc-600" : "bg-emerald-400"}`} />
                  <span className="text-[11px] font-medium text-zinc-400">v3 {currentIdx >= 5 ? "(retired)" : "(active)"}</span>
                </div>
                <p className="text-[11px] text-zinc-500">Generic: &quot;Write a compelling subject line&quot;</p>
                <p className="text-[11px] text-zinc-600 tabular-nums mt-1">Reply rate: 6.4%</p>
              </div>
              {currentIdx >= 2 && (
                <div className={`rounded-xl p-3 border transition-all duration-500 ${
                  currentIdx >= 5 ? "border-emerald-500/20 glow-emerald" : currentIdx >= 3 ? "border-amber-500/20" : "border-indigo-500/20"
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`h-2 w-2 rounded-full ${
                      currentIdx >= 5 ? "bg-emerald-400" : "bg-amber-400 animate-pulse-soft"
                    }`} />
                    <span className="text-[11px] font-medium text-zinc-400">
                      v4 {currentIdx >= 5 ? "(active)" : currentIdx >= 3 ? "(canary 10%)" : "(draft)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500">Specific: &quot;Lead with quantified value metric&quot;</p>
                  {currentIdx >= 4 && <p className="text-[11px] text-emerald-400 tabular-nums mt-1">Reply rate: 14.2%</p>}
                </div>
              )}
            </div>
          </div>

          {/* Final card */}
          {currentIdx >= 6 && (
            <div className="card p-5 border-emerald-500/20 glow-emerald">
              <h3 className="text-[13px] font-semibold text-emerald-400 mb-2">Evolution Complete</h3>
              <div className="space-y-1.5 text-[12px]">
                <p className="text-zinc-400">Reply rate: <span className="text-zinc-500 line-through">6.4%</span> → <span className="text-emerald-400 font-semibold">13.8%</span></p>
                <p className="text-zinc-400">Meetings/week: <span className="text-zinc-500 line-through">23</span> → <span className="text-emerald-400 font-semibold">46</span></p>
                <p className="text-zinc-400">Pipeline/week: <span className="text-zinc-500 line-through">$84K</span> → <span className="text-emerald-400 font-semibold">$168K</span></p>
                <p className="text-zinc-400 mt-2">Time: <span className="text-emerald-400 font-semibold">2 weeks</span> (automated)</p>
                <p className="text-zinc-400">Cost: <span className="text-emerald-400 font-semibold">$0</span></p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Visualizations ──────────────────────────────────────────────

function DataCollectionViz() {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">Week 1: Outreach Activity</h3>
      <div className="space-y-3">
        {WEEKLY_DATA.map(d => (
          <div key={d.day} className="flex items-center gap-3">
            <span className="text-[12px] text-zinc-500 w-8 shrink-0">{d.day}</span>
            <div className="flex-1 flex items-center gap-2">
              <div className="flex-1 h-6 bg-zinc-800/50 rounded-lg overflow-hidden relative">
                <div className="h-full bg-indigo-500/30 rounded-lg transition-all" style={{ width: `${(d.sent / 150) * 100}%` }} />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-zinc-400 tabular-nums">{d.sent} sent</span>
              </div>
              <div className="w-20 text-right">
                <span className="text-[12px] font-medium tabular-nums text-zinc-300">{d.replied}</span>
                <span className="text-[10px] text-zinc-500 ml-1">replied</span>
              </div>
              <span className={`text-[11px] font-medium tabular-nums w-12 text-right ${d.rate >= 8 ? "text-emerald-400" : "text-zinc-500"}`}>{d.rate}%</span>
            </div>
          </div>
        ))}
      </div>
      <div className="divider my-4" />
      <div className="flex gap-6 text-[12px]">
        <div><span className="text-zinc-500">Total sent:</span> <span className="text-zinc-200 font-medium tabular-nums">847</span></div>
        <div><span className="text-zinc-500">Total replied:</span> <span className="text-zinc-200 font-medium tabular-nums">58</span></div>
        <div><span className="text-zinc-500">Avg reply rate:</span> <span className="text-zinc-200 font-medium tabular-nums">6.8%</span></div>
      </div>
    </div>
  );
}

function PatternViz() {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">Discovered Pattern: Subject Line Performance</h3>
      <div className="space-y-3">
        {PATTERN_DATA.map((p, i) => (
          <div key={p.pattern} className={`rounded-xl p-4 border transition-all ${i === 0 ? "border-emerald-500/20 bg-emerald-500/[0.03] glow-emerald" : "border-white/[0.04] bg-white/[0.02]"}`}>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[13px] font-medium ${i === 0 ? "text-emerald-400" : "text-zinc-400"}`}>{p.pattern}</span>
              <span className={`text-[15px] font-bold tabular-nums ${i === 0 ? "text-emerald-400" : "text-zinc-400"}`}>{p.replyRate}%</span>
            </div>
            <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
              <div className={`h-full rounded-full transition-all ${i === 0 ? "bg-emerald-400" : "bg-zinc-600"}`} style={{ width: `${(p.replyRate / 20) * 100}%` }} />
            </div>
            <p className="text-[10px] text-zinc-600 mt-1 tabular-nums">{p.count} emails sampled</p>
          </div>
        ))}
      </div>
      <p className="text-[12px] text-emerald-400 font-medium mt-4">Value-first subject lines have 2.5x higher reply rate than average</p>
    </div>
  );
}

function PromptDiffViz() {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">Prompt Change: v3 → v4</h3>
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-rose-400" />
            <span className="text-[11px] font-medium text-rose-400">v3 (current)</span>
          </div>
          <pre className="text-[11px] font-mono text-zinc-400 leading-relaxed whitespace-pre-wrap">{`Subject line:
  "Write a compelling subject"
  (no specific format)

Send time:
  Any time of day

ICP threshold:
  Score >= 65

Template refresh:
  Manual rotation`}</pre>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.02] p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span className="text-[11px] font-medium text-emerald-400">v4 (new)</span>
          </div>
          <pre className="text-[11px] font-mono text-emerald-300/80 leading-relaxed whitespace-pre-wrap">{`Subject line:
  "Lead with quantified metric"
  e.g., "Cut CAC by 40%"

Send time:
  9-10 AM recipient local

ICP threshold:
  Score >= 75 (+10)

Template refresh:
  Auto-rotate every 7 days`}</pre>
        </div>
      </div>
    </div>
  );
}

function ABTestViz({ step }: { step: number }) {
  const daysToShow = step >= 4 ? 7 : 4;
  const data = AB_DAILY.slice(0, daysToShow);
  const maxRate = 16;

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-1">A/B Test: Reply Rate Over Time</h3>
      <p className="text-[11px] text-zinc-500 mb-4">Control (v3) vs Variant (v4) — 7-day test</p>

      {/* Chart */}
      <div className="relative h-[200px] bg-white/[0.02] rounded-xl border border-white/[0.04] p-4">
        <svg viewBox="0 0 300 160" className="w-full h-full">
          {/* Grid lines */}
          {[0, 4, 8, 12, 16].map(v => {
            const y = 150 - (v / maxRate) * 140;
            return <g key={v}>
              <line x1="30" y1={y} x2="290" y2={y} stroke="rgba(255,255,255,0.04)" />
              <text x="25" y={y + 3} textAnchor="end" fill="#52525b" fontSize="9">{v}%</text>
            </g>;
          })}

          {/* Control line */}
          <polyline fill="none" stroke="#71717a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            points={data.map((d, i) => `${30 + (i / 6) * 260},${150 - (d.control / maxRate) * 140}`).join(" ")} />

          {/* Variant line */}
          <polyline fill="none" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
            points={data.map((d, i) => `${30 + (i / 6) * 260},${150 - (d.variant / maxRate) * 140}`).join(" ")} />

          {/* Dots */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={30 + (i / 6) * 260} cy={150 - (d.control / maxRate) * 140} r="3" fill="#71717a" />
              <circle cx={30 + (i / 6) * 260} cy={150 - (d.variant / maxRate) * 140} r="3.5" fill="#818cf8" />
              <text x={30 + (i / 6) * 260} y="158" textAnchor="middle" fill="#52525b" fontSize="8">D{d.day}</text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend + results */}
      <div className="flex items-center gap-6 mt-4">
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-5 rounded bg-zinc-500" />
          <span className="text-[11px] text-zinc-500">Control (v3): 6.4%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-[3px] w-5 rounded bg-indigo-500" />
          <span className="text-[11px] text-indigo-400">Variant (v4): {step >= 4 ? "14.2%" : "..."}</span>
        </div>
        {step >= 4 && (
          <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px] tabular-nums">+121.9% (p=0.007)</span>
        )}
      </div>
    </div>
  );
}

function PromotionViz() {
  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">Auto-Promotion Checklist</h3>
      <div className="space-y-3">
        {[
          { check: "Statistical significance (p < 0.05)", result: "p = 0.007", pass: true },
          { check: "Improvement > 5% threshold", result: "+121.9%", pass: true },
          { check: "Guardrail: unsubscribe rate safe", result: "0.0% vs 0.3%", pass: true },
          { check: "Sample size adequate (n >= 50)", result: "n = 91", pass: true },
          { check: "No secondary metric degradation", result: "All stable", pass: true },
          { check: "Weekly proposal budget (< 5)", result: "3/5 used", pass: true },
        ].map(item => (
          <div key={item.check} className="flex items-center gap-3 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/10 px-4 py-2.5">
            <svg className="h-4 w-4 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-[12px] text-zinc-300 flex-1">{item.check}</span>
            <span className="text-[11px] text-emerald-400 font-medium tabular-nums shrink-0">{item.result}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 rounded-xl bg-indigo-500/[0.06] border border-indigo-500/20 text-center">
        <p className="text-[13px] font-semibold text-indigo-400">v4 promoted to 100% traffic</p>
        <p className="text-[11px] text-zinc-500 mt-0.5">v3 retired. No container rebuild needed.</p>
      </div>
    </div>
  );
}

function ResultViz() {
  const metrics = [
    { label: "Reply Rate", before: "6.4%", after: "13.8%", change: "+115.6%" },
    { label: "Open Rate", before: "22.1%", after: "34.6%", change: "+56.6%" },
    { label: "Meetings / Week", before: "23", after: "46", change: "+100%" },
    { label: "Pipeline / Week", before: "$84K", after: "$168K", change: "+100%" },
    { label: "Unsubscribe Rate", before: "0.3%", after: "0.1%", change: "-66.7%" },
  ];

  return (
    <div>
      <h3 className="text-[13px] font-semibold text-zinc-200 mb-4">Full-Traffic Impact (Week 4)</h3>
      <div className="space-y-3">
        {metrics.map(m => (
          <div key={m.label} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
            <span className="text-[13px] text-zinc-400">{m.label}</span>
            <div className="flex items-center gap-3">
              <span className="text-[13px] text-zinc-600 tabular-nums line-through">{m.before}</span>
              <svg className="h-3 w-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              <span className="text-[15px] font-semibold text-emerald-400 tabular-nums">{m.after}</span>
              <span className="badge bg-emerald-500/10 text-emerald-400 text-[10px] tabular-nums">{m.change}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 p-4 rounded-xl bg-emerald-500/[0.04] border border-emerald-500/20">
        <p className="text-[14px] font-semibold text-emerald-400">Projected annual impact: +$672K ARR</p>
        <p className="text-[12px] text-zinc-500 mt-1">From a single automated prompt evolution cycle. Zero human effort. Zero cost.</p>
      </div>
    </div>
  );
}

function KV({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-zinc-500">{label}</span>
      <span className={`font-medium tabular-nums ${highlight ? "text-emerald-400" : "text-zinc-200"}`}>{value}</span>
    </div>
  );
}
