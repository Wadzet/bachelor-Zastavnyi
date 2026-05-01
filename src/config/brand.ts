export const BRAND = {
  name: "BizInsight",
  tagline: "AI and business intelligence for leaders who act.",
  // NEXT_PUBLIC_SITE_URL is set in Vercel env vars to the production domain.
  // Falls back to localhost for local development.
  // Safe for client-side use — contains only the public website base URL.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
} as const
