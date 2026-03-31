"use client";

import { useState } from "react";

/* ─── Types ──────────────────────────────────────────────── */

interface ProductInfo {
  name: string;
  description: string;
  price: string;
  differentiator: string;
}

interface SalesRules {
  maxDiscount: number;
  maxEmailsPerDay: number;
  followUpDays: number;
  blockedDomains: string[];
}

interface ConnectedAccount {
  id: string;
  label: string;
  provider: string;
  initial: string;
  connected: boolean;
  color: string;
}

/* ─── Defaults ───────────────────────────────────────────── */

const DEFAULT_PRODUCT: ProductInfo = {
  name: "CloudSync",
  description: "Project management tool with real-time resource allocation",
  price: "$15/user/month",
  differentiator: "Real-time resource allocation + Jira/Slack integration",
};

const DEFAULT_RULES: SalesRules = {
  maxDiscount: 15,
  maxEmailsPerDay: 50,
  followUpDays: 3,
  blockedDomains: ["acme-corp.com"],
};

const ACCOUNTS: ConnectedAccount[] = [
  { id: "email", label: "Email", provider: "Gmail", initial: "G", connected: true, color: "from-red-500 to-red-600" },
  { id: "calendar", label: "Calendar", provider: "Google Calendar", initial: "C", connected: true, color: "from-blue-500 to-blue-600" },
  { id: "crm", label: "CRM", provider: "HubSpot", initial: "H", connected: true, color: "from-orange-500 to-orange-600" },
  { id: "linkedin", label: "LinkedIn", provider: "LinkedIn", initial: "L", connected: false, color: "from-sky-500 to-sky-600" },
];

/* ─── Component ──────────────────────────────────────────── */

export default function SettingsPage() {
  /* Product info state */
  const [product, setProduct] = useState<ProductInfo>(DEFAULT_PRODUCT);
  const [editingProduct, setEditingProduct] = useState(false);
  const [draft, setDraft] = useState<ProductInfo>(DEFAULT_PRODUCT);

  /* Sales rules state */
  const [rules, setRules] = useState<SalesRules>(DEFAULT_RULES);
  const [newDomain, setNewDomain] = useState("");

  /* Product edit handlers */
  const startEditing = () => {
    setDraft({ ...product });
    setEditingProduct(true);
  };

  const saveProduct = () => {
    setProduct({ ...draft });
    setEditingProduct(false);
  };

  const cancelEditing = () => {
    setEditingProduct(false);
  };

  /* Domain tag handlers */
  const addDomain = () => {
    const d = newDomain.trim().toLowerCase();
    if (d && !rules.blockedDomains.includes(d)) {
      setRules({ ...rules, blockedDomains: [...rules.blockedDomains, d] });
      setNewDomain("");
    }
  };

  const removeDomain = (domain: string) => {
    setRules({ ...rules, blockedDomains: rules.blockedDomains.filter((d) => d !== domain) });
  };

  return (
    <div className="space-y-10">
      {/* ─── Header ─────────────────────────────────────── */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Settings</h1>
        <p className="mt-2 text-lg text-zinc-400">
          Tell your AI sales team how to work
        </p>
      </div>

      {/* ─── Section 1: About Your Product ──────────────── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">About your product</h2>
        <div className="card-elevated p-6 space-y-5">
          {editingProduct ? (
            <>
              <Field label="Product name">
                <input
                  type="text"
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="settings-input"
                />
              </Field>
              <Field label="What it does">
                <textarea
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  rows={2}
                  className="settings-input resize-none"
                />
              </Field>
              <Field label="Price">
                <input
                  type="text"
                  value={draft.price}
                  onChange={(e) => setDraft({ ...draft, price: e.target.value })}
                  className="settings-input"
                />
              </Field>
              <Field label="What makes you different">
                <textarea
                  value={draft.differentiator}
                  onChange={(e) => setDraft({ ...draft, differentiator: e.target.value })}
                  rows={2}
                  className="settings-input resize-none"
                />
              </Field>
              <div className="flex gap-3 pt-1">
                <button
                  onClick={saveProduct}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
                >
                  Save changes
                </button>
                <button
                  onClick={cancelEditing}
                  className="rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.1] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <ReadOnlyField label="Product name" value={product.name} />
                <ReadOnlyField label="Price" value={product.price} />
                <ReadOnlyField label="What it does" value={product.description} span />
                <ReadOnlyField label="What makes you different" value={product.differentiator} span />
              </div>
              <button
                onClick={startEditing}
                className="mt-2 rounded-xl bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.1] transition-colors"
              >
                Edit
              </button>
            </>
          )}
        </div>
      </section>

      {/* ─── Section 2: Sales Rules ─────────────────────── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Sales rules</h2>
        <div className="card-elevated p-6 space-y-6">
          {/* Max discount */}
          <RuleRow
            label="Maximum discount agents can offer without asking you"
            hint="If a prospect asks for more, we'll check with you first."
            suffix="%"
            value={rules.maxDiscount}
            onChange={(v) => setRules({ ...rules, maxDiscount: v })}
          />

          <div className="divider" />

          {/* Max emails */}
          <RuleRow
            label="Maximum outreach emails per day"
            hint="Keeps your sending reputation healthy and avoids spam flags."
            suffix="emails"
            value={rules.maxEmailsPerDay}
            onChange={(v) => setRules({ ...rules, maxEmailsPerDay: v })}
          />

          <div className="divider" />

          {/* Follow-up timing */}
          <RuleRow
            label="Automatically follow up if no reply after"
            hint="We'll send a friendly nudge so prospects don't slip through the cracks."
            suffix="days"
            value={rules.followUpDays}
            onChange={(v) => setRules({ ...rules, followUpDays: v })}
          />

          <div className="divider" />

          {/* Blocked domains */}
          <div>
            <label className="block text-[15px] font-medium text-zinc-200">
              Companies to never contact
            </label>
            <p className="mt-1 text-sm text-zinc-500">
              Add domains of companies you have an existing relationship with or want to exclude.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {rules.blockedDomains.map((domain) => (
                <span
                  key={domain}
                  className="badge bg-white/[0.06] text-zinc-300 gap-1.5 pr-1.5"
                >
                  {domain}
                  <button
                    onClick={() => removeDomain(domain)}
                    className="ml-0.5 rounded-full p-0.5 text-zinc-500 hover:bg-white/[0.1] hover:text-zinc-300 transition-colors"
                    aria-label={`Remove ${domain}`}
                  >
                    <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addDomain()}
                placeholder="example.com"
                className="settings-input max-w-xs"
              />
              <button
                onClick={addDomain}
                className="rounded-xl bg-white/[0.06] px-4 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/[0.1] transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 3: Connected Accounts ──────────────── */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-white">Connected accounts</h2>
        <div className="card-elevated divide-y divide-white/[0.06]">
          {ACCOUNTS.map((account) => (
            <div key={account.id} className="flex items-center gap-4 px-6 py-4">
              {/* Icon circle */}
              <div
                className={`h-9 w-9 shrink-0 rounded-full bg-gradient-to-br ${account.color} flex items-center justify-center text-xs font-bold text-white`}
              >
                {account.initial}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-zinc-200">
                  {account.label}
                  <span className="ml-2 text-sm text-zinc-500">({account.provider})</span>
                </p>
              </div>

              {/* Status */}
              {account.connected ? (
                <span className="flex items-center gap-1.5 text-sm text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Connected
                </span>
              ) : (
                <button className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 transition-colors">
                  Connect
                </button>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

/* ─── Sub-components ──────────────────────────────────────── */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-zinc-400">{label}</label>
      {children}
    </div>
  );
}

function ReadOnlyField({ label, value, span }: { label: string; value: string; span?: boolean }) {
  return (
    <div className={span ? "sm:col-span-2" : ""}>
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-0.5 text-[15px] text-zinc-200">{value}</p>
    </div>
  );
}

function RuleRow({
  label,
  hint,
  suffix,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  suffix: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <label className="text-[15px] font-medium text-zinc-200">{label}</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={0}
            className="w-20 rounded-xl border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-center text-sm text-white tabular-nums focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
          />
          <span className="text-sm text-zinc-500">{suffix}</span>
        </div>
      </div>
      <p className="mt-1.5 text-sm text-zinc-500">{hint}</p>
    </div>
  );
}
