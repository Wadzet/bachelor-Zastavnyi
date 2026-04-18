import { createBrowserClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"

// ─── Auth browser client ──────────────────────────────────────────────────────
// Uses the ANON/publishable key — NOT the service role key.
// Used exclusively for client-side auth: signInWithPassword and signOut.
// Never used for direct database mutations.

let _client: SupabaseClient | null = null

export function getAuthBrowserClient(): SupabaseClient {
  if (_client) return _client
  _client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  )
  return _client
}
