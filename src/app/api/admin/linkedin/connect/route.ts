import { NextResponse } from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { buildAuthorizationUrl } from "@/lib/linkedin/client"

// GET /api/admin/linkedin/connect
// Initiates the LinkedIn OAuth authorization flow.
// Generates a CSRF state token, stores it in an httpOnly cookie,
// then redirects the browser to the LinkedIn consent screen.

export async function GET() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  // Cryptographically secure random state for CSRF protection.
  // crypto.randomUUID() is available globally in Node.js 16+ and Edge runtime.
  const state = crypto.randomUUID()

  const authUrl = buildAuthorizationUrl(state)

  // Set state in cookie on the redirect response.
  // httpOnly: prevents JS access | secure: HTTPS-only in prod
  // sameSite: "lax" — cookie is sent on top-level cross-site GET navigations
  // (LinkedIn redirects back via GET, so "lax" is required over "strict")
  const response = NextResponse.redirect(authUrl)
  response.cookies.set("linkedin_oauth_state", state, {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge:   600,  // 10 minutes — expires if admin doesn't complete OAuth in time
    path:     "/",
  })

  return response
}
