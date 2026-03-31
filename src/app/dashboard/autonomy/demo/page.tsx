"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { deals, companies, formatCurrency } from "@/lib/demo-data";

// ─── The Sales Dashboard Widget (will be broken then fixed) ──────

type BugState = "normal" | "bugged" | "fixed";

function SalesDashboardWidget({ bugState }: { bugState: BugState }) {
  const activeDeals = deals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost");
  const wonDeals = deals.filter(d => d.stage === "closed_won");

  if (bugState === "bugged") {
    // THE BUG: calculation uses wrong filter — counts ALL deals as "won"
    // and multiplies amounts by NaN due to accessing undefined property
    const buggedWonCount = deals.length; // wrong: counts all, not just won
    const buggedRevenue = deals.reduce((s, d) => {
      // @ts-expect-error accessing non-existent property causes NaN
      return s + (d.closedAmount ?? NaN);
    }, 0);
    const buggedWinRate = (buggedWonCount / 0) * 100; // division by zero = Infinity

    return (
      <div className="grid grid-cols-3 gap-4">
        <WidgetMetric label="Won Deals" value={`${buggedWonCount}`} normal="1" bug />
        <WidgetMetric label="Revenue" value={isNaN(buggedRevenue) ? "NaN" : formatCurrency(buggedRevenue)} normal={formatCurrency(wonDeals.reduce((s, d) => s + d.amount, 0))} bug />
        <WidgetMetric label="Win Rate" value={buggedWinRate === Infinity ? "Infinity%" : `${buggedWinRate.toFixed(1)}%`} normal="34%" bug />
      </div>
    );
  }

  if (bugState === "fixed") {
    // THE FIX: correct filter + null-safe property access + division guard
    const wonCount = wonDeals.length;
    const revenue = wonDeals.reduce((s, d) => s + (d.amount ?? 0), 0); // null-safe
    const winRate = deals.length > 0 ? (wonCount / deals.length) * 100 : 0; // division guard

    return (
      <div className="grid grid-cols-3 gap-4">
        <WidgetMetric label="Won Deals" value={`${wonCount}`} fixed />
        <WidgetMetric label="Revenue" value={formatCurrency(revenue)} fixed />
        <WidgetMetric label="Win Rate" value={`${winRate.toFixed(1)}%`} fixed />
      </div>
    );
  }

  // Normal state
  const wonCount = wonDeals.length;
  const revenue = wonDeals.reduce((s, d) => s + d.amount, 0);
  const winRate = deals.length > 0 ? (wonCount / deals.length) * 100 : 0;

  return (
    <div className="grid grid-cols-3 gap-4">
      <WidgetMetric label="Won Deals" value={`${wonCount}`} />
      <WidgetMetric label="Revenue" value={formatCurrency(revenue)} />
      <WidgetMetric label="Win Rate" value={`${winRate.toFixed(1)}%`} />
    </div>
  );
}

function WidgetMetric({ label, value, normal, bug, fixed }: {
  label: string; value: string; normal?: string; bug?: boolean; fixed?: boolean;
}) {
  return (
    <div className={`rounded-xl p-4 transition-all duration-500 ${
      bug ? "bg-rose-500/[0.06] border border-rose-500/30 glow-rose"
      : fixed ? "bg-emerald-500/[0.06] border border-emerald-500/30 glow-emerald"
      : "bg-white/[0.03] border border-white/[0.06]"
    }`}>
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{label}</p>
      <p className={`text-[22px] font-bold tracking-tight tabular-nums mt-1 ${
        bug ? "text-rose-400" : fixed ? "text-emerald-400" : "text-zinc-200"
      }`}>
        {value}
      </p>
      {bug && normal && (
        <p className="text-[11px] text-rose-400/60 mt-1">Expected: {normal}</p>
      )}
      {fixed && (
        <div className="flex items-center gap-1 mt-1">
          <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-[11px] text-emerald-400/70">Corrected</span>
        </div>
      )}
    </div>
  );
}

// ─── Deal Table (will show wrong assignments when bugged) ────────

function DealTable({ bugState }: { bugState: BugState }) {
  const topDeals = deals.filter(d => d.stage !== "closed_won" && d.stage !== "closed_lost").slice(0, 5);

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06]">
      <table className="w-full text-[13px]">
        <thead>
          <tr className="bg-white/[0.02] border-b border-white/[0.04]">
            <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Company</th>
            <th className="text-left px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Stage</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Amount</th>
            <th className="text-right px-4 py-2.5 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">Agent</th>
          </tr>
        </thead>
        <tbody>
          {topDeals.map((deal, i) => {
            const company = companies.find(c => c.id === deal.companyId);

            // Bug: agents get shuffled/wrong, amounts get corrupted
            const buggedAgent = bugState === "bugged"
              ? ["[undefined]", "null", "Agent_NaN", "ERROR", "???"][i % 5]
              : deal.assignedAgent;
            const buggedAmount = bugState === "bugged"
              ? deal.amount * -1 // negative amounts!
              : deal.amount;
            const isFixed = bugState === "fixed";

            return (
              <tr key={deal.id} className={`border-b border-white/[0.04] transition-all duration-300 ${
                bugState === "bugged" ? "bg-rose-500/[0.02]" : isFixed ? "bg-emerald-500/[0.02]" : "hover:bg-white/[0.02]"
              }`}>
                <td className="px-4 py-2.5 text-zinc-200">{company?.name}</td>
                <td className="px-4 py-2.5">
                  <span className="badge bg-zinc-500/10 text-zinc-400 text-[11px]">{deal.stage.replace(/_/g, " ")}</span>
                </td>
                <td className={`px-4 py-2.5 text-right tabular-nums font-medium ${
                  bugState === "bugged" ? "text-rose-400" : isFixed ? "text-emerald-400" : "text-zinc-200"
                }`}>
                  {formatCurrency(buggedAmount)}
                </td>
                <td className={`px-4 py-2.5 text-right text-[12px] ${
                  bugState === "bugged" ? "text-rose-400 font-mono" : "text-zinc-400"
                }`}>
                  {buggedAgent}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Debug Step Definitions ──────────────────────────────────────

interface DebugStep {
  id: string;
  label: string;
  duration: number;
  logs: string[];
  code?: { title: string; lines: string[] };
}

const DEBUG_STEPS: DebugStep[] = [
  {
    id: "detect",
    label: "Anomaly Detected",
    duration: 1800,
    logs: [
      "Monitor Agent health check triggered",
      "ANOMALY: Won Deals = 12 (expected: 1) — data integrity violation",
      "ANOMALY: Revenue = NaN — calculation error",
      "ANOMALY: Win Rate = Infinity% — division by zero",
      "ANOMALY: Deal table shows negative amounts and null agents",
      "Severity: CRITICAL — dashboard data corruption",
    ],
  },
  {
    id: "analyze",
    label: "Root Cause Analysis",
    duration: 2800,
    logs: [
      "Debug Agent analyzing SalesDashboardWidget source...",
      "Line 18: deals.length returns ALL deals (12), not filtered won deals (1)",
      "Line 20: d.closedAmount is undefined — property doesn't exist, should be d.amount",
      "Line 22: division by 0 — missing guard clause",
      "Line 45: DealTable agent assignment reads from corrupted index",
      "Root cause: wrong filter logic + undefined property access + missing null guards",
      "Confidence: 94%",
    ],
    code: {
      title: "Broken Code — SalesDashboardWidget",
      lines: [
        "// BUG 1: counts ALL deals, not just won deals",
        "- const buggedWonCount = deals.length;",
        "",
        "// BUG 2: accesses d.closedAmount (doesn't exist) → NaN",
        "- return s + (d.closedAmount ?? NaN);",
        "",
        "// BUG 3: divides by 0 → Infinity",
        "- const buggedWinRate = (buggedWonCount / 0) * 100;",
      ],
    },
  },
  {
    id: "fix",
    label: "Fix Generated",
    duration: 2200,
    logs: [
      "Generating fix...",
      "Fix 1: Filter deals by stage === 'closed_won' before counting",
      "Fix 2: Use d.amount instead of d.closedAmount, add ?? 0 null guard",
      "Fix 3: Add deals.length > 0 guard before division",
      "Fix 4: Restore correct agent assignments in DealTable",
    ],
    code: {
      title: "Proposed Fix",
      lines: [
        "// FIX 1: correct filter",
        "+ const wonCount = deals.filter(d => d.stage === 'closed_won').length;",
        "",
        "// FIX 2: correct property + null guard",
        "+ return s + (d.amount ?? 0);",
        "",
        "// FIX 3: division guard",
        "+ const winRate = deals.length > 0 ? (wonCount / deals.length) * 100 : 0;",
      ],
    },
  },
  {
    id: "validate",
    label: "Fix Validated",
    duration: 1800,
    logs: [
      "Running validation...",
      "  TypeScript type check: PASS",
      "  Unit test — Won Deals count: PASS (expected 1, got 1)",
      "  Unit test — Revenue calculation: PASS (expected $36,000, got $36,000)",
      "  Unit test — Win Rate: PASS (expected 8.3%, got 8.3%)",
      "  Unit test — no NaN/Infinity: PASS",
      "  Regression — other components: PASS",
      "All 6 checks passed. Safe to deploy.",
    ],
  },
  {
    id: "deploy",
    label: "Hot Fix Applied",
    duration: 2000,
    logs: [
      "Applying fix to SalesDashboardWidget...",
      "Swapping bugged calculation with corrected version",
      "Restoring DealTable agent assignments",
      "Component re-rendering...",
    ],
  },
  {
    id: "verify",
    label: "Fix Verified",
    duration: 1800,
    logs: [
      "Post-fix verification:",
      "  Won Deals: 12 → 1 ✓ (correct)",
      "  Revenue: NaN → $36,000 ✓ (correct)",
      "  Win Rate: Infinity → 8.3% ✓ (correct)",
      "  Deal amounts: all positive ✓",
      "  Agent assignments: all valid ✓",
      "",
      "Dashboard data integrity restored.",
      "Pattern logged: 'Always filter before aggregating, guard divisions, validate property names'",
    ],
  },
];

// ─── Main Demo Page ──────────────────────────────────────────────

export default function AutoDebugDemoPage() {
  const [bugState, setBugState] = useState<BugState>("normal");
  const [phase, setPhase] = useState<"idle" | "broken" | "debugging" | "fixed">("idle");
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<{ text: string; time: string }[]>([]);
  const [codeView, setCodeView] = useState<{ title: string; lines: string[] } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const addLog = useCallback((text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(p => [...p, { text, time }]);
  }, []);

  const injectBug = useCallback(() => {
    setBugState("bugged");
    setPhase("broken");
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setLogs([]);
    setCodeView(null);
    abortRef.current = false;
  }, []);

  const startAutoDebug = useCallback(async () => {
    setPhase("debugging");
    addLog("Auto Debug Agent activated — anomalies detected in dashboard");
    addLog("");

    for (let i = 0; i < DEBUG_STEPS.length; i++) {
      if (abortRef.current) break;
      const step = DEBUG_STEPS[i];
      setCurrentStep(i);

      addLog(`[STEP ${i + 1}/${DEBUG_STEPS.length}] ${step.label}`);

      if (step.code) setCodeView(step.code);

      for (const line of step.logs) {
        if (abortRef.current) break;
        addLog(line ? `  ${line}` : "");
        await sleep(220);
      }

      if (abortRef.current) break;
      await sleep(Math.max(0, step.duration - step.logs.length * 220));

      setCompletedSteps(prev => new Set([...prev, i]));

      // On deploy step: actually fix the widget
      if (step.id === "deploy") {
        await sleep(600);
        setBugState("fixed");
        addLog("  Dashboard widget updated — data corrected");
      }

      addLog("");
    }

    if (!abortRef.current) {
      setPhase("fixed");
      setCurrentStep(DEBUG_STEPS.length);
      addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      addLog("AUTO DEBUG/FIX COMPLETE — 6 steps, ~12 seconds, ZERO human intervention");
      addLog("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
  }, [addLog]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setBugState("normal");
    setPhase("idle");
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setLogs([]);
    setCodeView(null);
  }, []);

  return (
    <div className="p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Auto Debug/Fix — Live Demo</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Inject a real bug into the dashboard, then watch it get auto-detected and fixed</p>
        </div>
        <a href="/dashboard/autonomy" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">&larr; Back</a>
      </div>

      {/* Target widget: the thing that will break */}
      <div className={`card-elevated p-6 space-y-5 transition-all duration-500 ${
        bugState === "bugged" ? "border-rose-500/30" : bugState === "fixed" ? "border-emerald-500/30" : ""
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-[15px] font-semibold text-zinc-200">Sales Dashboard Widget</h2>
            {bugState === "normal" && <span className="badge bg-zinc-500/10 text-zinc-400 text-[11px]">Normal</span>}
            {bugState === "bugged" && <span className="badge bg-rose-500/10 text-rose-400 text-[11px]"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse-soft inline-block" />Corrupted</span>}
            {bugState === "fixed" && <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px]">Auto-Fixed</span>}
          </div>

          <div className="flex gap-2">
            {phase === "idle" && (
              <button onClick={injectBug} className="bg-rose-600 hover:bg-rose-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-all shadow-lg shadow-rose-500/20">
                Inject Bug
              </button>
            )}
            {phase === "broken" && (
              <button onClick={startAutoDebug} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-all shadow-lg shadow-indigo-500/20 animate-pulse-soft">
                Run Auto Debug/Fix
              </button>
            )}
            {(phase === "fixed" || phase === "broken") && (
              <button onClick={reset} className="bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[13px] rounded-lg px-4 py-2 transition-all border border-white/[0.08]">
                Reset
              </button>
            )}
            {phase === "debugging" && (
              <span className="flex items-center gap-2 text-[13px] text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse-soft" />
                Auto Debug Agent working...
              </span>
            )}
          </div>
        </div>

        {/* The actual dashboard metrics that will show wrong data */}
        <SalesDashboardWidget bugState={bugState} />

        {/* The deal table that will also break */}
        <DealTable bugState={bugState} />
      </div>

      {/* Debug visualization — only after bug injected */}
      {phase !== "idle" && (
        <div className="grid grid-cols-[1fr_360px] gap-6">
          {/* Left: pipeline + code + log */}
          <div className="space-y-5">
            {/* Step pipeline */}
            <div className="card p-6">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-5">Debug Pipeline</h3>
              <div className="flex items-start gap-0 overflow-x-auto pb-2">
                {DEBUG_STEPS.map((step, i) => {
                  const done = completedSteps.has(i);
                  const active = currentStep === i && phase === "debugging";
                  return (
                    <div key={step.id} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center gap-2 w-[100px]">
                        <div className={`h-11 w-11 rounded-full flex items-center justify-center transition-all duration-500 ${
                          active ? "bg-indigo-500 glow-indigo scale-110" : done ? "bg-emerald-500 glow-emerald" : "bg-zinc-800/80 border border-zinc-700/50"
                        }`}>
                          {done ? (
                            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className={`text-[13px] font-bold ${active ? "text-white animate-pulse-soft" : "text-zinc-600"}`}>{i + 1}</span>
                          )}
                        </div>
                        <span className={`text-[10px] text-center leading-tight font-medium ${
                          active ? "text-indigo-400" : done ? "text-emerald-400" : "text-zinc-600"
                        }`}>{step.label}</span>
                      </div>
                      {i < DEBUG_STEPS.length - 1 && (
                        <div className={`h-[2px] w-3 mt-[-22px] shrink-0 rounded transition-all duration-500 ${
                          done ? "bg-emerald-500/60" : active ? "bg-indigo-500/40" : "bg-zinc-800"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Code diff view */}
            {codeView && (
              <div className="card p-5">
                <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">{codeView.title}</h3>
                <pre className="bg-[#0a0a0c] border border-white/[0.04] rounded-xl p-4 text-[12px] font-mono leading-[1.9] overflow-x-auto">
                  {codeView.lines.map((line, i) => (
                    <div key={i} className={
                      line.startsWith("- ") ? "text-rose-400 bg-rose-500/[0.07] -mx-4 px-4 py-0.5" :
                      line.startsWith("+ ") ? "text-emerald-400 bg-emerald-500/[0.07] -mx-4 px-4 py-0.5" :
                      line.startsWith("//") ? "text-zinc-500" :
                      line === "" ? "h-2" :
                      "text-zinc-300"
                    }>{line || "\u00A0"}</div>
                  ))}
                </pre>
              </div>
            )}

            {/* System log */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">System Log</h3>
              <div ref={logRef} className="bg-[#0a0a0c] border border-white/[0.04] rounded-xl p-4 h-[300px] overflow-y-auto font-mono text-[11px] leading-[1.8]">
                {logs.length === 0 && <p className="text-zinc-600">Click &quot;Run Auto Debug/Fix&quot; to start...</p>}
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-zinc-600 shrink-0 tabular-nums">{l.time}</span>
                    <span className={
                      l.text.startsWith("━") ? "text-emerald-400 font-bold" :
                      l.text.startsWith("AUTO DEBUG") ? "text-emerald-400 font-bold" :
                      l.text.includes("ANOMALY") ? "text-rose-400" :
                      l.text.includes("PASS") || l.text.includes("correct") || l.text.includes("✓") ? "text-emerald-400" :
                      l.text.startsWith("[STEP") ? "text-indigo-400 font-semibold" :
                      l.text.startsWith("  ") ? "text-zinc-500" :
                      "text-zinc-300"
                    }>{l.text}</span>
                  </div>
                ))}
                {phase === "debugging" && <div className="text-indigo-400 animate-pulse-soft ml-16">...</div>}
              </div>
            </div>
          </div>

          {/* Right: status panel */}
          <div className="space-y-5">
            {/* Bug details */}
            <div className={`card p-5 transition-all duration-500 ${
              phase === "fixed" ? "border-emerald-500/20 glow-emerald" : bugState === "bugged" ? "border-rose-500/20 glow-rose" : ""
            }`}>
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Bug Report</h3>
              <div className="space-y-2.5">
                <Row label="Type" value="Data Corruption" />
                <Row label="Component" value="SalesDashboardWidget" mono />
                <Row label="Symptoms" value="NaN, Infinity, wrong counts" />
                <Row label="Impact" value="Critical — wrong revenue data" badge="rose" />
                <div className="divider my-1" />
                <div className="flex items-center justify-between text-[12px]">
                  <span className="text-zinc-500">Status</span>
                  {phase === "broken" && <span className="badge bg-rose-500/10 text-rose-400 text-[11px]"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse-soft inline-block" />Broken</span>}
                  {phase === "debugging" && <span className="badge bg-indigo-500/10 text-indigo-400 text-[11px]"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-soft inline-block" />Auto-fixing</span>}
                  {phase === "fixed" && <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px]">Auto-fixed</span>}
                </div>
              </div>
            </div>

            {/* Step checklist */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Progress</h3>
              <div className="space-y-2">
                {DEBUG_STEPS.map((step, i) => {
                  const done = completedSteps.has(i);
                  const active = currentStep === i && phase === "debugging";
                  return (
                    <div key={step.id} className="flex items-center gap-2.5">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        done ? "bg-emerald-500" : active ? "bg-indigo-500 animate-pulse-soft" : "bg-zinc-800 border border-zinc-700"
                      }`}>
                        {done && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                      <span className={`text-[12px] ${done ? "text-emerald-400" : active ? "text-indigo-400 font-medium" : "text-zinc-600"}`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Data comparison */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Data Comparison</h3>
              <div className="space-y-3">
                <CompareRow label="Won Deals" before="12" after="1" correct="1" showAfter={phase === "fixed"} />
                <CompareRow label="Revenue" before="NaN" after="$36,000" correct="$36,000" showAfter={phase === "fixed"} />
                <CompareRow label="Win Rate" before="Infinity%" after="8.3%" correct="8.3%" showAfter={phase === "fixed"} />
                <CompareRow label="Agents" before="null, NaN" after="Valid" correct="Valid" showAfter={phase === "fixed"} />
              </div>
            </div>

            {/* Conclusion */}
            {phase === "fixed" && (
              <div className="card p-5 border-emerald-500/20 glow-emerald">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-emerald-400">Auto-Healed</p>
                    <p className="text-[11px] text-zinc-500">6 steps, ~12s, zero human input</p>
                  </div>
                </div>
                <p className="text-[12px] text-zinc-400 leading-relaxed">
                  3 bugs fixed: wrong filter, undefined property, division by zero. All dashboard data corrected. Scroll up to see the green metrics.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helper components ─────────────────────────────────────

function Row({ label, value, mono, badge }: { label: string; value: string; mono?: boolean; badge?: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <span className="text-zinc-500">{label}</span>
      {badge ? (
        <span className={`badge bg-${badge}-500/10 text-${badge}-400 text-[11px]`}>{value}</span>
      ) : (
        <span className={`text-zinc-200 ${mono ? "font-mono text-[11px]" : ""}`}>{value}</span>
      )}
    </div>
  );
}

function CompareRow({ label, before, after, correct, showAfter }: {
  label: string; before: string; after: string; correct: string; showAfter: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] text-zinc-500 mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className="text-[13px] text-rose-400 tabular-nums line-through">{before}</span>
        {showAfter && (
          <>
            <svg className="h-3 w-3 text-emerald-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            <span className="text-[13px] text-emerald-400 font-semibold tabular-nums">{after}</span>
          </>
        )}
      </div>
    </div>
  );
}
