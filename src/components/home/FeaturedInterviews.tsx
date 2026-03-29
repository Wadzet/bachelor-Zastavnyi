"use client"

import { motion } from "motion/react"
import Link from "next/link"
import InterviewCard from "@/components/content/InterviewCard"
import type { Interview } from "@/types"

const ease = [0.25, 0.46, 0.45, 0.94] as const

interface Props {
  interviews: Interview[]
}

export default function FeaturedInterviews({ interviews }: Props) {
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
            {interviews.map((interview, i) => (
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
