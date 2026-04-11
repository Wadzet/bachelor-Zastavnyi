import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

const VALID_TYPES    = ["newsletter", "blog", "podcast", "social", "news", "research"] as const
const VALID_STATUSES = ["active", "paused", "error"] as const
const URL_RE         = /^https?:\/\/.+/

export async function POST(request: Request) {
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

  // Status defaults to "active" if omitted or invalid.
  const resolvedStatus =
    typeof status === "string" && (VALID_STATUSES as readonly string[]).includes(status)
      ? (status as string)
      : "active"

  // ── Insert ────────────────────────────────────────────────────────────────

  const supabase = getServerClient()

  const { error } = await supabase.from("sources").insert({
    name:            (name as string).trim(),
    url:             (url as string).trim(),
    type:            type as string,
    status:          resolvedStatus,
    description:
      typeof description === "string" && description.trim()
        ? description.trim()
        : null,
    last_checked_at: null,
  })

  if (error) {
    console.error("[admin/sources] POST error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to add source." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
