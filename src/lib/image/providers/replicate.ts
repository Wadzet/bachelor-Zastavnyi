import "server-only"

import type { ImageProviderResult } from "@/lib/image/types"

// ─── Replicate FLUX.1 Schnell provider ───────────────────────────────────────
//
// Calls the Replicate HTTP API directly (no npm package required).
// Uses REPLICATE_API_TOKEN and REPLICATE_IMAGE_MODEL env vars.
//
// Model: black-forest-labs/flux-schnell (default)
//   - Very fast (~2-5 s), low cost, 16:9 aspect ratio supported.
//   - Output: array of image URLs that must be fetched server-side.
//
// API flow:
//   1. POST /v1/models/{model}/predictions with Prefer: wait header.
//      Replicate waits up to 60 s before returning — avoids polling for fast models.
//   2. If the prediction is still "processing" (edge case), poll up to 5 × 3 s.
//   3. Fetch the first output URL server-side and return raw bytes.
//
// Security:
//   - REPLICATE_API_TOKEN is never logged or returned to the browser.
//   - Raw Replicate JSON is never forwarded to the browser.
//   - All fetches are server-side only ("use server" / "server-only" guard).

const REPLICATE_API_BASE = "https://api.replicate.com/v1"
const MAX_POLL_ATTEMPTS  = 5
const POLL_INTERVAL_MS   = 3_000
const PREDICTION_TIMEOUT = "60"   // seconds, sent as Prefer: wait={n}

type ReplicatePrediction = {
  id:     string
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled"
  output: string[] | null
  error:  string | null
  urls?:  { get: string }
}

/**
 * Generate an image via Replicate FLUX.1 Schnell.
 * Throws on any failure — caller is responsible for error handling.
 */
export async function generateWithReplicate(opts: {
  prompt: string
}): Promise<ImageProviderResult> {
  const token = process.env.REPLICATE_API_TOKEN
  const model = process.env.REPLICATE_IMAGE_MODEL ?? "black-forest-labs/flux-schnell"

  if (!token) {
    throw new Error("[replicate] REPLICATE_API_TOKEN is not set.")
  }

  // ── Start prediction ───────────────────────────────────────────────────────
  console.log(`[replicate] starting prediction — model=${model}`)

  const startRes = await fetch(`${REPLICATE_API_BASE}/models/${model}/predictions`, {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type":  "application/json",
      "Prefer":        `wait=${PREDICTION_TIMEOUT}`,
    },
    body: JSON.stringify({
      input: {
        prompt:        opts.prompt,
        num_outputs:   1,
        aspect_ratio:  "16:9",
        output_format: "webp",
        output_quality: 90,
      },
    }),
  })

  if (!startRes.ok) {
    // Do not include the raw body — may contain model details or rate-limit info
    // that we don't want forwarded to the browser.
    throw new Error(
      `[replicate] API request failed — HTTP ${startRes.status} ${startRes.statusText}`
    )
  }

  let prediction = await startRes.json() as ReplicatePrediction

  // ── Poll if still processing (edge case with Prefer: wait) ────────────────
  if (prediction.status === "processing" || prediction.status === "starting") {
    const pollUrl = prediction.urls?.get
    if (!pollUrl) {
      throw new Error("[replicate] No poll URL in processing response.")
    }
    for (let attempt = 0; attempt < MAX_POLL_ATTEMPTS; attempt++) {
      console.log(`[replicate] polling attempt ${attempt + 1}/${MAX_POLL_ATTEMPTS}`)
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
      const pollRes = await fetch(pollUrl, {
        headers: { "Authorization": `Bearer ${token}` },
      })
      if (!pollRes.ok) {
        throw new Error(
          `[replicate] Poll request failed — HTTP ${pollRes.status} ${pollRes.statusText}`
        )
      }
      prediction = await pollRes.json() as ReplicatePrediction
      if (prediction.status === "succeeded" || prediction.status === "failed" || prediction.status === "canceled") {
        break
      }
    }
  }

  if (prediction.status !== "succeeded") {
    throw new Error(
      `[replicate] Prediction ended with status="${prediction.status}". ` +
      `Check Replicate dashboard for details.`
    )
  }

  const outputUrls = prediction.output
  if (!Array.isArray(outputUrls) || outputUrls.length === 0) {
    throw new Error("[replicate] Prediction succeeded but output array is empty.")
  }

  const imageUrl = outputUrls[0]
  if (typeof imageUrl !== "string" || !imageUrl.startsWith("http")) {
    throw new Error("[replicate] Output is not a valid URL.")
  }

  // ── Fetch image bytes server-side ──────────────────────────────────────────
  console.log("[replicate] fetching generated image bytes")
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) {
    throw new Error(
      `[replicate] Failed to fetch generated image — HTTP ${imageRes.status}`
    )
  }

  const contentType = imageRes.headers.get("content-type") ?? "image/webp"
  const arrayBuffer = await imageRes.arrayBuffer()
  const buffer      = Buffer.from(arrayBuffer)

  console.log(`[replicate] image ready — ${buffer.length} bytes, type=${contentType}`)

  return {
    buffer,
    mimeType: contentType.split(";")[0].trim(),   // strip any charset suffix
    provider: "replicate",
    fallback: false,
  }
}
