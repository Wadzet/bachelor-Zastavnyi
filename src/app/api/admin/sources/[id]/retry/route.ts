import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// Temporary MVP admin route. Must be protected by auth before production.
// Note: this does NOT perform real source checking/scraping.
// It resets status to "active" and stamps last_checked_at as a manual retry marker.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

  const { error } = await supabase
    .from("sources")
    .update({
      status:          "active",
      last_checked_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (error) {
    console.error("[admin/sources] retry error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to retry source." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
