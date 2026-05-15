import "server-only"

import type { ImageProviderResult } from "@/lib/image/types"
import type { VisualType }          from "@/lib/gemini/image"

// ─── SVG cover generator ──────────────────────────────────────────────────────
//
// Generates a dark editorial SVG at 1600×900 (16:9) suitable for use as a
// post cover image when AI providers are unavailable or explicitly selected.
//
// Design system:
//   Background: #0a0a0a (near-black)
//   Primary accent: #f59e0b (amber-400)
//   Text: #ffffff (title), #a1a1aa (subtitle)
//   Decorative: abstract geometric shapes keyed to visual type

// ─── SVG canvas dimensions ────────────────────────────────────────────────────

const W = 1600
const H = 900

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Wrap a string to at most `maxChars` per line, returning up to `maxLines` lines. */
function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words  = text.split(/\s+/)
  const lines: string[] = []
  let   current = ""

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (candidate.length <= maxChars) {
      current = candidate
    } else {
      if (current) lines.push(current)
      if (lines.length >= maxLines) break
      current = word.slice(0, maxChars)
    }
  }
  if (current && lines.length < maxLines) lines.push(current)

  return lines.slice(0, maxLines)
}

/** Escape special XML characters. */
function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

// ─── Decorative elements keyed to visual type ─────────────────────────────────

function decorativeElements(vt: VisualType): string {
  switch (vt) {
    case "infographic":
      // Vertical process flow — stacked rectangles connected by lines
      return `
        <g opacity="0.18">
          <rect x="1220" y="80"  width="280" height="56" rx="8" fill="#f59e0b"/>
          <rect x="1220" y="200" width="280" height="56" rx="8" fill="#f59e0b"/>
          <rect x="1220" y="320" width="280" height="56" rx="8" fill="#f59e0b"/>
          <rect x="1220" y="440" width="280" height="56" rx="8" fill="#f59e0b"/>
          <line x1="1360" y1="136" x2="1360" y2="200" stroke="#f59e0b" stroke-width="3"/>
          <line x1="1360" y1="256" x2="1360" y2="320" stroke="#f59e0b" stroke-width="3"/>
          <line x1="1360" y1="376" x2="1360" y2="440" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="1360" cy="168" r="8" fill="#f59e0b"/>
          <circle cx="1360" cy="288" r="8" fill="#f59e0b"/>
          <circle cx="1360" cy="408" r="8" fill="#f59e0b"/>
        </g>`

    case "quote_card":
      // Large quotation mark decoration
      return `
        <g opacity="0.10">
          <text x="1100" y="600" font-family="Georgia, serif" font-size="600" fill="#f59e0b">"</text>
        </g>
        <g opacity="0.15">
          <line x1="80" y1="200" x2="520" y2="200" stroke="#f59e0b" stroke-width="2"/>
          <line x1="80" y1="680" x2="520" y2="680" stroke="#f59e0b" stroke-width="2"/>
        </g>`

    case "concept_diagram":
      // Interconnected nodes
      return `
        <g opacity="0.20">
          <circle cx="1380" cy="200" r="60"  fill="none" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="1220" cy="380" r="45"  fill="none" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="1480" cy="420" r="50"  fill="none" stroke="#f59e0b" stroke-width="3"/>
          <circle cx="1300" cy="580" r="35"  fill="none" stroke="#f59e0b" stroke-width="2"/>
          <circle cx="1500" cy="650" r="28"  fill="none" stroke="#f59e0b" stroke-width="2"/>
          <line x1="1380" y1="260" x2="1265" y2="335" stroke="#f59e0b" stroke-width="1.5"/>
          <line x1="1380" y1="260" x2="1430" y2="370" stroke="#f59e0b" stroke-width="1.5"/>
          <line x1="1220" y1="425" x2="1265" y2="545" stroke="#f59e0b" stroke-width="1.5"/>
          <line x1="1480" y1="470" x2="1472" y2="622" stroke="#f59e0b" stroke-width="1.5"/>
          <line x1="1300" y1="545" x2="1472" y2="622" stroke="#f59e0b" stroke-width="1.5"/>
        </g>`

    case "chart_visual":
      // Abstract bar chart
      return `
        <g opacity="0.22">
          <rect x="1100" y="500" width="60" height="280" rx="4" fill="#f59e0b"/>
          <rect x="1180" y="380" width="60" height="400" rx="4" fill="#f59e0b"/>
          <rect x="1260" y="460" width="60" height="320" rx="4" fill="#f59e0b"/>
          <rect x="1340" y="300" width="60" height="480" rx="4" fill="#f59e0b"/>
          <rect x="1420" y="420" width="60" height="360" rx="4" fill="#f59e0b"/>
          <rect x="1500" y="340" width="60" height="440" rx="4" fill="#f59e0b"/>
          <line x1="1090" y1="790" x2="1575" y2="790" stroke="#f59e0b" stroke-width="2"/>
        </g>`

    case "editorial_cover":
    default:
      // Abstract geometric shapes — circles and diagonal lines
      return `
        <g opacity="0.12">
          <circle cx="1450" cy="150" r="280" fill="none" stroke="#f59e0b" stroke-width="60"/>
          <circle cx="1450" cy="150" r="160" fill="none" stroke="#f59e0b" stroke-width="30"/>
        </g>
        <g opacity="0.08">
          <line x1="900"  y1="0"   x2="1600" y2="900" stroke="#f59e0b" stroke-width="2"/>
          <line x1="1000" y1="0"   x2="1600" y2="700" stroke="#f59e0b" stroke-width="1"/>
          <line x1="1100" y1="0"   x2="1600" y2="500" stroke="#f59e0b" stroke-width="1"/>
        </g>`
  }
}

// ─── Visual type label ────────────────────────────────────────────────────────

const VT_LABEL: Record<VisualType, string> = {
  editorial_cover:  "Editorial",
  infographic:      "Infographic",
  quote_card:       "Quote",
  concept_diagram:  "Concept",
  chart_visual:     "Data",
}

// ─── Main generator ───────────────────────────────────────────────────────────

/**
 * Generate a dark editorial SVG cover image for a post.
 * Returns raw SVG bytes — no external dependencies, no API calls.
 */
export function generateSvgCover(opts: {
  title:     string
  topic:     string
  visualType: VisualType
}): ImageProviderResult {
  const { title, topic, visualType } = opts

  // Title: up to 2 lines × 38 chars
  const titleLines = wrapText(title, 38, 2)

  // Amber horizontal rule Y position
  const ruleY  = 120
  // Title block starts below the rule
  const titleY = ruleY + 80

  // Build tspan elements for title
  const titleTspans = titleLines
    .map((line, i) =>
      `<tspan x="80" dy="${i === 0 ? 0 : 90}">${escXml(line)}</tspan>`
    )
    .join("\n        ")

  // Determine topic tag Y (after title lines)
  const tagY = titleY + (titleLines.length - 1) * 90 + 80

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%"   stop-color="#0a0a0a"/>
      <stop offset="100%" stop-color="#141414"/>
    </linearGradient>
    <linearGradient id="glow" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#f59e0b" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${W}" height="${H}" fill="url(#bg)"/>

  <!-- Decorative elements (visual-type specific) -->
  ${decorativeElements(visualType)}

  <!-- Left amber accent bar -->
  <rect x="0" y="0" width="6" height="${H}" fill="#f59e0b"/>

  <!-- Top horizontal amber rule -->
  <rect x="80" y="${ruleY}" width="500" height="3" fill="url(#glow)"/>

  <!-- Title -->
  <text
    x="80"
    y="${titleY}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="82"
    font-weight="700"
    fill="#ffffff"
    letter-spacing="-1"
  >
    ${titleTspans}
  </text>

  <!-- Topic tag -->
  <rect x="78" y="${tagY - 4}" width="${Math.min(topic.length * 14 + 28, 300)}" height="42" rx="21" fill="#f59e0b" fill-opacity="0.15"/>
  <rect x="78" y="${tagY - 4}" width="${Math.min(topic.length * 14 + 28, 300)}" height="42" rx="21" fill="none" stroke="#f59e0b" stroke-opacity="0.40" stroke-width="1"/>
  <text
    x="92"
    y="${tagY + 24}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="22"
    font-weight="500"
    fill="#f59e0b"
    fill-opacity="0.90"
    letter-spacing="0.5"
  >${escXml(topic)}</text>

  <!-- Visual type label — bottom left -->
  <text
    x="80"
    y="${H - 52}"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="18"
    font-weight="400"
    fill="#52525b"
    letter-spacing="2"
    text-transform="uppercase"
  >${VT_LABEL[visualType].toUpperCase()}</text>

  <!-- BizInsight wordmark — bottom right -->
  <text
    x="${W - 40}"
    y="${H - 52}"
    text-anchor="end"
    font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif"
    font-size="18"
    font-weight="600"
    fill="#3f3f46"
    letter-spacing="1"
  >BIZINSIGHT</text>

  <!-- Bottom rule -->
  <rect x="0" y="${H - 4}" width="${W}" height="4" fill="#f59e0b" fill-opacity="0.30"/>
</svg>`

  return {
    buffer:   Buffer.from(svg, "utf-8"),
    mimeType: "image/svg+xml",
    provider: "svg",
    fallback: false,
  }
}
