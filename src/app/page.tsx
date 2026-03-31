"use client";

import { useState } from "react";
import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="border-b border-gray-800 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600" />
            <span className="text-xl font-bold">PalUp</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#how-it-works" className="text-sm text-gray-400 hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-gray-400 hover:text-white">
              Pricing
            </a>
            <Link
              href="/dashboard"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium hover:bg-violet-500"
            >
              Get Started
            </Link>
          </nav>
        </div>
      </header>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <main className="flex-1">
        <section className="px-6 py-24 text-center">
          <div className="mx-auto max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-violet-500/30 bg-violet-500/10 px-4 py-1.5 text-sm text-violet-300">
              <span className="h-2 w-2 rounded-full bg-violet-400 animate-pulse" />
              Autonomous Business Execution Platform
            </div>
            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-7xl">
              One sentence.
              <br />
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                Complete business.
              </span>
            </h1>
            <p className="mb-10 text-lg text-gray-400 md:text-xl">
              Describe your business goal — PalUp handles everything from market research
              to deployment, payments, and marketing. No technical skills needed.
            </p>
            <GoalInput />
          </div>
        </section>

        {/* ─── How It Works ─────────────────────────────────── */}
        <section id="how-it-works" className="border-t border-gray-800 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              From idea to revenue in minutes
            </h2>
            <div className="grid gap-8 md:grid-cols-4">
              {[
                { step: "01", title: "Describe Your Goal", desc: "Tell us what you want to achieve in one sentence." },
                { step: "02", title: "AI Plans Everything", desc: "Our agents decompose your goal into an executable plan." },
                { step: "03", title: "Auto Build & Deploy", desc: "Agents build your site, content, payments, and marketing." },
                { step: "04", title: "Earn Revenue", desc: "Your business goes live. Auto-debug and auto-optimize 24/7." },
              ].map((item) => (
                <div key={item.step} className="rounded-xl border border-gray-800 bg-gray-900 p-6">
                  <div className="mb-3 text-2xl font-bold text-violet-400">{item.step}</div>
                  <h3 className="mb-2 text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-gray-400">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Agent Capabilities ───────────────────────────── */}
        <section className="border-t border-gray-800 px-6 py-20">
          <div className="mx-auto max-w-6xl">
            <h2 className="mb-12 text-center text-3xl font-bold">
              Powered by specialized AI agents
            </h2>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                { name: "Market Research", desc: "Competitors, pricing, demographics" },
                { name: "Brand & Design", desc: "Name, logo, colors, guidelines" },
                { name: "Website Builder", desc: "Full site deployed in minutes" },
                { name: "Content Generation", desc: "Copy, blogs, social, ads" },
                { name: "Payment Processing", desc: "Stripe payments, subscriptions" },
                { name: "Marketing Automation", desc: "Ads, SEO, email campaigns" },
                { name: "Analytics & Reporting", desc: "Real-time business insights" },
                { name: "Legal & Compliance", desc: "ToS, Privacy Policy, GDPR" },
                { name: "Auto Debug & Fix", desc: "24/7 monitoring and auto-repair" },
              ].map((agent) => (
                <div key={agent.name} className="flex items-start gap-3 rounded-lg border border-gray-800 bg-gray-900/50 p-4">
                  <div className="mt-0.5 h-2 w-2 rounded-full bg-violet-400" />
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-400">{agent.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Pricing ──────────────────────────────────────── */}
        <section id="pricing" className="border-t border-gray-800 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="mb-12 text-center text-3xl font-bold">Simple, scalable pricing</h2>
            <div className="grid gap-6 md:grid-cols-4">
              {[
                { name: "Starter", price: 29, desc: "Solo entrepreneurs", features: ["1 active goal", "Basic agents", "1 GB storage"] },
                { name: "Growth", price: 99, desc: "Growing teams", features: ["5 active goals", "All agents", "10 GB storage", "Custom domain"], popular: true },
                { name: "Business", price: 299, desc: "Scaling businesses", features: ["25 active goals", "Priority support", "100 GB storage", "API access"] },
                { name: "Enterprise", price: null, desc: "Large organizations", features: ["Unlimited goals", "Dedicated infra", "SSO", "Custom SLA"] },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border p-6 ${
                    plan.popular
                      ? "border-violet-500 bg-violet-500/10"
                      : "border-gray-800 bg-gray-900"
                  }`}
                >
                  {plan.popular && (
                    <div className="mb-3 text-xs font-semibold uppercase text-violet-400">Most Popular</div>
                  )}
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                  <p className="mb-4 text-sm text-gray-400">{plan.desc}</p>
                  <div className="mb-6">
                    {plan.price ? (
                      <>
                        <span className="text-4xl font-bold">${plan.price}</span>
                        <span className="text-gray-400">/mo</span>
                      </>
                    ) : (
                      <span className="text-2xl font-bold">Custom</span>
                    )}
                  </div>
                  <ul className="mb-6 space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-300">
                        <svg className="h-4 w-4 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={`block w-full rounded-lg py-2 text-center text-sm font-medium ${
                      plan.popular
                        ? "bg-violet-600 hover:bg-violet-500"
                        : "bg-gray-800 hover:bg-gray-700"
                    }`}
                  >
                    {plan.price ? "Start Free Trial" : "Contact Sales"}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-gray-800 px-6 py-8 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} PalUp. Turn ideas into revenue.
      </footer>
    </div>
  );
}

function GoalInput() {
  const [goal, setGoal] = useState("");

  return (
    <div className="mx-auto flex max-w-2xl gap-3">
      <input
        type="text"
        value={goal}
        onChange={(e) => setGoal(e.target.value)}
        placeholder="I want to sell handmade candles online..."
        className="flex-1 rounded-xl border border-gray-700 bg-gray-900 px-5 py-4 text-lg placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      <Link
        href={`/dashboard?goal=${encodeURIComponent(goal)}`}
        className="flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-4 text-lg font-medium hover:bg-violet-500"
      >
        Launch
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
      </Link>
    </div>
  );
}
