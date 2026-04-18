import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// Temporary MVP admin route. Must be protected by auth before production.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

  // Archive the post — published_at is intentionally preserved for audit history.
  const { error } = await supabase
    .from("posts")
    .update({ status: "archived" })
    .eq("id", id)

  if (error) {
    console.error("[admin/posts] archive error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to archive post." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
