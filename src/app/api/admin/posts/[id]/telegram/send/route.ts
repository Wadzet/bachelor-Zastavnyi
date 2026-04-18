import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"
import { sendTelegramMessage } from "@/lib/telegram/client"
import { BRAND } from "@/config/brand"
import { requireAdminApiAuth } from "@/lib/auth/admin"

// Temporary MVP admin route. Must be protected by auth before production.

// ─── Message builder (server-side, not trusted from client) ──────────────────

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

  // Plain text — safe for any post content regardless of special characters
  return (
    `New ${label} from ${BRAND.name}:\n\n` +
    `${title}\n\n` +
    `${shortExcerpt}\n\n` +
    `Read the full article:\n${url}`
  )
}

// ─── POST /api/admin/posts/[id]/telegram/send ─────────────────────────────────

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

  // ── Fetch post ────────────────────────────────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, excerpt, content_type, slug, status")
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

  const { title, excerpt, content_type, slug, status } = post as {
    id:           string
    title:        string
    excerpt:      string
    content_type: string
    slug:         string
    status:       string
  }

  // ── Require published status ──────────────────────────────────────────────────
  if (status !== "published") {
    return NextResponse.json(
      { success: false, message: "Only published posts can be sent to Telegram." },
      { status: 400 },
    )
  }

  // ── Require TELEGRAM_CHAT_ID env var ──────────────────────────────────────────
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!chatId) {
    console.error("[admin/posts/telegram/send] TELEGRAM_CHAT_ID is not set.")
    return NextResponse.json(
      { success: false, message: "Telegram channel is not configured." },
      { status: 500 },
    )
  }

  // ── Build message server-side ─────────────────────────────────────────────────
  const text = buildMessage(title, excerpt, content_type, slug)

  // ── Send to Telegram ──────────────────────────────────────────────────────────
  let telegramResult: Awaited<ReturnType<typeof sendTelegramMessage>>
  try {
    telegramResult = await sendTelegramMessage({ chatId, text })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error"
    console.error("[admin/posts/telegram/send] network error:", msg)

    // Mark as failed in distribution_jobs
    await supabase.from("distribution_jobs").upsert(
      {
        post_id:       id,
        channel:       "telegram",
        status:        "failed",
        error_message: "Network error sending to Telegram.",
      },
      { onConflict: "post_id,channel" },
    )

    return NextResponse.json(
      { success: false, message: "Failed to send Telegram message." },
      { status: 500 },
    )
  }

  if (!telegramResult.ok) {
    // Safe error — never returns the bot token or chat ID
    const safeError = telegramResult.description
      ? `Telegram API error: ${telegramResult.description.slice(0, 200)}`
      : "Telegram API returned an error."

    console.error("[admin/posts/telegram/send] Telegram API error:", telegramResult.description)

    await supabase.from("distribution_jobs").upsert(
      {
        post_id:       id,
        channel:       "telegram",
        status:        "failed",
        error_message: safeError,
      },
      { onConflict: "post_id,channel" },
    )

    return NextResponse.json(
      { success: false, message: "Failed to send Telegram message." },
      { status: 500 },
    )
  }

  // ── Success — record sent status ──────────────────────────────────────────────
  const metadata = telegramResult.messageId
    ? JSON.stringify({ telegram_message_id: telegramResult.messageId })
    : null

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

  return NextResponse.json({ success: true }, { status: 200 })
}
