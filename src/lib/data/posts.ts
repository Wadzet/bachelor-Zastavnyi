// Prevents this module from being imported in client components or browser bundles.
import "server-only"

/**
 * src/lib/data/posts.ts
 *
 * Server-side Data Access Layer for public post content.
 *
 * ⚠️  SERVER-ONLY FILE ⚠️
 * All functions call getServerClient() which uses the service role key.
 * Do NOT import this file into:
 *   • client components ("use client")
 *   • browser-side code of any kind
 *
 * Public functions only return posts with status = 'published'.
 * Mapping helpers convert raw DB rows → existing TypeScript UI types.
 */

import { getServerClient } from "@/lib/supabase/server"
import type { Insight, Interview, Topic, Author, Guest } from "@/types"

// ---------------------------------------------------------------------------
// Internal DB row shapes
// Never exported — consumed only by the mapping helpers below.
// ---------------------------------------------------------------------------

type AuthorRow = {
  id: string
  name: string
  role: string
  avatar_url: string | null
}

type PostRow = {
  id: string
  title: string
  excerpt: string
  body_markdown: string | null
  content_type: string
  topic: string
  status: string
  slug: string
  author_id: string | null
  guest_data: unknown   // JSONB: { name, role, company, bio?, avatar_url? }
  qa_data: unknown      // JSONB: [{ question, answer }, ...]
  cover_image_url: string | null
  featured: boolean
  published_at: string | null
  created_at: string
  updated_at: string
  authors: AuthorRow | null // joined via author_id FK
}

// Narrowed shapes for the JSONB columns — used only inside mapping helpers.
type GuestData = {
  name: string
  role: string
  company: string
  bio?: string
  avatar_url?: string
}

type QAItem = {
  question: string
  answer: string
}

// ---------------------------------------------------------------------------
// Mapping helpers (not exported — internal to this module)
// ---------------------------------------------------------------------------

const FALLBACK_AUTHOR: Author = { name: "BizInsight Editorial", role: "Editorial" }

/**
 * Maps an authors row (or null) to the UI Author type.
 * Falls back to a generic editorial byline when author_id is unset.
 */
export function mapAuthor(row: AuthorRow | null): Author {
  if (!row) return FALLBACK_AUTHOR
  return {
    name: row.name,
    role: row.role,
    ...(row.avatar_url ? { avatar: row.avatar_url } : {}),
  }
}

/**
 * Maps a posts row (joined with authors) to the UI Insight type.
 * Used for content_type IN ('insight', 'article', 'news').
 */
export function mapPostRowToInsight(row: PostRow): Insight {
  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body_markdown ?? "",
    author: mapAuthor(row.authors),
    publishedAt: row.published_at ?? "",
    topic: row.topic as Topic,
    ...(row.cover_image_url ? { coverImage: row.cover_image_url } : {}),
    featured: row.featured,
  }
}

/**
 * Maps a posts row (joined with authors) to the UI Interview type.
 * Safely handles null or malformed guest_data / qa_data JSONB.
 * Used for content_type = 'interview'.
 */
export function mapPostRowToInterview(row: PostRow): Interview {
  const guest = row.guest_data as GuestData | null
  const qa = row.qa_data as QAItem[] | null

  const mappedGuest: Guest = {
    name: guest?.name ?? "",
    role: guest?.role ?? "",
    company: guest?.company ?? "",
    ...(guest?.bio ? { bio: guest.bio } : {}),
    ...(guest?.avatar_url ? { avatar: guest.avatar_url } : {}),
  }

  // Filter defensively: only keep items that have both required string fields.
  const mappedQA = (qa ?? []).filter(
    (item): item is QAItem =>
      typeof item?.question === "string" && typeof item?.answer === "string"
  )

  return {
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    author: mapAuthor(row.authors),
    guest: mappedGuest,
    qa: mappedQA,
    publishedAt: row.published_at ?? "",
    topic: row.topic as Topic,
    ...(row.cover_image_url ? { coverImage: row.cover_image_url } : {}),
    featured: row.featured,
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** content_type values rendered by the insights listing and detail pages. */
const INSIGHT_CONTENT_TYPES = ["insight", "article", "news"] as const

/** Supabase select string: all post columns + joined author row. */
const SELECT_WITH_AUTHOR = "*, authors(*)" as const

// ---------------------------------------------------------------------------
// Public data access functions
// ---------------------------------------------------------------------------

/**
 * Returns published insight/article/news posts with featured = true,
 * ordered by most recently published.
 *
 * Used by: homepage FeaturedInsights section.
 */
export async function getFeaturedInsights(): Promise<Insight[]> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .eq("featured", true)
    .in("content_type", INSIGHT_CONTENT_TYPES)
    .order("published_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPostRowToInsight(row as unknown as PostRow))
}

/**
 * Returns published interview posts with featured = true,
 * ordered by most recently published.
 *
 * Used by: homepage FeaturedInterviews section.
 */
export async function getFeaturedInterviews(): Promise<Interview[]> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .eq("featured", true)
    .eq("content_type", "interview")
    .order("published_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPostRowToInterview(row as unknown as PostRow))
}

/**
 * Returns all published insight/article/news posts,
 * ordered by most recently published.
 *
 * Used by: /insights listing page.
 */
export async function getInsights(): Promise<Insight[]> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .in("content_type", INSIGHT_CONTENT_TYPES)
    .order("published_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPostRowToInsight(row as unknown as PostRow))
}

/**
 * Returns a single published insight/article/news post by slug.
 * Returns null if not found — caller decides whether to call notFound().
 *
 * Used by: /insights/[slug] detail page.
 */
export async function getInsightBySlug(slug: string): Promise<Insight | null> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .in("content_type", INSIGHT_CONTENT_TYPES)
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapPostRowToInsight(data as unknown as PostRow)
}

/**
 * Returns all published interview posts,
 * ordered by most recently published.
 *
 * Used by: /interviews listing page.
 */
export async function getInterviews(): Promise<Interview[]> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .eq("content_type", "interview")
    .order("published_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPostRowToInterview(row as unknown as PostRow))
}

/**
 * Returns a single published interview post by slug.
 * Returns null if not found — caller decides whether to call notFound().
 *
 * Used by: /interviews/[slug] detail page.
 */
export async function getInterviewBySlug(slug: string): Promise<Interview | null> {
  const { data, error } = await getServerClient()
    .from("posts")
    .select(SELECT_WITH_AUTHOR)
    .eq("status", "published")
    .eq("content_type", "interview")
    .eq("slug", slug)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapPostRowToInterview(data as unknown as PostRow)
}
