import { NextResponse }        from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { getServerClient }     from "@/lib/supabase/server"
import { generateImage }       from "@/lib/image"
import type { ImageProvider }  from "@/lib/image"

// POST /api/admin/posts/[id]/image/generate
//
// Generates an AI cover image for a post, uploads it to Supabase Storage
// (post-images bucket), and updates posts.cover_image_url.
//
// Request body (all optional):
//   { provider?: "auto" | "replicate" | "gemini" | "svg" }
//
// Constraints:
//   • Requires admin auth.
//   • One image per request — no batch generation.
//   • Post must exist. Any status accepted (draft, review, published).
//   • All API tokens stay server-side; raw provider errors never reach browser.
//
// Success response: { success: true, imageUrl, visualType, provider, fallback? }
// Error response:   { success: false, message }   (safe — no secrets)

const VALID_PROVIDERS: ImageProvider[] = ["auto", "replicate", "gemini", "svg"]

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

  // ── Parse optional provider from body ─────────────────────────────────────
  let provider: ImageProvider = "auto"
  try {
    const body = await request.json() as { provider?: unknown }
    if (body.provider && VALID_PROVIDERS.includes(body.provider as ImageProvider)) {
      provider = body.provider as ImageProvider
    }
  } catch {
    // No body or invalid JSON — use default provider
  }

  // ── Fetch post ────────────────────────────────────────────────────────────
  const { data: post, error: fetchError } = await supabase
    .from("posts")
    .select("id, title, excerpt, body_markdown, content_type, topic, status")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("[posts/image/generate] fetch error:", fetchError.message)
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

  const { title, excerpt, body_markdown, content_type, topic } = post as {
    id:            string
    title:         string
    excerpt:       string
    body_markdown: string | null
    content_type:  string
    topic:         string
    status:        string
  }

  // ── Validate provider-specific requirements ───────────────────────────────
  if (provider === "replicate" && !process.env.REPLICATE_API_TOKEN) {
    return NextResponse.json(
      { success: false, message: "Replicate provider not configured (missing REPLICATE_API_TOKEN)." },
      { status: 500 },
    )
  }
  if (provider === "gemini" && !process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { success: false, message: "Gemini provider not configured (missing GEMINI_API_KEY)." },
      { status: 500 },
    )
  }

  // ── Generate image via provider router ────────────────────────────────────
  console.log(`[posts/image/generate] starting — post=${id} provider=${provider}`)

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
    console.error("[posts/image/generate] generation failed:", msg)
    return NextResponse.json(
      {
        success: false,
        message: "Image generation failed. Check server logs for details.",
      },
      { status: 500 },
    )
  }

  // ── Determine file extension from mime type ───────────────────────────────
  function mimeToExtension(mimeType: string): string {
    if (mimeType.includes("jpeg") || mimeType.includes("jpg")) return "jpg"
    if (mimeType.includes("webp"))                              return "webp"
    if (mimeType.includes("svg"))                               return "svg"
    return "png"
  }

  const extension   = mimeToExtension(imageResult.mimeType)
  const storagePath = `posts/${id}/cover-${Date.now()}.${extension}`

  // ── Upload to Supabase Storage (post-images bucket) ───────────────────────
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(storagePath, imageResult.buffer, {
      contentType: imageResult.mimeType,
      upsert:      false,
    })

  if (uploadError) {
    console.error("[posts/image/generate] storage upload error:", uploadError.message)
    return NextResponse.json(
      {
        success: false,
        message:
          "Image was generated but could not be saved. " +
          "Check that the 'post-images' Supabase Storage bucket exists and is public.",
      },
      { status: 500 },
    )
  }

  // ── Get the public URL ────────────────────────────────────────────────────
  const { data: publicUrlData } = supabase.storage
    .from("post-images")
    .getPublicUrl(storagePath)

  const imageUrl = publicUrlData.publicUrl

  // ── Update posts.cover_image_url ──────────────────────────────────────────
  const { error: updateError } = await supabase
    .from("posts")
    .update({ cover_image_url: imageUrl })
    .eq("id", id)

  if (updateError) {
    console.error("[posts/image/generate] posts update error:", updateError.message)
    return NextResponse.json(
      {
        success: false,
        message:
          "Image was saved but the post record could not be updated. " +
          "Refresh the page and set the cover image URL manually if needed.",
        imageUrl,
      },
      { status: 500 },
    )
  }

  console.log(
    `[posts/image/generate] complete — post=${id} ` +
    `provider=${imageResult.provider} visualType=${imageResult.visualType} ` +
    `fallback=${imageResult.fallback} path=${storagePath}`,
  )

  return NextResponse.json(
    {
      success:    true,
      imageUrl,
      visualType: imageResult.visualType,
      provider:   imageResult.provider,
      ...(imageResult.fallback ? { fallback: true } : {}),
    },
    { status: 200 },
  )
}
