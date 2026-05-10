import { NextResponse } from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { getServerClient } from "@/lib/supabase/server"

// GET /api/admin/linkedin/status
// Returns LinkedIn connection status for the admin UI.
// Safe to call from the browser — never returns the access_token.

export type LinkedInStatusResponse = {
  connected:    boolean
  expired?:     boolean
  displayName?: string
  expiresAt?:   string  // ISO date string — safe metadata, not a token
}

export async function GET() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("social_accounts")
    .select("display_name, expires_at, updated_at")
    .eq("provider", "linkedin")
    .eq("account_type", "member")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error("[linkedin/status] DB error:", error.message)
    // Fail safe — return not-connected rather than 500
    return NextResponse.json<LinkedInStatusResponse>({ connected: false })
  }

  if (!data) {
    return NextResponse.json<LinkedInStatusResponse>({ connected: false })
  }

  const isExpired = data.expires_at
    ? new Date(data.expires_at) < new Date()
    : false

  return NextResponse.json<LinkedInStatusResponse>({
    connected:   !isExpired,
    expired:     isExpired || undefined,
    displayName: data.display_name ?? undefined,
    expiresAt:   data.expires_at   ?? undefined,
  })
}
