// ─── Image provider shared types ─────────────────────────────────────────────
//
// These types are shared by the provider router (src/lib/image/index.ts)
// and all concrete providers. Importing from this file in server components
// is safe — there is nothing browser-specific here.

export type ImageProvider = "auto" | "replicate" | "gemini" | "svg"

// The concrete provider that actually ran (never "auto").
export type ConcreteProvider = "replicate" | "gemini" | "svg"

/**
 * Standardized result returned by every image provider.
 * The caller is responsible for uploading `buffer` to Supabase Storage.
 */
export type ImageProviderResult = {
  buffer:   Buffer        // raw image bytes
  mimeType: string        // e.g. "image/webp", "image/png", "image/svg+xml"
  provider: ConcreteProvider
  fallback: boolean       // true if a fallback provider was used instead of the requested one
}
