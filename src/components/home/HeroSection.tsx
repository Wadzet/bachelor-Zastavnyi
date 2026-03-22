"use client"

import { motion } from "motion/react"
import Link from "next/link"

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32 lg:py-36">
      {/* Subtle grid texture */}
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle" />

      {/* Warm top radial glow — adds depth without noise */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(251,191,36,0.04), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-14 lg:flex-row lg:items-center lg:gap-20">

          {/* ── Left: eyebrow + headline ── */}
          <div className="flex-1">
            <motion.div
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.5, ease }}
              className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-zinc-700/60 bg-zinc-800/50 px-4 py-1.5 backdrop-blur-sm"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span className="text-xs font-medium tracking-wide text-zinc-400">
                AI &amp; Business Intelligence
              </span>
            </motion.div>

            <motion.h1
              initial={{ y: 22 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.55, delay: 0.1, ease }}
              className="text-5xl font-bold leading-[1.07] tracking-tight text-white sm:text-6xl xl:text-7xl"
            >
              The briefing room
              <br />
              for{" "}
              <span className="text-zinc-500">business leaders</span>
              <br />
              navigating AI.
            </motion.h1>
          </div>

          {/* ── Right: description + CTAs ── */}
          <motion.div
            initial={{ y: 18 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.55, delay: 0.22, ease }}
            className="shrink-0 lg:w-[360px] xl:w-[400px]"
          >
            <p className="text-lg leading-relaxed text-zinc-400">
              In-depth insights, practitioner interviews, and strategic advisory —
              built for owners, managers, and analysts who need to act, not just
              understand.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center rounded-full bg-white px-7 py-3 text-sm font-semibold text-zinc-900 shadow-sm transition-all duration-200 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Book a Consultation
              </Link>
              <Link
                href="/insights"
                className="group inline-flex items-center gap-1.5 text-sm font-medium text-amber-400 transition-colors duration-150 hover:text-amber-300"
              >
                Explore insights
                <span
                  aria-hidden="true"
                  className="transition-transform duration-150 group-hover:translate-x-0.5"
                >
                  →
                </span>
              </Link>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  )
}
