import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { createLinkedInPost } from "@/lib/linkedin/client"
import { BRAND } from "@/config/brand"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// POST /api/admin/posts/[id]/linkedin/send
// Sends a published post to the connected LinkedIn member profile via the API.
// Requires a valid non-expired token in social_accounts.
//
// On success: upserts distribution_jobs with status=sent
// On failure: upserts distribution_jobs with status=failed (safe error only)

// ─── Message builder (server-side — never trust client text) ─────────────────

function publicUrlPath(contentType: string, slug: string): string {
  return contentType === "interview" ? `/interviews/${slug}` : `/insights/${slug}`
}

function buildLinkedInText(
  title:       string,
  excerpt:     string,
  contentType: string,
  slug:        string,
): string {
  const url          = `${BRAND.siteUrl}${publicUrlPath(contentType, slug)}`
  const shortExcerpt = excerpt.length > 200 ? excerpt.slice(0, 197) + "…" : excerpt
  return (
    `${title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read more: ${url}\n\n` +
    `#AI #BusinessStrategy #Operations #DigitalTransformation`
  )
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

  // ── Fetch post ────────────────────────────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, excerpt, content_type, slug, status")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[admin/posts/linkedin/send] fetch error:", fetchError.message)
    return NextResponse.json(
      { success: false, message: "Failed to look up post." },
      { status: 500 },
    )
  }

  if (!post) {
    return NextResponse.json(
      { success: false, message: "Post not found." },
      { status: 404 },
    )
  }

  const { title, excerpt, content_type, slug, status } = post as {
    id: string; title: string; excerpt: string
    content_type: string; slug: string; status: string
  }

  if (status !== "published") {
    return NextResponse.json(
      { success: false, message: "Only published posts can be shared on LinkedIn." },
      { status: 400 },
    )
  }

  // ── Load LinkedIn token from social_accounts ──────────────────────────────
  // Selects most-recently-updated member account.
  // access_token stays server-side — never returned to the browser.
  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("access_token, provider_account_id, display_name, expires_at")
    .eq("provider", "linkedin")
    .eq("account_type", "member")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (accountError) {
    console.error("[admin/posts/linkedin/send] account fetch error:", accountError.message)
    return NextResponse.json(
      { success: false, message: "Failed to load LinkedIn account." },
      { status: 500 },
    )
  }

  if (!account) {
    return NextResponse.json(
      { success: false, message: "LinkedIn is not connected. Connect your LinkedIn account first." },
      { status: 400 },
    )
  }

  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    return NextResponse.json(
      { success: false, message: "LinkedIn access token has expired. Please reconnect your LinkedIn account." },
      { status: 400 },
    )
  }

  // ── Build post text server-side ───────────────────────────────────────────
  const memberUrn = `urn:li:person:${account.provider_account_id}`
  const text      = buildLinkedInText(title, excerpt, content_type, slug)

  // ── Call LinkedIn Posts API ───────────────────────────────────────────────
  const result = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })

  if (!result.ok) {
    const safeError = result.error ?? "LinkedIn API returned an error."
    // Debug-safe: no token in log
    console.error("[admin/posts/linkedin/send] API error:", safeError)

    await supabase.from("distribution_jobs").upsert(
      {
        post_id:       id,
        channel:       "linkedin",
        status:        "failed",
        error_message: safeError.slice(0, 500),
      },
      { onConflict: "post_id,channel" },
    )

    return NextResponse.json(
      { success: false, message: "Failed to post to LinkedIn." },
      { status: 500 },
    )
  }

  // ── Success — record sent status ──────────────────────────────────────────
  const metadata = JSON.stringify({
    linkedin_post_id: result.postId ?? null,
    manual:           false,
  })

  await supabase.from("distribution_jobs").upsert(
    {
      post_id:       id,
      channel:       "linkedin",
      status:        "sent",
      sent_at:       new Date().toISOString(),
      error_message: null,
      metadata,
    },
    { onConflict: "post_id,channel" },
  )

  return NextResponse.json({ success: true }, { status: 200 })
}
