"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  healthMetrics,
  anomalyAlerts,
  debugSessions,
  deployments,
  promptVersions,
  evolutionProposals,
  salesPatterns,
  formatDateTime,
  timeAgo,
  type HealthMetric,
  type AnomalyAlert,
  type DebugSession,
  type Deployment,
  type PromptVersion,
  type EvolutionProposal,
  type SalesPattern,
} from "@/lib/demo-data";

// ─── Tabs ────────────────────────────────────────────────────────

type Tab = "monitor" | "debug" | "deploy" | "evolution" | "live";

const TABS: { key: Tab; label: string; highlight?: boolean }[] = [
  { key: "live", label: "Live Demo", highlight: true },
  { key: "monitor", label: "Monitor" },
  { key: "debug", label: "Debug / Fix" },
  { key: "deploy", label: "Deploy" },
  { key: "evolution", label: "Evolution" },
];

// ─── Helpers ─────────────────────────────────────────────────────

function Sparkline({
  data,
  status,
}: {
  data: number[];
  status: "good" | "warning" | "critical";
}) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 36;
  const pad = 2;
  const points = data
    .map((v, i) => {
      const x = pad + (i / (data.length - 1)) * (w - 2 * pad);
      const y = h - pad - ((v - min) / range) * (h - 2 * pad);
      return `${x},${y}`;
    })
    .join(" ");

  const strokeColor =
    status === "good"
      ? "#34d399"
      : status === "warning"
        ? "#fbbf24"
        : "#f87171";
  const gradId = `spark-${status}-${data.length}`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={120} height={36} className="mt-1.5">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
          <stop offset="100%" stopColor={strokeColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon
        points={`${pad},${h - pad} ${points} ${w - pad},${h - pad}`}
        fill={`url(#${gradId})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function formatMetricValue(value: number, unit: string) {
  if (unit === "$") return `$${(value / 1000).toFixed(0)}k`;
  if (unit === "%") return `${value}%`;
  return `${value}`;
}

// ─── Root Page ───────────────────────────────────────────────────

export default function AutonomyPage() {
  const [tab, setTab] = useState<Tab>("live");

  return (
    <div className="p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">
          Autonomous Operations
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Self-monitoring, self-healing, self-improving agent infrastructure
        </p>
      </div>

      {/* Tab bar */}
      <nav className="flex gap-0.5 rounded-xl bg-white/[0.03] p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-5 py-2 text-[13px] font-medium transition-all duration-200 ${
              tab === t.key
                ? t.highlight ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20" : "bg-white/[0.08] text-white"
                : t.highlight ? "text-indigo-400 hover:text-indigo-300" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {t.highlight && tab !== t.key && <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-soft" />}
            {t.label}
          </button>
        ))}
      </nav>

      {/* Content */}
      {tab === "live" && <LiveDemoTab />}
      {tab === "live" && (
        <a
          href="/dashboard/autonomy/demo"
          className="card card-hover flex items-center justify-between p-5 group"
        >
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-rose-500/10 flex items-center justify-center group-hover:bg-rose-500/15 transition-colors">
              <svg className="h-5 w-5 text-rose-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 12.75c1.148 0 2.278.08 3.383.237 1.037.146 1.866.966 1.866 2.013 0 3.728-2.35 6.75-5.25 6.75S6.75 18.728 6.75 15c0-1.046.83-1.867 1.866-2.013A24.204 24.204 0 0112 12.75zm0 0c2.883 0 5.647.508 8.207 1.44a23.91 23.91 0 01-1.152 6.06M12 12.75c-2.883 0-5.647.508-8.208 1.44.125 2.104.52 4.136 1.153 6.06M12 12.75a2.25 2.25 0 002.248-2.354M12 12.75a2.25 2.25 0 01-2.248-2.354M12 8.25c.995 0 1.971-.08 2.922-.236.403-.066.74-.358.795-.762a3.778 3.778 0 00-.399-2.25M12 8.25c-.995 0-1.97-.08-2.922-.236-.402-.066-.74-.358-.795-.762a3.734 3.734 0 01.4-2.253M12 8.25a2.25 2.25 0 00-2.248 2.146M12 8.25a2.25 2.25 0 012.248 2.146M8.683 5a6.032 6.032 0 01-1.155-1.002c.07-.63.27-1.222.574-1.747m.581 2.749A3.75 3.75 0 0115.318 5m0 0c.427-.283.815-.62 1.155-.999a4.471 4.471 0 00-.575-1.752M4.921 6a24.048 24.048 0 00-.392 3.314c1.668.546 3.416.914 5.223 1.082M19.08 6c.205 1.08.337 2.187.392 3.314a23.882 23.882 0 01-5.223 1.082" />
              </svg>
            </div>
            <div>
              <p className="text-[14px] font-semibold text-zinc-200">Inject a Real Bug</p>
              <p className="text-[12px] text-zinc-500">Break a UI component and watch the Auto Debug Agent fix it live</p>
            </div>
          </div>
          <svg className="h-5 w-5 text-zinc-600 group-hover:text-zinc-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </a>
      )}
      {tab === "monitor" && <MonitorTab />}
      {tab === "debug" && <DebugTab />}
      {tab === "deploy" && <DeployTab />}
      {tab === "evolution" && <EvolutionTab />}
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// LIVE DEMO: Auto Debug/Fix → Deploy → Verify simulation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

interface SimStep {
  id: string;
  label: string;
  description: string;
  detail: string;
  duration: number; // ms to complete
  icon: string;
}

const SIM_STEPS: SimStep[] = [
  {
    id: "detect",
    label: "Anomaly Detected",
    description: "Monitor Agent detected outreach reply rate drop",
    detail: "Email reply rate fell to 2.1% (threshold: 5.0%). Triggered by Monitor Agent's 5-minute health check cycle. Severity: WARNING. Alert ID: AL-2026-0330-001.",
    duration: 2000,
    icon: "M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z",
  },
  {
    id: "analyze",
    label: "Root Cause Analysis",
    description: "Debug Agent analyzing error patterns and recent changes",
    detail: "Analyzing 1,205 outreach emails from past 30 days. Comparing subject line performance by week. Found: same 3 subject line templates used for 21 consecutive days. Open rate decay: 34% → 18%. Root cause: template fatigue. Confidence: 82%.",
    duration: 3000,
    icon: "M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z",
  },
  {
    id: "propose",
    label: "Fix Proposed",
    description: "Generated 3 new subject line variants from high-performing patterns",
    detail: "Extracted top patterns from successful emails (reply rate > 10%):\n\nVariant A: \"[Company] — cut [metric] by [X]%\" (value-first)\nVariant B: \"Quick question about [specific pain point]\" (curiosity)\nVariant C: \"[Mutual connection] suggested I reach out\" (social proof)\n\nProposed: A/B test all 3 against current templates. Also adding 7-day auto-refresh rule to prevent future template fatigue.",
    duration: 2500,
    icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
  },
  {
    id: "pr",
    label: "PR Created",
    description: "Auto-generated pull request with prompt changes",
    detail: "Created PR #152: \"fix(outreach): rotate stale email templates + add 7-day refresh rule\"\n\nFiles changed:\n  src/lib/prompts/outreach-cold-email.ts (+47, -12)\n  src/lib/rules/template-refresh.ts (+23, new)\n  tests/outreach-templates.test.ts (+31)\n\nAll CI checks passing. Semgrep security scan: clean.",
    duration: 2000,
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
  },
  {
    id: "review",
    label: "Auto Review & Merge",
    description: "Automated code review passed, PR merged to main",
    detail: "Review checks:\n  Scope limited to allowed paths: PASS\n  No secrets in diff: PASS\n  Test coverage > 80%: PASS (94%)\n  Confidence threshold >= 0.7: PASS (0.82)\n  Auto-fix limit (5/day): PASS (2/5 used)\n\nAuto-approved and merged at 2026-03-30 06:12:00 UTC.",
    duration: 1500,
    icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  },
  {
    id: "deploy",
    label: "Canary Deploy",
    description: "Deploying v1.4.3 to 5% of traffic",
    detail: "Deployment pipeline:\n  Stage 1: CI validation — PASS (lint, typecheck, tests, security)\n  Stage 2: Docker build + push to GHCR — DONE (sha: a3f7c2d)\n  Stage 3: Canary deploy — 5% traffic routed to v1.4.3\n\nMonitor Agent watching: reply rate, open rate, error rate, latency.\n10-minute observation window started.",
    duration: 3500,
    icon: "M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5",
  },
  {
    id: "rollout",
    label: "Progressive Rollout",
    description: "Expanding from 5% → 25% → 50% → 100%",
    detail: "Canary health check (10 min): ALL GREEN\n  Reply rate: 2.1% → 3.8% (+81% improvement)\n  Open rate: 18.5% → 27.2% (+47%)\n  Error rate: 0.0%\n  Latency: nominal\n\nProgressive rollout:\n  06:22 — 5% → 25% (5 min hold) ✓\n  06:27 — 25% → 50% (5 min hold) ✓\n  06:32 — 50% → 100% ✓\n\nv1.4.3 fully deployed.",
    duration: 3000,
    icon: "M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605",
  },
  {
    id: "verify",
    label: "Fix Verified",
    description: "Monitor Agent confirmed metrics recovered",
    detail: "Post-deployment verification (24h window):\n\n  BEFORE     AFTER      CHANGE\n  Reply rate    2.1%  →   6.4%     +205% ✓\n  Open rate    18.5%  →  31.7%     +71%  ✓\n  Error rate    0.0%  →   0.0%     —     ✓\n  Bounce rate   1.2%  →   0.8%     -33%  ✓\n\nAlert AL-2026-0330-001 auto-resolved.\nDebug session DS-2026-0330-001 marked as VERIFIED.\nPattern logged: \"Template rotation every 7 days prevents fatigue decay.\"",
    duration: 2000,
    icon: "M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z",
  },
];

function LiveDemoTab() {
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [logs, setLogs] = useState<{ step: number; text: string; time: string }[]>([]);
  const [canaryPercent, setCanaryPercent] = useState(0);
  const [metricsAfter, setMetricsAfter] = useState<{ replyRate: number; openRate: number } | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const addLog = useCallback((step: number, text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs((prev) => [...prev, { step, text, time }]);
  }, []);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logs]);

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const runSimulation = useCallback(async () => {
    abortRef.current = false;
    setIsRunning(true);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setLogs([]);
    setCanaryPercent(0);
    setMetricsAfter(null);

    for (let i = 0; i < SIM_STEPS.length; i++) {
      if (abortRef.current) break;
      const step = SIM_STEPS[i];
      setCurrentStep(i);
      addLog(i, `[${step.label.toUpperCase()}] ${step.description}`);

      // Simulate sub-steps for deploy and rollout
      if (step.id === "deploy") {
        await sleep(800);
        if (abortRef.current) break;
        addLog(i, "  CI validation: lint ✓  typecheck ✓  tests ✓  security ✓");
        await sleep(700);
        if (abortRef.current) break;
        addLog(i, "  Docker build: sha:a3f7c2d pushed to GHCR");
        await sleep(500);
        if (abortRef.current) break;
        setCanaryPercent(5);
        addLog(i, "  Canary: 5% traffic routed to v1.4.3");
        await sleep(1500);
        if (abortRef.current) break;
        addLog(i, "  Health check (5%): reply rate +81%, no errors");
      } else if (step.id === "rollout") {
        for (const pct of [25, 50, 100]) {
          await sleep(700);
          if (abortRef.current) break;
          setCanaryPercent(pct);
          addLog(i, `  Rollout: ${pct}% traffic — health: GREEN`);
        }
        await sleep(500);
        if (abortRef.current) break;
        addLog(i, "  v1.4.3 fully deployed to 100% traffic");
      } else if (step.id === "verify") {
        await sleep(800);
        if (abortRef.current) break;
        setMetricsAfter({ replyRate: 6.4, openRate: 31.7 });
        addLog(i, "  Reply rate: 2.1% → 6.4% (+205%)");
        await sleep(600);
        if (abortRef.current) break;
        addLog(i, "  Open rate: 18.5% → 31.7% (+71%)");
        await sleep(600);
        if (abortRef.current) break;
        addLog(i, "  Alert auto-resolved. Pattern logged.");
      } else {
        await sleep(step.duration);
      }

      if (abortRef.current) break;
      setCompletedSteps((prev) => new Set([...prev, i]));
    }

    if (!abortRef.current) {
      setCurrentStep(SIM_STEPS.length);
      addLog(SIM_STEPS.length - 1, "━━━ AUTO DEBUG/FIX CYCLE COMPLETE ━━━");
    }
    setIsRunning(false);
  }, [addLog]);

  const handleStop = () => {
    abortRef.current = true;
    setIsRunning(false);
  };

  const allDone = currentStep >= SIM_STEPS.length;

  return (
    <div className="space-y-6">
      {/* Intro card */}
      <div className="card-elevated p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-zinc-200">Auto Debug/Fix Live Simulation</h2>
            <p className="text-[13px] text-zinc-500 mt-1 max-w-xl leading-relaxed">
              Watch the complete autonomous cycle in real-time: anomaly detection &rarr; root cause analysis &rarr; fix generation &rarr; PR creation &rarr; review &rarr; canary deploy &rarr; progressive rollout &rarr; verification.
            </p>
          </div>
          {!isRunning && !allDone && (
            <button
              onClick={runSimulation}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-5 py-2.5 transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
            >
              Start Simulation
            </button>
          )}
          {isRunning && (
            <button
              onClick={handleStop}
              className="shrink-0 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 text-[13px] font-medium rounded-lg px-5 py-2.5 transition-all border border-rose-500/20"
            >
              Stop
            </button>
          )}
          {allDone && (
            <button
              onClick={runSimulation}
              className="shrink-0 bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[13px] font-medium rounded-lg px-5 py-2.5 transition-all border border-white/[0.08]"
            >
              Run Again
            </button>
          )}
        </div>
      </div>

      {/* Pipeline visualization + Metrics */}
      <div className="grid grid-cols-[1fr_320px] gap-6">
        {/* Left: Pipeline + Log */}
        <div className="space-y-5">
          {/* Step pipeline */}
          <div className="card p-6">
            <div className="flex items-start gap-0 overflow-x-auto pb-2">
              {SIM_STEPS.map((step, i) => {
                const done = completedSteps.has(i);
                const active = currentStep === i && isRunning;
                return (
                  <div key={step.id} className="flex items-center shrink-0">
                    <div className="flex flex-col items-center gap-2 w-[100px]">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center transition-all duration-500 ${
                        active ? "bg-indigo-500 glow-indigo scale-110" : done ? "bg-emerald-500 glow-emerald" : "bg-zinc-800/80 border border-zinc-700/50"
                      }`}>
                        {done && !active ? (
                          <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          <svg className={`h-5 w-5 ${active ? "text-white" : "text-zinc-500"} ${active ? "animate-pulse-soft" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={step.icon} />
                          </svg>
                        )}
                      </div>
                      <span className={`text-[11px] text-center leading-tight ${
                        active ? "text-indigo-400 font-semibold" : done ? "text-emerald-400 font-medium" : "text-zinc-600"
                      }`}>
                        {step.label}
                      </span>
                    </div>
                    {i < SIM_STEPS.length - 1 && (
                      <div className={`h-[2px] w-6 mt-[-24px] shrink-0 rounded transition-all duration-500 ${
                        done ? "bg-emerald-500/60" : active ? "bg-indigo-500/40" : "bg-zinc-800"
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Current step detail */}
          {currentStep >= 0 && currentStep < SIM_STEPS.length && (
            <div className={`card p-5 transition-all duration-300 ${isRunning ? "border-indigo-500/20 glow-indigo" : completedSteps.has(currentStep) ? "border-emerald-500/20" : ""}`}>
              <div className="flex items-center gap-2 mb-3">
                <div className={`h-6 w-6 rounded-full flex items-center justify-center ${isRunning ? "bg-indigo-500" : "bg-emerald-500"}`}>
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={SIM_STEPS[currentStep].icon} />
                  </svg>
                </div>
                <h3 className="text-[13px] font-semibold text-zinc-200">{SIM_STEPS[currentStep].label}</h3>
                {isRunning && <span className="ml-auto badge bg-indigo-500/10 text-indigo-400 text-[11px]"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-soft inline-block" />Processing</span>}
                {completedSteps.has(currentStep) && !isRunning && <span className="ml-auto badge bg-emerald-500/10 text-emerald-400 text-[11px]">Complete</span>}
              </div>
              <pre className="text-[12px] text-zinc-400 leading-relaxed whitespace-pre-wrap font-mono bg-white/[0.02] rounded-xl p-4 max-h-[200px] overflow-y-auto">
                {SIM_STEPS[currentStep].detail}
              </pre>
            </div>
          )}

          {/* All done summary */}
          {allDone && (
            <div className="card p-5 border-emerald-500/20 glow-emerald">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center glow-emerald">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-emerald-400">Auto Debug/Fix Cycle Complete</h3>
                  <p className="text-[12px] text-zinc-400 mt-0.5">8 steps executed autonomously. Anomaly detected, diagnosed, fixed, deployed, and verified without human intervention.</p>
                </div>
              </div>
            </div>
          )}

          {/* Log output */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">System Log</h3>
            <div ref={logRef} className="bg-[#0a0a0c] rounded-xl p-4 h-[260px] overflow-y-auto font-mono text-[11px] leading-[1.8] border border-white/[0.04]">
              {logs.length === 0 && (
                <p className="text-zinc-600">Press &quot;Start Simulation&quot; to begin...</p>
              )}
              {logs.map((log, i) => (
                <div key={i} className="flex gap-3">
                  <span className="text-zinc-600 shrink-0 tabular-nums">{log.time}</span>
                  <span className={`${
                    log.text.startsWith("━") ? "text-emerald-400 font-semibold"
                    : log.text.startsWith("  ") ? "text-zinc-500"
                    : "text-zinc-300"
                  }`}>{log.text}</span>
                </div>
              ))}
              {isRunning && (
                <div className="flex gap-3">
                  <span className="text-zinc-600 shrink-0 tabular-nums">{new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                  <span className="text-indigo-400 animate-pulse-soft">Processing...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Metrics panel */}
        <div className="space-y-5">
          {/* Before metrics */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Before (Anomaly State)</h3>
            <div className="space-y-4">
              <SimMetric label="Email Reply Rate" value={2.1} unit="%" threshold={5.0} status="critical" />
              <SimMetric label="Email Open Rate" value={18.5} unit="%" threshold={25.0} status="warning" />
              <SimMetric label="Agent Error Rate" value={0.0} unit="%" threshold={2.0} status="good" />
              <SimMetric label="CRM Sync Health" value={99.2} unit="%" threshold={99.0} status="good" />
            </div>
          </div>

          {/* Canary progress */}
          {canaryPercent > 0 && (
            <div className={`card p-5 transition-all duration-500 ${canaryPercent < 100 ? "border-amber-500/20 glow-amber" : "border-emerald-500/20 glow-emerald"}`}>
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">
                {canaryPercent < 100 ? "Canary Rollout" : "Deployment Complete"}
              </h3>
              <div className="flex items-center justify-between text-[13px] mb-2">
                <span className="text-zinc-400">v1.4.3</span>
                <span className={`font-semibold tabular-nums ${canaryPercent < 100 ? "text-amber-400" : "text-emerald-400"}`}>{canaryPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-700 ease-out ${canaryPercent < 100 ? "bg-amber-400" : "bg-emerald-400"}`}
                  style={{ width: `${canaryPercent}%` }}
                />
              </div>
              {canaryPercent < 100 && (
                <p className="text-[11px] text-zinc-500 mt-2">Monitor Agent observing health metrics...</p>
              )}
            </div>
          )}

          {/* After metrics */}
          {metricsAfter && (
            <div className="card p-5 border-emerald-500/20 glow-emerald transition-all duration-500">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">After (Verified)</h3>
              <div className="space-y-4">
                <SimMetricCompare label="Email Reply Rate" before={2.1} after={metricsAfter.replyRate} unit="%" />
                <SimMetricCompare label="Email Open Rate" before={18.5} after={metricsAfter.openRate} unit="%" />
              </div>
            </div>
          )}

          {/* Cycle info */}
          <div className="card p-5">
            <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Cycle Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="text-zinc-500">Steps completed</span>
                <span className="text-zinc-200 tabular-nums font-medium">{completedSteps.size} / {SIM_STEPS.length}</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-zinc-500">Human intervention</span>
                <span className="text-emerald-400 font-medium">None required</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-zinc-500">Safety checks</span>
                <span className="text-zinc-200 tabular-nums font-medium">5 / 5 passed</span>
              </div>
              <div className="flex justify-between text-[12px]">
                <span className="text-zinc-500">Auto-fix budget</span>
                <span className="text-zinc-200 tabular-nums font-medium">2 / 5 today</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SimMetric({ label, value, unit, threshold, status }: { label: string; value: number; unit: string; threshold: number; status: "good" | "warning" | "critical" }) {
  const pct = Math.min((value / threshold) * 100, 100);
  const barColor = status === "good" ? "bg-emerald-400" : status === "warning" ? "bg-amber-400" : "bg-rose-400";
  const dotColor = status === "good" ? "bg-emerald-400" : status === "warning" ? "bg-amber-400" : "bg-rose-400 animate-pulse-soft";
  return (
    <div>
      <div className="flex items-center justify-between text-[12px] mb-1.5">
        <div className="flex items-center gap-2">
          <div className={`h-[6px] w-[6px] rounded-full ${dotColor}`} />
          <span className="text-zinc-400">{label}</span>
        </div>
        <span className="text-zinc-200 font-medium tabular-nums">{value}{unit}</span>
      </div>
      <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
        <div className={`h-full rounded-full ${barColor} transition-all duration-300`} style={{ width: `${pct}%` }} />
      </div>
      <p className="text-[10px] text-zinc-600 mt-1 tabular-nums">Threshold: {threshold}{unit}</p>
    </div>
  );
}

function SimMetricCompare({ label, before, after, unit }: { label: string; before: number; after: number; unit: string }) {
  const improvement = ((after - before) / before * 100).toFixed(0);
  return (
    <div>
      <p className="text-[12px] text-zinc-400 mb-1">{label}</p>
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-zinc-500 tabular-nums line-through">{before}{unit}</span>
        <svg className="h-3 w-3 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
        <span className="text-[15px] font-semibold text-emerald-400 tabular-nums">{after}{unit}</span>
        <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px] tabular-nums">+{improvement}%</span>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 1: Monitor
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function MonitorTab() {
  return (
    <div className="space-y-8">
      {/* Health Metrics Grid */}
      <section>
        <h2 className="text-[13px] font-medium text-zinc-400 mb-4">
          Health Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthMetrics.map((m) => (
            <MetricCard key={m.label} metric={m} />
          ))}
        </div>
      </section>

      {/* Anomaly Alerts */}
      <section>
        <h2 className="text-[13px] font-medium text-zinc-400 mb-4">
          Anomaly Alerts
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04] text-zinc-500">
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-medium">
                  Severity
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-medium">
                  Message
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider font-medium">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider font-medium">
                  Detected
                </th>
              </tr>
            </thead>
            <tbody>
              {anomalyAlerts.map((a) => {
                const rowGlow =
                  a.status === "active" && a.severity === "critical"
                    ? "glow-rose"
                    : a.status === "active"
                      ? "glow-amber"
                      : "";
                return (
                  <tr
                    key={a.id}
                    className={`border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.02] ${rowGlow}`}
                  >
                    <td className="px-4 py-3">
                      <SeverityDot severity={a.severity} />
                    </td>
                    <td className="px-4 py-3 text-zinc-200 max-w-md">
                      {a.message}
                    </td>
                    <td className="px-4 py-3">
                      <AlertStatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-3 text-zinc-500 text-[12px] text-right whitespace-nowrap tabular-nums">
                      {timeAgo(a.detectedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function MetricCard({ metric }: { metric: HealthMetric }) {
  const trendUp = metric.trend > 0;
  const lowerIsBetter =
    metric.label === "Avg Deal Cycle" || metric.label === "Agent Error Rate";
  const isGoodTrend = lowerIsBetter ? !trendUp : trendUp;

  return (
    <div className="card relative group transition-all duration-200 hover:border-indigo-500/20 p-4">
      {/* Status dot in corner */}
      <div className="absolute top-3 right-3">
        <span
          className={`block h-2 w-2 rounded-full ${
            metric.status === "good"
              ? "bg-emerald-400 glow-emerald"
              : metric.status === "warning"
                ? "bg-amber-400 glow-amber"
                : "bg-rose-400 glow-rose"
          } ${metric.status !== "good" ? "animate-pulse-soft" : ""}`}
        />
      </div>

      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
        {metric.label}
      </p>
      <p className="mt-1.5 text-[28px] font-semibold tracking-tight text-zinc-200 tabular-nums">
        {formatMetricValue(metric.value, metric.unit)}
        {metric.unit !== "$" && metric.unit !== "%" && (
          <span className="text-[12px] font-normal text-zinc-500 ml-1">
            {metric.unit}
          </span>
        )}
      </p>

      {/* Trend badge */}
      <div className="mt-1">
        <span
          className={`badge text-[11px] tabular-nums ${
            isGoodTrend
              ? "bg-emerald-500/10 text-emerald-400"
              : "bg-rose-500/10 text-rose-400"
          }`}
        >
          {trendUp ? "\u2191" : "\u2193"} {Math.abs(metric.trend).toFixed(1)}%
          <span className="text-zinc-500 ml-1">7d</span>
        </span>
      </div>

      <Sparkline data={metric.history} status={metric.status} />
    </div>
  );
}

function SeverityDot({
  severity,
}: {
  severity: "critical" | "warning" | "info";
}) {
  const c =
    severity === "critical"
      ? "bg-rose-500"
      : severity === "warning"
        ? "bg-amber-400"
        : "bg-indigo-400";
  const glow =
    severity === "critical"
      ? "glow-rose"
      : severity === "warning"
        ? "glow-amber"
        : "glow-indigo";
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${c} ${glow}`}
    />
  );
}

function AlertStatusBadge({
  status,
}: {
  status: "active" | "investigating" | "resolved" | "dismissed";
}) {
  const styles: Record<string, string> = {
    active: "bg-rose-500/10 text-rose-400",
    investigating: "bg-amber-500/10 text-amber-400",
    resolved: "bg-emerald-500/10 text-emerald-400",
    dismissed: "bg-zinc-500/10 text-zinc-500",
  };
  return (
    <span
      className={`badge text-[11px] ${styles[status]}`}
    >
      {status === "active" && (
        <span className="mr-1.5 h-1.5 w-1.5 rounded-full bg-rose-400 animate-pulse-soft inline-block" />
      )}
      {status}
    </span>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 2: Debug / Fix
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const PIPELINE_STEPS = [
  "Detect",
  "Analyze",
  "Propose Fix",
  "Create PR",
  "Review",
  "Deploy",
  "Verify",
] as const;

const STATUS_TO_STEP: Record<string, number> = {
  diagnosing: 1,
  fix_proposed: 2,
  pr_created: 3,
  reviewing: 4,
  merged: 4,
  deployed: 5,
  verified: 6,
  failed: -1,
};

function DebugTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-[13px] font-medium text-zinc-400">Debug Sessions</h2>
      {debugSessions.map((s) => (
        <DebugSessionCard key={s.id} session={s} />
      ))}
    </div>
  );
}

function DebugSessionCard({ session }: { session: DebugSession }) {
  const currentStep = STATUS_TO_STEP[session.status] ?? 0;
  const isCompleted =
    session.status === "verified" || session.status === "deployed";
  const isFailed = session.status === "failed";

  const categoryColors: Record<string, string> = {
    prompt_drift: "bg-purple-500/10 text-purple-400",
    knowledge_stale: "bg-amber-500/10 text-amber-400",
    integration_error: "bg-rose-500/10 text-rose-400",
    rate_limit: "bg-orange-500/10 text-orange-400",
    context_overflow: "bg-indigo-500/10 text-indigo-400",
  };

  return (
    <div className="card p-6 space-y-5 transition-all duration-200">
      {/* Pipeline visualization */}
      <div className="flex items-start gap-0 overflow-x-auto pb-2">
        {PIPELINE_STEPS.map((step, i) => {
          const done = i <= currentStep && !isFailed;
          const active = i === currentStep && !isCompleted && !isFailed;
          const pending = i > currentStep || isFailed;

          return (
            <div key={step} className="flex items-center shrink-0">
              <div className="flex flex-col items-center gap-1.5">
                {/* Circle */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center transition-all duration-200 ${
                    active
                      ? "bg-indigo-500 animate-pulse-soft glow-indigo"
                      : done
                        ? "bg-emerald-500 glow-emerald"
                        : "bg-zinc-800 border border-zinc-700"
                  }`}
                >
                  {done && !active && (
                    <svg
                      className="h-3.5 w-3.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                  {active && (
                    <span className="h-2 w-2 rounded-full bg-white" />
                  )}
                </div>
                {/* Label */}
                <span
                  className={`text-[11px] whitespace-nowrap ${
                    active
                      ? "text-indigo-400 font-medium"
                      : done
                        ? "text-emerald-400"
                        : "text-zinc-600"
                  }`}
                >
                  {step}
                </span>
              </div>
              {/* Connecting line */}
              {i < PIPELINE_STEPS.length - 1 && (
                <div
                  className={`h-px w-8 mt-[-18px] shrink-0 ${
                    done && !active
                      ? "bg-emerald-500/50"
                      : active
                        ? "border-t border-dashed border-indigo-500/50"
                        : "bg-zinc-800"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Details card below pipeline */}
      <div className="card-elevated p-4 space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-3">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
                Root Cause
              </p>
              <p className="text-[13px] text-zinc-200 leading-relaxed">
                {session.rootCause}
              </p>
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-1">
                Fix Description
              </p>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                {session.proposedFix}
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span
                className={`badge text-[11px] ${categoryColors[session.rootCauseCategory] || "bg-zinc-500/10 text-zinc-400"}`}
              >
                {session.rootCauseCategory.replace(/_/g, " ")}
              </span>
            </div>

            {/* Confidence bar */}
            <div>
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-zinc-500">Confidence</span>
                <span className="text-zinc-200 font-medium tabular-nums">
                  {(session.confidence * 100).toFixed(0)}%
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-indigo-500 transition-all duration-200"
                  style={{ width: `${session.confidence * 100}%` }}
                />
              </div>
            </div>

            {session.prUrl && (
              <a
                href={session.prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-[12px] text-indigo-400 hover:text-indigo-300 transition-all duration-200"
              >
                <code className="bg-indigo-500/10 rounded px-1.5 py-0.5 font-mono text-[11px]">
                  {session.prUrl.split("/").slice(-2).join(" #")}
                </code>
              </a>
            )}

            {/* Before/After Metrics */}
            {isCompleted && session.metricsAfterFix && (
              <div className="rounded-[12px] border border-white/[0.04] bg-white/[0.02] p-3">
                <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-2">
                  Before / After
                </p>
                <div className="space-y-2">
                  {session.metricsBeforeFix.map((bm, i) => {
                    const am = session.metricsAfterFix![i];
                    const delta = am.value - bm.value;
                    const lowerBetter = bm.metric.includes("Failed");
                    const isGood = lowerBetter ? delta < 0 : delta > 0;
                    return (
                      <div
                        key={bm.metric}
                        className="flex items-center justify-between text-[12px]"
                      >
                        <span className="text-zinc-500">{bm.metric}</span>
                        <div className="flex items-center gap-2 tabular-nums">
                          <span className="text-zinc-500">{bm.value}</span>
                          <span
                            className={`font-medium ${isGood ? "text-emerald-400" : "text-rose-400"}`}
                          >
                            {isGood ? "\u2191" : "\u2193"} {am.value}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-zinc-500 tabular-nums">
              Started {timeAgo(session.startedAt)}
              {session.completedAt && (
                <> &middot; Completed {timeAgo(session.completedAt)}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 3: Deploy
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function DeployTab() {
  return (
    <div className="space-y-6">
      <h2 className="text-[13px] font-medium text-zinc-400">
        Deployment Timeline
      </h2>
      <div className="relative ml-4">
        {/* Vertical line */}
        <div className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-indigo-500/40 via-zinc-700/30 to-transparent" />

        <div className="space-y-0">
          {deployments.map((d) => (
            <DeploymentEntry key={d.id} deployment={d} />
          ))}
        </div>
      </div>
    </div>
  );
}

function DeploymentEntry({ deployment: d }: { deployment: Deployment }) {
  const isRolledBack = d.status === "rolled_back";

  const dotColor: Record<string, string> = {
    deployed: "bg-emerald-400",
    rolled_back: "bg-rose-400 glow-rose",
    building: "bg-indigo-400 animate-pulse-soft",
    canary: "bg-amber-400 animate-pulse-soft",
    rolling_out: "bg-indigo-400 animate-pulse-soft",
    failed: "bg-rose-400",
  };

  const statusBadge: Record<string, string> = {
    deployed: "bg-emerald-500/10 text-emerald-400",
    rolled_back: "bg-rose-500/10 text-rose-400",
    building: "bg-indigo-500/10 text-indigo-400",
    canary: "bg-amber-500/10 text-amber-400",
    rolling_out: "bg-indigo-500/10 text-indigo-400",
    failed: "bg-rose-500/10 text-rose-400",
  };

  const healthColor: Record<string, string> = {
    healthy: "bg-emerald-500/10 text-emerald-400",
    degraded: "bg-amber-500/10 text-amber-400",
    unhealthy: "bg-rose-500/10 text-rose-400",
    pending: "bg-zinc-500/10 text-zinc-500",
  };

  return (
    <div className="relative pb-6 pl-8">
      {/* Timeline dot */}
      <div
        className={`absolute left-0 top-[18px] h-[15px] w-[15px] rounded-full ring-4 ring-zinc-950 ${dotColor[d.status] || "bg-zinc-500"}`}
      />

      <div
        className={`card p-5 transition-all duration-200 ${
          isRolledBack ? "border-rose-500/20" : "hover:border-indigo-500/10"
        }`}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap items-center gap-2">
            {/* Version */}
            <code className="rounded-md bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 text-[13px] font-mono font-semibold text-indigo-400">
              {d.version}
            </code>

            {/* Status */}
            <span className={`badge text-[11px] ${statusBadge[d.status]}`}>
              {d.status === "canary" && (
                <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-soft inline-block" />
              )}
              {d.status.replace(/_/g, " ")}
            </span>

            {/* Health */}
            <span className={`badge text-[11px] ${healthColor[d.healthCheck]}`}>
              {d.healthCheck}
            </span>
          </div>

          {/* Time */}
          <span className="text-[11px] text-zinc-500 tabular-nums whitespace-nowrap ml-4">
            {formatDateTime(d.startedAt)}
          </span>
        </div>

        <p className="text-[13px] text-zinc-400 mb-3">
          {d.triggerDescription}
        </p>

        {/* Canary progress bar */}
        {d.status === "canary" && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-[11px] mb-1">
              <span className="text-zinc-500">Canary rollout</span>
              <span className="text-amber-400 font-medium tabular-nums">
                {d.canaryPercent}%
              </span>
            </div>
            <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-200"
                style={{ width: `${d.canaryPercent}%` }}
              />
            </div>
          </div>
        )}

        {d.completedAt && (
          <p className="text-[11px] text-zinc-500 tabular-nums">
            {isRolledBack ? (
              <>
                Rolled back{" "}
                <span className="text-rose-400">
                  {formatDateTime(d.completedAt)}
                </span>
              </>
            ) : (
              <>Completed {formatDateTime(d.completedAt)}</>
            )}
          </p>
        )}
      </div>
    </div>
  );
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TAB 4: Evolution
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function EvolutionTab() {
  return (
    <div className="space-y-10">
      {/* Evolution Proposals */}
      <section>
        <h2 className="text-[13px] font-medium text-zinc-400 mb-4">
          Evolution Proposals
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          {evolutionProposals.map((p) => (
            <ProposalCard key={p.id} proposal={p} />
          ))}
        </div>
      </section>

      {/* Sales Patterns */}
      <section>
        <h2 className="text-[13px] font-medium text-zinc-400 mb-4">
          Sales Patterns
        </h2>
        <div className="card overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Type
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Stage
                </th>
                <th className="text-left px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Description
                </th>
                <th className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-zinc-500 font-medium">
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {salesPatterns.map((sp) => (
                <tr
                  key={sp.id}
                  className="border-b border-white/[0.04] transition-all duration-200 hover:bg-white/[0.02]"
                >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        sp.patternType === "effective"
                          ? "bg-emerald-400"
                          : "bg-rose-400"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className="badge bg-zinc-500/10 text-zinc-400 text-[11px]">
                      {sp.stage.replace(/_/g, " ")}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 max-w-md text-[13px]">
                    {sp.description}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1 rounded-full bg-zinc-800 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${
                            sp.successRate >= 0.6
                              ? "bg-emerald-400"
                              : sp.successRate >= 0.4
                                ? "bg-amber-400"
                                : "bg-rose-400"
                          }`}
                          style={{ width: `${sp.successRate * 100}%` }}
                        />
                      </div>
                      <span
                        className={`text-[12px] font-medium tabular-nums ${
                          sp.successRate >= 0.6
                            ? "text-emerald-400"
                            : sp.successRate >= 0.4
                              ? "text-amber-400"
                              : "text-rose-400"
                        }`}
                      >
                        {(sp.successRate * 100).toFixed(0)}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Prompt Versions */}
      <section>
        <h2 className="text-[13px] font-medium text-zinc-400 mb-4">
          Prompt Versions
        </h2>
        <PromptVersionsSection />
      </section>
    </div>
  );
}

function ProposalCard({ proposal: p }: { proposal: EvolutionProposal }) {
  const impactColors: Record<string, string> = {
    high: "bg-rose-500/10 text-rose-400",
    medium: "bg-amber-500/10 text-amber-400",
    low: "bg-indigo-500/10 text-indigo-400",
  };
  const statusColors: Record<string, string> = {
    proposed: "bg-zinc-500/10 text-zinc-400",
    ab_testing: "bg-amber-500/10 text-amber-400",
    adopted: "bg-emerald-500/10 text-emerald-400",
    rejected: "bg-rose-500/10 text-rose-400",
  };

  return (
    <div className="card p-5 transition-all duration-200 hover:border-indigo-500/10 space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <span className={`badge text-[11px] ${impactColors[p.impact]}`}>
            {p.impact} impact
          </span>
          <span className={`badge text-[11px] ${statusColors[p.status]}`}>
            {p.status === "ab_testing" && (
              <span className="mr-1 h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse-soft inline-block" />
            )}
            {p.status.replace(/_/g, " ")}
          </span>
        </div>
        <h3 className="text-[13px] font-semibold text-zinc-200">{p.title}</h3>
        <p className="mt-1 text-[12px] text-zinc-500 leading-relaxed">
          {p.description}
        </p>
      </div>

      {/* A/B results */}
      {p.abTestResult && (
        <div className="rounded-[12px] border border-white/[0.04] bg-white/[0.02] p-3 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[11px] text-zinc-500 mb-0.5">Control</p>
              <p className="text-[13px] text-zinc-300 font-semibold tabular-nums">
                {(p.abTestResult.controlRate * 100).toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-[11px] text-zinc-500 mb-0.5">Variant</p>
              <p className="text-[13px] text-emerald-400 font-semibold tabular-nums">
                {(p.abTestResult.variantRate * 100).toFixed(1)}%
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px] tabular-nums">
              +{p.abTestResult.improvement.toFixed(1)}% improvement
            </span>
            <span className="text-[11px] text-zinc-500 tabular-nums">
              n={p.abTestResult.sampleSize}
            </span>
          </div>

          {/* Significance */}
          <div>
            {p.abTestResult.significant ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Statistically significant
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-zinc-500">
                <span className="text-zinc-600">&mdash;</span>
                Not yet significant
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PromptVersionsSection() {
  // Group by agentType + promptKey
  const groups: Record<string, PromptVersion[]> = {};
  for (const pv of promptVersions) {
    const key = `${pv.agentType}::${pv.promptKey}`;
    (groups[key] ??= []).push(pv);
  }

  return (
    <div className="space-y-4">
      {Object.entries(groups).map(([key, versions]) => {
        const active = versions.find((v) => v.status === "active");
        const canary = versions.find((v) => v.status === "canary");
        const [agentType, promptKey] = key.split("::");

        return (
          <div key={key} className="card p-5 space-y-4">
            <div>
              <h3 className="text-[13px] font-semibold text-zinc-200">
                {agentType}
              </h3>
              <p className="text-[11px] text-zinc-500 font-mono">{promptKey}</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Active version */}
              {active && (
                <div className="rounded-[12px] border-l-2 border-l-emerald-500 border border-white/[0.04] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-medium text-emerald-400">
                      Active
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                      v{active.version}
                    </span>
                  </div>
                  <PromptMetrics pv={active} />
                </div>
              )}

              {/* Canary version */}
              {canary && (
                <div className="rounded-[12px] border-l-2 border-l-amber-500 border border-white/[0.04] bg-white/[0.02] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-amber-400 animate-pulse-soft" />
                    <span className="text-[11px] font-medium text-amber-400">
                      Canary ({canary.canaryPercent}%)
                    </span>
                    <span className="text-[11px] text-zinc-500 font-mono tabular-nums">
                      v{canary.version}
                    </span>
                  </div>
                  <PromptMetrics pv={canary} compareTo={active} />
                </div>
              )}
            </div>

            {/* Retired versions */}
            {versions.filter((v) => v.status === "retired").length > 0 && (
              <div className="text-[11px] text-zinc-600">
                {versions
                  .filter((v) => v.status === "retired")
                  .map((v) => (
                    <span key={v.id} className="mr-3 tabular-nums">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-zinc-700 mr-1 align-middle" />
                      v{v.version} retired
                    </span>
                  ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function PromptMetrics({
  pv,
  compareTo,
}: {
  pv: PromptVersion;
  compareTo?: PromptVersion;
}) {
  const metrics = [
    {
      label: "Outcome Rate",
      value: pv.metrics.outcomeRate,
      fmt: (v: number) => `${(v * 100).toFixed(1)}%`,
      better: "higher" as const,
      baseKey: "outcomeRate" as const,
    },
    {
      label: "Confidence",
      value: pv.metrics.avgConfidence,
      fmt: (v: number) => `${(v * 100).toFixed(0)}%`,
      better: "higher" as const,
      baseKey: "avgConfidence" as const,
    },
    {
      label: "Latency",
      value: pv.metrics.avgLatencyMs,
      fmt: (v: number) => `${v}ms`,
      better: "lower" as const,
      baseKey: "avgLatencyMs" as const,
    },
    {
      label: "Cost",
      value: pv.metrics.costPerInteraction,
      fmt: (v: number) => `$${v.toFixed(3)}`,
      better: "lower" as const,
      baseKey: "costPerInteraction" as const,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2">
      {metrics.map((m) => {
        let deltaStr = "";
        let deltaColor = "text-zinc-500";
        if (compareTo) {
          const baseVal = compareTo.metrics[m.baseKey];
          const delta = m.value - baseVal;
          const isImproved =
            m.better === "higher" ? delta > 0 : delta < 0;
          if (delta !== 0) {
            deltaStr =
              delta > 0
                ? `+${m.fmt(Math.abs(delta))}`
                : `-${m.fmt(Math.abs(delta))}`;
            deltaColor = isImproved ? "text-emerald-400" : "text-rose-400";
          }
        }

        return (
          <div key={m.label}>
            <p className="text-[11px] text-zinc-500">{m.label}</p>
            <p className="text-[12px] text-zinc-200 font-medium tabular-nums">
              {m.fmt(m.value)}
              {deltaStr && (
                <span className={`ml-1 text-[11px] ${deltaColor}`}>
                  {deltaStr}
                </span>
              )}
            </p>
          </div>
        );
      })}
    </div>
  );
}
