import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import { getGeminiClient, resolveModel, SUPPORTED_MODELS } from "@/lib/gemini/client"

// =============================================================================
// generateDraft — reusable server-side draft generation service
// =============================================================================
//
// Core logic extracted from POST /api/admin/drafts/generate so it can be reused
// by both the manual (Editorial Mode) route and the Automated Mode orchestrator.
//
// Responsibilities:
//   1. Validate inputs (returns a structured error — no NextResponse here).
//   2. Insert a pending ai_generations audit row.
//   3. Call Gemini and parse the JSON response.
//   4. Insert the draft (status 'review').
//   5. Finalise the ai_generations row (completed / failed).
//
// Security: server-only. GEMINI_API_KEY and the Supabase service role key never
// leave the server. Errors returned to callers are safe/generic; full details
// are logged server-side only.
// =============================================================================

// ─── Valid content types (interviews cannot be AI-generated) ──────────────────
export const GENERATABLE_TYPES = ["insight", "article", "news"] as const
export type GeneratableType = (typeof GENERATABLE_TYPES)[number]

export const VALID_TOPICS = [
  "AI Strategy",
  "Operations",
  "Automation",
  "Market Trends",
  "Leadership",
  "Case Study",
] as const

export type GenerateDraftInput = {
  mode:   "url" | "text"
  input:  string
  type:   string
  topic?: string
  model?: string
}

export type GenerateDraftResult =
  | { ok: true;  draftId: string; title: string }
  | { ok: false; status: number; message: string }

// ─── Prompt builder ───────────────────────────────────────────────────────────

function buildPrompt(
  mode:  "url" | "text",
  input: string,
  type:  GeneratableType,
  topic: string,
): string {
  const contentTypeDesc = {
    insight: "a strategic business insight",
    article: "an in-depth business article",
    news:    "a concise business news piece",
  }[type]

  const topicLine = topic
    ? `The content must be specifically focused on the topic: "${topic}".`
    : "Choose the most relevant business topic for the content."

  const sourceInstruction =
    mode === "url"
      ? `The source article is located at: ${input}\n` +
        `Note: you do not have live internet access. Use the URL as context for the editorial tone and subject matter. ` +
        `Base the draft on the URL's implied topic area. ` +
        `Include a note in the draft's editorial context that this content is inspired by an external source and requires verification before publication.`
      : `Base the draft on the following provided text:\n\n${input}`

  return `You are an expert business journalist writing for BizInsight, a premium AI-focused business media platform.
Your readers are senior executives, founders, and business leaders who expect sharp, data-informed, opinionated writing.

${sourceInstruction}

Write ${contentTypeDesc} as a draft for editorial review.
${topicLine}

Requirements:
- Title: concise (6–12 words), specific, no clickbait, no generic phrasing
- Excerpt: 1–2 punchy sentences (max 250 characters) that establish the core insight and hook the reader
- Body: 400–700 words of substantive markdown content with ## section headings
  - Lead with the sharpest insight, not background
  - Use concrete examples and specific claims where possible
  - Avoid filler phrases like "In today's fast-paced world" or "It goes without saying"
  - Each section must advance the argument — no padding
  - Close with an actionable implication or forward-looking observation

Return ONLY valid JSON with exactly these fields:
{
  "title": "string",
  "excerpt": "string",
  "body": "string (markdown)"
}

Do not include any text before or after the JSON object.`
}

// ─── Core service ─────────────────────────────────────────────────────────────

export async function generateDraft(opts: GenerateDraftInput): Promise<GenerateDraftResult> {
  const { mode, input, type, topic, model: modelOverride } = opts

  // ── Validate ────────────────────────────────────────────────────────────────
  if (!mode || !["url", "text"].includes(mode)) {
    return { ok: false, status: 400, message: "mode must be 'url' or 'text'." }
  }

  const trimmedInput = (input ?? "").trim()
  if (!trimmedInput) {
    return { ok: false, status: 400, message: "input is required." }
  }

  if (mode === "url" && !/^https?:\/\/.+/.test(trimmedInput)) {
    return { ok: false, status: 400, message: "input must be a valid URL when mode is 'url'." }
  }

  if (!type || !(GENERATABLE_TYPES as readonly string[]).includes(type)) {
    return {
      ok: false,
      status: 400,
      message: `type must be one of: ${GENERATABLE_TYPES.join(", ")}. Interview drafts cannot be AI-generated.`,
    }
  }

  const trimmedTopic = (topic ?? "").trim()
  if (trimmedTopic && !(VALID_TOPICS as readonly string[]).includes(trimmedTopic)) {
    return { ok: false, status: 400, message: `Invalid topic: "${trimmedTopic}".` }
  }

  if (modelOverride && !(SUPPORTED_MODELS as readonly string[]).includes(modelOverride)) {
    return { ok: false, status: 400, message: `model must be one of: ${SUPPORTED_MODELS.join(", ")}.` }
  }

  const resolvedModel = resolveModel(modelOverride)
  const supabase      = getServerClient()

  // ── Insert pending ai_generations row ─────────────────────────────────────
  const { data: genRow, error: genInsertError } = await supabase
    .from("ai_generations")
    .insert({
      model:      resolvedModel,
      source_url: mode === "url"  ? trimmedInput : null,
      raw_input:  mode === "text" ? trimmedInput : null,
      status:     "pending",
    })
    .select("id")
    .single()

  if (genInsertError || !genRow) {
    console.error("[generateDraft] Failed to insert ai_generations row:", genInsertError?.message)
    return { ok: false, status: 500, message: "Failed to initialise generation log." }
  }

  const genId = genRow.id

  // ── Call Gemini ─────────────────────────────────────────────────────────────
  let generatedTitle:   string
  let generatedExcerpt: string
  let generatedBody:    string
  let promptTokens:     number | null = null
  let completionTokens: number | null = null

  try {
    const ai     = getGeminiClient()
    const prompt = buildPrompt(mode, trimmedInput, type as GeneratableType, trimmedTopic)

    const response = await ai.models.generateContent({
      model:    resolvedModel,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    })

    const usageMeta = response.usageMetadata
    if (usageMeta) {
      promptTokens     = usageMeta.promptTokenCount     ?? null
      completionTokens = usageMeta.candidatesTokenCount ?? null
    }

    const rawText = response.text ?? ""
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>
    } catch {
      throw new Error(`Model returned non-JSON response: ${rawText.slice(0, 200)}`)
    }

    const title   = (parsed.title   as string | undefined)?.trim() ?? ""
    const excerpt = (parsed.excerpt as string | undefined)?.trim() ?? ""
    const bodyMd  = (parsed.body    as string | undefined)?.trim() ?? ""

    if (!title || !excerpt || !bodyMd) {
      throw new Error(
        `Model response missing required fields. Got: ${JSON.stringify({ title: !!title, excerpt: !!excerpt, body: !!bodyMd })}`,
      )
    }

    generatedTitle   = title
    generatedExcerpt = excerpt
    generatedBody    = bodyMd
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err)
    console.error("[generateDraft] Gemini error:", errorMessage)

    await supabase
      .from("ai_generations")
      .update({
        status:        "failed",
        error_message: errorMessage.slice(0, 1000),
        completed_at:  new Date().toISOString(),
      })
      .eq("id", genId)

    return { ok: false, status: 500, message: "AI generation failed. Please try again." }
  }

  // ── Insert draft ────────────────────────────────────────────────────────────
  const { data: draft, error: draftError } = await supabase
    .from("drafts")
    .insert({
      title:         generatedTitle,
      excerpt:       generatedExcerpt,
      body_markdown: generatedBody,
      content_type:  type,
      topic:         trimmedTopic || "AI Strategy",
      source_url:    mode === "url"  ? trimmedInput : null,
      raw_input:     mode === "text" ? trimmedInput : null,
      status:        "review",
    })
    .select("id, title")
    .single()

  if (draftError || !draft) {
    console.error("[generateDraft] Failed to insert draft:", draftError?.message)

    await supabase
      .from("ai_generations")
      .update({
        status:            "failed",
        error_message:     "Draft insert failed after successful generation.",
        completed_at:      new Date().toISOString(),
        prompt_tokens:     promptTokens,
        completion_tokens: completionTokens,
        generated_title:   generatedTitle,
        generated_excerpt: generatedExcerpt,
        generated_body:    generatedBody,
      })
      .eq("id", genId)

    return { ok: false, status: 500, message: "Failed to save generated draft." }
  }

  // ── Finalise generation log ───────────────────────────────────────────────
  await supabase
    .from("ai_generations")
    .update({
      draft_id:          draft.id,
      status:            "completed",
      prompt_tokens:     promptTokens,
      completion_tokens: completionTokens,
      generated_title:   generatedTitle,
      generated_excerpt: generatedExcerpt,
      generated_body:    generatedBody,
      completed_at:      new Date().toISOString(),
    })
    .eq("id", genId)

  return { ok: true, draftId: draft.id, title: generatedTitle }
}
