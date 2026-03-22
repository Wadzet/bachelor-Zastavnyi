"use client"

import { useState } from "react"
import Link from "next/link"

type FieldProps = {
  id: string
  label: string
  type?: string
  required?: boolean
  autoComplete?: string
}

function Field({ id, label, type = "text", required = true, autoComplete }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-zinc-400">
        {label}
        {required && <span className="ml-0.5 text-amber-400/80">*</span>}
      </label>
      <input
        id={id}
        name={id}
        type={type}
        required={required}
        autoComplete={autoComplete}
        className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50"
      />
    </div>
  )
}

function SuccessState() {
  return (
    <div className="flex flex-col items-center gap-5 py-10 text-center">
      {/* Amber check circle */}
      <div className="flex h-12 w-12 items-center justify-center rounded-full border border-amber-400/20 bg-amber-400/10">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 text-amber-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>

      <div>
        <h3 className="text-base font-semibold text-white">Request received</h3>
        <p className="mt-2 max-w-xs text-sm leading-relaxed text-zinc-400">
          Thank you — our team will review your request and get back to you within
          one business day.
        </p>
      </div>

      <Link
        href="/insights"
        className="mt-2 text-xs font-medium text-amber-400 transition-colors hover:text-amber-300"
      >
        Explore our insights →
      </Link>
    </div>
  )
}

export default function ConsultationForm() {
  const [submitted, setSubmitted] = useState(false)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    // UI-only: no backend submission in this slice
    setSubmitted(true)
  }

  if (submitted) {
    return <SuccessState />
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="full-name" label="Full name" autoComplete="name" />
        <Field id="work-email" label="Work email" type="email" autoComplete="email" />
        <Field id="company" label="Company name" autoComplete="organization" />
        <Field id="role" label="Role / job title" autoComplete="organization-title" />
      </div>

      {/* Message */}
      <div className="flex flex-col gap-1.5">
        <label htmlFor="message" className="text-xs font-medium text-zinc-400">
          How can we help?<span className="ml-0.5 text-amber-400/80">*</span>
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          className="w-full resize-none rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-2.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors duration-150 focus:border-zinc-600 focus:ring-1 focus:ring-zinc-600/50"
        />
      </div>

      <button
        type="submit"
        className="inline-flex w-full items-center justify-center rounded-full bg-amber-400 px-6 py-3 text-sm font-semibold text-zinc-950 shadow-sm transition-all duration-200 hover:bg-amber-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-400"
      >
        Request Consultation
      </button>

      <p className="text-center text-xs text-zinc-600">
        All fields are required. We do not share your information.
      </p>
    </form>
  )
}
