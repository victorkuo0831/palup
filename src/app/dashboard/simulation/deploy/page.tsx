"use client";

import { useState, useEffect, useCallback, useRef } from "react";

// ─── Two scenarios: happy path + rollback path ───────────────────

type Scenario = "success" | "rollback";

interface DeployStep {
  id: string;
  label: string;
  description: string;
  duration: number;
  logs: string[];
  status: "pass" | "fail" | "rollback" | "info";
  // For canary/rollout progress
  canaryPercent?: number;
  healthMetrics?: { label: string; value: string; status: "ok" | "warn" | "fail" }[];
}

function getSteps(scenario: Scenario): DeployStep[] {
  const common: DeployStep[] = [
    {
      id: "trigger",
      label: "Trigger",
      description: scenario === "success"
        ? "Evolution Agent promoted outreach prompt v4 → triggers deployment pipeline"
        : "Dependency update: Anthropic SDK v0.80 → v0.81 (Renovate auto-PR merged)",
      duration: 1500,
      logs: [
        scenario === "success"
          ? "Trigger: evolution_promotion — prompt v4 promoted to active"
          : "Trigger: dependency_update — Renovate PR #153 merged",
        `Source: ${scenario === "success" ? "Evolution Agent (AB-2026-W14-001 winner)" : "Renovate bot (anthropic-sdk-0.81.2)"}`,
        "Deployment pipeline initiated",
        `Version: ${scenario === "success" ? "v1.4.3" : "v1.4.4"}`,
      ],
      status: "info",
    },
    {
      id: "ci-lint",
      label: "Lint & Format",
      description: "ESLint + Prettier check on all changed files",
      duration: 1200,
      logs: [
        "Running ESLint on 3 changed files...",
        "  src/lib/prompts/outreach-cold-email.ts — PASS",
        "  src/lib/rules/template-refresh.ts — PASS",
        "  tests/outreach-templates.test.ts — PASS",
        "Prettier format check: PASS",
        "Stage 1a: Lint — PASS",
      ],
      status: "pass",
    },
    {
      id: "ci-typecheck",
      label: "TypeScript",
      description: "Full project type check with strict mode",
      duration: 1800,
      logs: [
        "Running tsc --noEmit --strict...",
        "Checking 247 source files...",
        "0 errors, 0 warnings",
        "Stage 1b: TypeScript — PASS",
      ],
      status: "pass",
    },
    {
      id: "ci-test",
      label: "Unit Tests",
      description: "Running test suite with coverage",
      duration: 2200,
      logs: [
        "Running jest --coverage...",
        "",
        "  PASS  tests/outreach-templates.test.ts",
        "    ✓ value-first subject line generated correctly (12ms)",
        "    ✓ send time respects recipient timezone (8ms)",
        "    ✓ ICP threshold filters low-score leads (5ms)",
        "    ✓ template rotation triggers after 7 days (11ms)",
        "",
        "  PASS  tests/agents/outreach.test.ts (14 tests)",
        "  PASS  tests/agents/sales.test.ts (22 tests)",
        "  PASS  tests/workflow/engine.test.ts (18 tests)",
        "",
        "Test Suites: 4 passed, 4 total",
        "Tests:       58 passed, 58 total",
        "Coverage:    94.2% (threshold: 80%)",
        "Stage 1c: Tests — PASS",
      ],
      status: "pass",
    },
    {
      id: "ci-security",
      label: "Security Scan",
      description: "Semgrep + dependency audit for vulnerabilities",
      duration: 1500,
      logs: [
        "Running semgrep --config=auto...",
        "Scanning 247 files for security patterns...",
        "  No prompt injection vectors found",
        "  No hardcoded secrets detected",
        "  No SQL injection risks",
        "Running npm audit...",
        "  0 vulnerabilities found",
        "Stage 1d: Security — PASS",
      ],
      status: "pass",
    },
    {
      id: "build",
      label: "Docker Build",
      description: "Multi-stage Docker build and push to container registry",
      duration: 2500,
      logs: [
        "Building Docker image (multi-stage)...",
        "  Stage 1/3: Installing dependencies... done (12.4s)",
        "  Stage 2/3: Building application... done (8.7s)",
        "  Stage 3/3: Creating production image... done (2.1s)",
        "Image size: 142MB (optimized from 890MB base)",
        "",
        "Pushing to GHCR...",
        `  ghcr.io/palup/agent-runtime:${scenario === "success" ? "v1.4.3" : "v1.4.4"}`,
        `  SHA: ${scenario === "success" ? "a3f7c2d" : "b8e4f1a"}`,
        "Stage 2: Build + Push — DONE",
      ],
      status: "pass",
    },
  ];

  if (scenario === "success") {
    return [
      ...common,
      {
        id: "canary",
        label: "Canary 5%",
        description: "Routing 5% of traffic to v1.4.3. Monitor Agent observing for 10 minutes.",
        duration: 3000,
        logs: [
          "Deploying canary: 5% traffic → v1.4.3",
          "Kubernetes: new ReplicaSet created (1 pod)",
          "Istio VirtualService updated: 95/5 split",
          "Pod healthy: readiness probe passed",
          "",
          "Monitor Agent observing (10 min window)...",
          "  Minute 2: error rate 0.0%, latency p99 210ms ✓",
          "  Minute 5: error rate 0.0%, latency p99 195ms ✓",
          "  Minute 8: error rate 0.0%, latency p99 205ms ✓",
          "  Minute 10: error rate 0.0%, latency p99 198ms ✓",
          "",
          "Canary health check: ALL GREEN",
          "Stage 3: Canary — PASS",
        ],
        status: "pass",
        canaryPercent: 5,
        healthMetrics: [
          { label: "Error Rate", value: "0.0%", status: "ok" },
          { label: "Latency p99", value: "198ms", status: "ok" },
          { label: "Reply Rate", value: "13.9%", status: "ok" },
          { label: "Memory", value: "312MB", status: "ok" },
        ],
      },
      {
        id: "rollout-25",
        label: "Rollout 25%",
        description: "Expanding to 25% traffic. Holding 5 minutes.",
        duration: 1800,
        logs: [
          "Progressive rollout: 5% → 25%",
          "Kubernetes: scaling to 3 pods",
          "Istio: 75/25 split",
          "",
          "Health check (5 min hold)...",
          "  Error rate: 0.0% ✓",
          "  Latency p99: 201ms ✓",
          "  No anomaly alerts triggered",
          "Stage 4a: 25% — PASS",
        ],
        status: "pass",
        canaryPercent: 25,
      },
      {
        id: "rollout-50",
        label: "Rollout 50%",
        description: "Half of traffic on new version. 5 minute hold.",
        duration: 1800,
        logs: [
          "Progressive rollout: 25% → 50%",
          "Kubernetes: scaling to 5 pods",
          "Istio: 50/50 split",
          "",
          "Health check (5 min hold)...",
          "  Error rate: 0.0% ✓",
          "  Latency p99: 195ms ✓",
          "  Reply rate stable at 13.8% ✓",
          "Stage 4b: 50% — PASS",
        ],
        status: "pass",
        canaryPercent: 50,
      },
      {
        id: "rollout-100",
        label: "Rollout 100%",
        description: "Full traffic on v1.4.3. Old version draining.",
        duration: 1500,
        logs: [
          "Progressive rollout: 50% → 100%",
          "Kubernetes: old ReplicaSet scaling to 0",
          "Istio: 100% to v1.4.3",
          "Old pods drained gracefully (30s grace period)",
          "Stage 4c: 100% — DONE",
        ],
        status: "pass",
        canaryPercent: 100,
      },
      {
        id: "verify",
        label: "Post-Deploy Verify",
        description: "2-minute verification window. Querying anomaly alerts and failure rates.",
        duration: 2000,
        logs: [
          "Post-deployment verification (2 min window)...",
          "",
          "Checking anomaly_alerts since deploy time: 0 critical, 0 warning",
          "Checking workflow_steps failure rate: 0.1% (normal)",
          "Checking agent error rate: 0.0%",
          "Checking CRM sync health: 99.8%",
          "",
          "All checks passed.",
          "",
          "Deployment v1.4.3 marked as DEPLOYED",
          "deployment_history updated: status=deployed, health=healthy",
          "Triggered by: evolution_promotion",
          "",
          "━━━ DEPLOYMENT COMPLETE ━━━",
        ],
        status: "pass",
      },
    ];
  } else {
    // Rollback scenario
    return [
      ...common,
      {
        id: "canary",
        label: "Canary 5%",
        description: "Routing 5% of traffic to v1.4.4. Monitor Agent observing.",
        duration: 3500,
        logs: [
          "Deploying canary: 5% traffic → v1.4.4",
          "Kubernetes: new ReplicaSet created (1 pod)",
          "Istio VirtualService updated: 95/5 split",
          "Pod healthy: readiness probe passed",
          "",
          "Monitor Agent observing (10 min window)...",
          "  Minute 2: error rate 0.0%, latency p99 215ms ✓",
          "  Minute 4: error rate 0.3%, latency p99 340ms ⚠",
          "  Minute 5: error rate 1.2%, latency p99 890ms ⚠⚠",
          "  Minute 6: error rate 4.8%, latency p99 2100ms ✗✗✗",
          "",
          "ANOMALY DETECTED: Error rate 4.8% exceeds 2% threshold",
          "ANOMALY DETECTED: Latency p99 2100ms exceeds 500ms threshold",
          "Root cause: Anthropic SDK v0.81 changed streaming response format",
          "",
          "Canary health check: FAILED",
          "Stage 3: Canary — FAIL",
        ],
        status: "fail",
        canaryPercent: 5,
        healthMetrics: [
          { label: "Error Rate", value: "4.8%", status: "fail" },
          { label: "Latency p99", value: "2100ms", status: "fail" },
          { label: "Reply Rate", value: "2.1%", status: "fail" },
          { label: "Memory", value: "780MB", status: "warn" },
        ],
      },
      {
        id: "rollback",
        label: "Auto Rollback",
        description: "Canary failed. Deployment Agent automatically rolls back to previous version.",
        duration: 2500,
        logs: [
          "CANARY FAILED — initiating automatic rollback",
          "",
          "Rollback procedure:",
          "  1. Routing 100% traffic back to v1.4.3...",
          "  Istio: 100/0 split restored",
          "  2. Terminating v1.4.4 pods...",
          "  Kubernetes: new ReplicaSet scaled to 0",
          "  3. Verifying rollback health...",
          "  Error rate: 0.0% ✓ (recovered)",
          "  Latency p99: 195ms ✓ (recovered)",
          "",
          "Rollback complete in 8 seconds",
          "Zero user impact (only 5% canary traffic affected for ~4 minutes)",
        ],
        status: "rollback",
        canaryPercent: 0,
      },
      {
        id: "incident",
        label: "Incident Created",
        description: "Auto-generated incident report and debug session triggered.",
        duration: 2000,
        logs: [
          "Incident report auto-generated:",
          "  ID: INC-2026-0324-001",
          "  Severity: P2 (canary caught, no full-traffic impact)",
          "  Root cause: SDK breaking change in streaming response format",
          "  Duration: 4 minutes (canary only, 5% traffic)",
          "  User impact: ~12 requests saw errors",
          "",
          "Actions taken automatically:",
          "  1. Deployment v1.4.4 marked as ROLLED_BACK",
          "  2. Debug/Fix Agent notified — session DS-2026-0324-001 created",
          "  3. Renovate PR #153 flagged: 'breaking change detected'",
          "  4. Auto-deploy frozen for Anthropic SDK updates (requires manual review)",
          "",
          "Notification sent to engineering channel",
          "",
          "━━━ DEPLOYMENT ROLLED BACK — SYSTEM PROTECTED ━━━",
        ],
        status: "rollback",
      },
    ];
  }
}

// ─── Page ────────────────────────────────────────────────────────

export default function DeploySimPage() {
  const [scenario, setScenario] = useState<Scenario>("success");
  const [isRunning, setIsRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(-1);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [stepStatuses, setStepStatuses] = useState<Map<number, "pass" | "fail" | "rollback">>(new Map());
  const [logs, setLogs] = useState<{ text: string; time: string }[]>([]);
  const [currentCanary, setCurrentCanary] = useState(0);
  const [currentHealth, setCurrentHealth] = useState<DeployStep["healthMetrics"]>(undefined);
  const logRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef(false);

  const steps = getSteps(scenario);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const addLog = useCallback((text: string) => {
    const time = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" });
    setLogs(p => [...p, { text, time }]);
  }, []);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const run = useCallback(async () => {
    abortRef.current = false;
    setIsRunning(true);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setStepStatuses(new Map());
    setLogs([]);
    setCurrentCanary(0);
    setCurrentHealth(undefined);

    addLog(`Deployment pipeline started — Scenario: ${scenario === "success" ? "Successful Deploy" : "Failed Canary + Auto-Rollback"}`);
    addLog("");

    const steps = getSteps(scenario);
    for (let i = 0; i < steps.length; i++) {
      if (abortRef.current) break;
      const step = steps[i];
      setCurrentStep(i);

      if (step.canaryPercent !== undefined) setCurrentCanary(step.canaryPercent);
      if (step.healthMetrics) setCurrentHealth(step.healthMetrics);

      addLog(`[${step.label.toUpperCase()}] ${step.description}`);

      for (const line of step.logs) {
        if (abortRef.current) break;
        addLog(line ? `  ${line}` : "");
        await sleep(180);
      }

      if (abortRef.current) break;
      await sleep(Math.max(0, step.duration - step.logs.length * 180));

      setCompletedSteps(prev => new Set([...prev, i]));
      setStepStatuses(prev => new Map(prev).set(i, step.status === "info" ? "pass" : step.status));
      addLog("");
    }

    setIsRunning(false);
    if (!abortRef.current) setCurrentStep(steps.length);
  }, [scenario, addLog]);

  const reset = useCallback(() => {
    abortRef.current = true;
    setIsRunning(false);
    setCurrentStep(-1);
    setCompletedSteps(new Set());
    setStepStatuses(new Map());
    setLogs([]);
    setCurrentCanary(0);
    setCurrentHealth(undefined);
  }, []);

  const allDone = currentStep >= steps.length;
  const hadFailure = scenario === "rollback" && allDone;

  return (
    <div className="p-8 max-w-[1400px] space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Auto-Deploy Simulation</h1>
          <p className="text-[13px] text-zinc-500 mt-1">Watch the deployment pipeline: CI → Build → Canary → Progressive Rollout → Verify (or Auto-Rollback)</p>
        </div>
        <a href="/dashboard/autonomy" className="text-[12px] text-indigo-400 hover:text-indigo-300 transition-colors">&larr; Back</a>
      </div>

      {/* Scenario selector + controls */}
      <div className="card-elevated p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-zinc-500 font-medium">Scenario:</span>
            <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1">
              <button
                onClick={() => { setScenario("success"); reset(); }}
                className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${scenario === "success" ? "bg-emerald-500/20 text-emerald-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Successful Deploy
              </button>
              <button
                onClick={() => { setScenario("rollback"); reset(); }}
                className={`rounded-lg px-4 py-1.5 text-[12px] font-medium transition-all ${scenario === "rollback" ? "bg-rose-500/20 text-rose-400" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Failed Canary + Rollback
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            {!isRunning && !allDone && (
              <button onClick={run} className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-5 py-2 transition-all shadow-lg shadow-indigo-500/20">
                Start Deploy
              </button>
            )}
            {isRunning && (
              <span className="flex items-center gap-2 text-[13px] text-indigo-400">
                <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse-soft" />
                Pipeline running...
              </span>
            )}
            {allDone && (
              <button onClick={reset} className="bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 text-[13px] rounded-lg px-4 py-2 transition-all border border-white/[0.08]">
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Pipeline + content */}
      {(isRunning || allDone) && (
        <div className="grid grid-cols-[1fr_340px] gap-6">
          {/* Left */}
          <div className="space-y-5">
            {/* Pipeline steps */}
            <div className="card p-5 overflow-x-auto">
              <div className="flex items-start gap-0 min-w-max">
                {steps.map((step, i) => {
                  const done = completedSteps.has(i);
                  const active = currentStep === i && isRunning;
                  const status = stepStatuses.get(i);
                  const isFail = status === "fail" || status === "rollback";
                  return (
                    <div key={step.id} className="flex items-center shrink-0">
                      <div className="flex flex-col items-center gap-1.5 w-[85px]">
                        <div className={`h-9 w-9 rounded-full flex items-center justify-center transition-all duration-500 ${
                          active ? "bg-indigo-500 glow-indigo scale-110"
                          : done && isFail ? "bg-rose-500 glow-rose"
                          : done ? "bg-emerald-500 glow-emerald"
                          : "bg-zinc-800 border border-zinc-700/50"
                        }`}>
                          {done && !isFail && <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                          {done && isFail && <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                          {!done && <span className={`text-[11px] font-bold ${active ? "text-white animate-pulse-soft" : "text-zinc-600"}`}>{i + 1}</span>}
                        </div>
                        <span className={`text-[9px] text-center leading-tight font-medium ${
                          active ? "text-indigo-400"
                          : done && isFail ? "text-rose-400"
                          : done ? "text-emerald-400"
                          : "text-zinc-600"
                        }`}>{step.label}</span>
                      </div>
                      {i < steps.length - 1 && (
                        <div className={`h-[2px] w-3 mt-[-16px] shrink-0 rounded transition-all duration-500 ${
                          done && !isFail ? "bg-emerald-500/50"
                          : done && isFail ? "bg-rose-500/50"
                          : "bg-zinc-800"
                        }`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Canary progress */}
            {currentCanary > 0 && (
              <div className={`card p-5 transition-all duration-500 ${
                currentHealth?.some(h => h.status === "fail") ? "border-rose-500/20 glow-rose"
                : currentCanary === 100 ? "border-emerald-500/20 glow-emerald"
                : "border-amber-500/20 glow-amber"
              }`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-[13px] font-medium text-zinc-300">
                    {currentCanary === 0 ? "Rolled Back" : currentCanary === 100 ? "Fully Deployed" : `Canary: ${currentCanary}% traffic`}
                  </h3>
                  <span className={`text-[15px] font-bold tabular-nums ${
                    currentHealth?.some(h => h.status === "fail") ? "text-rose-400" : "text-emerald-400"
                  }`}>{currentCanary}%</span>
                </div>
                <div className="h-3 rounded-full bg-zinc-800 overflow-hidden mb-4">
                  <div className={`h-full rounded-full transition-all duration-700 ${
                    currentHealth?.some(h => h.status === "fail") ? "bg-rose-500" : currentCanary === 100 ? "bg-emerald-500" : "bg-amber-400"
                  }`} style={{ width: `${currentCanary}%` }} />
                </div>
                {currentHealth && (
                  <div className="grid grid-cols-4 gap-3">
                    {currentHealth.map(h => (
                      <div key={h.label} className="text-center">
                        <div className={`h-2 w-2 rounded-full mx-auto mb-1 ${
                          h.status === "ok" ? "bg-emerald-400" : h.status === "warn" ? "bg-amber-400" : "bg-rose-400 animate-pulse-soft"
                        }`} />
                        <p className="text-[10px] text-zinc-500">{h.label}</p>
                        <p className={`text-[12px] font-medium tabular-nums ${
                          h.status === "ok" ? "text-emerald-400" : h.status === "warn" ? "text-amber-400" : "text-rose-400"
                        }`}>{h.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* System log */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Deployment Log</h3>
              <div ref={logRef} className="bg-[#0a0a0c] border border-white/[0.04] rounded-xl p-4 h-[340px] overflow-y-auto font-mono text-[11px] leading-[1.8]">
                {logs.map((l, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="text-zinc-600 shrink-0 tabular-nums">{l.time}</span>
                    <span className={
                      l.text.includes("━━━") ? (hadFailure ? "text-rose-400 font-bold" : "text-emerald-400 font-bold")
                      : l.text.includes("FAIL") || l.text.includes("✗") || l.text.includes("ANOMALY") || l.text.includes("ROLLED BACK") ? "text-rose-400"
                      : l.text.includes("PASS") || l.text.includes("✓") || l.text.includes("DONE") || l.text.includes("COMPLETE") ? "text-emerald-400"
                      : l.text.includes("⚠") ? "text-amber-400"
                      : l.text.startsWith("[") ? "text-indigo-400 font-semibold"
                      : l.text.startsWith("  ") ? "text-zinc-500"
                      : "text-zinc-300"
                    }>{l.text}</span>
                  </div>
                ))}
                {isRunning && <div className="text-indigo-400 animate-pulse-soft ml-16">...</div>}
              </div>
            </div>

            {/* Final result cards */}
            {allDone && !hadFailure && (
              <div className="card p-5 border-emerald-500/20 glow-emerald">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-emerald-400">Deployment Successful</p>
                    <p className="text-[12px] text-zinc-400">v1.4.3 deployed to 100% traffic. All health checks passed. Zero downtime.</p>
                  </div>
                </div>
              </div>
            )}
            {allDone && hadFailure && (
              <div className="card p-5 border-amber-500/20 glow-amber">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" /></svg>
                  </div>
                  <div>
                    <p className="text-[15px] font-semibold text-amber-400">System Protected by Auto-Rollback</p>
                    <p className="text-[12px] text-zinc-400">Canary caught the issue at 5% traffic. Rolled back in 8 seconds. Only ~12 requests affected. Debug/Fix Agent notified.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right panel */}
          <div className="space-y-5">
            {/* Deploy info */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Deployment</h3>
              <div className="space-y-2.5 text-[12px]">
                <div className="flex justify-between"><span className="text-zinc-500">Version</span><code className="text-indigo-400 bg-indigo-500/10 rounded px-1.5 py-0.5 text-[11px]">{scenario === "success" ? "v1.4.3" : "v1.4.4"}</code></div>
                <div className="flex justify-between"><span className="text-zinc-500">Trigger</span><span className="text-zinc-200">{scenario === "success" ? "Evolution" : "Dependency update"}</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Strategy</span><span className="text-zinc-200">Canary → Progressive</span></div>
                <div className="divider" />
                <div className="flex justify-between">
                  <span className="text-zinc-500">Status</span>
                  {!allDone && isRunning && <span className="badge bg-indigo-500/10 text-indigo-400 text-[11px]"><span className="mr-1 h-1.5 w-1.5 rounded-full bg-indigo-400 animate-pulse-soft inline-block" />In progress</span>}
                  {allDone && !hadFailure && <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px]">Deployed</span>}
                  {allDone && hadFailure && <span className="badge bg-rose-500/10 text-rose-400 text-[11px]">Rolled back</span>}
                </div>
              </div>
            </div>

            {/* Pipeline stages */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Pipeline Progress</h3>
              <div className="space-y-2">
                {steps.map((step, i) => {
                  const done = completedSteps.has(i);
                  const active = currentStep === i && isRunning;
                  const status = stepStatuses.get(i);
                  const isFail = status === "fail" || status === "rollback";
                  return (
                    <div key={step.id} className="flex items-center gap-2.5">
                      <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                        done && isFail ? "bg-rose-500"
                        : done ? "bg-emerald-500"
                        : active ? "bg-indigo-500 animate-pulse-soft"
                        : "bg-zinc-800 border border-zinc-700"
                      }`}>
                        {done && !isFail && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        {done && isFail && <svg className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>}
                      </div>
                      <span className={`text-[11px] ${
                        done && isFail ? "text-rose-400" : done ? "text-emerald-400" : active ? "text-indigo-400 font-medium" : "text-zinc-600"
                      }`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safety info */}
            <div className="card p-5">
              <h3 className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-3">Safety Mechanisms</h3>
              <div className="space-y-2 text-[12px]">
                <div className="flex justify-between"><span className="text-zinc-500">Canary %</span><span className="text-zinc-200">5% initial</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Hold time</span><span className="text-zinc-200">5 min per stage</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Error threshold</span><span className="text-zinc-200">2% max</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Latency threshold</span><span className="text-zinc-200">500ms p99</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Auto-rollback</span><span className="text-emerald-400 font-medium">Enabled</span></div>
                <div className="flex justify-between"><span className="text-zinc-500">Max deploys/hr</span><span className="text-zinc-200">3</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
