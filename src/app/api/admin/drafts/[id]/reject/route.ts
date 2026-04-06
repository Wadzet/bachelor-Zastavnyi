import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServerClient()

  const { error } = await supabase
    .from("drafts")
    .update({ status: "rejected" })
    .eq("id", id)

  if (error) {
    console.error("[admin/drafts] reject error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to reject draft." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
