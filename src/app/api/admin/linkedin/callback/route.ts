import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { exchangeCodeForToken, getMemberInfo } from "@/lib/linkedin/client"
import { getServerClient } from "@/lib/supabase/server"

// GET /api/admin/linkedin/callback
// LinkedIn OAuth callback. Validates state, exchanges code for token,
// fetches member identity, stores credentials in social_accounts, redirects back.
//
// On success: redirects to /admin/posts?linkedin=connected
// On failure: redirects to /admin/posts?linkedin=error
// (both params are informational only — the UI reads connection state from
//  GET /api/admin/linkedin/status, not from the URL param)

export async function GET(request: Request) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { searchParams } = new URL(request.url)
  const code  = searchParams.get("code")
  const state = searchParams.get("state")
  const oauthError = searchParams.get("error")

  const errorUrl     = new URL("/admin/posts?linkedin=error",     request.url)
  const connectedUrl = new URL("/admin/posts?linkedin=connected", request.url)

  // ── LinkedIn returned an error (user denied consent, etc.) ────────────────
  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError
    console.error("[linkedin/callback] OAuth error from LinkedIn:", desc.slice(0, 200))
    return NextResponse.redirect(errorUrl)
  }

  if (!code || !state) {
    console.error("[linkedin/callback] Missing code or state in callback")
    return NextResponse.redirect(errorUrl)
  }

  // ── Validate state cookie (CSRF protection) ───────────────────────────────
  const cookieStore = await cookies()
  const storedState = cookieStore.get("linkedin_oauth_state")?.value

  if (!storedState || storedState !== state) {
    console.error("[linkedin/callback] State mismatch — possible CSRF attempt or expired cookie")
    // Clear the stale cookie regardless
    const response = NextResponse.redirect(errorUrl)
    response.cookies.delete("linkedin_oauth_state")
    return response
  }

  // ── Exchange authorization code for access token ──────────────────────────
  let tokenData
  try {
    tokenData = await exchangeCodeForToken(code)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[linkedin/callback] Token exchange failed:", msg)
    const response = NextResponse.redirect(errorUrl)
    response.cookies.delete("linkedin_oauth_state")
    return response
  }

  // ── Fetch member identity via OIDC userinfo ───────────────────────────────
  let userInfo
  try {
    userInfo = await getMemberInfo(tokenData.access_token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[linkedin/callback] Member info fetch failed:", msg)
    const response = NextResponse.redirect(errorUrl)
    response.cookies.delete("linkedin_oauth_state")
    return response
  }

  // ── Compute token expiry ──────────────────────────────────────────────────
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  // ── Upsert social_accounts (server-side only — token never leaves server) ─
  const supabase = getServerClient()
  const { error: upsertError } = await supabase
    .from("social_accounts")
    .upsert(
      {
        provider:            "linkedin",
        account_type:        "member",
        provider_account_id: userInfo.sub,
        display_name:        userInfo.name    ?? null,
        access_token:        tokenData.access_token,
        expires_at:          expiresAt,
        metadata:            JSON.stringify({
          email:       userInfo.email       ?? null,
          given_name:  userInfo.given_name  ?? null,
          family_name: userInfo.family_name ?? null,
        }),
      },
      { onConflict: "provider,account_type,provider_account_id" },
    )

  if (upsertError) {
    console.error("[linkedin/callback] DB upsert error:", upsertError.message)
    const response = NextResponse.redirect(errorUrl)
    response.cookies.delete("linkedin_oauth_state")
    return response
  }

  // Debug-safe log — no tokens, no secrets
  console.log(
    `[linkedin/callback] Connected: ${userInfo.name ?? userInfo.sub}, ` +
    `expires: ${expiresAt}`,
  )

  // ── Success — clear state cookie and redirect ─────────────────────────────
  const response = NextResponse.redirect(connectedUrl)
  response.cookies.delete("linkedin_oauth_state")
  return response
}
