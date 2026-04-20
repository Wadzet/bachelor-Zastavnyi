import { createServerClient } from "@supabase/ssr"
import { NextResponse, type NextRequest } from "next/server"

// ─── ADMIN_EMAILS check (inlined — middleware runs in Edge runtime) ────────────
// Cannot import from src/lib/auth/admin.ts (has "server-only" guard).

function isAllowedAdminEmail(email: string): boolean {
  const raw = process.env.ADMIN_EMAILS ?? ""
  const allowed = raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Always refresh auth session cookies so tokens stay alive.
  // createServerClient in middleware reads/writes NextRequest cookies.
  let response = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Write refreshed tokens back to both request and response
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // IMPORTANT: getUser() not getSession() — validates token server-side.
  const { data: { user } } = await supabase.auth.getUser()

  const isAdminPage = pathname.startsWith("/admin") && pathname !== "/admin/login"
  const isAdminApi  = pathname.startsWith("/api/admin")

  if (isAdminPage || isAdminApi) {
    const hasUser     = !!user?.email
    const emailAllowed = hasUser && isAllowedAdminEmail(user.email!)
    const isAdmin     = hasUser && emailAllowed

    // Debug-safe: no tokens, cookies, or env values logged
    console.log(`[middleware] ${pathname} — hasUser: ${hasUser}, emailAllowed: ${emailAllowed}`)

    if (!isAdmin) {
      // API routes → 401 JSON
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, message: "Unauthorized." },
          { status: 401 },
        )
      }
      // Admin pages → redirect to login
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return response
}

// ─── Matcher ──────────────────────────────────────────────────────────────────
// /admin(.*)   — matches /admin exactly AND /admin/anything (fixes bare /admin gap)
// /api/admin(.*)  — matches all admin API routes
// Note: /admin/:path* does NOT reliably match the bare /admin path in Next.js.

export const config = {
  matcher: [
    "/admin(.*)",
    "/api/admin(.*)",
  ],
}
