import Link from "next/link"
import { BRAND } from "@/config/brand"

const navLinks = [
  { label: "Insights", href: "/insights" },
  { label: "Interviews", href: "/interviews" },
]

export default function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-zinc-950/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Wordmark */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-white transition-colors hover:text-zinc-300"
        >
          {BRAND.name}
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-6 md:gap-8" aria-label="Main navigation">
          <ul className="hidden items-center gap-6 md:flex" role="list">
            {navLinks.map(({ label, href }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="text-sm font-medium text-zinc-400 transition-colors hover:text-white"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* CTA */}
          <Link
            href="/contact"
            className="inline-flex items-center justify-center rounded-full border border-zinc-700 bg-zinc-800/60 px-5 py-2 text-sm font-medium text-white transition-colors hover:border-zinc-600 hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-500"
          >
            Book a Consultation
          </Link>
        </nav>
      </div>
    </header>
  )
}
