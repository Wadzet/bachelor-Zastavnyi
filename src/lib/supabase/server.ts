/**
 * src/lib/supabase/server.ts
 *
 * Server-side Supabase client — service role.
 *
 * ⚠️  SERVER-ONLY FILE ⚠️
 * Do NOT import this file into:
 *   • client components ("use client")
 *   • browser-side code of any kind
 *   • any file that can be bundled for the browser
 *
 * The service role key bypasses all Row Level Security (RLS) policies
 * and grants unrestricted access to the database. Exposing it to the
 * browser would be a critical security vulnerability.
 *
 * Safe import locations:
 *   • Next.js Server Components (default — no "use client" directive)
 *   • Next.js Server Actions  ("use server" directive)
 *   • Next.js Route Handlers  (app/api/ — server-side only)
 *   • src/lib/supabase/server.ts itself (this file)
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// ---------------------------------------------------------------------------
// Lazy singleton — the client is created on first call, not at module load.
//
// Why lazy?
//   During `next build`, Next.js evaluates module-level code. If the client
//   were instantiated at the top level, a missing env var would crash the
//   build for every developer who hasn't set up .env.local yet.
//   By creating the client inside the function, the error is only thrown
//   when a server action or server component actually calls getServerClient(),
//   which never happens during a static build.
// ---------------------------------------------------------------------------
let _client: SupabaseClient | null = null

/**
 * Returns a Supabase client authenticated with the service role key.
 *
 * Call this in Server Components, Server Actions, and Route Handlers only.
 * The client is created once and reused across calls within the same
 * Node.js module lifetime (standard Next.js server process).
 *
 * @throws {Error} If NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY
 *                 are not set in the environment.
 */
export function getServerClient(): SupabaseClient {
  if (_client) return _client

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url) {
    throw new Error(
      "[Supabase] Missing env var: NEXT_PUBLIC_SUPABASE_URL\n" +
        "Copy .env.example to .env.local and fill in your Supabase project URL.\n" +
        "Find it at: Supabase Dashboard → Project Settings → API → Project URL"
    )
  }

  if (!serviceRoleKey) {
    throw new Error(
      "[Supabase] Missing env var: SUPABASE_SERVICE_ROLE_KEY\n" +
        "Copy .env.example to .env.local and fill in your service role key.\n" +
        "Find it at: Supabase Dashboard → Project Settings → API → service_role key\n" +
        "⚠️  Never commit this key. Never use it in client components."
    )
  }

  _client = createClient(url, serviceRoleKey, {
    auth: {
      // Server-side service role clients do not need session persistence.
      // Cookies and local storage are irrelevant here.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return _client
}
