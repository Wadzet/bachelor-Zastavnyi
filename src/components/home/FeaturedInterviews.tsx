"use client"

import { motion } from "motion/react"
import Link from "next/link"
import InterviewCard from "@/components/content/InterviewCard"
import type { Interview } from "@/types"

// Mock data — replace with real data layer once CMS is wired in
const featuredInterviews: Interview[] = [
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
    author: { name: "James Corfield", role: "Contributing Editor" },
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
    author: { name: "Elena Marsh", role: "Senior Editor" },
    publishedAt: "2026-05-02",
    topic: "AI Strategy",
    featured: true,
  },
]

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function FeaturedInterviews() {
  return (
    <section className="bg-zinc-950 py-20 sm:py-24">
      {/* Subtle top separator */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-12 border-t border-zinc-800/60 pt-20 sm:pt-24">
          {/* Section header */}
          <motion.div
            initial={{ y: 16 }}
            whileInView={{ y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease }}
            className="mb-12 flex items-end justify-between gap-8"
          >
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-amber-400/70">
                In conversation
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Featured Interviews
              </h2>
            </div>
            <Link
              href="/interviews"
              className="group hidden shrink-0 items-center gap-1 text-sm font-medium text-zinc-500 transition-colors duration-150 hover:text-amber-400 sm:flex"
            >
              View all interviews
              <span
                aria-hidden="true"
                className="transition-transform duration-150 group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </motion.div>

          {/* Cards grid */}
          <div className="grid gap-5 lg:grid-cols-2">
            {featuredInterviews.map((interview, i) => (
              <InterviewCard key={interview.slug} interview={interview} index={i} />
            ))}
          </div>

          {/* Mobile view-all */}
          <div className="mt-8 sm:hidden">
            <Link
              href="/interviews"
              className="text-sm font-medium text-amber-400 transition-colors hover:text-amber-300"
            >
              View all interviews →
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
