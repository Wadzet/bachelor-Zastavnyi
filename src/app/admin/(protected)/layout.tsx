import { redirect } from "next/navigation"
import { getAdminUser } from "@/lib/auth/admin"

// ─── Server-side auth guard ───────────────────────────────────────────────────
// This layout wraps /admin, /admin/sources, /admin/drafts, /admin/posts.
// /admin/login is NOT under this group — it is never subject to this check.
//
// Defense-in-depth: protects admin pages even if middleware is bypassed.
// Uses getAdminUser() which calls supabase.auth.getUser() — server-validates
// the session token; does not trust the client-side session cache.

export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getAdminUser()

  if (!user) {
    // Debug-safe: no tokens, cookies, or env values logged
    console.log("[admin/layout] access denied — hasUser: false, redirecting to /admin/login")
    redirect("/admin/login")
  }

  console.log("[admin/layout] access granted — hasUser: true, emailAllowed: true")
  return <>{children}</>
}
