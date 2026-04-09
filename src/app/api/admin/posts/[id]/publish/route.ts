import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServerClient()

  // Fetch the current published_at so we can preserve it if already set.
  const { data: current, error: fetchErr } = await supabase
    .from("posts")
    .select("published_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchErr) {
    console.error("[admin/posts] publish fetch error:", fetchErr.message)
    return NextResponse.json(
      { success: false, message: "Failed to publish post." },
      { status: 500 },
    )
  }

  // Keep existing published_at; set to now() only on first publish.
  const publishedAt =
    (current as { published_at: string | null } | null)?.published_at ??
    new Date().toISOString()

  const { error } = await supabase
    .from("posts")
    .update({ status: "published", published_at: publishedAt })
    .eq("id", id)

  if (error) {
    console.error("[admin/posts] publish update error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to publish post." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
