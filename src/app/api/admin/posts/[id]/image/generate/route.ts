import { NextResponse }        from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { getServerClient }     from "@/lib/supabase/server"
import { generateCoverImage }  from "@/lib/gemini/image"

// POST /api/admin/posts/[id]/image/generate
//
// Generates an AI cover image for a post using Gemini, uploads it to
// Supabase Storage (post-images bucket), and updates posts.cover_image_url.
//
// Constraints:
//   • Requires admin auth.
//   • One image per request — no batch generation.
//   • Post must exist. Any status is accepted (draft, review, published).
//   • Gemini API key and service role key stay server-side.
//   • Generated image prompt is never returned to the browser.
//
// Success response: { success: true, imageUrl, visualType }
// Error response:   { success: false, message }   (safe — no secrets)

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params
  const supabase = getServerClient()

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
    id:           string
    title:        string
    excerpt:      string
    body_markdown: string | null
    content_type: string
    topic:        string
    status:       string
  }

  // ── Check env vars early (fail fast) ─────────────────────────────────────
  if (!process.env.GEMINI_API_KEY) {
    console.error("[posts/image/generate] GEMINI_API_KEY is not set")
    return NextResponse.json(
      { success: false, message: "Image generation is not configured (missing GEMINI_API_KEY)." },
      { status: 500 },
    )
  }

  // ── Generate image via Gemini ─────────────────────────────────────────────
  let imageResult: Awaited<ReturnType<typeof generateCoverImage>>

  try {
    imageResult = await generateCoverImage({
      title,
      excerpt,
      body:        body_markdown ?? "",
      topic,
      contentType: content_type,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // Log full error server-side; return a safe message to the browser.
    // Never log or return the raw prompt, API key, or model response.
    console.error("[posts/image/generate] Gemini image generation failed:", msg)
    return NextResponse.json(
      {
        success: false,
        message: "Image generation failed. Check server logs for details.",
      },
      { status: 500 },
    )
  }

  // ── Convert base64 to Buffer for Supabase Storage upload ─────────────────
  const imageBuffer = Buffer.from(imageResult.base64, "base64")
  const extension   = imageResult.mimeType.includes("jpeg") ? "jpg" : "png"
  const storagePath = `posts/${id}/cover-${Date.now()}.${extension}`

  // ── Upload to Supabase Storage (post-images bucket) ───────────────────────
  // Service role bypasses storage RLS — no anon upload policy is needed.
  const { error: uploadError } = await supabase.storage
    .from("post-images")
    .upload(storagePath, imageBuffer, {
      contentType: imageResult.mimeType,
      upsert:      false,   // prevent accidental overwrites — use a fresh timestamp path
    })

  if (uploadError) {
    console.error("[posts/image/generate] Storage upload error:", uploadError.message)
    return NextResponse.json(
      {
        success: false,
        message: "Image was generated but could not be saved. " +
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
    // Image was uploaded but DB update failed. The image is orphaned in Storage
    // but that is recoverable. Return the URL so the admin can at least see it.
    return NextResponse.json(
      {
        success: false,
        message: "Image was saved but the post record could not be updated. " +
                 "Refresh the page and set the cover image URL manually if needed.",
        imageUrl,
      },
      { status: 500 },
    )
  }

  console.log(
    `[posts/image/generate] cover generated — post=${id} ` +
    `visualType=${imageResult.visualType} path=${storagePath}`,
  )

  return NextResponse.json(
    {
      success:    true,
      imageUrl,
      visualType: imageResult.visualType,
    },
    { status: 200 },
  )
}
