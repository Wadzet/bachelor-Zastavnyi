"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import ContentCard from "@/components/content/ContentCard"
import SearchBar from "@/components/ui/SearchBar"
import FilterPills from "@/components/ui/FilterPills"
import type { Insight, Topic } from "@/types"

const allInsights: Insight[] = [
  {
    slug: "ai-strategy-fails-without-operational-readiness",
    title: "Why AI Strategy Fails Without Operational Readiness",
    excerpt:
      "Most AI initiatives stall not because of poor technology, but because the organisation was not ready to absorb the change. Here is what readiness actually requires.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
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
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-05",
    topic: "Automation",
  },
  {
    slug: "what-market-leaders-understand-about-ai-governance",
    title: "What Market Leaders Understand About AI Governance That Others Don't",
    excerpt:
      "Governance is not a constraint on AI adoption — it is the foundation that makes scale possible. The companies moving fastest are also the most deliberate.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-09",
    topic: "Market Trends",
  },
  {
    slug: "managers-guide-to-running-ai-augmented-teams",
    title: "The Manager's Guide to Running an AI-Augmented Team",
    excerpt:
      "When your team works alongside AI tools every day, the job of management changes. Here is how effective managers are adapting their approach to accountability, output, and growth.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-01",
    topic: "Leadership",
  },
  {
    slug: "inside-ai-pilot-meridian-group-finance-case-study",
    title: "Inside the AI Pilot: A Case Study from Meridian Group's Finance Team",
    excerpt:
      "What actually happens when a mid-size company runs its first AI pilot in a finance function? Meridian Group shares the honest numbers — what worked, what did not, and what they would do differently.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-04-22",
    topic: "Case Study",
  },
  {
    slug: "rethinking-operations-predictive-ai",
    title: "Rethinking Operations in the Age of Predictive AI",
    excerpt:
      "Predictive models are changing how operations teams plan, allocate, and respond. The shift is less about replacing human judgment and more about giving it better data.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-04-15",
    topic: "Operations",
  },
  {
    slug: "building-ai-literacy-across-non-technical-teams",
    title: "Building AI Literacy Across Non-Technical Teams",
    excerpt:
      "The gap between what AI can do and what most employees understand is a strategic liability. Closing it does not require engineering — it requires a different kind of leadership commitment.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-12",
    topic: "Leadership",
  },
  {
    slug: "market-forces-reshaping-enterprise-ai-spend",
    title: "The Market Forces Reshaping Enterprise AI Spend in 2026",
    excerpt:
      "Budget cycles are tightening, vendor consolidation is accelerating, and decision criteria have shifted from 'can it do AI?' to 'can it prove ROI?' Here is what the data shows.",
    body: "",
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-14",
    topic: "Market Trends",
  },
]

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function InsightsListing() {
  const [search, setSearch] = useState("")
  const [activeTopic, setActiveTopic] = useState<Topic | "All">("All")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allInsights.filter((insight) => {
      const matchesTopic = activeTopic === "All" || insight.topic === activeTopic
      const matchesSearch =
        !q ||
        insight.title.toLowerCase().includes(q) ||
        insight.excerpt.toLowerCase().includes(q)
      return matchesTopic && matchesSearch
    })
  }, [search, activeTopic])

  return (
    <section className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 sm:pt-20 sm:pb-32 lg:px-8">

        {/* ── Page header ────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          className="mb-10"
        >
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
            All Insights
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Analysis &amp; Intelligence
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            In-depth editorial on AI strategy, operations, and leadership — for business owners,
            managers, and analysts who need clarity, not hype.
          </p>
        </motion.div>

        {/* ── Control toolbar ────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.1, ease }}
          className="mb-10 border-t border-zinc-800/60 pt-8"
        >
          {/* Search */}
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search insights…"
          />

          {/* Pills + count on same row */}
          <div className="mt-3 flex items-center gap-4">
            <div className="min-w-0 flex-1">
              <FilterPills active={activeTopic} onChange={setActiveTopic} />
            </div>
            <p className="shrink-0 text-xs text-zinc-600">
              {filtered.length} {filtered.length === 1 ? "result" : "results"}
            </p>
          </div>
        </motion.div>

        {/* ── Card grid ──────────────────────────────────── */}
        {filtered.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((insight, i) => (
              <ContentCard key={insight.slug} insight={insight} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-zinc-500">No insights match your search.</p>
            <button
              type="button"
              onClick={() => { setSearch(""); setActiveTopic("All") }}
              className="mt-4 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
