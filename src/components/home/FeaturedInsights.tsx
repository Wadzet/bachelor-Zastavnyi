"use client"

import { motion } from "motion/react"
import Link from "next/link"
import ContentCard from "@/components/content/ContentCard"
import type { Insight } from "@/types"

// Mock data — replace with real data layer once CMS is wired in
const featuredInsights: Insight[] = [
  {
    slug: "ai-strategy-fails-without-operational-readiness",
    title: "Why AI Strategy Fails Without Operational Readiness",
    excerpt:
      "Most AI initiatives stall not because of poor technology, but because the organisation was not ready to absorb the change. Here is what readiness actually requires.",
    body: "",
    author: { name: "Elena Marsh", role: "Senior Editor" },
    publishedAt: "2026-04-28",
    topic: "AI Strategy",
    featured: true,
  },
  {
    slug: "automating-the-middle-where-ai-delivers-real-roi",
    title: "Automating the Middle: Where AI Delivers Real ROI in Operations",
    excerpt:
      "The biggest efficiency gains from AI are not at the edges of your business — they are in the middle-office workflows most leaders never examine closely.",
    body: "",
    author: { name: "James Corfield", role: "Contributing Analyst" },
    publishedAt: "2026-05-05",
    topic: "Automation",
    featured: true,
  },
  {
    slug: "what-market-leaders-understand-about-ai-governance",
    title: "What Market Leaders Understand About AI Governance That Others Don't",
    excerpt:
      "Governance is not a constraint on AI adoption — it is the foundation that makes scale possible. The companies moving fastest are also the most deliberate.",
    body: "",
    author: { name: "Elena Marsh", role: "Senior Editor" },
    publishedAt: "2026-05-09",
    topic: "Market Trends",
    featured: true,
  },
]

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function FeaturedInsights() {
  return (
    <section className="bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease }}
          className="mb-12 flex items-end justify-between gap-8"
        >
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/70">
              From the editors
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Featured Insights
            </h2>
          </div>
          <Link
            href="/insights"
            className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:text-amber-400 sm:flex"
          >
            View all insights
            <span
              aria-hidden="true"
              className="transition-transform duration-150 group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </motion.div>

        {/* Cards grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {featuredInsights.map((insight, i) => (
            <ContentCard key={insight.slug} insight={insight} index={i} />
          ))}
        </div>

        {/* Mobile view-all */}
        <div className="mt-8 sm:hidden">
          <Link
            href="/insights"
            className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
          >
            View all insights →
          </Link>
        </div>
      </div>
    </section>
  )
}
