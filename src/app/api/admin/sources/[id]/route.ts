import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

const VALID_TYPES    = ["newsletter", "blog", "podcast", "social", "news", "research"] as const
const VALID_STATUSES = ["active", "paused", "error"] as const
const URL_RE         = /^https?:\/\/.+/

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

  const { name, url, type, status, description } = body as Record<string, unknown>

  // ── Validation ────────────────────────────────────────────────────────────

  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json(
      { success: false, message: "Name is required." },
      { status: 400 },
    )
  }
  if (!url || typeof url !== "string" || !url.trim()) {
    return NextResponse.json(
      { success: false, message: "URL is required." },
      { status: 400 },
    )
  }
  if (!URL_RE.test((url as string).trim())) {
    return NextResponse.json(
      { success: false, message: "URL must start with http:// or https://." },
      { status: 400 },
    )
  }
  if (!type || typeof type !== "string" || !(VALID_TYPES as readonly string[]).includes(type)) {
    return NextResponse.json(
      { success: false, message: "Invalid source type." },
      { status: 400 },
    )
  }
  if (!status || typeof status !== "string" || !(VALID_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json(
      { success: false, message: "Invalid source status." },
      { status: 400 },
    )
  }

  // ── Update ────────────────────────────────────────────────────────────────

  const supabase = getServerClient()

  const { error } = await supabase
    .from("sources")
    .update({
      name:        (name as string).trim(),
      url:         (url as string).trim(),
      type:        type as string,
      status:      status as string,
      description:
        typeof description === "string" && description.trim()
          ? description.trim()
          : null,
    })
    .eq("id", id)

  if (error) {
    console.error("[admin/sources] PATCH error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to update source." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 200 })
}
