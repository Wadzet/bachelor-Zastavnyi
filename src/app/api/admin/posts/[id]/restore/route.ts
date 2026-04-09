import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServerClient()

  // Restore to "review" — requires editorial sign-off before republishing.
  // published_at is preserved unchanged for historical reference.
  const { error } = await supabase
    .from("posts")
    .update({ status: "review" })
    .eq("id", id)

  if (error) {
    console.error("[admin/posts] restore error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to restore post." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
