import Link from "next/link"
import { BRAND } from "@/config/brand"

const navLinks = [
  { label: "Insights", href: "/insights" },
  { label: "Interviews", href: "/interviews" },
]

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-zinc-800/60 bg-zinc-950">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          {/* Brand */}
          <div className="flex flex-col gap-1">
            <span className="text-base font-bold tracking-tight text-white">
              {BRAND.name}
            </span>
            <span className="text-sm text-zinc-500">{BRAND.tagline}</span>
          </div>

          {/* Nav links */}
          <nav aria-label="Footer navigation">
            <ul className="flex items-center gap-6" role="list">
              {navLinks.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-zinc-500 transition-colors hover:text-white"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-zinc-800/60 pt-6">
          <p className="text-xs text-zinc-600">
            &copy; {currentYear} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
