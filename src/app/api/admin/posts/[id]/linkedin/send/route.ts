import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import {
  createLinkedInPost,
  createLinkedInPostWithImage,
  uploadLinkedInImage,
} from "@/lib/linkedin/client"
import { BRAND } from "@/config/brand"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// POST /api/admin/posts/[id]/linkedin/send
// Sends a published post to the connected LinkedIn member profile via the API.
//
// Image strategy:
//   If posts.cover_image_url is set:
//     1. Upload image to LinkedIn Images API (register + PUT bytes)
//     2. Create post with image media
//     3. If image upload or image-post fails: fall back to text-only post
//   If no cover image: text-only post directly
//
// On success: upserts distribution_jobs with status=sent
// On failure: upserts distribution_jobs with status=failed
//
// metadata stored: { linkedin_post_id, linkedin_image_urn?, delivery_type: "image"|"text", manual: false }

// ─── Message builder ──────────────────────────────────────────────────────────

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

  // ── Fetch post (include cover_image_url) ──────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, excerpt, content_type, slug, status, cover_image_url")
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

  const { title, excerpt, content_type, slug, status, cover_image_url } = post as {
    id:              string
    title:           string
    excerpt:         string
    content_type:    string
    slug:            string
    status:          string
    cover_image_url: string | null
  }

  if (status !== "published") {
    return NextResponse.json(
      { success: false, message: "Only published posts can be shared on LinkedIn." },
      { status: 400 },
    )
  }

  // ── Idempotency guard ─────────────────────────────────────────────────────
  const { data: existingJob, error: existingJobError } = await supabase
    .from("distribution_jobs")
    .select("status")
    .eq("post_id", id)
    .eq("channel", "linkedin")
    .eq("status", "sent")
    .maybeSingle()

  if (existingJobError) {
    console.error("[admin/posts/linkedin/send] idempotency check error:", existingJobError.message)
  }

  if (existingJob) {
    console.log(`[admin/posts/linkedin/send] post ${id} already sent to LinkedIn — skipping`)
    return NextResponse.json({ success: true, alreadySent: true }, { status: 200 })
  }

  // ── Load LinkedIn token from social_accounts ──────────────────────────────
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

  const memberUrn = `urn:li:person:${account.provider_account_id}`
  const text      = buildLinkedInText(title, excerpt, content_type, slug)

  // ── Attempt image post if cover image exists ──────────────────────────────
  let result: Awaited<ReturnType<typeof createLinkedInPost>>
  let deliveryType: "image" | "text" = "text"
  let linkedinImageUrn: string | undefined

  if (cover_image_url) {
    console.log(`[admin/posts/linkedin/send] uploading cover image — post=${id}`)
    const uploadResult = await uploadLinkedInImage({
      accessToken: account.access_token,
      memberUrn,
      imageUrl: cover_image_url,
    })

    if (uploadResult.ok && uploadResult.imageUrn) {
      // Image uploaded — create post with image
      console.log(`[admin/posts/linkedin/send] creating image post — post=${id}`)
      result = await createLinkedInPostWithImage({
        accessToken: account.access_token,
        memberUrn,
        text,
        imageUrn: uploadResult.imageUrn,
      })

      if (result.ok) {
        deliveryType     = "image"
        linkedinImageUrn = uploadResult.imageUrn
      } else {
        // Image post failed — fall back to text
        console.warn(
          `[admin/posts/linkedin/send] image post failed (${result.error ?? "unknown"}), falling back to text`
        )
        result = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
        deliveryType = "text"
      }
    } else {
      // Image upload failed — fall back to text-only post
      console.warn(
        `[admin/posts/linkedin/send] image upload failed (${uploadResult.error ?? "unknown"}), falling back to text`
      )
      result = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
      deliveryType = "text"
    }
  } else {
    // No cover image — text-only directly
    console.log(`[admin/posts/linkedin/send] creating text post — post=${id}`)
    result = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
    deliveryType = "text"
  }

  // ── Handle final API failure ──────────────────────────────────────────────
  if (!result.ok) {
    const safeError = result.error ?? "LinkedIn API returned an error."
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
    linkedin_post_id:  result.postId ?? null,
    linkedin_image_urn: linkedinImageUrn ?? null,
    delivery_type:     deliveryType,
    manual:            false,
  })

  const { error: successUpsertError } = await supabase
    .from("distribution_jobs")
    .upsert(
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

  if (successUpsertError) {
    console.error("[admin/posts/linkedin/send] sent-status upsert error:", successUpsertError.message)
    return NextResponse.json(
      {
        success: false,
        message:
          "LinkedIn post was created, but the app failed to record the sent status. " +
          "Check server logs for details.",
      },
      { status: 500 },
    )
  }

  console.log(`[admin/posts/linkedin/send] sent — post=${id} delivery=${deliveryType}`)
  return NextResponse.json({ success: true }, { status: 200 })
}
