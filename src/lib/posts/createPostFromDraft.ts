import "server-only"

import { getServerClient } from "@/lib/supabase/server"

// =============================================================================
// createPostFromDraft — reusable "promote draft → post" service
// =============================================================================
//
// Core logic extracted from POST /api/admin/drafts/[id]/promote so it can be
// reused by both the manual promote route (Editorial Mode) and the Automated
// Mode orchestrator.
//
// Behaviour preserved from the original route:
//   • Editorial Mode requires the draft to be 'approved'.
//   • Interview drafts are blocked (need guest/Q&A data).
//   • Duplicate prevention: if a post already references this draft_id, the
//     existing post is returned instead of creating a second one.
//   • A unique slug is generated; the new post starts in 'review' status.
//
// Automated Mode difference (opts.fromAutomation = true):
//   • Allows promoting a draft that is still in 'review' status, because the
//     automated pipeline creates drafts in 'review' and there is no human
//     approval step. Everything else is identical — the post is still created
//     unpublished ('review'); publishing remains a separate, gated action.
// =============================================================================

type DraftRow = {
  id:            string
  title:         string
  excerpt:       string
  body_markdown: string
  content_type:  string
  topic:         string
  status:        string
}

type SupabaseClient = ReturnType<typeof getServerClient>

export type CreatePostFromDraftResult =
  | { ok: true;  postId: string; slug: string; alreadyExists?: boolean }
  | { ok: false; status: number; message: string }

/** Convert a title to a URL-safe slug. */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
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

export async function createPostFromDraft(
  draftId: string,
  opts: { fromAutomation?: boolean } = {},
): Promise<CreatePostFromDraftResult> {
  const { fromAutomation = false } = opts
  const supabase = getServerClient()

  // ── 1. Fetch the draft ────────────────────────────────────────────────────
  const { data: draftData, error: draftErr } = await supabase
    .from("drafts")
    .select("id, title, excerpt, body_markdown, content_type, topic, status")
    .eq("id", draftId)
    .maybeSingle()

  if (draftErr) {
    console.error("[createPostFromDraft] fetch error:", draftErr.message)
    return { ok: false, status: 500, message: "Failed to promote draft." }
  }
  if (!draftData) {
    return { ok: false, status: 404, message: "Draft not found." }
  }

  const draft = draftData as unknown as DraftRow

  // ── 2. Validate status ────────────────────────────────────────────────────
  // Editorial Mode: only 'approved' drafts may be promoted.
  // Automated Mode: 'review' or 'approved' are acceptable (no human approval step).
  const allowedStatuses = fromAutomation ? ["review", "approved"] : ["approved"]
  if (!allowedStatuses.includes(draft.status)) {
    return {
      ok: false,
      status: 400,
      message: fromAutomation
        ? "Only review or approved drafts can be promoted."
        : "Only approved drafts can be promoted.",
    }
  }

  // ── 2b. Block interview promotion ─────────────────────────────────────────
  // Interview posts require guest_data and qa_data not captured in the drafts
  // workflow. Promoting one would create a broken public page.
  if (draft.content_type === "interview") {
    return {
      ok: false,
      status: 400,
      message: "Interview drafts require guest and Q&A data before promotion.",
    }
  }

  // ── 3. Duplicate prevention ───────────────────────────────────────────────
  const { data: existingData, error: existErr } = await supabase
    .from("posts")
    .select("id, slug")
    .eq("draft_id", draftId)
    .maybeSingle()

  if (existErr) {
    console.error("[createPostFromDraft] duplicate check error:", existErr.message)
    return { ok: false, status: 500, message: "Failed to promote draft." }
  }
  if (existingData) {
    const existing = existingData as unknown as { id: string; slug: string }
    return { ok: true, postId: existing.id, slug: existing.slug, alreadyExists: true }
  }

  // ── 4. Generate a unique slug ─────────────────────────────────────────────
  const baseSlug = slugify(draft.title) || "untitled"
  const slug     = await uniqueSlug(supabase, baseSlug)

  // ── 5. Insert the new post (status 'review' — unpublished) ────────────────
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
      draft_id:        draftId,
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
    console.error("[createPostFromDraft] insert error:", insertErr.message)
    return { ok: false, status: 500, message: "Failed to promote draft." }
  }

  const newPost = newPostData as unknown as { id: string }
  return { ok: true, postId: newPost.id, slug }
}
