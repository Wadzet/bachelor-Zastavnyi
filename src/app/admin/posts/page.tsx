"use client"

import { useState, useMemo } from "react"
import { mockPosts } from "@/data/admin"
import { BRAND } from "@/config/brand"
import SearchBar from "@/components/ui/SearchBar"
import StatusBadge from "@/components/admin/StatusBadge"
import type { PostStatus, TelegramStatus, Post } from "@/types"

// ─── Types & constants ────────────────────────────────────────────────────────

type PostStatusFilter = "All" | PostStatus
type TelegramFilter   = "All" | TelegramStatus
type PreviewMode      = "post" | "telegram"

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

// Placeholder domain for Telegram messages and preview links
const BRAND_DOMAIN = BRAND.siteUrl

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

function TelegramPreviewPanel({ post, onClose }: { post: Post; onClose: () => void }) {
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

      {/* Action */}
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
            <button
              type="button"
              onClick={() => {}}
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-500/15 px-4 py-1.5 text-xs font-semibold text-blue-300 transition-colors hover:bg-blue-500/25"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
              {tgStatus === "ready"
                ? "Send to Telegram"
                : tgStatus === "failed"
                ? "Retry send"
                : "Mark as ready"}
            </button>
            {!tgStatus && (
              <button
                type="button"
                onClick={() => {}}
                className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-800/50 px-4 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              >
                Schedule
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminPostsPage() {
  // ── State ────────────────────────────────────────────────────────────────────
  const [search, setSearch]                 = useState("")
  const [statusFilter, setStatusFilter]     = useState<PostStatusFilter>("All")
  const [telegramFilter, setTelegramFilter] = useState<TelegramFilter>("All")
  const [selectedPost, setSelectedPost]     = useState<Post | null>(null)
  const [previewMode, setPreviewMode]       = useState<PreviewMode>("post")

  // ── Filtered list ────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return mockPosts.filter((p) => {
      const matchesStatus   = statusFilter === "All" || p.status === statusFilter
      const matchesTelegram = telegramFilter === "All" || p.telegramStatus === telegramFilter
      const matchesSearch   =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.slug.toLowerCase().includes(q)
      return matchesStatus && matchesTelegram && matchesSearch
    })
  }, [search, statusFilter, telegramFilter])

  // ── Summary counts — full dataset, not filtered ──────────────────────────────
  const publishedCount = mockPosts.filter((p) => p.status === "published").length
  const reviewCount    = mockPosts.filter((p) => p.status === "review").length
  const telegramReady  = mockPosts.filter((p) => p.telegramStatus === "ready").length

  // ── Panel handlers ───────────────────────────────────────────────────────────
  function handlePreview(post: Post) {
    if (selectedPost?.id === post.id && previewMode === "post") {
      setSelectedPost(null)
    } else {
      setSelectedPost(post)
      setPreviewMode("post")
    }
  }

  function handleTelegram(post: Post) {
    if (selectedPost?.id === post.id && previewMode === "telegram") {
      setSelectedPost(null)
    } else {
      setSelectedPost(post)
      setPreviewMode("telegram")
    }
  }

  function clearFilters() {
    setSearch("")
    setStatusFilter("All")
    setTelegramFilter("All")
  }

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
          <span className="font-semibold text-white">{mockPosts.length}</span>
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
          Telegram distribution
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
      </div>

      {/* ── Results count ─────────────────────────────────── */}
      <p className="text-xs text-zinc-600">
        Showing {filtered.length} {filtered.length === 1 ? "post" : "posts"}
      </p>

      {/* ── List + preview panel ─────────────────────────── */}
      <div
        className={
          selectedPost
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
              const isAnySelected      = selectedPost?.id === post.id
              const path               = publicUrlPath(post)

              return (
                <li
                  key={post.id}
                  className={[
                    "rounded-xl border bg-zinc-900 px-5 py-4 transition-colors duration-150",
                    isAnySelected
                      ? isTelegramSelected
                        ? "border-blue-400/25"
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
                    </div>

                    {/* Right: actions */}
                    <div className="flex shrink-0 flex-wrap items-center gap-2">

                      {/* Preview */}
                      <button
                        type="button"
                        onClick={() => handlePreview(post)}
                        className={[
                          "inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
                        onClick={() => {}}
                        className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                      >
                        Edit
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
                          onClick={() => {}}
                          className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-1.5 text-xs font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                        >
                          Restore
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {}}
                          className="inline-flex items-center rounded-lg border border-emerald-700/50 bg-emerald-900/20 px-3 py-1.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-900/40"
                        >
                          Publish
                        </button>
                      )}

                      {/* Telegram */}
                      <button
                        type="button"
                        onClick={() => handleTelegram(post)}
                        className={[
                          "inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
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
              {search || statusFilter !== "All" || telegramFilter !== "All"
                ? "Try adjusting your search or filters."
                : "Create your first post or approve a draft to get started."}
            </p>
            {(search || statusFilter !== "All" || telegramFilter !== "All") && (
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

        {/* ── Preview / Telegram panel (sticky on lg+) ──── */}
        {selectedPost && (
          <div className="lg:sticky lg:top-6 lg:self-start">
            {previewMode === "telegram" ? (
              <TelegramPreviewPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            ) : (
              <PostPreviewPanel
                post={selectedPost}
                onClose={() => setSelectedPost(null)}
              />
            )}
          </div>
        )}
      </div>

      {/* ── Footer note ───────────────────────────────────── */}
      <p className="border-t border-zinc-800/60 pt-4 text-xs text-zinc-700">
        Publishing and Telegram distribution are not yet active.
        All actions are mock UI — no data is persisted or sent.
      </p>

    </div>
  )
}
