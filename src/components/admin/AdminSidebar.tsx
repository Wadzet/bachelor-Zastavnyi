"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import Logo from "@/components/brand/Logo"
import LogoutButton from "@/components/admin/LogoutButton"

// ─── Icons ────────────────────────────────────────────────────────────────────

function IconDashboard() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2V6zM4 16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-2zm10 0a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2v-2z" />
    </svg>
  )
}

function IconSources() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 0 0-5.656 0l-4 4a4 4 0 1 0 5.656 5.656l1.102-1.101m-.758-4.899a4 4 0 0 0 5.656 0l4-4a4 4 0 0 0-5.656-5.656l-1.1 1.1" />
    </svg>
  )
}

function IconDrafts() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5m-1.414-9.414a2 2 0 1 1 2.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  )
}

function IconPosts() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
    </svg>
  )
}

function IconExternal() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75} aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  )
}

// ─── Nav items ────────────────────────────────────────────────────────────────

type NavItem = {
  href: string
  label: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { href: "/admin",         label: "Dashboard", icon: <IconDashboard /> },
  { href: "/admin/sources", label: "Sources",   icon: <IconSources /> },
  { href: "/admin/drafts",  label: "Drafts",    icon: <IconDrafts /> },
  { href: "/admin/posts",   label: "Posts",     icon: <IconPosts /> },
]

// ─── Component ────────────────────────────────────────────────────────────────

type AdminSidebarProps = {
  onClose?: () => void
}

export default function AdminSidebar({ onClose }: AdminSidebarProps) {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === "/admin") return pathname === "/admin"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-zinc-800 bg-zinc-900">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-zinc-800 px-5">
        <Logo className="h-5" />
        <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-amber-400">
          Admin
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Admin navigation">
        <ul role="list" className="space-y-0.5">
          {navItems.map(({ href, label, icon }) => (
            <li key={href}>
              <Link
                href={href}
                onClick={onClose}
                className={[
                  "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                  isActive(href)
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-400 hover:bg-zinc-800/60 hover:text-white",
                ].join(" ")}
                aria-current={isActive(href) ? "page" : undefined}
              >
                <span className={[
                  "shrink-0 transition-colors duration-150",
                  isActive(href) ? "text-amber-400" : "text-zinc-600 group-hover:text-zinc-400",
                ].join(" ")}>
                  {icon}
                </span>
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Footer: view public site + sign out */}
      <div className="shrink-0 border-t border-zinc-800 px-3 py-4 space-y-0.5">
        <Link
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="group flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-zinc-400"
        >
          <IconExternal />
          View public site
        </Link>
        <LogoutButton />
      </div>
    </aside>
  )
}
