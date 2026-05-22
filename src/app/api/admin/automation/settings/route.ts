import { NextResponse }        from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import {
  getAutomationSettings,
  updateAutomationSettings,
  type AutomationSettingsPatch,
} from "@/lib/data/automation"
import { GENERATABLE_TYPES, VALID_TOPICS } from "@/lib/drafts/generateDraft"
import { VALID_IMAGE_PROVIDERS } from "@/lib/posts/generateCoverImageForPost"
import { SUPPORTED_MODELS } from "@/lib/gemini/client"
import type {
  AutomationContentType,
  AutomationImageProvider,
} from "@/lib/automation/types"

// =============================================================================
// /api/admin/automation/settings — read & update Automated Mode settings
// =============================================================================
//
// GET  → returns the singleton automation_settings row.
// PUT  → validates + updates the singleton row. Unknown / invalid fields are
//        rejected; booleans are coerced; safe defaults stay enforced server-side.
//
// Requires admin auth. No secrets are read from or written to the client.
// =============================================================================

export async function GET() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  try {
    const settings = await getAutomationSettings()
    return NextResponse.json({ success: true, settings }, { status: 200 })
  } catch (err) {
    console.error("[automation/settings] GET error:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { success: false, message: "Failed to load automation settings." },
      { status: 500 },
    )
  }
}

export async function PUT(request: Request) {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  // ── Parse body ──────────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json(
      { success: false, message: "Request body must be valid JSON." },
      { status: 400 },
    )
  }

  const patch: AutomationSettingsPatch = {}

  // ── enabled + boolean switches ────────────────────────────────────────────
  const boolKeys = [
    "enabled",
    "createPostAfterDraft",
    "autoPublishWebsite",
    "autoSendTelegram",
    "autoSendLinkedin",
  ] as const

  for (const key of boolKeys) {
    if (body[key] !== undefined) {
      if (typeof body[key] !== "boolean") {
        return NextResponse.json(
          { success: false, message: `"${key}" must be a boolean.` },
          { status: 400 },
        )
      }
      patch[key] = body[key] as boolean
    }
  }

  // ── defaultContentType ────────────────────────────────────────────────────
  if (body.defaultContentType !== undefined) {
    const value = body.defaultContentType
    if (typeof value !== "string" || !(GENERATABLE_TYPES as readonly string[]).includes(value)) {
      return NextResponse.json(
        { success: false, message: `defaultContentType must be one of: ${GENERATABLE_TYPES.join(", ")}.` },
        { status: 400 },
      )
    }
    patch.defaultContentType = value as AutomationContentType
  }

  // ── defaultTopic ──────────────────────────────────────────────────────────
  if (body.defaultTopic !== undefined) {
    const value = body.defaultTopic
    if (typeof value !== "string" || !(VALID_TOPICS as readonly string[]).includes(value)) {
      return NextResponse.json(
        { success: false, message: `defaultTopic must be one of: ${VALID_TOPICS.join(", ")}.` },
        { status: 400 },
      )
    }
    patch.defaultTopic = value
  }

  // ── defaultTextModel (nullable) ───────────────────────────────────────────
  if (body.defaultTextModel !== undefined) {
    const value = body.defaultTextModel
    if (value === null || value === "") {
      patch.defaultTextModel = null
    } else if (typeof value === "string" && (SUPPORTED_MODELS as readonly string[]).includes(value)) {
      patch.defaultTextModel = value
    } else {
      return NextResponse.json(
        { success: false, message: `defaultTextModel must be null or one of: ${SUPPORTED_MODELS.join(", ")}.` },
        { status: 400 },
      )
    }
  }

  // ── defaultImageProvider ──────────────────────────────────────────────────
  if (body.defaultImageProvider !== undefined) {
    const value = body.defaultImageProvider
    if (typeof value !== "string" || !(VALID_IMAGE_PROVIDERS as readonly string[]).includes(value)) {
      return NextResponse.json(
        { success: false, message: `defaultImageProvider must be one of: ${VALID_IMAGE_PROVIDERS.join(", ")}.` },
        { status: 400 },
      )
    }
    patch.defaultImageProvider = value as AutomationImageProvider
  }

  // ── maxSourcesPerRun (1–20) ───────────────────────────────────────────────
  if (body.maxSourcesPerRun !== undefined) {
    const value = body.maxSourcesPerRun
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 20) {
      return NextResponse.json(
        { success: false, message: "maxSourcesPerRun must be an integer between 1 and 20." },
        { status: 400 },
      )
    }
    patch.maxSourcesPerRun = value
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json(
      { success: false, message: "No valid settings fields provided." },
      { status: 400 },
    )
  }

  // ── Persist ─────────────────────────────────────────────────────────────────
  try {
    const settings = await updateAutomationSettings(patch)
    return NextResponse.json({ success: true, settings }, { status: 200 })
  } catch (err) {
    console.error("[automation/settings] PUT error:", err instanceof Error ? err.message : err)
    return NextResponse.json(
      { success: false, message: "Failed to update automation settings." },
      { status: 500 },
    )
  }
}
