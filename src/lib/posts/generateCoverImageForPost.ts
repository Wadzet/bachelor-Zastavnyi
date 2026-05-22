import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import { generateImage }   from "@/lib/image"
import type { ImageProvider } from "@/lib/image"

// =============================================================================
// generateCoverImageForPost — reusable cover-image generation service
// =============================================================================
//
// Core logic extracted from POST /api/admin/posts/[id]/image/generate so it can
// be reused by both the manual image route (Editorial Mode) and the Automated
// Mode orchestrator.
//
// Steps:
//   1. Fetch the post.
//   2. Validate provider-specific env requirements.
//   3. Generate the image via the provider router (Replicate / Gemini / SVG).
//   4. Upload to the Supabase Storage 'post-images' bucket.
//   5. Update posts.cover_image_url with the public URL.
//
// Security: server-only. REPLICATE_API_TOKEN / GEMINI_API_KEY never reach the
// browser. Returned errors are safe/generic; full details are logged server-side.
// =============================================================================

export const VALID_IMAGE_PROVIDERS: ImageProvider[] = ["auto", "replicate", "gemini", "svg"]

export type GenerateCoverImageResult =
  | { ok: true;  imageUrl: string; visualType: string; provider: string; fallback: boolean }
  | { ok: false; status: number; message: string }

function mimeToExtension(mimeType: string): string {
  if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg"
  if (mimeType.includes("webp"))                              return "webp"
  if (mimeType.includes("svg"))                               return "svg"
  return "png"
}

export async function generateCoverImageForPost(opts: {
  postId:   string
  provider?: ImageProvider
}): Promise<GenerateCoverImageResult> {
  const { postId } = opts
  const provider: ImageProvider =
    opts.provider && VALID_IMAGE_PROVIDERS.includes(opts.provider) ? opts.provider : "auto"

  const supabase = getServerClient()

  // ── Fetch post ────────────────────────────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, excerpt, body_markdown, content_type, topic, status")
    .eq("id", postId)
    .maybeSingle()

  if (fetchError) {
    console.error("[generateCoverImageForPost] fetch error:", fetchError.message)
    return { ok: false, status: 500, message: "Failed to look up post." }
  }
  if (!post) {
    return { ok: false, status: 404, message: "Post not found." }
  }

  const { title, excerpt, body_markdown, content_type, topic } = post as {
    title:         string
    excerpt:       string
    body_markdown: string | null
    content_type:  string
    topic:         string
    status:        string
  }

  // ── Validate provider-specific requirements ───────────────────────────────
  if (provider === "replicate" && !process.env.REPLICATE_API_TOKEN) {
    return { ok: false, status: 500, message: "Replicate provider not configured (missing REPLICATE_API_TOKEN)." }
  }
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    return { ok: false, status: 500, message: "Gemini provider not configured (missing GEMINI_API_KEY)." }
  }

  // ── Generate image ────────────────────────────────────────────────────────
  console.log(`[generateCoverImageForPost] starting — post=${postId} provider=${provider}`)

  let imageResult: Awaited<ReturnType<typeof generateImage>>
  try {
    imageResult = await generateImage({
      title,
      excerpt,
      body:        body_markdown ?? "",
      topic,
      contentType: content_type,
      provider,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[generateCoverImageForPost] generation failed:", msg)
    return { ok: false, status: 500, message: "Image generation failed. Check server logs for details." }
  }

  // ── Upload to Supabase Storage ────────────────────────────────────────────
  const extension   = mimeToExtension(imageResult.mimeType)
  const storagePath = `posts/${postId}/cover-${Date.now()}.${extension}`

  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(storagePath, imageResult.buffer, {
      contentType: imageResult.mimeType,
      upsert:      false,
    })

  if (uploadError) {
    console.error("[generateCoverImageForPost] storage upload error:", uploadError.message)
    return {
      ok: false,
      status: 500,
      message:
        "Image was generated but could not be saved. " +
        "Check that the 'post-images' Supabase Storage bucket exists and is public.",
    }
  }

  // ── Public URL + update post ──────────────────────────────────────────────
  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(storagePath)

  const imageUrl = publicUrlData.publicUrl

  const { error: updateError } = await supabase
    .from("posts")
    .update({ cover_image_url: imageUrl })
    .eq("id", postId)

  if (updateError) {
    console.error("[generateCoverImageForPost] posts update error:", updateError.message)
    return {
      ok: false,
      status: 500,
      message:
        "Image was saved but the post record could not be updated. " +
        "Refresh the page and set the cover image URL manually if needed.",
    }
  }

  console.log(
    `[generateCoverImageForPost] complete — post=${postId} ` +
    `provider=${imageResult.provider} visualType=${imageResult.visualType} ` +
    `fallback=${imageResult.fallback} path=${storagePath}`,
  )

  return {
    ok:         true,
    imageUrl,
    visualType: imageResult.visualType,
    provider:   imageResult.provider,
    fallback:   imageResult.fallback,
  }
}
