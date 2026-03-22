"use client"

import { usePathname } from "next/navigation"

const pageTitles: Record<string, string> = {
  "/admin":         "Dashboard",
  "/admin/sources": "Sources",
  "/admin/drafts":  "Drafts",
  "/admin/posts":   "Posts",
}

function IconMenu() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  )
}

type AdminHeaderProps = {
  onMenuClick: () => void
}

export default function AdminHeader({ onMenuClick }: AdminHeaderProps) {
  const pathname = usePathname()

  // Exact match first, then strip trailing segments for nested routes
  const title =
    pageTitles[pathname] ??
    pageTitles[Object.keys(pageTitles).find((k) => pathname.startsWith(k + "/")) ?? ""] ??
    "Admin"

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b border-zinc-800 bg-zinc-900/95 px-4 backdrop-blur-sm sm:px-6">
      {/* Mobile menu toggle */}
      <button
        type="button"
        onClick={onMenuClick}
        className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white lg:hidden"
        aria-label="Open navigation"
      >
        <IconMenu />
      </button>

      {/* Page title */}
      <h1 className="text-sm font-semibold text-white">
        {title}
      </h1>
    </header>
  )
}
