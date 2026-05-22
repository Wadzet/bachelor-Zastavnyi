import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import {
  sendTelegramMessage,
  sendTelegramPhoto,
  TELEGRAM_CAPTION_LIMIT,
} from "@/lib/telegram/client"
import {
  createLinkedInPost,
  createLinkedInPostWithImage,
  uploadLinkedInImage,
} from "@/lib/linkedin/client"
import { BRAND } from "@/config/brand"

// =============================================================================
// Automated Mode distribution helpers
// =============================================================================
//
// These functions let the Automated Mode orchestrator send a published post to
// Telegram / LinkedIn by reusing the SAME low-level client libraries that the
// manual send routes use (src/lib/telegram/client.ts, src/lib/linkedin/client.ts).
//
// IMPORTANT — by design, the manual send ROUTES
//   • /api/admin/posts/[id]/telegram/send
//   • /api/admin/posts/[id]/linkedin/send
// are NOT modified or called from here. We re-implement the small, safe glue
// (message building, SVG guard, idempotency, distribution_jobs write) locally so
// the proven manual routes keep working exactly as before. Auto-distribution is
// off by default and gated behind auto_publish_website in the orchestrator.
//
// Security: server-only. Bot token / LinkedIn access token never reach the
// browser and are never logged. Returned results are safe summaries.
// =============================================================================

export type AutoDistributeResult = {
  ok:       boolean
  skipped?: boolean   // already sent (idempotent) or not configured
  reason?:  string    // safe, human-readable note
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function publicUrlPath(contentType: string, slug: string): string {
  return contentType === "interview" ? `/interviews/${slug}` : `/insights/${slug}`
}

/** SVG is not supported by Telegram sendPhoto or the LinkedIn Images API. */
function isSvgUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".svg")
  } catch {
    return url.toLowerCase().includes(".svg")
  }
}

type PostForDistribution = {
  id:              string
  title:           string
  excerpt:         string
  content_type:    string
  slug:            string
  status:          string
  cover_image_url: string | null
}

async function fetchPublishedPost(
  supabase: ReturnType<typeof getServerClient>,
  postId:   string,
): Promise<PostForDistribution | null> {
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, excerpt, content_type, slug, status, cover_image_url")
    .eq("id", postId)
    .maybeSingle()

  if (error) {
    console.error("[automation/distribute] post fetch error:", error.message)
    return null
  }
  return (data as PostForDistribution | null) ?? null
}

/** Returns true if a 'sent' distribution_jobs row already exists for the channel. */
async function alreadySent(
  supabase: ReturnType<typeof getServerClient>,
  postId:   string,
  channel:  "telegram" | "linkedin",
): Promise<boolean> {
  const { data } = await supabase
    .from("distribution_jobs")
    .select("status")
    .eq("post_id", postId)
    .eq("channel", channel)
    .eq("status", "sent")
    .maybeSingle()
  return Boolean(data)
}

// ─── Telegram ─────────────────────────────────────────────────────────────────

function buildTelegramMessage(p: PostForDistribution): string {
  const label        = p.content_type === "article" ? "article" : "insight"
  const url          = `${BRAND.siteUrl}${publicUrlPath(p.content_type, p.slug)}`
  const shortExcerpt = p.excerpt.length > 140 ? p.excerpt.slice(0, 137) + "…" : p.excerpt
  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${p.title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

function buildTelegramCaption(p: PostForDistribution): string {
  const url          = `${BRAND.siteUrl}${publicUrlPath(p.content_type, p.slug)}`
  const reserveChars = url.length + 60
  const excerptLimit = Math.max(60, TELEGRAM_CAPTION_LIMIT - p.title.length - reserveChars - 10)
  const shortExcerpt = p.excerpt.length > excerptLimit ? p.excerpt.slice(0, excerptLimit - 1) + "…" : p.excerpt
  const label        = p.content_type === "article" ? "article" : "insight"
  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${p.title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

export async function autoSendTelegram(postId: string): Promise<AutoDistributeResult> {
  const supabase = getServerClient()

  const post = await fetchPublishedPost(supabase, postId)
  if (!post)                       return { ok: false, reason: "Post not found." }
  if (post.status !== "published") return { ok: false, reason: "Post is not published." }

  if (await alreadySent(supabase, postId, "telegram")) {
    return { ok: true, skipped: true, reason: "Already sent to Telegram." }
  }

  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) {
    return { ok: false, skipped: true, reason: "Telegram channel is not configured." }
  }

  let deliveryType: "photo" | "message" = "message"
  let result: Awaited<ReturnType<typeof sendTelegramMessage>>

  try {
    if (post.cover_image_url && !isSvgUrl(post.cover_image_url)) {
      const photo = await sendTelegramPhoto({
        chatId,
        photoUrl: post.cover_image_url,
        caption:  buildTelegramCaption(post),
      })
      if (photo.ok) {
        result       = photo
        deliveryType = "photo"
      } else {
        // Photo rejected — fall back to text
        result       = await sendTelegramMessage({ chatId, text: buildTelegramMessage(post) })
        deliveryType = "message"
      }
    } else {
      result = await sendTelegramMessage({ chatId, text: buildTelegramMessage(post) })
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[automation/distribute] telegram network error:", msg)
    await supabase.from("distribution_jobs").upsert(
      { post_id: postId, channel: "telegram", status: "failed", error_message: "Network error sending to Telegram." },
      { onConflict: "post_id,channel" },
    )
    return { ok: false, reason: "Network error sending to Telegram." }
  }

  if (!result.ok) {
    const safeError = result.description ? `Telegram API error: ${result.description.slice(0, 200)}` : "Telegram API error."
    await supabase.from("distribution_jobs").upsert(
      { post_id: postId, channel: "telegram", status: "failed", error_message: safeError },
      { onConflict: "post_id,channel" },
    )
    return { ok: false, reason: "Telegram API returned an error." }
  }

  await supabase.from("distribution_jobs").upsert(
    {
      post_id:       postId,
      channel:       "telegram",
      status:        "sent",
      sent_at:       new Date().toISOString(),
      error_message: null,
      metadata:      JSON.stringify({ telegram_message_id: result.messageId ?? null, delivery_type: deliveryType, auto: true }),
    },
    { onConflict: "post_id,channel" },
  )

  return { ok: true, reason: `Sent to Telegram (${deliveryType}).` }
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

function buildLinkedInText(p: PostForDistribution): string {
  const url          = `${BRAND.siteUrl}${publicUrlPath(p.content_type, p.slug)}`
  const shortExcerpt = p.excerpt.length > 200 ? p.excerpt.slice(0, 197) + "…" : p.excerpt
  return (
    `${p.title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read more: ${url}\n\n` +
    `#AI #BusinessStrategy #Operations #DigitalTransformation`
  )
}

export async function autoSendLinkedIn(postId: string): Promise<AutoDistributeResult> {
  const supabase = getServerClient()

  const post = await fetchPublishedPost(supabase, postId)
  if (!post)                       return { ok: false, reason: "Post not found." }
  if (post.status !== "published") return { ok: false, reason: "Post is not published." }

  if (await alreadySent(supabase, postId, "linkedin")) {
    return { ok: true, skipped: true, reason: "Already sent to LinkedIn." }
  }

  // ── Load LinkedIn token from social_accounts ──────────────────────────────
  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("access_token, provider_account_id, expires_at")
    .eq("provider", "linkedin")
    .eq("account_type", "member")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (accountError) {
    console.error("[automation/distribute] linkedin account fetch error:", accountError.message)
    return { ok: false, reason: "Failed to load LinkedIn account." }
  }
  if (!account) {
    return { ok: false, skipped: true, reason: "LinkedIn is not connected." }
  }
  if (account.expires_at && new Date(account.expires_at) < new Date()) {
    return { ok: false, skipped: true, reason: "LinkedIn access token has expired." }
  }

  const memberUrn = `urn:li:person:${account.provider_account_id}`
  const text      = buildLinkedInText(post)

  let result: Awaited<ReturnType<typeof createLinkedInPost>>
  let deliveryType: "image" | "text" = "text"
  let imageUrn: string | undefined

  if (post.cover_image_url && !isSvgUrl(post.cover_image_url)) {
    const upload = await uploadLinkedInImage({
      accessToken: account.access_token,
      memberUrn,
      imageUrl:    post.cover_image_url,
    })
    if (upload.ok && upload.imageUrn) {
      const imagePost = await createLinkedInPostWithImage({
        accessToken: account.access_token,
        memberUrn,
        text,
        imageUrn:    upload.imageUrn,
      })
      if (imagePost.ok) {
        result       = imagePost
        deliveryType = "image"
        imageUrn     = upload.imageUrn
      } else {
        result       = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
        deliveryType = "text"
      }
    } else {
      result       = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
      deliveryType = "text"
    }
  } else {
    result = await createLinkedInPost({ accessToken: account.access_token, memberUrn, text })
  }

  if (!result.ok) {
    const safeError = result.error ?? "LinkedIn API returned an error."
    await supabase.from("distribution_jobs").upsert(
      { post_id: postId, channel: "linkedin", status: "failed", error_message: safeError.slice(0, 500) },
      { onConflict: "post_id,channel" },
    )
    return { ok: false, reason: "Failed to post to LinkedIn." }
  }

  await supabase.from("distribution_jobs").upsert(
    {
      post_id:       postId,
      channel:       "linkedin",
      status:        "sent",
      sent_at:       new Date().toISOString(),
      error_message: null,
      metadata:      JSON.stringify({
        linkedin_post_id:   result.postId ?? null,
        linkedin_image_urn: imageUrn ?? null,
        delivery_type:      deliveryType,
        manual:             false,
        auto:               true,
      }),
    },
    { onConflict: "post_id,channel" },
  )

  return { ok: true, reason: `Sent to LinkedIn (${deliveryType}).` }
}
