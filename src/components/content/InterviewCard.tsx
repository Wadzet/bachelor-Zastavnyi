"use client"

import { motion } from "motion/react"
import Link from "next/link"
import type { Interview } from "@/types"

type InterviewCardProps = {
  interview: Interview
  index?: number
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(iso))
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function InterviewCard({ interview, index = 0 }: InterviewCardProps) {
  return (
    <motion.div
      initial={{ y: 24 }}
      whileInView={{ y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.07, ease }}
      className="min-w-0 w-full max-w-full"
    >
      <Link
        href={`/interviews/${interview.slug}`}
        className="group flex h-full min-w-0 w-full max-w-full flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900 transition-all duration-200 hover:-translate-y-1.5 hover:border-zinc-700 hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
      >
        {/* Guest header band */}
        <div className="relative min-w-0 max-w-full overflow-hidden bg-gradient-to-br from-zinc-800 to-zinc-950 px-6 py-5">
          {/* Topic label */}
          <span className="inline-block max-w-full truncate rounded-full border border-zinc-700/40 bg-zinc-900/70 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-zinc-400 backdrop-blur-sm">
            {interview.topic}
          </span>

          {/* Guest identity — this is the subject, not the editorial author */}
          <div className="mt-4 flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-700 bg-zinc-800 text-xs font-bold tracking-wide text-zinc-300">
              {getInitials(interview.guest.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-white">
                {interview.guest.name}
              </p>
              <p className="truncate text-xs text-zinc-500">
                {interview.guest.role}
                <span aria-hidden="true" className="mx-1.5 text-zinc-700">·</span>
                {interview.guest.company}
              </p>
            </div>
          </div>
        </div>

        {/* Content body */}
        <div className="flex min-w-0 flex-1 flex-col p-5 pt-4">
          <h3 className="break-words text-sm font-semibold leading-snug text-white transition-colors duration-150 group-hover:text-zinc-300">
            {interview.title}
          </h3>

          <p className="mt-3 flex-1 text-xs leading-relaxed text-zinc-500">
            {interview.excerpt}
          </p>

          {/* Footer — date only; no editorial author attribution */}
          <div className="mt-5 flex min-w-0 items-center justify-between border-t border-zinc-800/60 pt-4">
            <time dateTime={interview.publishedAt} className="truncate text-xs text-zinc-600">
              {formatDate(interview.publishedAt)}
            </time>
            <span className="shrink-0 text-xs font-medium text-amber-400 transition-all duration-150 group-hover:translate-x-0.5 group-hover:text-amber-300">
              Read →
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}
