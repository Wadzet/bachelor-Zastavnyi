"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { getAuthBrowserClient } from "@/lib/supabase/auth-client"
import { BRAND } from "@/config/brand"

const inputCls =
  "w-full rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white " +
  "placeholder-zinc-600 outline-none transition-colors focus:border-zinc-600 " +
  "focus:ring-1 focus:ring-zinc-600/50 disabled:opacity-50"

export default function AdminLoginForm() {
  const router = useRouter()

  const [email,    setEmail]    = useState("")
  const [password, setPassword] = useState("")
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const supabase = getAuthBrowserClient()
      const { error: authError } = await supabase.auth.signInWithPassword({
        email:    email.trim(),
        password,
      })

      if (authError) {
        // Do not expose raw Supabase error messages — keep it generic
        setError("Invalid email or password. Please try again.")
        return
      }

      // Refresh server state and navigate to admin
      router.refresh()
      router.push("/admin")
    } catch {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">

        {/* Brand header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            {BRAND.name}
          </p>
          <h1 className="mt-2 text-2xl font-bold text-white">Admin login</h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Sign in with your admin credentials to continue.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">

          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              placeholder="you@example.com"
              className={inputCls}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs font-medium text-zinc-400"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              placeholder="••••••••"
              className={inputCls}
            />
          </div>

          {/* Error */}
          {error && (
            <p role="alert" className="text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full rounded-xl bg-amber-400 py-3 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>

        </form>

        {/* Footer note */}
        <p className="mt-6 text-center text-xs text-zinc-700">
          Access is restricted to authorised admin accounts only.
        </p>

      </div>
    </div>
  )
}
