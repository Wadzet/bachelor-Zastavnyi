import { notFound } from "next/navigation"
import type { Metadata } from "next"
import Link from "next/link"
import { BRAND } from "@/config/brand"
import ContentHeader from "@/components/content/ContentHeader"
import ArticleBody from "@/components/content/ArticleBody"
import { getInsightBySlug } from "@/lib/data/posts"

// Revalidate every 60 seconds — detail pages stay fresh without a full rebuild.
export const revalidate = 60

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const insight = await getInsightBySlug(slug)
  if (!insight) return { title: `Not Found — ${BRAND.name}` }
  return {
    title: `${insight.title} — ${BRAND.name}`,
    description: insight.excerpt,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function InsightDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const insight = await getInsightBySlug(slug)

  if (!insight) notFound()

  return (
    <div className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">

        {/* Back link */}
        <Link
          href="/insights"
          className="mb-10 inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-white"
        >
          <span aria-hidden="true">←</span>
          All Insights
        </Link>

        {/* Header: topic, title, date */}
        <ContentHeader
          topic={insight.topic}
          title={insight.title}
          publishedAt={insight.publishedAt}
        />

        {/* Divider */}
        <div className="mb-10 border-t border-zinc-800/60" />

        {/* Article body */}
        <ArticleBody body={insight.body} />

      </div>
    </div>
  )
}
