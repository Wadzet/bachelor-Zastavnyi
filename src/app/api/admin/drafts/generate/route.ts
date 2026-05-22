import { NextResponse } from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { generateDraft } from "@/lib/drafts/generateDraft"

// POST /api/admin/drafts/generate
//
// Thin HTTP wrapper around the reusable generateDraft() service
// (src/lib/drafts/generateDraft.ts). The same service powers Automated Mode.
//
// Requires admin auth. All generation, validation, and logging happen inside
// the service; this handler only parses the request and maps the result.

export async function POST(request: Request) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid JSON body." },
      { status: 400 },
    )
  }

  const { mode, input, type, topic, model } = body as Record<string, string>

  const result = await generateDraft({ mode: mode as "url" | "text", input, type, topic, model })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    )
  }

  return NextResponse.json(
    { success: true, draftId: result.draftId, title: result.title },
    { status: 201 },
  )
}
