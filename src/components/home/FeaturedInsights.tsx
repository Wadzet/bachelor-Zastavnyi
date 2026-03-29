"use client"

import { motion } from "motion/react"
import Link from "next/link"
import ContentCard from "@/components/content/ContentCard"
import type { Insight } from "@/types"

const ease = [0.25, 0.46, 0.45, 0.94] as const

interface Props {
  insights: Insight[]
}

export default function FeaturedInsights({ insights }: Props) {
  return (
    <section className="bg-zinc-950 py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
          {insights.map((insight, i) => (
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
