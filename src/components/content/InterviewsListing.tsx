"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import InterviewCard from "@/components/content/InterviewCard"
import SearchBar from "@/components/ui/SearchBar"
import FilterPills from "@/components/ui/FilterPills"
import type { Interview, Topic } from "@/types"

const ease = [0.25, 0.46, 0.45, 0.94] as const

interface Props {
  interviews: Interview[]
}

export default function InterviewsListing({ interviews }: Props) {
  const [search, setSearch] = useState("")
  const [activeTopic, setActiveTopic] = useState<Topic | "All">("All")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return interviews.filter((interview) => {
      const matchesTopic = activeTopic === "All" || interview.topic === activeTopic
      const matchesSearch =
        !q ||
        interview.title.toLowerCase().includes(q) ||
        interview.excerpt.toLowerCase().includes(q) ||
        interview.guest.name.toLowerCase().includes(q) ||
        interview.guest.company.toLowerCase().includes(q)
      return matchesTopic && matchesSearch
    })
  }, [search, activeTopic, interviews])

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
            All Interviews
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            In Conversation
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-zinc-400">
            Long-form conversations with executives, operators, and practitioners navigating AI
            transformation in the real world.
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
            placeholder="Search by guest, company, or topic…"
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
          <div className="grid gap-6 lg:grid-cols-2">
            {filtered.map((interview, i) => (
              <InterviewCard key={interview.slug} interview={interview} index={i} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <p className="text-sm text-zinc-500">No interviews match your search.</p>
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
