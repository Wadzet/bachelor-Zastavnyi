import { NextResponse }        from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { generateCoverImageForPost, VALID_IMAGE_PROVIDERS } from "@/lib/posts/generateCoverImageForPost"
import type { ImageProvider }  from "@/lib/image"

// POST /api/admin/posts/[id]/image/generate
//
// Thin HTTP wrapper around the reusable generateCoverImageForPost() service
// (src/lib/posts/generateCoverImageForPost.ts). The same service powers
// Automated Mode.
//
// Request body (optional): { provider?: "auto" | "replicate" | "gemini" | "svg" }
//
// Requires admin auth. All API tokens stay server-side; raw provider errors
// never reach the browser.
//
// Success: { success: true, imageUrl, visualType, provider, fallback? }
// Error:   { success: false, message }

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params

  // ── Parse optional provider from body ─────────────────────────────────────
  let provider: ImageProvider = "auto"
  try {
    const body = await request.json() as { provider?: unknown }
    if (body.provider && VALID_IMAGE_PROVIDERS.includes(body.provider as ImageProvider)) {
      provider = body.provider as ImageProvider
    }
  } catch {
    // No body or invalid JSON — use default provider
  }

  const result = await generateCoverImageForPost({ postId: id, provider })

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    )
  }

  return NextResponse.json(
    {
      success:    true,
      imageUrl:   result.imageUrl,
      visualType: result.visualType,
      provider:   result.provider,
      ...(result.fallback ? { fallback: true } : {}),
    },
    { status: 200 },
  )
}
