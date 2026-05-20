import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage, sendTelegramPhoto, TELEGRAM_CAPTION_LIMIT } from "@/lib/telegram/client"
import { BRAND } from "@/config/brand"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// POST /api/admin/posts/[id]/telegram/send
//
// Sends a published post to Telegram.
// If posts.cover_image_url is set, sends via sendPhoto (photo + caption).
// If no cover image, sends via sendMessage (plain text).
// If sendPhoto fails, falls back to sendMessage automatically.
//
// metadata stored in distribution_jobs:
//   { telegram_message_id, delivery_type: "photo" | "message" }

// ─── Message builder ──────────────────────────────────────────────────────────

function publicUrlPath(contentType: string, slug: string): string {
  return contentType === "interview"
    ? `/interviews/${slug}`
    : `/insights/${slug}`
}

function buildMessage(
  title:       string,
  excerpt:     string,
  contentType: string,
  slug:        string,
): string {
  const label      = contentType === "article" ? "article" : "insight"
  const url        = `${BRAND.siteUrl}${publicUrlPath(contentType, slug)}`
  const shortExcerpt =
    excerpt.length > 140 ? excerpt.slice(0, 137) + "…" : excerpt

  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

/** Build a caption for sendPhoto — respects Telegram's 1024-char limit. */
function buildCaption(
  title:       string,
  excerpt:     string,
  contentType: string,
  slug:        string,
): string {
  const url   = `${BRAND.siteUrl}${publicUrlPath(contentType, slug)}`
  // Reserve ~60 chars for URL + label line at end
  const reserveChars = url.length + 60
  const excerptLimit = Math.max(60, TELEGRAM_CAPTION_LIMIT - title.length - reserveChars - 10)
  const shortExcerpt = excerpt.length > excerptLimit
    ? excerpt.slice(0, excerptLimit - 1) + "…"
    : excerpt

  const label = contentType === "article" ? "article" : "insight"
  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

// ─── Helper: upsert a failed distribution job ─────────────────────────────────

async function recordFailed(
  supabase: ReturnType<typeof getServerClient>,
  postId:   string,
  message:  string,
) {
  await supabase.from("distribution_jobs").upsert(
    { post_id: postId, channel: "telegram", status: "failed", error_message: message },
    { onConflict: "post_id,channel" },
  )
}

// ─── POST handler ─────────────────────────────────────────────────────────────

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
    console.error("[admin/posts/telegram/send] fetch error:", fetchError.message)
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
      { success: false, message: "Only published posts can be sent to Telegram." },
      { status: 400 },
    )
  }

  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) {
    console.error("[admin/posts/telegram/send] TELEGRAM_CHAT_ID is not set.")
    return NextResponse.json(
      { success: false, message: "Telegram channel is not configured." },
      { status: 500 },
    )
  }

  // ── Send: photo + caption if cover image exists, plain text otherwise ─────
  let telegramResult: Awaited<ReturnType<typeof sendTelegramMessage>>
  let deliveryType: "photo" | "message" = "message"

  if (cover_image_url) {
    // Attempt sendPhoto first
    console.log(`[admin/posts/telegram/send] sending photo — post=${id}`)
    try {
      const caption = buildCaption(title, excerpt, content_type, slug)
      const photoResult = await sendTelegramPhoto({ chatId, photoUrl: cover_image_url, caption })

      if (photoResult.ok) {
        telegramResult = photoResult
        deliveryType   = "photo"
      } else {
        // Photo rejected by Telegram API — fall back to text
        console.warn(
          `[admin/posts/telegram/send] sendPhoto failed (${photoResult.description ?? "unknown"}), falling back to text`
        )
        const text = buildMessage(title, excerpt, content_type, slug)
        telegramResult = await sendTelegramMessage({ chatId, text })
        deliveryType   = "message"
      }
    } catch (err) {
      // Network error during photo send — fall back to text
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.warn(`[admin/posts/telegram/send] sendPhoto network error (${msg}), falling back to text`)
      try {
        const text = buildMessage(title, excerpt, content_type, slug)
        telegramResult = await sendTelegramMessage({ chatId, text })
        deliveryType   = "message"
      } catch (fallbackErr) {
        const fbMsg = fallbackErr instanceof Error ? fallbackErr.message : "Unknown error"
        console.error("[admin/posts/telegram/send] text fallback also failed:", fbMsg)
        await recordFailed(supabase, id, "Network error sending to Telegram.")
        return NextResponse.json(
          { success: false, message: "Failed to send Telegram message." },
          { status: 500 },
        )
      }
    }
  } else {
    // No cover image — plain text only
    console.log(`[admin/posts/telegram/send] sending text message — post=${id}`)
    const text = buildMessage(title, excerpt, content_type, slug)
    try {
      telegramResult = await sendTelegramMessage({ chatId, text })
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error"
      console.error("[admin/posts/telegram/send] network error:", msg)
      await recordFailed(supabase, id, "Network error sending to Telegram.")
      return NextResponse.json(
        { success: false, message: "Failed to send Telegram message." },
        { status: 500 },
      )
    }
  }

  if (!telegramResult.ok) {
    const safeError = telegramResult.description
      ? `Telegram API error: ${telegramResult.description.slice(0, 200)}`
      : "Telegram API returned an error."
    console.error("[admin/posts/telegram/send] Telegram API error:", telegramResult.description)
    await recordFailed(supabase, id, safeError)
    return NextResponse.json(
      { success: false, message: "Failed to send Telegram message." },
      { status: 500 },
    )
  }

  // ── Success — record sent status ──────────────────────────────────────────
  const metadata = JSON.stringify({
    telegram_message_id: telegramResult.messageId ?? null,
    delivery_type:       deliveryType,
  })

  await supabase.from("distribution_jobs").upsert(
    {
      post_id:       id,
      channel:       "telegram",
      status:        "sent",
      sent_at:       new Date().toISOString(),
      error_message: null,
      metadata,
    },
    { onConflict: "post_id,channel" },
  )

  console.log(`[admin/posts/telegram/send] sent — post=${id} delivery=${deliveryType}`)
  return NextResponse.json({ success: true }, { status: 200 })
}
