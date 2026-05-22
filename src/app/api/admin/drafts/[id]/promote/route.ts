import { NextResponse } from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { createPostFromDraft } from "@/lib/posts/createPostFromDraft"

// POST /api/admin/drafts/[id]/promote
//
// Thin HTTP wrapper around the reusable createPostFromDraft() service
// (src/lib/posts/createPostFromDraft.ts). The same service powers Automated Mode.
//
// Editorial Mode: only 'approved' drafts may be promoted (enforced in service).

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const { id } = await params

  const result = await createPostFromDraft(id)

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    )
  }

  if (result.alreadyExists) {
    return NextResponse.json(
      {
        success:       true,
        postId:        result.postId,
        slug:          result.slug,
        alreadyExists: true,
        message:       "This draft has already been promoted to a post.",
      },
      { status: 200 },
    )
  }

  return NextResponse.json(
    { success: true, postId: result.postId, slug: result.slug },
    { status: 200 },
  )
}
