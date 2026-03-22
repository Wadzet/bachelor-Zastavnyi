"use client"

import { motion } from "motion/react"
import Link from "next/link"

const ease = [0.25, 0.46, 0.45, 0.94] as const

export default function ConsultationBanner() {
  return (
    <section className="relative overflow-hidden bg-zinc-900">
      {/* Grid texture — slightly more visible than hero since bg is lighter */}
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle" />

      {/* Warm radial — reinforces amber CTA */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 80% at 100% 50%, rgba(251,191,36,0.04), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-24 lg:px-8">
        <motion.div
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease }}
          className="flex flex-col gap-10 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Copy */}
          <div className="max-w-xl">
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Advisory
            </p>
            <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
              Need strategic guidance on AI for your business?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-zinc-400">
              Our team works directly with business owners, managers, and analysts
              to translate AI capability into operational decisions that hold up
              in practice.
            </p>
          </div>

          {/* CTA — amber pill: the one place amber is used as a background */}
          <div className="shrink-0">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-full bg-amber-400 px-7 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-all duration-200 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
            >
              Book a Consultation
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
