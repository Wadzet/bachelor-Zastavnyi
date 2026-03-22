"use client"

import { useState, useMemo } from "react"
import { mockSources } from "@/data/admin"
import SearchBar from "@/components/ui/SearchBar"
import StatusBadge from "@/components/admin/StatusBadge"
import type { SourceStatus } from "@/types"

// ─── Types ────────────────────────────────────────────────────────────────────

type StatusFilter = "All" | SourceStatus

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "All",    label: "All"    },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error",  label: "Error"  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChecked(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminSourcesPage() {
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return mockSources.filter((source) => {
      const matchesStatus = statusFilter === "All" || source.status === statusFilter
      const matchesSearch =
        !q ||
        source.name.toLowerCase().includes(q) ||
        source.url.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [search, statusFilter])

  // Summary counts — computed from full dataset, not filtered
  const activeCount = mockSources.filter((s) => s.status === "active").length
  const pausedCount = mockSources.filter((s) => s.status === "paused").length
  const errorCount  = mockSources.filter((s) => s.status === "error").length

  return (
    <div className="space-y-6">

      {/* ── Page header ─────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Sources</h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500">
            Trusted AI and business publications manually curated for the platform.
            The future AI agent will monitor these sources to generate editorial drafts.
          </p>
        </div>

        {/* Primary action — mock UI, no persistence yet */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {}}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add source
          </button>
        </div>
      </div>

      {/* ── Summary stats ───────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>
          <span className="font-semibold text-emerald-400">{activeCount}</span>
          <span className="ml-1.5 text-zinc-500">active</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${pausedCount > 0 ? "text-zinc-300" : "text-zinc-600"}`}>
            {pausedCount}
          </span>
          <span className="ml-1.5 text-zinc-500">paused</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${errorCount > 0 ? "text-red-400" : "text-zinc-600"}`}>
            {errorCount}
          </span>
          <span className="ml-1.5 text-zinc-500">{errorCount === 1 ? "error" : "errors"}</span>
        </span>
      </div>

      {/* ── Controls: search + status filter ────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by name or URL…"
          />
        </div>

        {/* Status filter pills — local to this page; not reusing FilterPills (typed to Topic) */}
        <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {STATUS_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setStatusFilter(value)}
              className={[
                "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
                statusFilter === value
                  ? "bg-amber-400 text-zinc-950"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ───────────────────────────────── */}
      <p className="text-xs text-zinc-600">
        Showing {filtered.length} {filtered.length === 1 ? "source" : "sources"}
      </p>

      {/* ── Source list ─────────────────────────────────── */}
      {filtered.length > 0 ? (
        <ul role="list" className="space-y-3">
          {filtered.map((source) => (
            <li
              key={source.id}
              className="rounded-xl border border-zinc-800 bg-zinc-900 px-5 py-4 transition-colors duration-150 hover:border-zinc-700"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                {/* Left: identity + meta */}
                <div className="min-w-0 flex-1">
                  {/* Name + status */}
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-white">{source.name}</p>
                    <StatusBadge status={source.status} />
                  </div>

                  {/* Description */}
                  {source.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                      {source.description}
                    </p>
                  )}

                  {/* URL · Type · Last checked */}
                  <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="break-all text-zinc-600 transition-colors hover:text-zinc-300"
                    >
                      {source.url}
                    </a>
                    <span aria-hidden="true" className="text-zinc-700">·</span>
                    <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 capitalize text-zinc-400">
                      {source.type}
                    </span>
                    <span aria-hidden="true" className="text-zinc-700">·</span>
                    <span className="text-zinc-600">
                      Checked {formatChecked(source.lastChecked)}
                    </span>
                  </div>
                </div>

                {/* Right: actions */}
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    View
                  </a>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => {}}
                    className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                  >
                    {source.status === "paused"
                      ? "Resume"
                      : source.status === "error"
                      ? "Retry"
                      : "Pause"}
                  </button>
                </div>

              </div>
            </li>
          ))}
        </ul>
      ) : (
        /* ── Empty state ──────────────────────────────── */
        <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
          <p className="text-sm text-zinc-400">No sources found.</p>
          <p className="mt-1 text-xs text-zinc-600">
            {search || statusFilter !== "All"
              ? "Try adjusting your search or filter."
              : "Add your first source to get started."}
          </p>
          {(search || statusFilter !== "All") && (
            <button
              type="button"
              onClick={() => { setSearch(""); setStatusFilter("All") }}
              className="mt-4 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* ── Footer note ─────────────────────────────────── */}
      <p className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-700">
        Source monitoring and automatic draft generation are not yet active.
        Sources are manually curated in this version.
      </p>

    </div>
  )
}
