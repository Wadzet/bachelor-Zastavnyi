"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthBrowserClient } from "@/lib/supabase/auth-client"

export default function LogoutButton() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      const supabase = getAuthBrowserClient()
      await supabase.auth.signOut()
      router.refresh()
      router.push("/admin/login")
    } catch {
      // Even on error, redirect to login — session is likely invalid
      router.push("/admin/login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="group flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs text-zinc-600 transition-colors hover:text-red-400 disabled:opacity-50"
    >
      {/* Logout icon */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-3.5 w-3.5 shrink-0 transition-colors group-hover:text-red-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.75}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
        />
      </svg>
      {loading ? "Signing out…" : "Sign out"}
    </button>
  )
}
