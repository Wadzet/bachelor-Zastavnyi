import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Temporary MVP admin route. Must be protected by auth before production.

type DraftRow = {
  id:           string
  title:        string
  excerpt:      string
  body_markdown: string
  content_type: string
  topic:        string
  status:       string
}

type SupabaseClient = ReturnType<typeof getServerClient>

/** Convert a title to a URL-safe slug. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")        // spaces → hyphens
    .replace(/[^a-z0-9-]/g, "") // strip everything else
    .replace(/-{2,}/g, "-")      // collapse repeated hyphens
    .replace(/^-+|-+$/g, "")    // trim leading / trailing hyphens
}

/**
 * Find a slug that doesn't already exist in posts.
 * Tries: base → base-2 → base-3 … base-99
 * Last-resort fallback: base-<unix-ms>
 */
async function uniqueSlug(supabase: SupabaseClient, base: string): Promise<string> {
  const candidates = [
    base,
    ...Array.from({ length: 98 }, (_, i) => `${base}-${i + 2}`),
  ]
  for (const candidate of candidates) {
    const { data } = await supabase
      .from("posts")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle()
    if (!data) return candidate
  }
  return `${base}-${Date.now()}`
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = getServerClient()

  // ── 1. Fetch the draft ────────────────────────────────────────────────────

  const { data: draftData, error: draftErr } = await supabase
    .from("drafts")
    .select("id, title, excerpt, body_markdown, content_type, topic, status")
    .eq("id", id)
    .maybeSingle()

  if (draftErr) {
    console.error("[admin/drafts] promote fetch error:", draftErr.message)
    return NextResponse.json(
      { success: false, message: "Failed to promote draft." },
      { status: 500 },
    )
  }
  if (!draftData) {
    return NextResponse.json(
      { success: false, message: "Draft not found." },
      { status: 404 },
    )
  }

  const draft = draftData as unknown as DraftRow

  // ── 2. Validate status ────────────────────────────────────────────────────

  if (draft.status !== "approved") {
    return NextResponse.json(
      { success: false, message: "Only approved drafts can be promoted." },
      { status: 400 },
    )
  }

  // ── 2b. Block interview promotion ─────────────────────────────────────────
  // Interview posts require guest_data and qa_data which are not yet captured
  // in the drafts workflow. Promoting an interview draft would create a broken
  // public page. Block until an interview editor is implemented.

  if (draft.content_type === "interview") {
    return NextResponse.json(
      {
        success: false,
        message: "Interview drafts require guest and Q&A data before promotion.",
      },
      { status: 400 },
    )
  }

  // ── 3. Duplicate prevention ───────────────────────────────────────────────
  // If a post already references this draft_id, return success with the
  // existing post rather than creating a duplicate.

  const { data: existingData, error: existErr } = await supabase
    .from("posts")
    .select("id, slug")
    .eq("draft_id", id)
    .maybeSingle()

  if (existErr) {
    console.error("[admin/drafts] promote duplicate check error:", existErr.message)
    return NextResponse.json(
      { success: false, message: "Failed to promote draft." },
      { status: 500 },
    )
  }
  if (existingData) {
    const existing = existingData as unknown as { id: string; slug: string }
    return NextResponse.json(
      {
        success:      true,
        postId:       existing.id,
        slug:         existing.slug,
        alreadyExists: true,
        message:      "This draft has already been promoted to a post.",
      },
      { status: 200 },
    )
  }

  // ── 4. Generate a unique slug ─────────────────────────────────────────────

  const baseSlug = slugify(draft.title) || "untitled"
  const slug     = await uniqueSlug(supabase, baseSlug)

  // ── 5. Insert the new post ────────────────────────────────────────────────

  const { data: newPostData, error: insertErr } = await supabase
    .from("posts")
    .insert({
      title:           draft.title,
      excerpt:         draft.excerpt,
      body_markdown:   draft.body_markdown,
      content_type:    draft.content_type,
      topic:           draft.topic,
      slug,
      status:          "review",
      draft_id:        id,
      featured:        false,
      published_at:    null,
      cover_image_url: null,
      author_id:       null,
      guest_data:      null,
      qa_data:         null,
    })
    .select("id")
    .single()

  if (insertErr) {
    console.error("[admin/drafts] promote insert error:", insertErr.message)
    return NextResponse.json(
      { success: false, message: "Failed to promote draft." },
      { status: 500 },
    )
  }

  const newPost = newPostData as unknown as { id: string }

  return NextResponse.json(
    { success: true, postId: newPost.id, slug },
    { status: 200 },
  )
}
