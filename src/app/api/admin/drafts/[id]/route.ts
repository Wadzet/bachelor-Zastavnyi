import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// Temporary MVP admin route. Must be protected by auth before production.

const VALID_TOPICS = [
  "AI Strategy",
  "Operations",
  "Leadership",
  "Automation",
  "Case Study",
  "Market Trends",
] as const

const VALID_TYPES = ["insight", "interview", "article", "news"] as const

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

  const { title, excerpt, body: draftBody, topic, type, sourceUrl } =
    body as Record<string, unknown>

  // ── Validation ────────────────────────────────────────────────────────────

  if (!title || typeof title !== "string" || !title.trim()) {
    return NextResponse.json(
      { success: false, message: "Title is required." },
      { status: 400 },
    )
  }
  if (!excerpt || typeof excerpt !== "string" || !excerpt.trim()) {
    return NextResponse.json(
      { success: false, message: "Excerpt is required." },
      { status: 400 },
    )
  }
  if (!draftBody || typeof draftBody !== "string" || !draftBody.trim()) {
    return NextResponse.json(
      { success: false, message: "Body is required." },
      { status: 400 },
    )
  }
  if (
    !topic ||
    typeof topic !== "string" ||
    !(VALID_TOPICS as readonly string[]).includes(topic)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid topic." },
      { status: 400 },
    )
  }
  if (
    !type ||
    typeof type !== "string" ||
    !(VALID_TYPES as readonly string[]).includes(type)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid content type." },
      { status: 400 },
    )
  }

  // ── Update ────────────────────────────────────────────────────────────────

  const supabase = getServerClient()

  const { error } = await supabase
    .from("drafts")
    .update({
      title:        (title as string).trim(),
      excerpt:      (excerpt as string).trim(),
      body_markdown: (draftBody as string).trim(),
      topic:        topic as string,
      content_type: type as string,
      source_url:
        typeof sourceUrl === "string" && sourceUrl.trim()
          ? sourceUrl.trim()
          : null,
    })
    .eq("id", id)

  if (error) {
    console.error("[admin/drafts] PATCH error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to update draft." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
