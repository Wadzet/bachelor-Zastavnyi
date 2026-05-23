import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// =============================================================================
// PATCH /api/admin/sources/[id]/automation — toggle per-source automation
// =============================================================================
//
// Controls whether a source is included in SCHEDULED automation checks
// (sources.automation_enabled). Manual "Run automation now" still processes
// every active source regardless of this flag.
//
// Admin-only. Body: { automationEnabled: boolean }.
// =============================================================================

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    )
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    )
  }

  const { automationEnabled } = body as Record<string, unknown>

  if (typeof automationEnabled !== "boolean") {
    return NextResponse.json(
      { success: false, message: "automationEnabled must be a boolean." },
      { status: 400 },
    )
  }

  const supabase = getServerClient()

  const { error } = await supabase
    .from("sources")
    .update({ automation_enabled: automationEnabled })
    .eq("id", id)

  if (error) {
    console.error("[admin/sources] automation toggle error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to update source automation." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true, automationEnabled }, { status: 200 })
}
