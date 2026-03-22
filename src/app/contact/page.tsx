import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import ConsultationForm from "@/components/contact/ConsultationForm"

export const metadata: Metadata = {
  title: `Book a Consultation — ${BRAND.name}`,
  description:
    "Talk to our team about AI strategy, operations, and practical transformation for your business.",
}

const coveragePoints = [
  {
    label: "AI strategy and readiness",
    detail: "Where your business stands and what a realistic adoption path looks like.",
  },
  {
    label: "Operational transformation",
    detail: "Which workflows are ready to automate and how to sequence the transition.",
  },
  {
    label: "Decision-making and governance",
    detail: "How to build internal confidence and accountability around AI-driven decisions.",
  },
]

export default function ContactPage() {
  return (
    <div className="relative min-h-screen bg-zinc-950">
      {/* Grid texture — consistent with homepage sections */}
      <div className="pointer-events-none absolute inset-0 bg-grid-subtle" />

      {/* Warm ambient glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 10% 20%, rgba(251,191,36,0.035), transparent)",
        }}
      />

      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <div className="grid gap-16 lg:grid-cols-2 lg:gap-20 xl:gap-28">

          {/* ── Left: pitch copy ──────────────────────────── */}
          <div className="flex flex-col justify-center">
            <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Strategic Advisory
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Book a<br className="hidden sm:block" /> Consultation
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-zinc-400">
              Our team works directly with business owners, managers, and analysts to
              translate AI capability into decisions that hold up in practice — not
              just in a deck.
            </p>

            {/* What we cover */}
            <div className="mt-10 space-y-6">
              {coveragePoints.map((point) => (
                <div key={point.label} className="flex gap-4">
                  <div className="mt-1 h-1.5 w-1.5 shrink-0 translate-y-[5px] rounded-full bg-amber-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">{point.label}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-zinc-500">
                      {point.detail}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Trust line */}
            <p className="mt-10 text-xs text-zinc-600">
              We respond to all enquiries within one business day.
            </p>
          </div>

          {/* ── Right: form panel ─────────────────────────── */}
          <div>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 sm:p-10">
              <h2 className="mb-6 text-base font-semibold text-white">
                Tell us about your situation
              </h2>
              <ConsultationForm />
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
