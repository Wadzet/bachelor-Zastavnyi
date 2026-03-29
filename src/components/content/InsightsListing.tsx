"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import ContentCard from "@/components/content/ContentCard"
import SearchBar from "@/components/ui/SearchBar"
import FilterPills from "@/components/ui/FilterPills"
import type { Insight, Topic } from "@/types"

const ease = [0.25, 0.46, 0.45, 0.94] as const

interface Props {
  insights: Insight[]
}

export default function InsightsListing({ insights }: Props) {
  const [search, setSearch] = useState("")
  const [activeTopic, setActiveTopic] = useState<Topic | "All">("All")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return insights.filter((insight) => {
      const matchesTopic = activeTopic === "All" || insight.topic === activeTopic
      const matchesSearch =
        !q ||
        insight.title.toLowerCase().includes(q) ||
        insight.excerpt.toLowerCase().includes(q)
      return matchesTopic && matchesSearch
    })
  }, [search, activeTopic, insights])

  return (
    <section className="min-h-screen bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 sm:pt-20 sm:pb-32 lg:px-8">

        {/* ── Page header ────────────────────────────────── */}
        <motion.div
          initial={{ y: 20 }}
          animate={{ y: 0 }}
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
          initial={{ y: 12 }}
          animate={{ y: 0 }}
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
