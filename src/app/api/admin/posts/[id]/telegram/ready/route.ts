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

  // ── Verify post exists ────────────────────────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[admin/posts/telegram/ready] fetch error:", fetchError.message)
    return NextResponse.json(
      { success: false, message: "Failed to look up post." },
      { status: 500 },
    )
  }

  if (!post) {
    return NextResponse.json(
      { success: false, message: "Post not found." },
      { status: 404 },
    )
  }

  // ── Upsert distribution_jobs row ──────────────────────────────────────────────
  const { error: upsertError } = await supabase
    .from("distribution_jobs")
    .upsert(
      {
        post_id:       id,
        channel:       "telegram",
        status:        "ready",
        error_message: null,
      },
      { onConflict: "post_id,channel" },
    )

  if (upsertError) {
    console.error("[admin/posts/telegram/ready] upsert error:", upsertError.message)
    return NextResponse.json(
      { success: false, message: "Failed to mark post as ready." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
