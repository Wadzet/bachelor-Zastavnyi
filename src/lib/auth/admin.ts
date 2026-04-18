import "server-only"

import { NextResponse } from "next/server"
import { getAuthServerClient } from "@/lib/supabase/auth-server"

// ─── ADMIN_EMAILS allow-list ──────────────────────────────────────────────────
// Comma-separated email addresses permitted to access /admin/* routes.
// Example: ADMIN_EMAILS=alice@example.com,bob@example.com
// Comparison is case-insensitive.

export function isAllowedAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ""
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

// ─── getAdminUser ─────────────────────────────────────────────────────────────
// Returns the authenticated Supabase user if:
//   1. A valid session exists (verified via getUser(), not getSession())
//   2. The user's email is in ADMIN_EMAILS
// Returns null otherwise — never throws.

export async function getAdminUser() {
  try {
    const supabase = await getAuthServerClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error || !user?.email) return null
    if (!isAllowedAdminEmail(user.email)) return null
    return user
  } catch {
    return null
  }
}

// ─── requireAdminUser ─────────────────────────────────────────────────────────
// Throws if the user is not authenticated or not in ADMIN_EMAILS.

export async function requireAdminUser() {
  const user = await getAdminUser()
  if (!user) throw new Error("Unauthorized")
  return user
}

// ─── requireAdminApiAuth ──────────────────────────────────────────────────────
// Convenience wrapper for API route handlers.
// Returns a 401 NextResponse if not an admin; null if access is allowed.
// Pattern:
//   const authError = await requireAdminApiAuth()
//   if (authError) return authError

export async function requireAdminApiAuth(): Promise<NextResponse | null> {
  const user = await getAdminUser()
  if (!user) {
    return NextResponse.json(
      { success: false, message: "Unauthorized." },
      { status: 401 },
    )
  }
  return null
}
