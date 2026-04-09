import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

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

// Slug: lowercase letters, numbers, hyphens; at least one character.
// Allows single-char slugs (e.g. "a") and multi-char slugs.
const SLUG_RE = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
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

  const {
    title,
    excerpt,
    slug,
    topic,
    type,
    body: postBody,
    featured,
    coverImage,
  } = body as Record<string, unknown>

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
  if (!slug || typeof slug !== "string" || !slug.trim()) {
    return NextResponse.json(
      { success: false, message: "Slug is required." },
      { status: 400 },
    )
  }
  if (!SLUG_RE.test((slug as string).trim())) {
    return NextResponse.json(
      {
        success: false,
        message: "Slug may only contain lowercase letters, numbers, and hyphens.",
      },
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
  // Body is required for all non-interview content types.
  if (type !== "interview") {
    if (!postBody || typeof postBody !== "string" || !(postBody as string).trim()) {
      return NextResponse.json(
        { success: false, message: "Body is required for this content type." },
        { status: 400 },
      )
    }
  }

  // ── Update ────────────────────────────────────────────────────────────────

  const supabase = getServerClient()

  const { error } = await supabase
    .from("posts")
    .update({
      title:           (title as string).trim(),
      excerpt:         (excerpt as string).trim(),
      slug:            (slug as string).trim(),
      topic:           topic as string,
      content_type:    type as string,
      body_markdown:
        typeof postBody === "string" && (postBody as string).trim()
          ? (postBody as string).trim()
          : null,
      featured:        typeof featured === "boolean" ? featured : false,
      cover_image_url:
        typeof coverImage === "string" && (coverImage as string).trim()
          ? (coverImage as string).trim()
          : null,
    })
    .eq("id", id)

  if (error) {
    console.error("[admin/posts] PATCH error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to update post." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
