import "server-only"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SendMessageParams {
  chatId: string
  text:   string
}

export interface TelegramSendResult {
  ok:         boolean
  messageId?: number
  description?: string
}

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
    ok:          boolean
    result?:     { message_id: number }
    description?: string
  }

  return {
    ok:          data.ok,
    messageId:   data.result?.message_id,
    description: data.description,
  }
}
