"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import SearchBar from "@/components/ui/SearchBar"
import StatusBadge from "@/components/admin/StatusBadge"
import type { DraftStatus, ContentType, Topic, Draft, Source } from "@/types"

// ─── Types & constants ────────────────────────────────────────────────────────

type StatusFilter = "All" | DraftStatus

type EditFields = {
  title: string
  excerpt: string
  body: string
  topic: Topic
  type: ContentType
  sourceUrl: string
}

type ActionLoading = { id: string; action: "approve" | "reject" | "promote" } | null

type PromoteResult = { postId: string; slug: string; alreadyExists?: boolean }

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "All",      label: "All"      },
  { value: "pending",  label: "Pending"  },
  { value: "review",   label: "Review"   },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
]

const DRAFT_CONTENT_TYPES: { value: ContentType; label: string }[] = [
  { value: "insight", label: "Insight" },
  { value: "article", label: "Article" },
  { value: "news",    label: "News"    },
]

const ALL_TOPICS: Topic[] = [
  "AI Strategy",
  "Operations",
  "Automation",
  "Market Trends",
  "Leadership",
  "Case Study",
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function sourceNameById(sources: Source[], id?: string): string | null {
  if (!id) return null
  return sources.find((s) => s.id === id)?.name ?? null
}

// ─── Gemini model options ─────────────────────────────────────────────────────

const GEMINI_MODELS: { value: string; label: string }[] = [
  { value: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash-Lite — low cost"    },
  { value: "gemini-2.5-flash",      label: "Gemini 2.5 Flash — better quality"   },
]

// ─── Shared input class ───────────────────────────────────────────────────────

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white " +
  "placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 " +
  "focus:ring-1 focus:ring-zinc-600/50 disabled:opacity-50"

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({
  draft,
  onClose,
  onSaved,
}: {
  draft: Draft
  onClose: () => void
  onSaved: () => void
}) {
  const [fields, setFields] = useState<EditFields>({
    title:     draft.title,
    excerpt:   draft.excerpt,
    body:      draft.body,
    topic:     draft.topic,
    type:      draft.type,
    sourceUrl: draft.sourceUrl ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  function set(key: keyof EditFields, value: string) {
    setFields((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSave() {
    setError(null)
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/drafts/${draft.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:     fields.title,
          excerpt:   fields.excerpt,
          body:      fields.body,
          topic:     fields.topic,
          type:      fields.type,
          sourceUrl: fields.sourceUrl || undefined,
        }),
      })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setError(json.message ?? "Failed to save draft.")
        return
      }
      onSaved()
    } catch {
      setError("Network error. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-5">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
          Edit draft
        </p>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="text-zinc-600 transition-colors hover:text-white disabled:opacity-40"
          aria-label="Close edit panel"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="space-y-3">
        {/* Title */}
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Title <span className="text-amber-400/80">*</span>
          </label>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => set("title", e.target.value)}
            disabled={loading}
            className={inputCls}
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Excerpt <span className="text-amber-400/80">*</span>
          </label>
          <textarea
            value={fields.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            disabled={loading}
            rows={3}
            className={`${inputCls} resize-none`}
          />
        </div>

        {/* Body */}
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Body (markdown) <span className="text-amber-400/80">*</span>
          </label>
          <textarea
            value={fields.body}
            onChange={(e) => set("body", e.target.value)}
            disabled={loading}
            rows={8}
            className={`${inputCls} resize-y font-mono text-xs`}
          />
        </div>

        {/* Content type */}
        <div>
          <p className="mb-1.5 text-xs text-zinc-500">Content type</p>
          <div className="flex flex-wrap gap-1.5">
            {DRAFT_CONTENT_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                disabled={loading}
                onClick={() => set("type", value)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 disabled:opacity-50",
                  fields.type === value
                    ? "bg-zinc-700 text-white"
                    : "border border-zinc-700 text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Topic */}
        <div>
          <p className="mb-1.5 text-xs text-zinc-500">Topic</p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_TOPICS.map((topic) => (
              <button
                key={topic}
                type="button"
                disabled={loading}
                onClick={() => set("topic", topic)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 disabled:opacity-50",
                  fields.topic === topic
                    ? "bg-zinc-700 text-white"
                    : "border border-zinc-700 text-zinc-500 hover:text-zinc-300",
                ].join(" ")}
              >
                {topic}
              </button>
            ))}
          </div>
        </div>

        {/* Source URL */}
        <div>
          <label className="mb-1 block text-xs text-zinc-500">
            Source URL <span className="text-zinc-700">(optional)</span>
          </label>
          <input
            type="url"
            value={fields.sourceUrl}
            onChange={(e) => set("sourceUrl", e.target.value)}
            disabled={loading}
            placeholder="https://example.com/article"
            className={inputCls}
          />
        </div>

        {/* Error */}
        {error && (
          <p role="alert" className="text-xs text-red-400">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-zinc-800/60 pt-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={loading}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Saving…" : "Save changes"}
          </button>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Draft preview panel ──────────────────────────────────────────────────────

function DraftPreview({
  draft,
  sources,
  onClose,
  isGenerated = false,
}: {
  draft: Draft
  sources: Source[]
  onClose: () => void
  isGenerated?: boolean
}) {
  const sourceName = sourceNameById(sources, draft.sourceId)
  const bodyBlocks = draft.body.trim() ? draft.body.split(/\n\n+/).filter(Boolean) : []

  return (
    <div
      className={[
        "rounded-xl border p-5",
        isGenerated
          ? "border-amber-400/25 bg-amber-400/5"
          : "border-zinc-700/50 bg-zinc-900",
      ].join(" ")}
    >
      {/* Top row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          {isGenerated && (
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-400">
              Generated preview
            </p>
          )}
          <div className="flex flex-wrap items-center gap-1.5">
            <StatusBadge status={draft.status} />
            <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-xs capitalize text-zinc-400">
              {draft.type}
            </span>
            <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-xs text-zinc-400">
              {draft.topic}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 text-zinc-600 transition-colors hover:text-white"
          aria-label="Close preview"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <h3 className="text-sm font-bold leading-snug text-white">{draft.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{draft.excerpt}</p>

      <p className="mt-3 text-xs">
        <span className="text-zinc-600">Source: </span>
        {draft.sourceUrl ? (
          <a
            href={draft.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {sourceName ?? draft.sourceUrl}
          </a>
        ) : (
          <span className="text-zinc-500">
            {draft.sourceId ? (sourceName ?? "Unknown source") : "Manual input"}
          </span>
        )}
      </p>

      {bodyBlocks.length > 0 && (
        <div className="mt-4 border-t border-zinc-800 pt-4">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
            Body preview
          </p>
          <div className="space-y-2">
            {bodyBlocks.slice(0, 5).map((block, i) => {
              if (block.startsWith("## "))
                return <p key={i} className="text-xs font-semibold text-zinc-300">{block.slice(3)}</p>
              if (block.startsWith("### "))
                return <p key={i} className="text-xs font-medium text-zinc-400">{block.slice(4)}</p>
              return <p key={i} className="text-xs leading-relaxed text-zinc-500">{block}</p>
            })}
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-zinc-700">
        Created {formatDate(draft.createdAt)}
        {draft.updatedAt !== draft.createdAt && (
          <> · Updated {formatDate(draft.updatedAt)}</>
        )}
      </p>

      {isGenerated && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-800/60 pt-4">
          <button
            type="button"
            onClick={() => {}}
            className="inline-flex items-center rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
            Save as draft
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  drafts: Draft[]
  sources: Source[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function DraftsClient({ drafts, sources }: Props) {
  const router = useRouter()

  // ── Generator state ──────────────────────────────────────────────────────────
  const [genMode, setGenMode]           = useState<"url" | "text">("url")
  const [genInput, setGenInput]         = useState("")
  const [genType, setGenType]           = useState<ContentType>("insight")
  const [genTopic, setGenTopic]         = useState<Topic | "">("")
  const [genModel, setGenModel]         = useState("gemini-2.5-flash-lite")
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError]         = useState<string | null>(null)
  const [genSuccess, setGenSuccess]     = useState<string | null>(null)

  // ── List state ───────────────────────────────────────────────────────────────
  const [search, setSearch]               = useState("")
  const [statusFilter, setStatusFilter]   = useState<StatusFilter>("All")
  const [selectedDraft, setSelectedDraft] = useState<Draft | null>(null)
  const [editingDraft, setEditingDraft]   = useState<Draft | null>(null)

  // ── Mutation state ───────────────────────────────────────────────────────────
  const [actionLoading, setActionLoading]   = useState<ActionLoading>(null)
  const [actionError, setActionError]       = useState<{ id: string; message: string } | null>(null)
  const [promoteResults, setPromoteResults] = useState<Record<string, PromoteResult>>({})

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return drafts.filter((d) => {
      const matchesStatus = statusFilter === "All" || d.status === statusFilter
      const matchesSearch =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.excerpt.toLowerCase().includes(q)
      return matchesStatus && matchesSearch
    })
  }, [search, statusFilter, drafts])

  // ── Summary counts ───────────────────────────────────────────────────────────
  const reviewCount   = drafts.filter((d) => d.status === "review").length
  const pendingCount  = drafts.filter((d) => d.status === "pending").length
  const approvedCount = drafts.filter((d) => d.status === "approved").length

  // ── Generator handler — calls real Gemini API via server route ───────────────
  async function handleGenerate() {
    const trimmed = genInput.trim()
    if (!trimmed || isGenerating) return

    setIsGenerating(true)
    setGenError(null)
    setGenSuccess(null)

    try {
      const res = await fetch("/api/admin/drafts/generate", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:  genMode,
          input: trimmed,
          type:  genType,
          topic: genTopic || undefined,
          model: genModel,
        }),
      })

      const json = (await res.json()) as {
        success: boolean
        draftId?: string
        title?:   string
        message?: string
      }

      if (!json.success) {
        setGenError(json.message ?? "Generation failed. Please try again.")
        return
      }

      setGenSuccess(
        json.title
          ? `Draft created: "${json.title}"`
          : "Draft created successfully.",
      )
      setGenInput("")
      router.refresh()
    } catch {
      setGenError("Network error. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  // ── Edit handlers ────────────────────────────────────────────────────────────

  function handleEditOpen(draft: Draft) {
    setEditingDraft(draft)
    setSelectedDraft(null)  // close preview when editing
    setActionError(null)
  }

  function handleEditClose() {
    setEditingDraft(null)
  }

  function handleEditSaved() {
    setEditingDraft(null)
    router.refresh()
  }

  // ── Approve / reject handlers ─────────────────────────────────────────────────

  async function handleApprove(draft: Draft) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: draft.id, action: "approve" })
    try {
      const res = await fetch(`/api/admin/drafts/${draft.id}/approve`, { method: "POST" })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: draft.id, message: json.message ?? "Failed to approve draft." })
        return
      }
      // Clear preview if it was showing this draft
      if (selectedDraft?.id === draft.id) setSelectedDraft(null)
      router.refresh()
    } catch {
      setActionError({ id: draft.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleReject(draft: Draft) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: draft.id, action: "reject" })
    try {
      const res = await fetch(`/api/admin/drafts/${draft.id}/reject`, { method: "POST" })
      const json = (await res.json()) as { success: boolean; message?: string }
      if (!json.success) {
        setActionError({ id: draft.id, message: json.message ?? "Failed to reject draft." })
        return
      }
      if (selectedDraft?.id === draft.id) setSelectedDraft(null)
      router.refresh()
    } catch {
      setActionError({ id: draft.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Promote handler ───────────────────────────────────────────────────────────

  async function handlePromote(draft: Draft) {
    if (actionLoading) return
    setActionError(null)
    setActionLoading({ id: draft.id, action: "promote" })
    try {
      const res  = await fetch(`/api/admin/drafts/${draft.id}/promote`, { method: "POST" })
      const json = (await res.json()) as {
        success:       boolean
        postId?:       string
        slug?:         string
        alreadyExists?: boolean
        message?:      string
      }
      if (!json.success) {
        setActionError({ id: draft.id, message: json.message ?? "Failed to create post." })
      } else {
        setPromoteResults((prev) => ({
          ...prev,
          [draft.id]: {
            postId:       json.postId!,
            slug:         json.slug!,
            alreadyExists: json.alreadyExists,
          },
        }))
        router.refresh()
      }
    } catch {
      setActionError({ id: draft.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Right-panel visibility ────────────────────────────────────────────────────
  const showRightPanel = !!(editingDraft ?? selectedDraft)

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white">Drafts</h2>
        <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500">
          AI-assisted editorial drafts generated from trusted sources or manually provided text.
          Review and approve drafts before they become published posts.
        </p>
      </div>

      {/* ── Summary stats ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>
          <span className={`font-semibold ${reviewCount > 0 ? "text-amber-400" : "text-zinc-600"}`}>
            {reviewCount}
          </span>
          <span className="ml-1.5 text-zinc-500">{reviewCount === 1 ? "needs review" : "need review"}</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${pendingCount > 0 ? "text-zinc-300" : "text-zinc-600"}`}>
            {pendingCount}
          </span>
          <span className="ml-1.5 text-zinc-500">pending</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className="font-semibold text-emerald-400">{approvedCount}</span>
          <span className="ml-1.5 text-zinc-500">approved</span>
        </span>
      </div>

      {/* ── Workflow strip ────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-xs leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-400">Workflow: </span>
          Source or text
          <span className="mx-1.5 text-zinc-700">→</span>
          AI draft
          <span className="mx-1.5 text-zinc-700">→</span>
          Human review
          <span className="mx-1.5 text-zinc-700">→</span>
          Approval
          <span className="mx-1.5 text-zinc-700">→</span>
          Post publication
        </p>
      </div>

      {/* ── Generator panel ──────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Generate new draft
        </p>

        <div className="mb-4 flex gap-2">
          {(["url", "text"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => { setGenMode(mode); setGenInput("") }}
              className={[
                "rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
                genMode === mode
                  ? "bg-amber-400 text-zinc-950"
                  : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white",
              ].join(" ")}
            >
              {mode === "url" ? "Source URL" : "Raw text"}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {genMode === "url" ? (
            <input
              type="url"
              value={genInput}
              onChange={(e) => setGenInput(e.target.value)}
              placeholder="https://example.com/article-url"
              className="w-full rounded-xl border border-zinc-700/70 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500"
            />
          ) : (
            <textarea
              value={genInput}
              onChange={(e) => setGenInput(e.target.value)}
              placeholder="Paste article text, research summary, or notes…"
              rows={4}
              className="w-full resize-none rounded-xl border border-zinc-700/70 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors focus:border-zinc-500"
            />
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
            <div>
              <p className="mb-2 text-xs text-zinc-500">Content type</p>
              <div className="flex flex-wrap gap-1.5">
                {DRAFT_CONTENT_TYPES.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setGenType(value)}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                      genType === value
                        ? "bg-zinc-700 text-white"
                        : "border border-zinc-700 text-zinc-500 hover:text-zinc-300",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <p className="mb-2 text-xs text-zinc-500">
                Topic <span className="text-zinc-700">(optional)</span>
              </p>
              <div className="flex flex-wrap gap-1.5">
                {ALL_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    type="button"
                    onClick={() => setGenTopic((prev) => (prev === topic ? "" : topic))}
                    className={[
                      "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                      genTopic === topic
                        ? "bg-zinc-700 text-white"
                        : "border border-zinc-700 text-zinc-500 hover:text-zinc-300",
                    ].join(" ")}
                  >
                    {topic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Model selector */}
          <div>
            <p className="mb-2 text-xs text-zinc-500">AI model</p>
            <div className="flex flex-wrap gap-1.5">
              {GEMINI_MODELS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setGenModel(value)}
                  disabled={isGenerating}
                  className={[
                    "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 disabled:opacity-50",
                    genModel === value
                      ? "bg-zinc-700 text-white"
                      : "border border-zinc-700 text-zinc-500 hover:text-zinc-300",
                  ].join(" ")}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Error / success feedback */}
          {genError && (
            <p role="alert" className="text-xs text-red-400">
              {genError}
            </p>
          )}
          {genSuccess && (
            <p role="status" className="text-xs text-emerald-400">
              {genSuccess}{" "}
              <button
                type="button"
                onClick={() => setGenSuccess(null)}
                className="ml-1 text-zinc-600 transition-colors hover:text-zinc-400"
              >
                ✕
              </button>
            </p>
          )}

          <div>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!genInput.trim() || isGenerating}
              className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generating…
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Generate draft
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Controls: search + status filter ─────────────── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex-1">
          <SearchBar value={search} onChange={setSearch} placeholder="Search by title or excerpt…" />
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

      {/* ── Results count ─────────────────────────────────── */}
      <p className="text-xs text-zinc-600">
        Showing {filtered.length} {filtered.length === 1 ? "draft" : "drafts"}
      </p>

      {/* ── List + right panel ───────────────────────────── */}
      <div className={showRightPanel ? "grid gap-5 lg:grid-cols-[1fr_360px] lg:items-start" : ""}>

        {/* Draft list */}
        {filtered.length > 0 ? (
          <ul role="list" className="min-w-0 space-y-3">
            {filtered.map((draft) => {
              const isSelected    = selectedDraft?.id === draft.id
              const isEditing     = editingDraft?.id === draft.id
              const srcName       = sourceNameById(sources, draft.sourceId)
              const canDecide     = draft.status !== "approved" && draft.status !== "rejected"
              const isApproving   = actionLoading?.id === draft.id && actionLoading.action === "approve"
              const isRejecting   = actionLoading?.id === draft.id && actionLoading.action === "reject"
              const isPromoting   = actionLoading?.id === draft.id && actionLoading.action === "promote"
              const promoteResult = promoteResults[draft.id] ?? null
              const thisActionErr = actionError?.id === draft.id ? actionError.message : null

              return (
                <li
                  key={draft.id}
                  className={[
                    "rounded-xl border bg-zinc-900 px-5 py-4 transition-colors duration-150",
                    isEditing
                      ? "border-amber-400/40"
                      : isSelected
                      ? "border-amber-400/30"
                      : "border-zinc-800 hover:border-zinc-700",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                    {/* Left: content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-snug text-white">{draft.title}</p>
                        <StatusBadge status={draft.status} />
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {draft.excerpt}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 capitalize text-zinc-400">
                          {draft.type}
                        </span>
                        <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-zinc-400">
                          {draft.topic}
                        </span>
                        {(draft.sourceUrl || srcName) && (
                          <>
                            <span aria-hidden="true" className="text-zinc-700">·</span>
                            {draft.sourceUrl ? (
                              <a
                                href={draft.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="break-all text-zinc-600 transition-colors hover:text-zinc-300"
                              >
                                {srcName ?? draft.sourceUrl}
                              </a>
                            ) : (
                              <span className="text-zinc-600">{srcName}</span>
                            )}
                          </>
                        )}
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span className="text-zinc-600">{formatDate(draft.updatedAt)}</span>
                      </div>
                      {/* Inline action error */}
                      {thisActionErr && (
                        <p role="alert" className="mt-2 text-xs text-red-400">{thisActionErr}</p>
                      )}
                      {/* Promote success */}
                      {promoteResult && (
                        <p className="mt-2 text-xs text-emerald-400">
                          {promoteResult.alreadyExists
                            ? "Already a post. "
                            : "Post created. "}
                          <a
                            href="/admin/posts"
                            className="font-medium underline underline-offset-2 transition-colors hover:text-emerald-300"
                          >
                            View in Posts →
                          </a>
                        </p>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setSelectedDraft(null)
                          } else {
                            setSelectedDraft(draft)
                            setEditingDraft(null)
                          }
                        }}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          isSelected
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isSelected ? "Close" : "Preview"}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() => isEditing ? handleEditClose() : handleEditOpen(draft)}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                          isEditing
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>

                      {/* Approve */}
                      {canDecide && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleApprove(draft)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isApproving ? "Approving…" : "Approve"}
                          </button>

                          {/* Reject */}
                          <button
                            type="button"
                            onClick={() => handleReject(draft)}
                            disabled={!!actionLoading}
                            className="inline-flex items-center rounded-lg border border-red-700/50 bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-900/40 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {isRejecting ? "Rejecting…" : "Reject"}
                          </button>
                        </>
                      )}

                      {/* Create post — only for approved drafts */}
                      {draft.status === "approved" && (
                        <button
                          type="button"
                          onClick={() => handlePromote(draft)}
                          disabled={!!actionLoading || !!promoteResult}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-400 transition-colors hover:bg-amber-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isPromoting ? "Creating post…" : promoteResult ? "Post created ✓" : "Create post"}
                        </button>
                      )}
                    </div>

                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
            <p className="text-sm text-zinc-400">No drafts found.</p>
            <p className="mt-1 text-xs text-zinc-600">
              {search || statusFilter !== "All"
                ? "Try adjusting your search or filter."
                : "Use the generator above to create your first draft."}
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

        {/* ── Right panel (edit or preview, sticky on lg+) ── */}
        {showRightPanel && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {editingDraft ? (
              <EditPanel
                draft={editingDraft}
                onClose={handleEditClose}
                onSaved={handleEditSaved}
              />
            ) : selectedDraft ? (
              <DraftPreview
                draft={selectedDraft}
                sources={sources}
                onClose={() => setSelectedDraft(null)}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────── */}
      <p className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-700">
        Draft generation uses Google Gemini. Generated drafts appear in the list below with status &ldquo;review&rdquo;.
        Approve a draft, then click &ldquo;Create post&rdquo; to promote it to the Posts queue.
      </p>

    </div>
  )
}
