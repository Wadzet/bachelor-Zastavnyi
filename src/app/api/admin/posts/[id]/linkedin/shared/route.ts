import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// Temporary MVP admin route. Must be protected by auth before production.
// LinkedIn distribution is manual — no LinkedIn API calls are made here.
// This route confirms that the admin has manually shared the post on LinkedIn.

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
    console.error("[admin/posts/linkedin/shared] fetch error:", fetchError.message)
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

  // ── Upsert distribution_jobs row — mark as manually shared ────────────────────
  // metadata.manual = true records that this was a manual admin share,
  // not an automated LinkedIn API post. This differentiates it from future
  // automated LinkedIn distribution once OAuth is implemented.
  const { error: upsertError } = await supabase
    .from("distribution_jobs")
    .upsert(
      {
        post_id:       id,
        channel:       "linkedin",
        status:        "sent",
        sent_at:       new Date().toISOString(),
        error_message: null,
        metadata:      JSON.stringify({ manual: true }),
      },
      { onConflict: "post_id,channel" },
    )

  if (upsertError) {
    console.error("[admin/posts/linkedin/shared] upsert error:", upsertError.message)
    return NextResponse.json(
      { success: false, message: "Failed to record LinkedIn share." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
