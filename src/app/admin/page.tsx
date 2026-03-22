import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import StatCard from "@/components/admin/StatCard"
import StatusBadge from "@/components/admin/StatusBadge"
import { mockSources, mockDrafts, mockPosts } from "@/data/admin"

export const metadata: Metadata = {
  title: "Dashboard",
}

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

export default function AdminDashboardPage() {
  // Computed stats
  const activeSources  = mockSources.filter((s) => s.status === "active").length
  const sourceErrors   = mockSources.filter((s) => s.status === "error").length
  const draftsInReview = mockDrafts.filter((d) => d.status === "review").length
  const publishedPosts = mockPosts.filter((p) => p.status === "published").length
  const telegramReady  = mockPosts.filter((p) => p.telegramStatus === "ready").length

  // Recent items — most recent first
  const recentDrafts = [...mockDrafts]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 4)

  const recentPosts = [...mockPosts]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 5)

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
          value={mockSources.length}
          description={`${activeSources} active${sourceErrors > 0 ? ` · ${sourceErrors} error` : ""}`}
        />
        <StatCard
          label="Drafts in Review"
          value={draftsInReview}
          description="Awaiting editorial approval"
          trend={draftsInReview > 0 ? `${draftsInReview} need attention` : undefined}
        />
        <StatCard
          label="Published Posts"
          value={publishedPosts}
          description="Live on the public website"
        />
        <StatCard
          label="Telegram Ready"
          value={telegramReady}
          description="Posts ready to distribute"
          trend={telegramReady > 0 ? "Ready to send" : undefined}
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

      {/* ── Recent content ───────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-2">

        {/* Recent drafts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recent Drafts
            </p>
            <span className="text-xs text-zinc-600">{mockDrafts.length} total</span>
          </div>

          <ul role="list" className="space-y-0">
            {recentDrafts.map((draft) => (
              <li
                key={draft.id}
                className="flex items-start justify-between gap-4 overflow-hidden border-b border-zinc-800/60 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {draft.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {draft.topic}
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    {formatDate(draft.updatedAt)}
                  </p>
                </div>
                <StatusBadge status={draft.status} />
              </li>
            ))}
          </ul>
        </div>

        {/* Recent posts */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <div className="mb-5 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Recent Posts
            </p>
            <span className="text-xs text-zinc-600">{mockPosts.length} total</span>
          </div>

          <ul role="list" className="space-y-0">
            {recentPosts.map((post) => (
              <li
                key={post.id}
                className="flex items-start justify-between gap-4 overflow-hidden border-b border-zinc-800/60 py-3 last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-white">
                    {post.title}
                  </p>
                  <p className="mt-0.5 text-xs text-zinc-600">
                    {post.topic}
                    <span aria-hidden="true" className="mx-1.5">·</span>
                    {formatDate(post.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-1.5">
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
