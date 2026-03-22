"use client"

import { motion } from "motion/react"
import Link from "next/link"
import type { Insight, Topic } from "@/types"

type ContentCardProps = {
  insight: Insight
  index?: number
}

// Per-topic tonal gradient — distinct but restrained against zinc-900
const topicCover: Record<Topic, string> = {
  "AI Strategy":   "from-violet-950 via-violet-950/60 to-zinc-900",
  "Operations":    "from-sky-950 via-sky-950/60 to-zinc-900",
  "Leadership":    "from-amber-950 via-amber-950/60 to-zinc-900",
  "Automation":    "from-emerald-950 via-emerald-950/60 to-zinc-900",
  "Case Study":    "from-stone-900 via-stone-900/60 to-zinc-900",
  "Market Trends": "from-blue-950 via-blue-950/60 to-zinc-900",
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function ContentCard({ insight, index = 0 }: ContentCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease }}
    >
      <Link
        href={`/insights/${insight.slug}`}
        className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Topic gradient cover */}
        <div
          className={`relative flex h-[120px] items-end bg-gradient-to-br p-5 ${topicCover[insight.topic]}`}
        >
          <span className="inline-block rounded-full border border-zinc-700/40 bg-zinc-900/70 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-zinc-300 backdrop-blur-sm">
            {insight.topic}
          </span>
        </div>

        {/* Content body */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="text-sm font-semibold leading-snug text-white transition-colors duration-150 group-hover:text-zinc-300">
            {insight.title}
          </h3>

          <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500">
            {insight.excerpt}
          </p>

          {/* Footer — date only; no author attribution */}
          <div className="mt-5 flex items-center justify-between border-t border-zinc-800/60 pt-4">
            <time dateTime={insight.publishedAt} className="text-xs text-zinc-600">
              {formatDate(insight.publishedAt)}
            </time>
            <span className="text-xs font-medium text-amber-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-amber-300">
              Read →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
