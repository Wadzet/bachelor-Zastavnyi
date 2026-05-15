import "server-only"

// ─── Image provider router ────────────────────────────────────────────────────
//
// Central entry point for all cover image generation.
//
// Provider strategy:
//   auto      — Try Replicate first (if REPLICATE_API_TOKEN set).
//               On any Replicate failure, fall back to SVG.
//               Gemini is NOT attempted automatically (quota issues).
//   replicate — Replicate only. Throws on failure.
//   gemini    — Gemini only. Throws on failure.
//   svg       — SVG fallback only. Never throws (pure local generation).
//
// All provider calls are server-side only (enforced by "server-only" import).
// Callers should catch errors and return safe messages to the browser.

import {
  selectVisualType,
  buildImagePrompt,
  generateCoverImage as geminiGenerateCoverImage,
} from "@/lib/gemini/image"

import { generateWithReplicate } from "@/lib/image/providers/replicate"
import { generateSvgCover }      from "@/lib/image/providers/svg"

import type { ImageProvider, ImageProviderResult } from "@/lib/image/types"
import type { VisualType }                         from "@/lib/gemini/image"

export type { ImageProvider, ImageProviderResult } from "@/lib/image/types"
export type { VisualType }                         from "@/lib/gemini/image"

// ─── Main export ──────────────────────────────────────────────────────────────

export type GenerateImageResult = ImageProviderResult & {
  visualType: VisualType
}

/**
 * Generate a cover image for a post using the specified provider strategy.
 *
 * @param opts.provider  - Which provider to use (default "auto")
 * @returns Buffer + mimeType + provider + fallback flag + visualType
 * @throws  On unrecoverable errors (caller must handle and return safe messages)
 */
export async function generateImage(opts: {
  title:       string
  excerpt:     string
  body:        string
  topic:       string
  contentType: string
  provider?:   ImageProvider
}): Promise<GenerateImageResult> {
  const { title, excerpt, body, topic, contentType, provider = "auto" } = opts

  // ── 1. Determine visual type (common to all providers) ────────────────────
  const visualType = selectVisualType({ contentType, title, excerpt, body })

  // ── 2. Dispatch ───────────────────────────────────────────────────────────
  switch (provider) {

    // ── Replicate (explicit) ────────────────────────────────────────────────
    case "replicate": {
      const prompt = buildImagePrompt({ title, excerpt, body, topic, contentType, visualType })
      const result = await generateWithReplicate({ prompt })
      return { ...result, visualType }
    }

    // ── Gemini (explicit) ───────────────────────────────────────────────────
    case "gemini": {
      const result = await geminiGenerateCoverImage({ title, excerpt, body, topic, contentType })
      // Gemini returns base64; convert to Buffer for consistency
      return {
        buffer:     Buffer.from(result.base64, "base64"),
        mimeType:   result.mimeType,
        provider:   "gemini",
        fallback:   false,
        visualType: result.visualType,
      }
    }

    // ── SVG (explicit) ──────────────────────────────────────────────────────
    case "svg": {
      const result = generateSvgCover({ title, topic, visualType })
      return { ...result, visualType }
    }

    // ── Auto: Replicate → SVG fallback ──────────────────────────────────────
    case "auto":
    default: {
      if (process.env.REPLICATE_API_TOKEN) {
        try {
          const prompt = buildImagePrompt({ title, excerpt, body, topic, contentType, visualType })
          const result = await generateWithReplicate({ prompt })
          return { ...result, visualType }
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err)
          console.warn(
            "[image/auto] Replicate failed, falling back to SVG:", msg
          )
        }
      } else {
        console.log(
          "[image/auto] REPLICATE_API_TOKEN not set — using SVG fallback directly"
        )
      }

      // SVG fallback
      const fallbackResult = generateSvgCover({ title, topic, visualType })
      return { ...fallbackResult, fallback: true, visualType }
    }
  }
}
