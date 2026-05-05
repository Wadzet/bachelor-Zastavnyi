"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { BRAND } from "@/config/brand"
import SearchBar from "@/components/ui/SearchBar"
import StatusBadge from "@/components/admin/StatusBadge"
import type { PostStatus, TelegramStatus, LinkedInStatus, Post } from "@/types"

// ─── Types & constants ────────────────────────────────────────────────────────

type PostStatusFilter = "All" | PostStatus
type TelegramFilter   = "All" | TelegramStatus
type LinkedInFilter   = "All" | LinkedInStatus
type PreviewMode      = "post" | "telegram" | "linkedin"

type ActionLoading = { id: string; action: string } | null
type ActionError   = { id: string; message: string } | null

type EditFields = {
  title:      string
  excerpt:    string
  slug:       string
  topic:      string
  type:       string
  body:       string
  featured:   boolean
  coverImage: string
}

const POST_STATUS_FILTERS: { value: PostStatusFilter; label: string }[] = [
  { value: "All",       label: "All"       },
  { value: "draft",     label: "Draft"     },
  { value: "review",    label: "Review"    },
  { value: "published", label: "Published" },
  { value: "archived",  label: "Archived"  },
]

const TELEGRAM_FILTERS: { value: TelegramFilter; label: string }[] = [
  { value: "All",       label: "All"       },
  { value: "ready",     label: "Ready"     },
  { value: "scheduled", label: "Scheduled" },
  { value: "sent",      label: "Sent"      },
  { value: "failed",    label: "Failed"    },
]

const LINKEDIN_FILTERS: { value: LinkedInFilter; label: string }[] = [
  { value: "All",       label: "All"       },
  { value: "ready",     label: "Ready"     },
  { value: "sent",      label: "Shared"    },
  { value: "failed",    label: "Failed"    },
]

const VALID_TOPICS_EDIT = [
  "AI Strategy",
  "Operations",
  "Leadership",
  "Automation",
  "Case Study",
  "Market Trends",
] as const

const VALID_TYPES_EDIT = [
  { value: "insight",   label: "Insight"   },
  { value: "interview", label: "Interview" },
  { value: "article",   label: "Article"   },
  { value: "news",      label: "News"      },
]

const BRAND_DOMAIN = BRAND.siteUrl

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-xs text-white " +
  "placeholder-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 " +
  "focus:ring-amber-400/30 disabled:opacity-50"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(iso))
}

function publicUrlPath(post: Post): string {
  if (post.type === "interview") return `/interviews/${post.slug}`
  return `/insights/${post.slug}`
}

function buildTelegramMessage(post: Post): string {
  const label   = post.type === "article" ? "article" : "insight"
  const url     = `${BRAND_DOMAIN}${publicUrlPath(post)}`
  const excerpt =
    post.excerpt.length > 140 ? post.excerpt.slice(0, 137) + "…" : post.excerpt
  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${post.title}\n\n` +
    `${excerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

function buildLinkedInText(post: Post): string {
  const url     = `${BRAND_DOMAIN}${publicUrlPath(post)}`
  const excerpt =
    post.excerpt.length > 200 ? post.excerpt.slice(0, 197) + "…" : post.excerpt
  return (
    `${post.title}\n\n` +
    `${excerpt}\n\n` +
    `Read more: ${url}\n\n` +
    `#AI #BusinessStrategy #Operations #DigitalTransformation`
  )
}

function buildLinkedInShareUrl(post: Post): string {
  const url = `${BRAND_DOMAIN}${publicUrlPath(post)}`
  return `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
}

// ─── Edit panel ───────────────────────────────────────────────────────────────

function EditPanel({
  post,
  onClose,
  onSaved,
}: {
  post: Post
  onClose: () => void
  onSaved: () => void
}) {
  const [fields, setFields] = useState<EditFields>({
    title:      post.title,
    excerpt:    post.excerpt,
    slug:       post.slug,
    topic:      post.topic,
    type:       post.type,
    body:       post.body      ?? "",
    featured:   post.featured  ?? false,
    coverImage: post.coverImage ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [saved,   setSaved]   = useState(false)

  function set<K extends keyof EditFields>(key: K, value: EditFields[K]) {
    setFields((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave() {
    setLoading(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch(`/api/admin/posts/${post.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title:      fields.title,
          excerpt:    fields.excerpt,
          slug:       fields.slug,
          topic:      fields.topic,
          type:       fields.type,
          body:       fields.body,
          featured:   fields.featured,
          coverImage: fields.coverImage || null,
        }),
      })
      const json = await res.json()
      if (!json.success) {
        setError(json.message ?? "Failed to save.")
      } else {
        setSaved(true)
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
          Edit post
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-zinc-600 transition-colors hover:text-white"
          aria-label="Close edit panel"
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

        {/* Title */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fields.title}
            onChange={(e) => set("title", e.target.value)}
            disabled={loading}
            className={inputCls}
            placeholder="Post title"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Excerpt <span className="text-red-400">*</span>
          </label>
          <textarea
            value={fields.excerpt}
            onChange={(e) => set("excerpt", e.target.value)}
            disabled={loading}
            rows={3}
            className={inputCls + " resize-none"}
            placeholder="Short description shown in listings"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Slug <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={fields.slug}
            onChange={(e) => set("slug", e.target.value)}
            disabled={loading}
            className={inputCls + " font-mono"}
            placeholder="url-safe-slug"
          />
          <p className="mt-1 text-[10px] text-zinc-700">
            Lowercase letters, numbers, hyphens only
          </p>
        </div>

        {/* Type + Topic */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Type <span className="text-red-400">*</span>
            </label>
            <select
              value={fields.type}
              onChange={(e) => set("type", e.target.value)}
              disabled={loading}
              className={inputCls}
            >
              {VALID_TYPES_EDIT.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Topic <span className="text-red-400">*</span>
            </label>
            <select
              value={fields.topic}
              onChange={(e) => set("topic", e.target.value)}
              disabled={loading}
              className={inputCls}
            >
              {VALID_TOPICS_EDIT.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Body — non-interview only */}
        {fields.type !== "interview" ? (
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
              Body (Markdown) <span className="text-red-400">*</span>
            </label>
            <textarea
              value={fields.body}
              onChange={(e) => set("body", e.target.value)}
              disabled={loading}
              rows={8}
              className={inputCls + " resize-y font-mono text-[11px]"}
              placeholder={"# Heading\n\nYour content here…"}
            />
          </div>
        ) : (
          <p className="rounded-lg bg-zinc-800/40 px-3 py-2 text-[11px] text-zinc-600">
            Interview Q&amp;A editing is not yet supported. You can edit the title,
            excerpt, slug, topic, featured, and cover image.
          </p>
        )}

        {/* Cover image */}
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Cover Image URL
          </label>
          <input
            type="text"
            value={fields.coverImage}
            onChange={(e) => set("coverImage", e.target.value)}
            disabled={loading}
            className={inputCls}
            placeholder="https://…"
          />
        </div>

        {/* Featured */}
        <label className="flex cursor-pointer items-center gap-2">
          <input
            type="checkbox"
            checked={fields.featured}
            onChange={(e) => set("featured", e.target.checked)}
            disabled={loading}
            className="h-3.5 w-3.5 accent-amber-400"
          />
          <span className="text-xs text-zinc-400">Featured post</span>
        </label>

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
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center rounded-full bg-amber-400 px-4 py-1.5 text-xs font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {loading ? "Saving…" : saved ? "Saved ✓" : "Save changes"}
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

// ─── Post preview panel ───────────────────────────────────────────────────────

function PostPreviewPanel({ post, onClose }: { post: Post; onClose: () => void }) {
  const path = publicUrlPath(post)

  return (
    <div className="rounded-xl border border-zinc-700/50 bg-zinc-900 p-5">
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusBadge status={post.status} />
          {post.telegramStatus && <StatusBadge status={post.telegramStatus} />}
          {post.linkedinStatus && <StatusBadge status={post.linkedinStatus} />}
          <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-xs capitalize text-zinc-400">
            {post.type}
          </span>
          <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-xs text-zinc-400">
            {post.topic}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 text-zinc-600 transition-colors hover:text-white"
          aria-label="Close preview"
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

      {/* Title + excerpt */}
      <h3 className="text-sm font-bold leading-snug text-white">{post.title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{post.excerpt}</p>

      {/* Slug + URL */}
      <div className="mt-3 space-y-1.5 text-xs">
        <p>
          <span className="text-zinc-600">Slug: </span>
          <span className="break-all font-mono text-zinc-500">{post.slug}</span>
        </p>
        <p>
          <span className="text-zinc-600">Public URL: </span>
          {post.status === "published" ? (
            <a
              href={path}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all font-mono text-amber-400/80 transition-colors hover:text-amber-400"
            >
              {path} ↗
            </a>
          ) : (
            <span className="break-all font-mono text-zinc-600">{path}</span>
          )}
        </p>
      </div>

      {/* Dates */}
      <div className="mt-3 space-y-0.5 text-xs text-zinc-700">
        {post.publishedAt && <p>Published {formatDate(post.publishedAt)}</p>}
        <p>Updated {formatDate(post.updatedAt)}</p>
      </div>
    </div>
  )
}

// ─── Telegram preview panel ───────────────────────────────────────────────────

function TelegramPreviewPanel({
  post,
  onClose,
  onReady,
  onSend,
  isLoading,
  error,
}: {
  post:      Post
  onClose:   () => void
  onReady:   () => void
  onSend:    () => void
  isLoading: boolean
  error:     string | null
}) {
  const message  = buildTelegramMessage(post)
  const tgStatus = post.telegramStatus

  return (
    <div className="rounded-xl border border-blue-400/15 bg-blue-950/20 p-5">
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-400">
            Telegram preview
          </p>
          {tgStatus && <StatusBadge status={tgStatus} />}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 text-zinc-600 transition-colors hover:text-white"
          aria-label="Close preview"
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

      {/* Message preview */}
      <div className="rounded-lg bg-zinc-800/80 px-4 py-3">
        <p className="whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-zinc-300">
          {message}
        </p>
      </div>

      {/* Note for unpublished posts */}
      {post.status !== "published" && (
        <p className="mt-3 text-xs text-amber-500/70">
          This post isn&apos;t published yet. Publish it before distributing via Telegram.
        </p>
      )}

      {/* Inline error */}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        {tgStatus === "sent" ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Already sent to Telegram
          </div>
        ) : tgStatus === "scheduled" ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            Scheduled for delivery
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {/* Primary action: changes label based on current telegram status */}
            <button
              type="button"
              disabled={isLoading || post.status !== "published"}
              onClick={
                tgStatus === "ready" || tgStatus === "failed"
                  ? onSend
                  : onReady
              }
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-4 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {tgStatus === "ready" || tgStatus === "failed" ? "Sending…" : "Marking ready…"}
                </>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                  {tgStatus === "ready"
                    ? "Send to Telegram"
                    : tgStatus === "failed"
                    ? "Retry send"
                    : "Mark as ready"}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── LinkedIn preview panel ───────────────────────────────────────────────────
// No LinkedIn API calls — distribution is manual for MVP.
// Admin copies the generated text, opens LinkedIn share, and manually pastes.

function LinkedInPreviewPanel({
  post,
  onClose,
  onReady,
  onShared,
  isLoading,
  error,
}: {
  post:      Post
  onClose:   () => void
  onReady:   () => void
  onShared:  () => void
  isLoading: boolean
  error:     string | null
}) {
  const [copied, setCopied] = useState(false)
  const text     = buildLinkedInText(post)
  const shareUrl = buildLinkedInShareUrl(post)
  const liStatus = post.linkedinStatus

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API unavailable (non-HTTPS dev context) — fail silently
    }
  }

  return (
    <div className="rounded-xl border border-sky-400/15 bg-sky-950/20 p-5">
      {/* Header row */}
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-sky-400">
            LinkedIn preview
          </p>
          {liStatus && <StatusBadge status={liStatus} />}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-0.5 shrink-0 text-zinc-600 transition-colors hover:text-white"
          aria-label="Close LinkedIn preview"
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

      {/* Text preview */}
      <div className="rounded-lg bg-zinc-800/80 px-4 py-3">
        <p className="whitespace-pre-wrap break-words font-mono text-[11px] leading-relaxed text-zinc-300">
          {text}
        </p>
      </div>

      {/* Note for unpublished posts */}
      {post.status !== "published" && (
        <p className="mt-3 text-xs text-amber-500/70">
          This post isn&apos;t published yet. Publish it before distributing via LinkedIn.
        </p>
      )}

      {/* Manual workflow note */}
      <p className="mt-3 text-[11px] leading-relaxed text-zinc-600">
        Copy the text above, then open LinkedIn to paste and share manually.
        Click &ldquo;Mark as shared&rdquo; after posting to record the distribution.
      </p>

      {/* Inline error */}
      {error && (
        <p role="alert" className="mt-3 text-xs text-red-400">
          {error}
        </p>
      )}

      {/* Actions */}
      <div className="mt-4 border-t border-zinc-800/60 pt-4">
        {liStatus === "sent" ? (
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3.5 w-3.5 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Already shared on LinkedIn
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">

            {/* Copy text */}
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-600/50 bg-zinc-800/60 px-4 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:bg-zinc-700/60"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                />
              </svg>
              {copied ? "Copied!" : "Copy text"}
            </button>

            {/* Open LinkedIn share */}
            <a
              href={shareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-4 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                />
              </svg>
              Open LinkedIn ↗
            </a>

            {/* Mark LinkedIn ready (if no status yet) */}
            {!liStatus && (
              <button
                type="button"
                disabled={isLoading || post.status !== "published"}
                onClick={onReady}
                className="inline-flex items-center gap-1.5 rounded-full border border-sky-500/30 bg-sky-500/15 px-4 py-1.5 text-xs font-semibold text-sky-300 transition-colors hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Marking ready…
                  </>
                ) : "Mark LinkedIn ready"}
              </button>
            )}

            {/* Mark as shared (once ready) */}
            {liStatus === "ready" && (
              <button
                type="button"
                disabled={isLoading}
                onClick={onShared}
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="h-3 w-3 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Saving…
                  </>
                ) : (
                  <>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-3 w-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Mark as shared
                  </>
                )}
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  posts: Post[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function PostsClient({ posts }: Props) {
  const router = useRouter()

  // ── State ────────────────────────────────────────────────────────────────────
  const [search, setSearch]                 = useState("")
  const [statusFilter, setStatusFilter]     = useState<PostStatusFilter>("All")
  const [telegramFilter, setTelegramFilter] = useState<TelegramFilter>("All")
  const [linkedinFilter, setLinkedinFilter] = useState<LinkedInFilter>("All")
  const [selectedPost, setSelectedPost]     = useState<Post | null>(null)
  const [previewMode, setPreviewMode]       = useState<PreviewMode>("post")
  const [editingPost, setEditingPost]       = useState<Post | null>(null)
  const [actionLoading, setActionLoading]   = useState<ActionLoading>(null)
  const [actionError, setActionError]       = useState<ActionError>(null)

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return posts.filter((p) => {
      const matchesStatus   = statusFilter === "All" || p.status === statusFilter
      const matchesTelegram = telegramFilter === "All" || p.telegramStatus === telegramFilter
      const matchesLinkedIn = linkedinFilter === "All" || p.linkedinStatus === linkedinFilter
      const matchesSearch   =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      return matchesStatus && matchesTelegram && matchesLinkedIn && matchesSearch
    })
  }, [search, statusFilter, telegramFilter, linkedinFilter, posts])

  // ── Summary counts — full dataset, not filtered ──────────────────────────────
  const publishedCount = posts.filter((p) => p.status === "published").length
  const reviewCount    = posts.filter((p) => p.status === "review").length
  const telegramReady  = posts.filter((p) => p.telegramStatus === "ready").length
  const linkedinReady  = posts.filter((p) => p.linkedinStatus === "ready").length

  // ── Panel handlers ───────────────────────────────────────────────────────────
  function handlePreview(post: Post) {
    setEditingPost(null)
    if (selectedPost?.id === post.id && previewMode === "post") {
      setSelectedPost(null)
    } else {
      setSelectedPost(post)
      setPreviewMode("post")
    }
  }

  function handleTelegram(post: Post) {
    setEditingPost(null)
    if (selectedPost?.id === post.id && previewMode === "telegram") {
      setSelectedPost(null)
    } else {
      setSelectedPost(post)
      setPreviewMode("telegram")
    }
  }

  function handleLinkedIn(post: Post) {
    setEditingPost(null)
    if (selectedPost?.id === post.id && previewMode === "linkedin") {
      setSelectedPost(null)
    } else {
      setSelectedPost(post)
      setPreviewMode("linkedin")
    }
  }

  function clearFilters() {
    setSearch("")
    setStatusFilter("All")
    setTelegramFilter("All")
    setLinkedinFilter("All")
  }

  // ── Edit handlers ────────────────────────────────────────────────────────────
  function handleEditOpen(post: Post) {
    setSelectedPost(null)
    setActionError(null)
    setEditingPost(post)
  }

  function handleEditClose() {
    setEditingPost(null)
  }

  function handleEditSaved() {
    router.refresh()
    setEditingPost(null)
  }

  // ── Mutation handlers ────────────────────────────────────────────────────────
  async function handlePublish(post: Post) {
    setActionLoading({ id: post.id, action: "publish" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/publish`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to publish." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleArchive(post: Post) {
    setActionLoading({ id: post.id, action: "archive" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/archive`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to archive." })
      } else {
        if (selectedPost?.id === post.id) setSelectedPost(null)
        if (editingPost?.id  === post.id) setEditingPost(null)
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleRestore(post: Post) {
    setActionLoading({ id: post.id, action: "restore" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/restore`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to restore." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleTelegramReady(post: Post) {
    setActionLoading({ id: post.id, action: "tg-ready" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/telegram/ready`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to mark as ready." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleTelegramSend(post: Post) {
    setActionLoading({ id: post.id, action: "tg-send" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/telegram/send`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to send to Telegram." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLinkedInReady(post: Post) {
    setActionLoading({ id: post.id, action: "li-ready" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/linkedin/ready`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to mark LinkedIn as ready." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  async function handleLinkedInShared(post: Post) {
    setActionLoading({ id: post.id, action: "li-shared" })
    setActionError(null)
    try {
      const res  = await fetch(`/api/admin/posts/${post.id}/linkedin/shared`, { method: "POST" })
      const json = await res.json()
      if (!json.success) {
        setActionError({ id: post.id, message: json.message ?? "Failed to record LinkedIn share." })
      } else {
        router.refresh()
      }
    } catch {
      setActionError({ id: post.id, message: "Network error. Please try again." })
    } finally {
      setActionLoading(null)
    }
  }

  // ── Derived layout flag ───────────────────────────────────────────────────────
  const showRightPanel = !!(editingPost ?? selectedPost)

  return (
    <div className="space-y-6">

      {/* ── Page header ──────────────────────────────────── */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Posts</h2>
          <p className="mt-1 max-w-lg text-sm leading-relaxed text-zinc-500">
            Approved content prepared for website publication and Telegram distribution.
            Posts are created from approved drafts or written directly.
          </p>
        </div>
        <div className="shrink-0">
          <button
            type="button"
            onClick={() => {}}
            className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300"
          >
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
            Create post
          </button>
        </div>
      </div>

      {/* ── Summary stats ────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
        <span>
          <span className="font-semibold text-white">{posts.length}</span>
          <span className="ml-1.5 text-zinc-500">total</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className="font-semibold text-emerald-400">{publishedCount}</span>
          <span className="ml-1.5 text-zinc-500">published</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${reviewCount > 0 ? "text-amber-400" : "text-zinc-600"}`}>
            {reviewCount}
          </span>
          <span className="ml-1.5 text-zinc-500">in review</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${telegramReady > 0 ? "text-amber-400" : "text-zinc-600"}`}>
            {telegramReady}
          </span>
          <span className="ml-1.5 text-zinc-500">Telegram ready</span>
        </span>
        <span aria-hidden="true" className="text-zinc-700">·</span>
        <span>
          <span className={`font-semibold ${linkedinReady > 0 ? "text-sky-400" : "text-zinc-600"}`}>
            {linkedinReady}
          </span>
          <span className="ml-1.5 text-zinc-500">LinkedIn ready</span>
        </span>
      </div>

      {/* ── Workflow strip ────────────────────────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 px-4 py-3">
        <p className="text-xs leading-relaxed text-zinc-500">
          <span className="font-medium text-zinc-400">Workflow: </span>
          Approved draft
          <span className="mx-1.5 text-zinc-700">→</span>
          Post creation
          <span className="mx-1.5 text-zinc-700">→</span>
          Website publication
          <span className="mx-1.5 text-zinc-700">→</span>
          Telegram / LinkedIn distribution
        </p>
      </div>

      {/* ── Controls ─────────────────────────────────────── */}
      <div className="space-y-3">

        {/* Row 1: search + post status filter */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search by title, excerpt, or slug…"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {POST_STATUS_FILTERS.map(({ value, label }) => (
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

        {/* Row 2: Telegram status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-600">Telegram:</span>
          {TELEGRAM_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTelegramFilter(value)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                telegramFilter === value
                  ? "bg-blue-500/20 border border-blue-500/30 text-blue-300"
                  : "border border-zinc-700/70 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Row 3: LinkedIn status filter */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-600">LinkedIn:</span>
          {LINKEDIN_FILTERS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setLinkedinFilter(value)}
              className={[
                "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150",
                linkedinFilter === value
                  ? "bg-sky-500/20 border border-sky-500/30 text-sky-300"
                  : "border border-zinc-700/70 text-zinc-600 hover:border-zinc-600 hover:text-zinc-400",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Results count ─────────────────────────────────── */}
      <p className="text-xs text-zinc-600">
        Showing {filtered.length} {filtered.length === 1 ? "post" : "posts"}
      </p>

      {/* ── List + right panel ────────────────────────────── */}
      <div
        className={
          showRightPanel
            ? "grid gap-5 lg:grid-cols-[1fr_380px] lg:items-start"
            : ""
        }
      >
        {/* Post list */}
        {filtered.length > 0 ? (
          <ul role="list" className="min-w-0 space-y-3">
            {filtered.map((post) => {
              const isPreviewSelected  = selectedPost?.id === post.id && previewMode === "post"
              const isTelegramSelected = selectedPost?.id === post.id && previewMode === "telegram"
              const isLinkedInSelected = selectedPost?.id === post.id && previewMode === "linkedin"
              const isAnySelected      = selectedPost?.id === post.id
              const isEditOpen         = editingPost?.id === post.id
              const isLoading          = actionLoading?.id === post.id
              const isPublishing       = isLoading && actionLoading?.action === "publish"
              const isArchiving        = isLoading && actionLoading?.action === "archive"
              const isRestoring        = isLoading && actionLoading?.action === "restore"
              const path               = publicUrlPath(post)

              return (
                <li
                  key={post.id}
                  className={[
                    "rounded-xl border bg-zinc-900 px-5 py-4 transition-colors duration-150",
                    isEditOpen
                      ? "border-amber-400/30"
                      : isAnySelected
                      ? isTelegramSelected
                        ? "border-blue-400/25"
                        : isLinkedInSelected
                        ? "border-sky-400/25"
                        : "border-amber-400/30"
                      : "border-zinc-800 hover:border-zinc-700",
                  ].join(" ")}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">

                    {/* Left: content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold leading-snug text-white">
                          {post.title}
                        </p>
                        <StatusBadge status={post.status} />
                        {post.telegramStatus && (
                          <StatusBadge status={post.telegramStatus} />
                        )}
                        {post.linkedinStatus && (
                          <StatusBadge status={post.linkedinStatus} />
                        )}
                      </div>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-zinc-500">
                        {post.excerpt}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs">
                        <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 capitalize text-zinc-400">
                          {post.type}
                        </span>
                        <span className="rounded-full border border-zinc-700/50 bg-zinc-800/60 px-2.5 py-0.5 text-zinc-400">
                          {post.topic}
                        </span>
                        <span aria-hidden="true" className="text-zinc-700">·</span>
                        <span className="break-all font-mono text-[11px] text-zinc-700">{path}</span>
                        {post.publishedAt && (
                          <>
                            <span aria-hidden="true" className="text-zinc-700">·</span>
                            <span className="text-zinc-600">
                              Published {formatDate(post.publishedAt)}
                            </span>
                          </>
                        )}
                      </div>
                      {/* Per-post action error */}
                      {actionError?.id === post.id && (
                        <p role="alert" className="mt-2 text-xs text-red-400">
                          {actionError.message}
                        </p>
                      )}
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">

                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => handlePreview(post)}
                        disabled={!!actionLoading}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          isPreviewSelected
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isPreviewSelected ? "Close" : "Preview"}
                      </button>

                      {/* Edit */}
                      <button
                        type="button"
                        onClick={() =>
                          isEditOpen ? handleEditClose() : handleEditOpen(post)
                        }
                        disabled={!!actionLoading}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          isEditOpen
                            ? "border-amber-400/40 bg-amber-400/10 text-amber-400"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {isEditOpen ? "Editing" : "Edit"}
                      </button>

                      {/* Publish / View live / Restore */}
                      {post.status === "published" ? (
                        <a
                          href={path}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/40"
                        >
                          View live ↗
                        </a>
                      ) : post.status === "archived" ? (
                        <button
                          type="button"
                          onClick={() => handleRestore(post)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                        >
                          {isRestoring ? "Restoring…" : "Restore"}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handlePublish(post)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/40 disabled:opacity-50"
                        >
                          {isPublishing ? "Publishing…" : "Publish"}
                        </button>
                      )}

                      {/* Archive — available for all non-archived posts */}
                      {post.status !== "archived" && (
                        <button
                          type="button"
                          onClick={() => handleArchive(post)}
                          disabled={!!actionLoading}
                          className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                        >
                          {isArchiving ? "Archiving…" : "Archive"}
                        </button>
                      )}

                      {/* Telegram */}
                      <button
                        type="button"
                        onClick={() => handleTelegram(post)}
                        disabled={!!actionLoading}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          isTelegramSelected
                            ? "border-blue-400/40 bg-blue-400/10 text-blue-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {!isTelegramSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                        )}
                        {isTelegramSelected ? "Close" : "Telegram"}
                      </button>

                      {/* LinkedIn */}
                      <button
                        type="button"
                        onClick={() => handleLinkedIn(post)}
                        disabled={!!actionLoading}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-50",
                          isLinkedInSelected
                            ? "border-sky-400/40 bg-sky-400/10 text-sky-300"
                            : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:bg-zinc-800 hover:text-white",
                        ].join(" ")}
                      >
                        {!isLinkedInSelected && (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-3 w-3"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                          </svg>
                        )}
                        {isLinkedInSelected ? "Close" : "LinkedIn"}
                      </button>

                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        ) : (
          /* ── Empty state ──────────────────────────────── */
          <div className="flex flex-col items-center justify-center rounded-xl border border-zinc-800 bg-zinc-900/40 py-16 text-center">
            <p className="text-sm text-zinc-400">No posts found.</p>
            <p className="mt-1 text-xs text-zinc-600">
              {search || statusFilter !== "All" || telegramFilter !== "All" || linkedinFilter !== "All"
                ? "Try adjusting your search or filters."
                : "Create your first post or approve a draft to get started."}
            </p>
            {(search || statusFilter !== "All" || telegramFilter !== "All" || linkedinFilter !== "All") && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Right panel: edit, post preview, or Telegram preview ── */}
        {showRightPanel && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {editingPost ? (
              <EditPanel
                post={editingPost}
                onClose={handleEditClose}
                onSaved={handleEditSaved}
              />
            ) : selectedPost && previewMode === "telegram" ? (
              <TelegramPreviewPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onReady={() => handleTelegramReady(selectedPost)}
                onSend={() => handleTelegramSend(selectedPost)}
                isLoading={
                  actionLoading?.id === selectedPost.id &&
                  (actionLoading.action === "tg-ready" || actionLoading.action === "tg-send")
                }
                error={
                  actionError?.id === selectedPost.id ? actionError.message : null
                }
              />
            ) : selectedPost && previewMode === "linkedin" ? (
              <LinkedInPreviewPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
                onReady={() => handleLinkedInReady(selectedPost)}
                onShared={() => handleLinkedInShared(selectedPost)}
                isLoading={
                  actionLoading?.id === selectedPost.id &&
                  (actionLoading.action === "li-ready" || actionLoading.action === "li-shared")
                }
                error={
                  actionError?.id === selectedPost.id ? actionError.message : null
                }
              />
            ) : selectedPost ? (
              <PostPreviewPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            ) : null}
          </div>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────── */}
      <p className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-700">
        Telegram distribution requires a published post and{" "}
        <span className="font-mono">TELEGRAM_BOT_TOKEN</span> +{" "}
        <span className="font-mono">TELEGRAM_CHAT_ID</span> in{" "}
        <span className="font-mono">.env.local</span>.{" "}
        LinkedIn distribution is manual — copy the generated text and share directly on LinkedIn.
      </p>

    </div>
  )
}
