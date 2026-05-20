import "server-only"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMessageParams {
  chatId: string
  text:   string
}

export interface SendPhotoParams {
  chatId:   string
  photoUrl: string   // public HTTPS URL — Telegram fetches it server-side
  caption:  string   // max 1024 chars (Telegram caption limit)
}

export interface TelegramSendResult {
  ok:           boolean
  messageId?:   number
  description?: string
}

// Telegram caption limit for sendPhoto (characters)
export const TELEGRAM_CAPTION_LIMIT = 1024

// ─── Token access ─────────────────────────────────────────────────────────────

function getBotToken(): string {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    throw new Error(
      "[telegram] TELEGRAM_BOT_TOKEN is not set. Add it to .env.local.",
    )
  }
  return token
}

// ─── sendTelegramMessage ──────────────────────────────────────────────────────
// Sends a plain-text message via the Telegram Bot API sendMessage endpoint.
// Throws on network error; returns structured result for API/DB logic errors.

export async function sendTelegramMessage({
  chatId,
  text,
}: SendMessageParams): Promise<TelegramSendResult> {
  const token = getBotToken()
  const url   = `https://api.telegram.org/bot${token}/sendMessage`

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  })

  const data = (await res.json()) as {
    ok:           boolean
    result?:      { message_id: number }
    description?: string
  }

  return {
    ok:          data.ok,
    messageId:   data.result?.message_id,
    description: data.description,
  }
}

// ─── sendTelegramPhoto ────────────────────────────────────────────────────────
// Sends a photo + caption via the Telegram Bot API sendPhoto endpoint.
// Telegram fetches the photo from the public URL server-side.
// Caption is truncated to TELEGRAM_CAPTION_LIMIT if needed.
// Throws on network error; returns structured result for API/DB logic errors.

export async function sendTelegramPhoto({
  chatId,
  photoUrl,
  caption,
}: SendPhotoParams): Promise<TelegramSendResult> {
  const token = getBotToken()
  const url   = `https://api.telegram.org/bot${token}/sendPhoto`

  // Enforce Telegram caption length limit
  const safeCaption =
    caption.length > TELEGRAM_CAPTION_LIMIT
      ? caption.slice(0, TELEGRAM_CAPTION_LIMIT - 1) + "…"
      : caption

  const res = await fetch(url, {
    method:  "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      photo:   photoUrl,
      caption: safeCaption,
    }),
  })

  const data = (await res.json()) as {
    ok:           boolean
    result?:      { message_id: number }
    description?: string
  }

  return {
    ok:          data.ok,
    messageId:   data.result?.message_id,
    description: data.description,
  }
}
