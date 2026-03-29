import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BRAND } from "@/config/brand"
import ContentHeader from "@/components/content/ContentHeader"
import InterviewBody from "@/components/content/InterviewBody"
import { getInterviewBySlug } from "@/lib/data/posts"

// Revalidate every 60 seconds — detail pages stay fresh without a full rebuild.
export const revalidate = 60

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const interview = await getInterviewBySlug(slug)
  if (!interview) return { title: `Not Found — ${BRAND.name}` }
  return {
    title: `${interview.title} — ${BRAND.name}`,
    description: interview.excerpt,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InterviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const interview = await getInterviewBySlug(slug)

  if (!interview) notFound()

  const { guest } = interview

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

        {/* Back link */}
        <Link
          href="/interviews"
          className="mb-10 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span>
          All Interviews
        </Link>

        {/* Header: topic, title, date */}
        <ContentHeader
          topic={interview.topic}
          title={interview.title}
          publishedAt={interview.publishedAt}
        />

        {/* Guest block */}
        <div className="mb-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <p className="mb-4 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
            In this interview
          </p>
          <div className="flex items-start gap-4">
            {/* Initials avatar */}
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-sm font-bold tracking-wide text-zinc-300">
              {getInitials(guest.name)}
            </div>

            <div className="min-w-0">
              <p className="text-base font-semibold text-white">{guest.name}</p>
              <p className="mt-0.5 text-sm text-zinc-500">
                {guest.role}
                <span aria-hidden="true" className="mx-2 text-zinc-700">·</span>
                {guest.company}
              </p>
              {guest.bio && (
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">
                  {guest.bio}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mb-10 border-t border-zinc-800/60" />

        {/* Q&A body */}
        <InterviewBody qa={interview.qa} />

      </div>
    </div>
  )
}
