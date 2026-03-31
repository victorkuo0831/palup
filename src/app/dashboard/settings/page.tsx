"use client";

import { useState } from "react";

// ─── Shared helpers ─────────────────────────────────────────

function removeTag(list: string[], item: string, setter: (v: string[]) => void) {
  setter(list.filter((t) => t !== item));
}

function addTag(list: string[], item: string, setter: (v: string[]) => void, reset: (v: string) => void) {
  const trimmed = item.trim();
  if (trimmed && !list.includes(trimmed)) setter([...list, trimmed]);
  reset("");
}

// ─── ICP Configuration ───────────────────────────────────────

function ICPSection() {
  const [industries, setIndustries] = useState(["SaaS", "E-commerce", "D2C"]);
  const [newIndustry, setNewIndustry] = useState("");
  const [companySize, setCompanySize] = useState("10-200 employees");
  const [revenue, setRevenue] = useState("$1M-$50M");
  const [geos, setGeos] = useState(["US", "CA", "UK"]);
  const [newGeo, setNewGeo] = useState("");

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-[15px] font-semibold text-zinc-200">ICP Configuration</h2>

      <div className="space-y-5">
        {/* Target Industries */}
        <div>
          <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Target Industries</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {industries.map((t) => (
              <span key={t} className="flex items-center gap-1.5 bg-white/[0.06] text-zinc-300 rounded-md px-2 py-0.5 text-[12px]">
                {t}
                <button onClick={() => removeTag(industries, t, setIndustries)} className="text-zinc-500 hover:text-zinc-300 transition-colors">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              value={newIndustry}
              onChange={(e) => setNewIndustry(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag(industries, newIndustry, setIndustries, setNewIndustry)}
              placeholder="Add industry..."
            />
            <button
              onClick={() => addTag(industries, newIndustry, setIndustries, setNewIndustry)}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Company Size + Revenue in 2-col */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Company Size</label>
            <input
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              value={companySize}
              onChange={(e) => setCompanySize(e.target.value)}
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Revenue Range</label>
            <input
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
            />
          </div>
        </div>

        {/* Geography */}
        <div>
          <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Geography</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {geos.map((g) => (
              <span key={g} className="flex items-center gap-1.5 bg-white/[0.06] text-zinc-300 rounded-md px-2 py-0.5 text-[12px]">
                {g}
                <button onClick={() => removeTag(geos, g, setGeos)} className="text-zinc-500 hover:text-zinc-300 transition-colors">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              value={newGeo}
              onChange={(e) => setNewGeo(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag(geos, newGeo, setGeos, setNewGeo)}
              placeholder="Add region..."
            />
            <button
              onClick={() => addTag(geos, newGeo, setGeos, setNewGeo)}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Rule Boundaries ─────────────────────────────────────────

function RuleBoundariesSection() {
  const [maxDiscount, setMaxDiscount] = useState(15);
  const [maxEmails, setMaxEmails] = useState(50);
  const [maxLinkedIn, setMaxLinkedIn] = useState(25);
  const [autoBudget, setAutoBudget] = useState(200);
  const [blacklist, setBlacklist] = useState(["acme-corp.com", "competitor.com"]);
  const [newDomain, setNewDomain] = useState("");

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-[15px] font-semibold text-zinc-200">Rule Boundaries</h2>

      <div className="space-y-5">
        {/* Max Discount */}
        <div>
          <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">
            Max Discount Without Approval
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={50}
              value={maxDiscount}
              onChange={(e) => setMaxDiscount(Number(e.target.value))}
              className="w-full max-w-sm accent-indigo-500"
            />
            <span className="text-[13px] font-medium tabular-nums text-indigo-400">{maxDiscount}%</span>
          </div>
        </div>

        {/* 2-col grid for number inputs */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Max Emails Per Day</label>
            <input
              type="number"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors tabular-nums"
              value={maxEmails}
              onChange={(e) => setMaxEmails(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Max LinkedIn / Day</label>
            <input
              type="number"
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors tabular-nums"
              value={maxLinkedIn}
              onChange={(e) => setMaxLinkedIn(Number(e.target.value))}
            />
          </div>
        </div>

        {/* Auto Budget */}
        <div>
          <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Auto-Approval Budget ($)</label>
          <input
            type="number"
            className="w-full max-w-xs bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors tabular-nums"
            value={autoBudget}
            onChange={(e) => setAutoBudget(Number(e.target.value))}
          />
        </div>

        {/* Blacklisted Domains */}
        <div>
          <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Blacklisted Domains</label>
          <div className="mb-2 flex flex-wrap gap-2">
            {blacklist.map((d) => (
              <span key={d} className="flex items-center gap-1.5 bg-white/[0.06] text-zinc-300 rounded-md px-2 py-0.5 text-[12px]">
                {d}
                <button onClick={() => setBlacklist(blacklist.filter((x) => x !== d))} className="text-zinc-500 hover:text-zinc-300 transition-colors">&times;</button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const trimmed = newDomain.trim();
                  if (trimmed && !blacklist.includes(trimmed)) setBlacklist([...blacklist, trimmed]);
                  setNewDomain("");
                }
              }}
              placeholder="Add domain..."
            />
            <button
              onClick={() => {
                const trimmed = newDomain.trim();
                if (trimmed && !blacklist.includes(trimmed)) setBlacklist([...blacklist, trimmed]);
                setNewDomain("");
              }}
              className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Integrations ────────────────────────────────────────────

interface Integration {
  name: string;
  connected: boolean;
}

function IntegrationsSection() {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { name: "HubSpot", connected: true },
    { name: "Gmail", connected: true },
    { name: "Google Calendar", connected: true },
    { name: "Salesforce", connected: false },
    { name: "Slack", connected: false },
    { name: "Stripe", connected: false },
  ]);

  const toggle = (name: string) =>
    setIntegrations(
      integrations.map((i) => (i.name === name ? { ...i, connected: !i.connected } : i)),
    );

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-[15px] font-semibold text-zinc-200">Integrations</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integ) => (
          <div
            key={integ.name}
            className="flex items-center justify-between rounded-xl bg-white/[0.02] border border-white/[0.04] p-4 transition-all duration-200 hover:bg-white/[0.04]"
          >
            <div className="flex items-center gap-3">
              {/* Icon placeholder: first letter in circle */}
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.06]">
                <span className="text-[13px] font-medium text-zinc-400">{integ.name[0]}</span>
              </div>
              <div>
                <p className="text-[13px] font-medium text-zinc-200">{integ.name}</p>
                <div className="mt-0.5 flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 rounded-full ${integ.connected ? "bg-emerald-400" : "bg-zinc-600"}`} />
                  <span className={`text-[11px] ${integ.connected ? "text-emerald-400" : "text-zinc-500"}`}>
                    {integ.connected ? "Connected" : "Not connected"}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => toggle(integ.name)}
              className={
                integ.connected
                  ? "bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
              }
            >
              {integ.connected ? "Disconnect" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Team & Permissions ──────────────────────────────────────

interface TeamMember {
  name: string;
  email: string;
  role: "Owner" | "Admin" | "Member" | "Viewer";
}

const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  Owner:  { bg: "bg-indigo-500/10", text: "text-indigo-400" },
  Admin:  { bg: "bg-violet-500/10", text: "text-violet-400" },
  Member: { bg: "bg-blue-500/10", text: "text-blue-400" },
  Viewer: { bg: "bg-zinc-500/10", text: "text-zinc-400" },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).join("").toUpperCase();
}

function TeamSection() {
  const members: TeamMember[] = [
    { name: "Alice Wang", email: "alice@palup.io", role: "Owner" },
    { name: "Ben Torres", email: "ben@palup.io", role: "Admin" },
    { name: "Chloe Nguyen", email: "chloe@palup.io", role: "Member" },
    { name: "Derek Kim", email: "derek@palup.io", role: "Viewer" },
  ];

  return (
    <div className="card p-6">
      <h2 className="mb-6 text-[15px] font-semibold text-zinc-200">Team &amp; Permissions</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/[0.04]">
              <th className="pb-3 pr-4 text-[11px] uppercase tracking-wider font-medium text-zinc-500">Name</th>
              <th className="pb-3 pr-4 text-[11px] uppercase tracking-wider font-medium text-zinc-500">Email</th>
              <th className="pb-3 text-[11px] uppercase tracking-wider font-medium text-zinc-500">Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => {
              const rc = ROLE_COLORS[m.role];
              return (
                <tr key={m.email} className="border-b border-white/[0.04] last:border-0">
                  <td className="py-3.5 pr-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.06]">
                        <span className="text-[10px] font-medium text-zinc-400">{getInitials(m.name)}</span>
                      </div>
                      <span className="text-[13px] text-zinc-200">{m.name}</span>
                    </div>
                  </td>
                  <td className="py-3.5 pr-4 text-[13px] text-zinc-400">{m.email}</td>
                  <td className="py-3.5">
                    <span className={`badge ${rc.bg} ${rc.text}`}>
                      {m.role}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-5">
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors">
          Invite Member
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Settings</h1>
        <p className="mt-1 text-[13px] text-zinc-500">Configure your sales agent platform</p>
      </div>

      <div className="space-y-5">
        <ICPSection />
        <RuleBoundariesSection />
        <IntegrationsSection />
        <TeamSection />
      </div>
    </div>
  );
}
