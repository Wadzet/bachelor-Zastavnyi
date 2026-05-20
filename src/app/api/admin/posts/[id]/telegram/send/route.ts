import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage, sendTelegramPhoto, TELEGRAM_CAPTION_LIMIT } from "@/lib/telegram/client"
import { BRAND } from "@/config/brand"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// POST /api/admin/posts/[id]/telegram/send
//
// Sends a published post to Telegram.
//
// Delivery strategy:
//   cover_image_url present AND not SVG → sendPhoto (photo + caption)
//   cover_image_url present AND is SVG  → sendMessage (SVG not supported by Telegram)
//   cover_image_url absent              → sendMessage (plain text)
//   sendPhoto fails                     → sendMessage fallback
//
// metadata stored in distribution_jobs:
//   { telegram_message_id, delivery_type: "photo" | "message" }

// ─── Helpers ──────────────────────────────────────────────────────────────────

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
  const label        = contentType === "article" ? "article" : "insight"
  const url          = `${BRAND.siteUrl}${publicUrlPath(contentType, slug)}`
  const shortExcerpt = excerpt.length > 140 ? excerpt.slice(0, 137) + "…" : excerpt
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
  const url          = `${BRAND.siteUrl}${publicUrlPath(contentType, slug)}`
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

/**
 * Returns true if the URL points to an SVG file.
 * Checks the URL pathname to avoid false positives from query strings.
 * SVG is not supported by Telegram sendPhoto.
 */
function isSvgUrl(url: string): boolean {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".svg")
  } catch {
    return url.toLowerCase().includes(".svg")
  }
}

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

  // ── Choose delivery method ────────────────────────────────────────────────
  let telegramResult: Awaited<ReturnType<typeof sendTelegramMessage>>
  let deliveryType: "photo" | "message" = "message"

  if (cover_image_url) {
    const isSvg = isSvgUrl(cover_image_url)
    console.log(
      `[admin/posts/telegram/send] cover image detected — post=${id} isSvg=${isSvg}`
    )

    if (isSvg) {
      // SVG is not supported by Telegram sendPhoto — use plain text directly
      console.log(
        `[admin/posts/telegram/send] cover image is SVG — delivery fallback reason: SVG not supported by Telegram sendPhoto`
      )
      const text = buildMessage(title, excerpt, content_type, slug)
      try {
        telegramResult = await sendTelegramMessage({ chatId, text })
        deliveryType   = "message"
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.error("[admin/posts/telegram/send] sendMessage (SVG fallback) error:", msg)
        await recordFailed(supabase, id, "Network error sending to Telegram.")
        return NextResponse.json(
          { success: false, message: "Failed to send Telegram message." },
          { status: 500 },
        )
      }
    } else {
      // PNG / JPEG / WebP — attempt sendPhoto with text fallback
      try {
        const caption     = buildCaption(title, excerpt, content_type, slug)
        const photoResult = await sendTelegramPhoto({ chatId, photoUrl: cover_image_url, caption })

        if (photoResult.ok) {
          telegramResult = photoResult
          deliveryType   = "photo"
        } else {
          // Telegram API rejected the photo — fall back to text
          console.warn(
            `[admin/posts/telegram/send] sendPhoto failed — delivery fallback reason: ${photoResult.description ?? "Telegram API error"}`
          )
          const text = buildMessage(title, excerpt, content_type, slug)
          telegramResult = await sendTelegramMessage({ chatId, text })
          deliveryType   = "message"
        }
      } catch (err) {
        // Network error during photo send — fall back to text
        const msg = err instanceof Error ? err.message : "Unknown error"
        console.warn(
          `[admin/posts/telegram/send] sendPhoto network error — delivery fallback reason: ${msg}`
        )
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
    }
  } else {
    // No cover image — plain text only
    console.log(`[admin/posts/telegram/send] no cover image — sending text message — post=${id}`)
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
