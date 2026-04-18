import "server-only"

import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

// ─── Auth server client ───────────────────────────────────────────────────────
// Uses the ANON/publishable key — NOT the service role key.
// Safe for session verification; does not bypass RLS.
// Use getServerClient() (service role) only AFTER admin auth is confirmed.

export async function getAuthServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // Ignore in React Server Components — cookies cannot be set after
            // response streaming starts. Session refresh is handled by middleware.
          }
        },
      },
    },
  )
}
