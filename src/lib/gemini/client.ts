import "server-only"

import { GoogleGenAI } from "@google/genai"

// ─── Supported models ─────────────────────────────────────────────────────────

export const SUPPORTED_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
] as const

export type GeminiModel = (typeof SUPPORTED_MODELS)[number]

export const DEFAULT_MODEL: GeminiModel = "gemini-2.5-flash-lite"

// ─── Lazy singleton ───────────────────────────────────────────────────────────

let _client: GoogleGenAI | null = null

export function getGeminiClient(): GoogleGenAI {
  if (_client) return _client

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    throw new Error(
      "[gemini] GEMINI_API_KEY is not set. Add it to .env.local.",
    )
  }

  _client = new GoogleGenAI({ apiKey })
  return _client
}

// ─── Model resolver ───────────────────────────────────────────────────────────
// Resolves model from: (1) explicit override, (2) env DEFAULT_AI_MODEL,
// (3) hard-coded default. Falls back gracefully if the env value is unrecognised.

export function resolveModel(override?: string): GeminiModel {
  const candidates = [
    override,
    process.env.DEFAULT_AI_MODEL,
  ]

  for (const candidate of candidates) {
    if (candidate && (SUPPORTED_MODELS as readonly string[]).includes(candidate)) {
      return candidate as GeminiModel
    }
  }

  return DEFAULT_MODEL
}
