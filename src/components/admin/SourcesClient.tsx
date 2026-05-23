"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import SearchBar from "@/components/ui/SearchBar"
import StatusBadge from "@/components/admin/StatusBadge"
import type { Source, SourceType, SourceStatus } from "@/types"

// ─── Types & constants ────────────────────────────────────────────────────────

type StatusFilter  = "All" | SourceStatus
type ActionLoading = { id: string; action: "pause" | "resume" | "retry" | "automation" } | null
type ActionError   = { id: string; message: string } | null

type SourceFields = {
  name:        string
  url:         string
  type:        SourceType
  status:      SourceStatus
  description: string
}

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "All",    label: "All"    },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error",  label: "Error"  },
]

const SOURCE_TYPES: { value: SourceType; label: string }[] = [
  { value: "newsletter", label: "Newsletter" },
  { value: "blog",       label: "Blog"       },
  { value: "podcast",    label: "Podcast"    },
  { value: "social",     label: "Social"     },
  { value: "news",       label: "News"       },
  { value: "research",   label: "Research"   },
]

const SOURCE_STATUSES: { value: SourceStatus; label: string }[] = [
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "error",  label: "Error"  },
]

const ADD_DEFAULTS: SourceFields = {
  name:        "",
  url:         "",
  type:        "blog",
  status:      "active",
  description: "",
}

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-white " +
  "placeholder-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 " +
  "focus:ring-amber-400/30 disabled:opacity-50"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatChecked(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month:  "short",
    day:    "numeric",
    hour:   "numeric",
    minute: "2-digit",
    hour12: true,
  }).format(new Date(iso))
}

// ─── Source form panel (shared by add and edit) ───────────────────────────────

function SourceFormPanel({
  mode,
  initial,
  sourceId,
  onClose,
  onSaved,
}: {
  mode:      "add" | "edit"
  initial:   SourceFields
  sourceId?: string
  onClose:   () => void
  onSaved:   () => void
}) {
  const [fields,  setFields]  = useState<SourceFields>(initial)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)

  function set<K extends keyof SourceFields>(key: K, value: SourceFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      const endpoint = mode === "add"
        ? "/api/admin/sources"
        : `/api/admin/sources/${sourceId}`
      const res  = await fetch(endpoint, {
        method:  mode === "add" ? "POST" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          name:        fields.name,
          url:         fields.url,
          type:        fields.type,
          status:      fields.status,
          description: fields.description || null,
        }),
      })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setError(json.message ?? "Failed to save source.")
      } else {
        onSaved()
      }
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-amber-400/20 bg-zinc-900 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400/80">
          {mode === "add" ? "Add source" : "Edit source"}
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-600 transition-colors hover:text-white"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">

        {/* Name */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fields.name}
            onChange={(e) => set("name", e.target.value)}
            disabled={loading}
            className={inputCls}
            placeholder="e.g. MIT Technology Review"
          />
        </div>

        {/* URL */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            URL <span className="text-red-400">*</span>
          </label>
          <input
            type="url"
            value={fields.url}
            onChange={(e) => set("url", e.target.value)}
            disabled={loading}
            className={inputCls}
            placeholder="https://example.com"
          />
        </div>

        {/* Type + Status */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              value={fields.type}
              onChange={(e) => set("type", e.target.value as SourceType)}
              disabled={loading}
              className={inputCls}
            >
              {SOURCE_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Status
            </label>
            <select
              value={fields.status}
              onChange={(e) => set("status", e.target.value as SourceStatus)}
              disabled={loading}
              className={inputCls}
            >
              {SOURCE_STATUSES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Description
            <span className="ml-1 font-normal normal-case tracking-normal text-zinc-700">(optional)</span>
          </label>
          <textarea
            value={fields.description}
            onChange={(e) => set("description", e.target.value)}
            disabled={loading}
            rows={3}
            className={inputCls + " resize-none"}
            placeholder="Brief description of what this source covers"
          />
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-zinc-800/60 pt-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="inline-flex items-center rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {loading
              ? (mode === "add" ? "Adding…" : "Saving…")
              : (mode === "add" ? "Add source" : "Save changes")}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="text-xs text-zinc-600 transition-colors hover:text-zinc-400 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  sources: Source[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SourcesClient({ sources }: Props) {
  const router = useRouter()

  // ── State ────────────────────────────────────────────────────────────────────
  const [search,        setSearch]        = useState("")
  const [statusFilter,  setStatusFilter]  = useState<StatusFilter>("All")
  const [addingSource,  setAddingSource]  = useState(false)
  const [editingSource, setEditingSource] = useState<Source | null>(null)
  const [actionLoading, setActionLoading] = useState<ActionLoading>(null)
  const [actionError,   setActionError]   = useState<ActionError>(null)

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return sources.filter((source) => {
      const matchesStatus = statusFilter === "All" || source.status === statusFilter
      const matchesSearch =
        !q ||
        source.name.toLowerCase().includes(q) ||
        source.url.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [search, statusFilter, sources])

  // Summary counts — full dataset, not filtered
  const activeCount = sources.filter((s) => s.status === "active").length
  const pausedCount = sources.filter((s) => s.status === "paused").length
  const errorCount  = sources.filter((s) => s.status === "error").length

  // ── Panel handlers ────────────────────────────────────────────────────────
  function handleAddOpen() {
    setEditingSource(null)
    setActionError(null)
    setAddingSource(true)
  }

  function handleEditOpen(source: Source) {
    setAddingSource(false)
    setActionError(null)
    setEditingSource(source)
  }

  function handlePanelClose() {
    setAddingSource(false)
    setEditingSource(null)
  }

  function handleSaved() {
    router.refresh()
    handlePanelClose()
  }

  // ── Mutation handlers ─────────────────────────────────────────────────────
  async function handlePause(source: Source) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: source.id, action: "pause" })
    try {
      const res  = await fetch(`/api/admin/sources/${source.id}/pause`, { method: "POST" })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: source.id, message: json.message ?? "Failed to pause source." })
      } else {
        if (editingSource?.id === source.id) setEditingSource(null)
        router.refresh()
      }
    } catch {
      setActionError({ id: source.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleResume(source: Source) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: source.id, action: "resume" })
    try {
      const res  = await fetch(`/api/admin/sources/${source.id}/resume`, { method: "POST" })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: source.id, message: json.message ?? "Failed to resume source." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: source.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleToggleAutomation(source: Source) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: source.id, action: "automation" })
    try {
      const res  = await fetch(`/api/admin/sources/${source.id}/automation`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ automationEnabled: !source.automationEnabled }),
      })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: source.id, message: json.message ?? "Failed to update automation." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: source.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRetry(source: Source) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: source.id, action: "retry" })
    try {
      const res  = await fetch(`/api/admin/sources/${source.id}/retry`, { method: "POST" })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: source.id, message: json.message ?? "Failed to retry source." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: source.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Derived layout flag ───────────────────────────────────────────────────
  const showRightPanel = addingSource || !!editingSource

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

        {/* Add source button */}
        <div className="shrink-0">
          <button
            type="button"
            onClick={addingSource ? handlePanelClose : handleAddOpen}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            {addingSource ? (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Cancel
              </>
            ) : (
              <>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-3.5 w-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add source
              </>
            )}
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

      {/* ── Source list + right panel ────────────────────── */}
      <div
        className={
          showRightPanel
            ? "grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start"
            : ""
        }
      >
        {/* Source list */}
        {filtered.length > 0 ? (
          <ul role="list" className="space-y-3">
            {filtered.map((source) => {
              const isPausing   = actionLoading?.id === source.id && actionLoading.action === "pause"
              const isResuming  = actionLoading?.id === source.id && actionLoading.action === "resume"
              const isRetrying  = actionLoading?.id === source.id && actionLoading.action === "retry"
              const isToggling  = actionLoading?.id === source.id && actionLoading.action === "automation"
              const isEditing   = editingSource?.id === source.id
              const thisErr     = actionError?.id === source.id ? actionError.message : null

              return (
                <li
                  key={source.id}
                  className={[
                    "rounded-xl border bg-zinc-900 px-5 py-4 transition-colors duration-150",
                    isEditing
                      ? "border-amber-400/30"
                      : "border-zinc-800 hover:border-zinc-700",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                    {/* Left: identity + meta */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-white">{source.name}</p>
                        <StatusBadge status={source.status} />
                      </div>

                      {source.description && (
                        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">
                          {source.description}
                        </p>
                      )}

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
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span
                          className={[
                            "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                            source.automationEnabled
                              ? "bg-sky-400/10 text-sky-400"
                              : "bg-zinc-700/40 text-zinc-500",
                          ].join(" ")}
                        >
                          {source.automationEnabled ? "Automation on" : "Automation off"}
                        </span>
                      </div>

                      {/* Per-source action error */}
                      {thisErr && (
                        <p role="alert" className="mt-2 text-xs text-red-400">
                          {thisErr}
                        </p>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">

                      {/* View */}
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        View
                      </a>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          isEditing ? handlePanelClose() : handleEditOpen(source)
                        }
                        disabled={!!actionLoading}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          isEditing
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isEditing ? "Editing" : "Edit"}
                      </button>

                      {/* Automation on/off (scheduled checks only) */}
                      <button
                        type="button"
                        onClick={() => handleToggleAutomation(source)}
                        disabled={!!actionLoading}
                        title="Include this source in scheduled automation checks"
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          source.automationEnabled
                            ? "border-sky-700/50 bg-sky-900/20 text-sky-400 hover:bg-sky-900/40"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isToggling
                          ? "Saving…"
                          : source.automationEnabled
                            ? "Disable automation"
                            : "Enable automation"}
                      </button>

                      {/* Pause / Resume / Retry */}
                      {source.status === "paused" ? (
                        <button
                          type="button"
                          onClick={() => handleResume(source)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/40 disabled:opacity-50"
                        >
                          {isResuming ? "Resuming…" : "Resume"}
                        </button>
                      ) : source.status === "error" ? (
                        <button
                          type="button"
                          onClick={() => handleRetry(source)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-amber-700/50 bg-amber-900/20 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-900/40 disabled:opacity-50"
                        >
                          {isRetrying ? "Retrying…" : "Retry"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePause(source)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                        >
                          {isPausing ? "Pausing…" : "Pause"}
                        </button>
                      )}

                    </div>
                  </div>
                </li>
              )
            })}
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

        {/* ── Right panel: add or edit (sticky on lg+) ──── */}
        {showRightPanel && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {addingSource ? (
              <SourceFormPanel
                mode="add"
                initial={ADD_DEFAULTS}
                onClose={handlePanelClose}
                onSaved={handleSaved}
              />
            ) : editingSource ? (
              <SourceFormPanel
                mode="edit"
                initial={{
                  name:        editingSource.name,
                  url:         editingSource.url,
                  type:        editingSource.type,
                  status:      editingSource.status,
                  description: editingSource.description ?? "",
                }}
                sourceId={editingSource.id}
                onClose={handlePanelClose}
                onSaved={handleSaved}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* ── Footer note ─────────────────────────────────── */}
      <p className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-700">
        Sources are manually curated. Sources with automation enabled are included
        in scheduled automation checks; manual &ldquo;Run automation now&rdquo;
        always processes every active source.
      </p>

    </div>
  )
}
