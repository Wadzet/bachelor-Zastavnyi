import type { Metadata } from "next"
import Link from "next/link"
import { BRAND } from "@/config/brand"
import StatCard from "@/components/admin/StatCard"
import StatusBadge from "@/components/admin/StatusBadge"
import {
  getAdminDashboardStats,
  getAdminRecentDrafts,
  getAdminRecentPosts,
} from "@/lib/data/admin"

export const metadata: Metadata = {
  title: "Dashboard",
}

// Revalidate every 60 seconds — keeps stats and recent items fresh.
export const revalidate = 60

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

// ─── Workflow steps ───────────────────────────────────────────────────────────

const workflowSteps = [
  {
    label: "Sources",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    description: "Trusted AI and business publications monitored for editorial signals.",
  },
  {
    label: "AI Drafts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636-.707.707M21 12h-1M4 12H3m3.343-5.657-.707-.707m2.828 9.9a5 5 0 1 1 7.072 0l-.548.547A3.374 3.374 0 0 0 14 18.469V19a2 2 0 1 1-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    description: "AI-generated editorial drafts created from source signals, reviewed before publishing.",
  },
  {
    label: "Posts",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
      </svg>
    ),
    description: "Approved drafts published to the public website as insights, interviews, or articles.",
  },
  {
    label: "Telegram",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
      </svg>
    ),
    description: "Published posts distributed to subscribers via Telegram. Managed per-post from the Posts page.",
  },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminDashboardPage() {
  const [stats, recentDrafts, recentPosts] = await Promise.all([
    getAdminDashboardStats(),
    getAdminRecentDrafts(),
    getAdminRecentPosts(),
  ])

  return (
    <div className="space-y-8">

      {/* ── Page heading ────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white">
          Content Pipeline
        </h2>
        <p className="mt-1 text-sm text-zinc-500">
          {BRAND.name} admin — sources, AI drafts, posts, and Telegram distribution.
        </p>
      </div>

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Trusted Sources"
          value={stats.totalSources}
          description={`${stats.activeSources} active${stats.sourceErrors > 0 ? ` · ${stats.sourceErrors} error` : ""}`}
        />
        <StatCard
          label="Drafts in Review"
          value={stats.draftsInReview}
          description="Awaiting editorial approval"
          trend={stats.draftsInReview > 0 ? `${stats.draftsInReview} need attention` : undefined}
        />
        <StatCard
          label="Published Posts"
          value={stats.publishedPosts}
          description="Live on the public website"
        />
        <StatCard
          label="Telegram Ready"
          value={stats.telegramReady}
          description="Posts ready to distribute"
          trend={stats.telegramReady > 0 ? "Ready to send" : undefined}
        />
      </div>

      {/* ── Workflow overview ────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-6 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          How the platform works
        </p>

        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-0">
          {workflowSteps.map((step, i) => (
            <div key={step.label} className="flex sm:contents">
              {/* Step */}
              <div className="min-w-0 flex-1 sm:pr-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-amber-400">{step.icon}</span>
                  <span className="text-sm font-semibold text-white">{step.label}</span>
                </div>
                <p className="text-xs leading-relaxed text-zinc-500">
                  {step.description}
                </p>
              </div>

              {/* Arrow — visible between steps on sm+ */}
              {i < workflowSteps.length - 1 && (
                <div className="hidden shrink-0 items-center self-start pt-1 sm:flex sm:px-2">
                  <span className="text-zinc-700">→</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Automated Mode card ──────────────────────────── */}
      <Link
        href="/admin/automation"
        className="group flex items-center justify-between gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 transition-colors hover:border-amber-400/40"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-amber-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </span>
          <div>
            <p className="text-sm font-semibold text-white">Automated Mode</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              Generate AI drafts from your active sources in one click. Safe by default — drafts only, no
              auto-publishing or distribution unless you enable it.
            </p>
          </div>
        </div>
        <span className="shrink-0 text-zinc-600 transition-colors group-hover:text-amber-400" aria-hidden="true">→</span>
      </Link>

      {/* ── Recent content ───────────────────────────────── */}
      <div className="grid min-w-0 w-full max-w-full gap-6 lg:grid-cols-2">

        {/* Recent drafts */}
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recent Drafts
            </p>
            <span className="shrink-0 text-xs text-zinc-600">{stats.totalDrafts} total</span>
          </div>

          <ul role="list" className="space-y-0">
            {recentDrafts.map((draft) => (
              <li
                key={draft.id}
                className="flex min-w-0 flex-col gap-2 overflow-hidden border-b border-zinc-800/60 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 max-w-full">
                  <p className="min-w-0 max-w-full truncate text-sm font-medium text-white">
                    {draft.title}
                  </p>
                  <p className="mt-0.5 min-w-0 max-w-full truncate text-xs text-zinc-600">
                    {draft.topic}
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    {formatDate(draft.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center self-start">
                  <StatusBadge status={draft.status} />
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Recent posts */}
        <div className="min-w-0 w-full max-w-full overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-5 flex min-w-0 items-center justify-between gap-3">
            <p className="min-w-0 truncate text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recent Posts
            </p>
            <span className="shrink-0 text-xs text-zinc-600">{stats.totalPosts} total</span>
          </div>

          <ul role="list" className="space-y-0">
            {recentPosts.map((post) => (
              <li
                key={post.id}
                className="flex min-w-0 flex-col gap-2 overflow-hidden border-b border-zinc-800/60 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4"
              >
                <div className="min-w-0 flex-1 max-w-full">
                  <p className="min-w-0 max-w-full truncate text-sm font-medium text-white">
                    {post.title}
                  </p>
                  <p className="mt-0.5 min-w-0 max-w-full truncate text-xs text-zinc-600">
                    {post.topic}
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    {formatDate(post.updatedAt)}
                  </p>
                </div>
                <div className="flex max-w-full flex-wrap items-center gap-1.5 sm:shrink-0 sm:justify-end">
                  <StatusBadge status={post.status} />
                  {post.telegramStatus && (
                    <StatusBadge status={post.telegramStatus} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  )
}
