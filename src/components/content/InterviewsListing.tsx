"use client"

import { useState, useMemo } from "react"
import { motion } from "motion/react"
import InterviewCard from "@/components/content/InterviewCard"
import SearchBar from "@/components/ui/SearchBar"
import FilterPills from "@/components/ui/FilterPills"
import type { Interview, Topic } from "@/types"

const allInterviews: Interview[] = [
  {
    slug: "sarah-chen-meridian-group-embedding-ai-in-operations",
    title: "Embedding AI Into Operations Without Disrupting Culture",
    excerpt:
      "Meridian Group's COO on why the biggest risk in AI transformation is not the technology — it is the people you do not bring along.",
    guest: {
      name: "Sarah Chen",
      role: "Chief Operating Officer",
      company: "Meridian Group",
      bio: "Sarah Chen oversees global operations at Meridian Group, where she led the company's AI integration programme across 12 markets.",
    },
    qa: [],
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-04-15",
    topic: "Leadership",
    featured: true,
  },
  {
    slug: "michael-torres-vantagepoint-analytics-ai-roi-year-one",
    title: "The Honest Truth About AI ROI in Year One",
    excerpt:
      "VantagePoint's CEO on the metrics that matter, the ones that mislead, and what business leaders should realistically expect in the first twelve months of AI adoption.",
    guest: {
      name: "Michael Torres",
      role: "Chief Executive Officer",
      company: "VantagePoint Analytics",
      bio: "Michael Torres founded VantagePoint Analytics in 2019. The firm advises mid-market companies on data strategy and AI implementation.",
    },
    qa: [],
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-02",
    topic: "AI Strategy",
    featured: true,
  },
  {
    slug: "priya-kapoor-terrascale-logistics-predictive-operations",
    title: "How Predictive AI Is Reshaping Supply Chain Decisions",
    excerpt:
      "TerraScale Logistics' COO on moving from reactive reporting to proactive decision-making — and why most operations leaders underestimate the culture shift involved.",
    guest: {
      name: "Priya Kapoor",
      role: "Chief Operating Officer",
      company: "TerraScale Logistics",
      bio: "Priya Kapoor leads operations and supply chain strategy at TerraScale Logistics, overseeing a network spanning 40 distribution centres across Europe and Asia.",
    },
    qa: [],
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-04-08",
    topic: "Operations",
  },
  {
    slug: "david-stein-novus-capital-ai-automation-finance",
    title: "Automating the Analyst: AI's Role in Modern Finance Teams",
    excerpt:
      "Novus Capital's Head of AI on which finance workflows are ready to automate now, which ones are not, and how to avoid the common mistake of automating the wrong things first.",
    guest: {
      name: "David Stein",
      role: "Head of AI",
      company: "Novus Capital",
      bio: "David Stein leads AI strategy and implementation at Novus Capital, where he has overseen the automation of core research and reporting functions over the past two years.",
    },
    qa: [],
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-04-29",
    topic: "Automation",
  },
  {
    slug: "amara-osei-brightfield-group-ai-strategy-execution",
    title: "Turning AI Strategy Into Execution: What Separates Leaders From Laggards",
    excerpt:
      "Brightfield Group's CEO on the organisational signals that predict whether an AI strategy will move from slide deck to shipped product — and what to do when it stalls.",
    guest: {
      name: "Amara Osei",
      role: "Chief Executive Officer",
      company: "Brightfield Group",
      bio: "Amara Osei co-founded Brightfield Group in 2017 and has since grown it into a 200-person management consultancy specialising in digital and AI transformation.",
    },
    qa: [],
    author: { name: "BizInsight Editorial", role: "Editorial" },
    publishedAt: "2026-05-08",
    topic: "AI Strategy",
  },
]

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function InterviewsListing() {
  const [search, setSearch] = useState("")
  const [activeTopic, setActiveTopic] = useState<Topic | "All">("All")

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    return allInterviews.filter((interview) => {
      const matchesTopic = activeTopic === "All" || interview.topic === activeTopic
      const matchesSearch =
        !q ||
        interview.title.toLowerCase().includes(q) ||
        interview.excerpt.toLowerCase().includes(q) ||
        interview.guest.name.toLowerCase().includes(q) ||
        interview.guest.company.toLowerCase().includes(q)
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
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
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
