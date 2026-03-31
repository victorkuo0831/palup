"use client";

import { useState } from "react";
import { knowledgeEntries, type KnowledgeEntry, type KnowledgeType } from "@/lib/demo-data";

// ─── Constants ───────────────────────────────────────────────

const TYPE_COLORS: Record<KnowledgeType, { bg: string; text: string }> = {
  product:    { bg: "bg-blue-500/10", text: "text-blue-400" },
  competitor: { bg: "bg-rose-500/10", text: "text-rose-400" },
  playbook:   { bg: "bg-violet-500/10", text: "text-violet-400" },
  objection:  { bg: "bg-amber-500/10", text: "text-amber-400" },
};

const TABS: { label: string; value: KnowledgeType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Product", value: "product" },
  { label: "Competitor", value: "competitor" },
  { label: "Playbook", value: "playbook" },
  { label: "Objection", value: "objection" },
];

function formatDate(ts: string) {
  return new Date(ts).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ─── Knowledge Card ──────────────────────────────────────────

function KnowledgeCard({ entry }: { entry: KnowledgeEntry }) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(entry.content);
  const colors = TYPE_COLORS[entry.type];

  return (
    <div className="card transition-all duration-200">
      {/* Header row */}
      <div className="flex items-start justify-between gap-4 p-5 pb-0">
        <div className="flex items-center gap-3">
          <span className={`badge ${colors.bg} ${colors.text}`}>
            {entry.type}
          </span>
          <h3 className="text-[15px] font-medium text-zinc-200">{entry.title}</h3>
        </div>
        <span className="shrink-0 text-[11px] tabular-nums text-zinc-600">
          {formatDate(entry.updatedAt)}
        </span>
      </div>

      {/* Preview text */}
      {!expanded && !editing && (
        <div className="px-5 pt-2 pb-4">
          <p className="line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
            {entry.content}
          </p>
        </div>
      )}

      {/* Expanded content */}
      {expanded && !editing && (
        <div className="px-5 pt-3 pb-4">
          <div className="whitespace-pre-wrap rounded-xl bg-white/[0.02] p-5 text-[13px] leading-relaxed text-zinc-300">
            {entry.content}
          </div>
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="px-5 pt-3 pb-4">
          <textarea
            className="w-full rounded-xl bg-white/[0.04] border border-white/[0.08] p-4 text-[13px] leading-relaxed text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
            rows={8}
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 px-5 pb-4">
        <button
          onClick={() => { setExpanded(!expanded); setEditing(false); }}
          className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
        >
          {expanded || editing ? "Collapse" : "Expand"}
        </button>
        <button
          onClick={() => {
            if (editing) {
              setEditing(false);
              setExpanded(true);
            } else {
              setEditing(true);
              setExpanded(false);
            }
          }}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>
    </div>
  );
}

// ─── Add Entry Form ──────────────────────────────────────────

function AddEntryForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<KnowledgeType>("product");
  const [content, setContent] = useState("");

  return (
    <div className="card mb-6 border-indigo-500/20 p-5">
      <h3 className="mb-4 text-[15px] font-semibold text-zinc-200">Add New Entry</h3>

      <div className="mb-4">
        <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Title</label>
        <input
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Entry title"
        />
      </div>

      <div className="mb-4">
        <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Type</label>
        <select
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 focus:border-indigo-500/50 focus:outline-none transition-colors"
          value={type}
          onChange={(e) => setType(e.target.value as KnowledgeType)}
        >
          <option value="product">Product</option>
          <option value="competitor">Competitor</option>
          <option value="playbook">Playbook</option>
          <option value="objection">Objection</option>
        </select>
      </div>

      <div className="mb-5">
        <label className="mb-2 block text-[12px] uppercase tracking-wider text-zinc-500">Content</label>
        <textarea
          className="w-full bg-white/[0.04] border border-white/[0.08] rounded-lg px-3 py-2 text-[13px] text-zinc-200 placeholder-zinc-600 focus:border-indigo-500/50 focus:outline-none transition-colors"
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Entry content..."
        />
      </div>

      <div className="flex gap-2">
        <button className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors">
          Save Entry
        </button>
        <button
          onClick={onClose}
          className="bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 border border-white/[0.08] text-[13px] rounded-lg px-3 py-2 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [filter, setFilter] = useState<KnowledgeType | "all">("all");
  const [showForm, setShowForm] = useState(false);

  const filtered =
    filter === "all"
      ? knowledgeEntries
      : knowledgeEntries.filter((e) => e.type === filter);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-semibold tracking-tight text-zinc-200">Knowledge Base</h1>
          <p className="mt-1 text-[13px] text-zinc-500">Manage product knowledge, competitor intel, and sales playbooks</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-medium rounded-lg px-4 py-2 transition-colors"
        >
          {showForm ? "Close" : "Add New"}
        </button>
      </div>

      {/* Add form */}
      {showForm && <AddEntryForm onClose={() => setShowForm(false)} />}

      {/* Filter tabs */}
      <div className="inline-flex rounded-xl bg-white/[0.03] p-1">
        {TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-[13px] font-medium transition-all duration-200 ${
              filter === tab.value
                ? "bg-white/[0.08] text-zinc-200"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-3">
        {filtered.map((entry) => (
          <KnowledgeCard key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  );
}
