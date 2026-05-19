import "server-only"

import { getGeminiClient } from "@/lib/gemini/client"

// ─── Image model ──────────────────────────────────────────────────────────────
// The env var DEFAULT_IMAGE_MODEL overrides the constant below.
// Keep the constant here so the model name is changed in exactly one place.
//
// Gemini native image generation uses the gemini-2.0-flash-preview-image-generation
// model via responseModalities: ["IMAGE"]. The env var lets the team switch
// to a newer model without a code deploy.

export const DEFAULT_IMAGE_MODEL_NAME = "gemini-2.0-flash-preview-image-generation"

export function resolveImageModel(): string {
  return process.env.DEFAULT_IMAGE_MODEL ?? DEFAULT_IMAGE_MODEL_NAME
}

// ─── Visual type ──────────────────────────────────────────────────────────────

export type VisualType =
  | "editorial_cover"
  | "infographic"
  | "quote_card"
  | "concept_diagram"
  | "chart_visual"

/**
 * Analyse post content and select the most appropriate visual type.
 *
 * Rules (in order of priority):
 *   1. interview → quote_card  (personal quotes are the natural visual)
 *   2. process/framework/steps keywords → infographic
 *   3. system/architecture/layers keywords → concept_diagram
 *   4. real numeric patterns (%, $, Nx) → chart_visual
 *   5. default → editorial_cover
 *
 * chart_visual is only chosen when the text contains clear numeric evidence
 * (percentages, dollar amounts, multipliers). This prevents fabricated charts.
 */
export function selectVisualType(opts: {
  contentType: string
  title:       string
  excerpt:     string
  body:        string
}): VisualType {
  const { contentType, title, excerpt, body } = opts

  // Interview → quote_card
  if (contentType === "interview") return "quote_card"

  const haystack = [title, excerpt, body.slice(0, 2000)].join(" ")

  // Process / steps / framework → infographic
  if (/\b(steps?|stages?|phases?|framework|process|methodology|roadmap|playbook|guide|how to|workflow|checklist)\b/i.test(haystack)) {
    return "infographic"
  }

  // Structural / system concepts → concept_diagram
  if (/\b(ecosystem|architecture|model|system|hierarchy|layers?|components?|pillars?|stack|platform|infrastructure)\b/i.test(haystack)) {
    return "concept_diagram"
  }

  // Real numeric data → chart_visual (only strong patterns — avoids years/IDs)
  if (/(\d+(?:\.\d+)?%|\$\d+[BMK]?|\d+(?:\.\d+)?x\b|\d+ (?:companies|organizations|businesses|respondents|executives|firms|leaders))/i.test(haystack)) {
    return "chart_visual"
  }

  return "editorial_cover"
}

// ─── Prompt builder ───────────────────────────────────────────────────────────

// Max body snippet fed into the image prompt.
// Keeps prompt length sensible and avoids sending the full article.
const MAX_BODY_SNIPPET = 600

const STYLE_GUIDE = [
  "premium business editorial visual",
  "very dark background (#0a0a0a to #1c1c1c)",
  "gold/amber accent color (#f59e0b) with white text accents",
  "clean minimal composition",
  "high contrast",
  "no realistic human faces or portraits",
  "no copyrighted logos, wordmarks, or brand names",
  "no small unreadable text — if text is used keep it large and minimal",
  "no fake charts with invented numbers",
  "editorial illustration style suitable for a business intelligence publication",
  "16:9 widescreen aspect ratio",
].join(", ")

type PromptContext = { title: string; excerpt: string; topic: string }

const TYPE_INSTRUCTIONS: Record<VisualType, (ctx: PromptContext) => string> = {
  editorial_cover: ({ title, excerpt, topic }) =>
    `Abstract editorial cover illustration evoking the theme "${title}". ` +
    `Core ideas: ${excerpt.slice(0, 140)}. ` +
    `Use geometric shapes, flowing data glyphs, or conceptual metaphors related to ${topic}. ` +
    `No literal depictions. Abstract and conceptual.`,

  infographic: ({ title }) =>
    `Clean dark-background infographic layout illustrating the key steps or framework in "${title}". ` +
    `Show 3–5 abstract process steps connected by arrows or flow lines. ` +
    `Use simple icons and large readable label placeholders. ` +
    `No specific numbers or statistics. Abstract process flow only.`,

  quote_card: ({ excerpt }) =>
    `Premium quote card with dark background. ` +
    `Feature this insight in large bold typography: "${excerpt.slice(0, 120)}". ` +
    `Minimal decorative lines or geometric elements as accents. ` +
    `Business editorial aesthetic. Lots of breathing room around the text.`,

  concept_diagram: ({ title }) =>
    `Abstract concept diagram visualising the system or structure described in "${title}". ` +
    `Show interconnected nodes, layers, or components using geometric shapes and connecting lines. ` +
    `No data numbers. No text labels beyond placeholder shapes. ` +
    `Dark background with amber/white accents.`,

  chart_visual: ({ title }) =>
    `Abstract data visualisation representing trends related to "${title}". ` +
    `Use stylised bar chart, line chart, or area chart shapes. ` +
    `Abstract visual pattern — no axis numbers, no specific data values. ` +
    `The chart shape is decorative, not factual. Dark editorial aesthetic.`,
}

export function buildImagePrompt(opts: {
  title:       string
  excerpt:     string
  body:        string
  topic:       string
  contentType: string
  visualType:  VisualType
}): string {
  const { title, excerpt, body, topic, visualType } = opts
  const bodySnippet = body.slice(0, MAX_BODY_SNIPPET)
  const typeInstruction = TYPE_INSTRUCTIONS[visualType]({ title, excerpt, topic })

  return (
    `Generate a single high-quality cover image for a business article.\n\n` +
    `Visual type: ${visualType}\n` +
    `Article topic area: ${topic}\n\n` +
    `${typeInstruction}\n\n` +
    `Additional context from article:\n${bodySnippet}\n\n` +
    `Style requirements: ${STYLE_GUIDE}\n\n` +
    `Output: one image only. No text explanation, no markdown, just the image.`
  )
}

// ─── Image generation result ──────────────────────────────────────────────────

export type ImageGenerationResult = {
  base64:     string   // raw base64, no data URI prefix
  mimeType:   string   // e.g. "image/png"
  visualType: VisualType
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generate a cover image for a post using Gemini's native image output.
 *
 * 1. Selects the visual type from post content.
 * 2. Builds a prompt.
 * 3. Calls Gemini with responseModalities: ["IMAGE"].
 * 4. Returns the raw base64 image bytes + mime type.
 *
 * Throws on any failure — caller is responsible for error handling.
 */
export async function generateCoverImage(opts: {
  title:       string
  excerpt:     string
  body:        string
  topic:       string
  contentType: string
}): Promise<ImageGenerationResult> {
  const model = resolveImageModel()

  if (!process.env.GEMINI_API_KEY) {
    throw new Error("[image] GEMINI_API_KEY is not set.")
  }
  if (!process.env.DEFAULT_IMAGE_MODEL && model === DEFAULT_IMAGE_MODEL_NAME) {
    // DEFAULT_IMAGE_MODEL not set — using hardcoded default, which is fine.
    // Just log so it's discoverable in dev.
    console.log(`[image] DEFAULT_IMAGE_MODEL not set, using built-in default: ${DEFAULT_IMAGE_MODEL_NAME}`)
  }

  const visualType = selectVisualType({
    contentType: opts.contentType,
    title:       opts.title,
    excerpt:     opts.excerpt,
    body:        opts.body,
  })

  const prompt = buildImagePrompt({ ...opts, visualType })

  const ai = getGeminiClient()

  console.log(`[image] generating cover — model=${model} visualType=${visualType}`)

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role:  "user",
        parts: [{ text: prompt }],
      },
    ],
    config: {
      // Request image output from the model.
      // Some Gemini versions use "IMAGE", others need the full mime type.
      responseModalities: ["IMAGE"],
    },
  })

  // Extract image inline data from the response parts
  const parts = response.candidates?.[0]?.content?.parts ?? []
  for (const part of parts) {
    const inlineData = part.inlineData as { data: string; mimeType: string } | undefined
    if (inlineData?.data) {
      return {
        base64:     inlineData.data,
        mimeType:   inlineData.mimeType ?? "image/png",
        visualType,
      }
    }
  }

  // If we reach here the model returned no image
  throw new Error(
    `[image] Gemini returned no image data for model ${model}. ` +
    `Response text: ${(response.text ?? "").slice(0, 200)}`,
  )
}
