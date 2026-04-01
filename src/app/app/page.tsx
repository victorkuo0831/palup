"use client";

import { useState, useRef, useEffect } from "react";

interface Prospect {
  company: string;
  website: string;
  industry: string;
  size: string;
  contactName: string;
  contactTitle: string;
  contactEmail: string;
  whyGoodFit: string;
  outreachMessage: string;
}

interface ICP {
  product: string;
  targetCustomer: string;
  icp: {
    industries?: string[];
    roles?: string[];
    companySize?: string;
    geography?: string;
  };
  searchStrategy: string;
}

interface Result {
  interpretation: ICP;
  prospects: Prospect[];
}

export default function AppHome() {
  const [goal, setGoal] = useState("");
  const [loading, setLoading] = useState(false);
  const [phase, setPhase] = useState<"idle" | "interpreting" | "prospecting" | "done">("idle");
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [expandedProspect, setExpandedProspect] = useState<number | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const handleSubmit = async () => {
    if (!goal.trim() || loading) return;
    setLoading(true);
    setError("");
    setResult(null);
    setExpandedProspect(null);
    setPhase("interpreting");

    try {
      const res = await fetch("/api/agent/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: goal.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        setPhase("idle");
        return;
      }

      setPhase("prospecting");
      await new Promise(r => setTimeout(r, 800));
      setResult(data);
      setPhase("done");
    } catch {
      setError("Connection failed. Please try again.");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero input */}
      <div className="card-elevated p-8 text-center">
        <h1 className="text-[24px] font-semibold tracking-tight text-zinc-100">
          What do you want to sell?
        </h1>
        <p className="text-[14px] text-zinc-500 mt-2 max-w-lg mx-auto">
          Describe your business in plain language. Your AI sales team will find real prospects and draft personalized outreach.
        </p>

        <div className="mt-6 max-w-2xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              placeholder='e.g. "I sell mountain bikes, find me customers"'
              disabled={loading}
              className="flex-1 rounded-xl border border-white/[0.08] bg-white/[0.04] px-5 py-3.5 text-[15px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors disabled:opacity-50"
            />
            <button
              onClick={handleSubmit}
              disabled={loading || !goal.trim()}
              className="shrink-0 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-[14px] font-semibold px-6 py-3.5 transition-all shadow-lg shadow-indigo-500/20"
            >
              {loading ? "Working..." : "Find Customers"}
            </button>
          </div>

          {phase === "idle" && !result && (
            <div className="flex flex-wrap justify-center gap-2 mt-4">
              {[
                "I sell organic skincare products to spas and hotels",
                "I run a SaaS for restaurant inventory management",
                "I offer corporate team building workshops",
                "I sell solar panels to commercial building owners",
              ].map((ex) => (
                <button
                  key={ex}
                  onClick={() => setGoal(ex)}
                  className="rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-1.5 text-[12px] text-zinc-500 hover:text-zinc-300 hover:border-white/[0.1] transition-all"
                >
                  {ex}
                </button>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="mt-4 mx-auto max-w-lg rounded-xl bg-rose-500/[0.08] border border-rose-500/20 px-4 py-3">
            <p className="text-[13px] text-rose-400">{error}</p>
          </div>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="card p-6">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <div className="h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <p className="text-[14px] font-medium text-zinc-200">
                {phase === "interpreting" && "Understanding your business..."}
                {phase === "prospecting" && "Finding real prospects for you..."}
              </p>
              <p className="text-[12px] text-zinc-500 mt-0.5">
                {phase === "interpreting" && "Analyzing your product, target market, and ideal customer profile"}
                {phase === "prospecting" && "Searching for companies that match your ideal customer profile"}
              </p>
            </div>
          </div>
          <div className="mt-5 space-y-3">
            <StepIndicator label="Interpret your goal" done={phase !== "interpreting"} active={phase === "interpreting"} />
            <StepIndicator label="Define ideal customer profile" done={phase === "prospecting" || phase === "done"} active={false} />
            <StepIndicator label="Find matching companies" done={phase === "done"} active={phase === "prospecting"} />
            <StepIndicator label="Draft personalized outreach" done={phase === "done"} active={false} />
          </div>
        </div>
      )}

      {/* Results */}
      {result && (
        <div ref={resultRef} className="space-y-6">
          {/* ICP */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <svg className="h-4 w-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-[15px] font-semibold text-zinc-200">Your AI Sales Agent understood your goal</h2>
                <p className="text-[12px] text-zinc-500">Here&apos;s the plan</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <InfoBlock label="What you sell" value={result.interpretation.product} />
              <InfoBlock label="Target customer" value={result.interpretation.targetCustomer} />
              <InfoBlock label="Industries" value={result.interpretation.icp?.industries?.join(", ") || "Various"} />
              <InfoBlock label="Strategy" value={result.interpretation.searchStrategy} />
            </div>
          </div>

          {/* Prospects */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[16px] font-semibold text-zinc-200">
                Found {result.prospects.length} prospects for you
              </h2>
              <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px]">Outreach ready</span>
            </div>
            <div className="space-y-3">
              {result.prospects.map((p, i) => (
                <ProspectCard
                  key={i}
                  prospect={p}
                  expanded={expandedProspect === i}
                  onToggle={() => setExpandedProspect(expandedProspect === i ? null : i)}
                />
              ))}
            </div>
          </div>

          {/* Next steps */}
          <div className="card p-6 border-indigo-500/20">
            <h3 className="text-[14px] font-semibold text-zinc-200 mb-3">What happens next</h3>
            <div className="space-y-2.5 text-[13px] text-zinc-400">
              <div className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">1</span>
                <span>Review the prospects above and click &quot;Send&quot; to approve outreach</span>
              </div>
              <div className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">2</span>
                <span>Your AI agent will send personalized emails and track responses</span>
              </div>
              <div className="flex gap-3">
                <span className="h-5 w-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-[11px] font-bold text-indigo-400 shrink-0">3</span>
                <span>When someone replies, your agent handles the conversation and books meetings</span>
              </div>
            </div>
          </div>

          <div className="text-center">
            <button
              onClick={() => { setResult(null); setPhase("idle"); setGoal(""); }}
              className="text-[13px] text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Try a different goal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function StepIndicator({ label, done, active }: { label: string; done: boolean; active: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`h-6 w-6 rounded-full flex items-center justify-center transition-all duration-500 ${
        done ? "bg-emerald-500" : active ? "bg-indigo-500 animate-pulse-soft" : "bg-zinc-800 border border-zinc-700"
      }`}>
        {done && <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
      </div>
      <span className={`text-[13px] ${done ? "text-emerald-400" : active ? "text-indigo-400 font-medium" : "text-zinc-600"}`}>{label}</span>
    </div>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-3.5">
      <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-1">{label}</p>
      <p className="text-[13px] text-zinc-300 leading-relaxed">{value}</p>
    </div>
  );
}

function ProspectCard({ prospect: p, expanded, onToggle }: {
  prospect: Prospect; expanded: boolean; onToggle: () => void;
}) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSending(false);
    setSent(true);
  };

  return (
    <div className={`card transition-all duration-200 cursor-pointer ${expanded ? "border-indigo-500/20" : "card-hover"}`} onClick={onToggle}>
      <div className="p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="h-11 w-11 rounded-xl bg-indigo-500/10 flex items-center justify-center text-[15px] font-bold text-indigo-400 shrink-0">
              {p.company.charAt(0)}
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-200">{p.company}</h3>
              <p className="text-[12px] text-zinc-500 mt-0.5">{p.contactName} &middot; {p.contactTitle}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="badge bg-white/[0.06] text-zinc-400 text-[10px]">{p.industry}</span>
                <span className="badge bg-white/[0.06] text-zinc-400 text-[10px]">{p.size}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {sent ? (
              <span className="badge bg-emerald-500/10 text-emerald-400 text-[11px]">Sent</span>
            ) : (
              <button onClick={handleSend} disabled={sending}
                className="rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-[12px] font-medium px-4 py-2 transition-all">
                {sending ? "Sending..." : "Send"}
              </button>
            )}
            <svg className={`h-4 w-4 text-zinc-600 transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
            </svg>
          </div>
        </div>
        <p className="text-[12px] text-zinc-500 mt-3 leading-relaxed">{p.whyGoodFit}</p>
      </div>

      {expanded && (
        <div className="px-5 pb-5">
          <div className="divider mb-4" />
          <p className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium mb-2">Draft outreach email</p>
          <div className="rounded-xl bg-white/[0.02] border border-white/[0.04] p-4">
            <pre className="text-[13px] text-zinc-300 leading-relaxed whitespace-pre-wrap font-sans">{p.outreachMessage}</pre>
          </div>
          <p className="text-[11px] text-zinc-600 mt-2">To: {p.contactEmail}</p>
        </div>
      )}
    </div>
  );
}
