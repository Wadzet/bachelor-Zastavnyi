import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { exchangeCodeForToken, getMemberInfo } from "@/lib/linkedin/client"
import { getServerClient } from "@/lib/supabase/server"

// GET /api/admin/linkedin/callback
// LinkedIn OAuth callback. Validates CSRF state, exchanges code for token,
// fetches member identity via OIDC, stores credentials in social_accounts,
// then redirects back to the admin UI.
//
// On success: redirects to /admin/posts?linkedin=connected
// On failure: redirects to /admin/posts?linkedin=error&reason=<safe_reason>
//
// Safe reason codes (no secrets, no PII):
//   oauth_denied      — user cancelled or LinkedIn returned an OAuth error
//   missing_params    — code or state missing from callback URL
//   csrf              — state cookie missing, expired, or doesn't match URL param
//   token_exchange    — LinkedIn token exchange HTTP request failed
//   userinfo          — LinkedIn OIDC userinfo request failed
//   db                — Supabase upsert failed (check SUPABASE_SERVICE_ROLE_KEY)

// ─── Helper: build error redirect and clear state cookie ─────────────────────

function errorRedirect(baseUrl: string, reason: string): NextResponse {
  const url = new URL(`/admin/posts?linkedin=error&reason=${reason}`, baseUrl)
  const response = NextResponse.redirect(url)
  response.cookies.delete("linkedin_oauth_state")
  return response
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function GET(request: Request) {
  console.log("[linkedin/callback] started")

  // ── Admin auth check — must pass before any other action ─────────────────
  // requireAdminApiAuth() verifies the Supabase session cookie (anon-key SSR
  // client) and checks ADMIN_EMAILS. Returns 401 NextResponse if not admin.
  const authError = await requireAdminApiAuth()
  if (authError) {
    // 401 — not a redirect so the browser shows the JSON error body.
    // This can happen if the Supabase session cookie expired during the OAuth
    // flow or was not sent on the cross-site LinkedIn redirect.
    console.error("[linkedin/callback] auth check failed — not an admin session")
    return authError
  }

  const { searchParams } = new URL(request.url)
  const code       = searchParams.get("code")
  const state      = searchParams.get("state")
  const oauthError = searchParams.get("error")

  console.log(
    `[linkedin/callback] has_code=${!!code} ` +
    `has_state=${!!state} ` +
    `has_oauth_error=${!!oauthError}`,
  )

  // ── LinkedIn returned an OAuth error (user denied, app misconfigured, etc.) ─
  if (oauthError) {
    const desc = searchParams.get("error_description") ?? oauthError
    console.error("[linkedin/callback] OAuth error from LinkedIn:", desc.slice(0, 200))
    return errorRedirect(request.url, "oauth_denied")
  }

  // ── code and state must both be present ──────────────────────────────────
  if (!code || !state) {
    console.error("[linkedin/callback] Missing code or state in callback URL")
    return errorRedirect(request.url, "missing_params")
  }

  // ── Validate CSRF state cookie ────────────────────────────────────────────
  // The state cookie was set (httpOnly, sameSite:"lax") by the connect route.
  // sameSite:"lax" allows the cookie to be sent on this top-level cross-site
  // GET from LinkedIn back to our domain.
  const cookieStore = await cookies()
  const storedState = cookieStore.get("linkedin_oauth_state")?.value

  console.log(`[linkedin/callback] state_cookie_exists=${!!storedState}`)

  if (!storedState || storedState !== state) {
    console.error(
      "[linkedin/callback] state_valid=false — " +
      "possible CSRF attempt, expired cookie (>10 min), or browser blocked the cookie",
    )
    return errorRedirect(request.url, "csrf")
  }

  console.log("[linkedin/callback] state_valid=true")

  // ── Exchange authorization code for access token ──────────────────────────
  let tokenData
  try {
    tokenData = await exchangeCodeForToken(code)
    console.log("[linkedin/callback] token_exchange_success=true")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[linkedin/callback] token_exchange_success=false:", msg)
    return errorRedirect(request.url, "token_exchange")
  }

  // ── Fetch member identity via OIDC userinfo ───────────────────────────────
  // access_token is used server-side only — never logged, never sent to browser.
  let userInfo
  try {
    userInfo = await getMemberInfo(tokenData.access_token)
    console.log("[linkedin/callback] userinfo_success=true")
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[linkedin/callback] userinfo_success=false:", msg)
    return errorRedirect(request.url, "userinfo")
  }

  // ── Compute token expiry ──────────────────────────────────────────────────
  const expiresAt = new Date(Date.now() + tokenData.expires_in * 1000).toISOString()

  // ── Upsert social_accounts (service-role client — bypasses RLS) ──────────
  // getServerClient() uses SUPABASE_SERVICE_ROLE_KEY. The service role JWT
  // carries role:"service_role" which tells PostgREST to bypass RLS entirely.
  // If this upsert fails with an RLS error, SUPABASE_SERVICE_ROLE_KEY in
  // .env.local is likely set to the anon key — check the server startup log
  // for the "[Supabase] ⚠️  SUPABASE_SERVICE_ROLE_KEY has role=..." warning.
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
    // Likely cause if message contains "row-level security":
    //   SUPABASE_SERVICE_ROLE_KEY in .env.local is the anon key, not service role.
    //   See server startup log for "[Supabase] ⚠️  SUPABASE_SERVICE_ROLE_KEY" warning.
    console.error("[linkedin/callback] upsert_success=false:", upsertError.message)
    return errorRedirect(request.url, "db")
  }

  // Debug-safe: no token, no sub, just the display name and expiry
  console.log(
    `[linkedin/callback] upsert_success=true ` +
    `display_name="${userInfo.name ?? "(none)"}" ` +
    `expires_at=${expiresAt}`,
  )

  // ── Success — clear state cookie and redirect to admin UI ─────────────────
  const successUrl = new URL("/admin/posts?linkedin=connected", request.url)
  const response   = NextResponse.redirect(successUrl)
  response.cookies.delete("linkedin_oauth_state")
  return response
}
