import "server-only"
import { getServerClient } from "@/lib/supabase/server"
import type {
  Source,
  SourceType,
  SourceStatus,
  Draft,
  ContentType,
  DraftStatus,
  Post,
  PostStatus,
  TelegramStatus,
  Topic,
} from "@/types"

// ─── Internal DB row types ────────────────────────────────────────────────────
// Typed manually — no generated Supabase types in this project yet.

type SourceRow = {
  id: string
  name: string
  url: string
  type: string
  status: string
  description: string | null
  last_checked_at: string | null   // NULL = source was never checked
  created_at: string
  updated_at: string
}

type DraftRow = {
  id: string
  title: string
  excerpt: string
  body_markdown: string
  content_type: string
  topic: string
  status: string
  source_id: string | null
  source_url: string | null
  created_at: string
  updated_at: string
}

type PostRow = {
  id: string
  title: string
  excerpt: string
  content_type: string
  topic: string
  status: string
  slug: string
  published_at: string | null
  created_at: string
  updated_at: string
  body_markdown: string | null
  featured: boolean | null
  cover_image_url: string | null
}

// Minimal shape fetched from distribution_jobs for telegram status merging.
type TelegramJobRow = {
  post_id: string
  status: string
}

// ─── Exported aggregate type (for dashboard) ──────────────────────────────────

export type AdminDashboardStats = {
  totalSources: number
  activeSources: number
  sourceErrors: number
  totalDrafts: number
  draftsInReview: number
  totalPosts: number
  publishedPosts: number
  telegramReady: number
}

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapSourceRow(row: SourceRow): Source {
  return {
    id:          row.id,
    name:        row.name,
    url:         row.url,
    type:        row.type as SourceType,
    status:      row.status as SourceStatus,
    description: row.description ?? undefined,
    // last_checked_at is NULL when the source was just added and never
    // monitored yet. Fall back to created_at so the UI always has a date.
    lastChecked: row.last_checked_at ?? row.created_at,
  }
}

function mapDraftRow(row: DraftRow): Draft {
  return {
    id:        row.id,
    title:     row.title,
    excerpt:   row.excerpt,
    body:      row.body_markdown,       // DB: body_markdown → TS: body
    type:      row.content_type as ContentType,
    topic:     row.topic as Topic,
    status:    row.status as DraftStatus,
    sourceId:  row.source_id  ?? undefined,
    sourceUrl: row.source_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// channel_status "pending" exists in the DB enum but is absent from the
// TypeScript TelegramStatus union. A job that is still pending has not yet
// been queued for distribution — treat it the same as no job at all.
const VALID_TELEGRAM_STATUSES = new Set<string>(["ready", "scheduled", "sent", "failed"])

function toTelegramStatus(dbStatus: string | null | undefined): TelegramStatus | undefined {
  if (!dbStatus || !VALID_TELEGRAM_STATUSES.has(dbStatus)) return undefined
  return dbStatus as TelegramStatus
}

function mapPostRow(row: PostRow, telegramDbStatus: string | null | undefined): Post {
  return {
    id:             row.id,
    title:          row.title,
    excerpt:        row.excerpt,
    body:           row.body_markdown ?? undefined,
    type:           row.content_type as ContentType,
    topic:          row.topic as Topic,
    status:         row.status as PostStatus,
    slug:           row.slug,
    featured:       row.featured ?? undefined,
    coverImage:     row.cover_image_url ?? undefined,
    publishedAt:    row.published_at ?? undefined,
    createdAt:      row.created_at,
    updatedAt:      row.updated_at,
    telegramStatus: toTelegramStatus(telegramDbStatus),
  }
}

// Build a post_id → channel_status lookup map from telegram distribution jobs.
function buildTelegramIndex(jobs: TelegramJobRow[]): Map<string, string> {
  return new Map(jobs.map((j) => [j.post_id, j.status]))
}

// Shared helper: fetch all telegram distribution jobs (no post_id filter).
// Used by list functions that need to annotate multiple posts at once.
async function fetchAllTelegramJobs(): Promise<TelegramJobRow[]> {
  const supabase = getServerClient()
  const { data, error } = await supabase
    .from("distribution_jobs")
    .select("post_id, status")
    .eq("channel", "telegram")
  if (error) throw error
  return (data ?? []) as unknown as TelegramJobRow[]
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function getAdminDashboardStats(): Promise<AdminDashboardStats> {
  const supabase = getServerClient()

  // Fetch only the status column from each table — minimal data transfer.
  const [
    { data: sources,      error: srcErr   },
    { data: drafts,       error: draftErr },
    { data: posts,        error: postErr  },
    { data: telegramJobs, error: tgErr    },
  ] = await Promise.all([
    supabase.from("sources").select("status"),
    supabase.from("drafts").select("status"),
    supabase.from("posts").select("status"),
    supabase.from("distribution_jobs").select("status").eq("channel", "telegram"),
  ])

  if (srcErr)   throw srcErr
  if (draftErr) throw draftErr
  if (postErr)  throw postErr
  if (tgErr)    throw tgErr

  return {
    totalSources:   sources?.length ?? 0,
    activeSources:  sources?.filter((s) => s.status === "active").length ?? 0,
    sourceErrors:   sources?.filter((s) => s.status === "error").length  ?? 0,
    totalDrafts:    drafts?.length ?? 0,
    draftsInReview: drafts?.filter((d)  => d.status === "review").length ?? 0,
    totalPosts:     posts?.length ?? 0,
    publishedPosts: posts?.filter((p)   => p.status === "published").length ?? 0,
    telegramReady:  telegramJobs?.filter((j) => j.status === "ready").length ?? 0,
  }
}

// ─── Recent items (dashboard cards) ──────────────────────────────────────────

export async function getAdminRecentDrafts(limit = 4): Promise<Draft[]> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("drafts")
    .select(
      "id, title, excerpt, body_markdown, content_type, topic, " +
      "status, source_id, source_url, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapDraftRow(row as unknown as DraftRow))
}

export async function getAdminRecentPosts(limit = 5): Promise<Post[]> {
  const supabase = getServerClient()

  // Fetch the most-recently-updated posts AND all telegram jobs in parallel.
  // We fetch all telegram jobs (not just for these posts) because the result
  // set is small and it avoids a subquery / IN filter.
  const [
    { data: postRows, error: postErr },
    telegramRows,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, excerpt, content_type, topic, status, " +
        "slug, published_at, created_at, updated_at, " +
        "body_markdown, featured, cover_image_url",
      )
      .order("updated_at", { ascending: false })
      .limit(limit),
    fetchAllTelegramJobs(),
  ])

  if (postErr) throw postErr

  const telegramIndex = buildTelegramIndex(telegramRows)
  const rows = (postRows ?? []) as unknown as PostRow[]

  return rows.map((row) => mapPostRow(row, telegramIndex.get(row.id)))
}

// ─── Sources ──────────────────────────────────────────────────────────────────

export async function getAdminSources(): Promise<Source[]> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("sources")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapSourceRow(row as unknown as SourceRow))
}

// ─── Drafts ───────────────────────────────────────────────────────────────────

export async function getAdminDrafts(): Promise<Draft[]> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("drafts")
    .select(
      "id, title, excerpt, body_markdown, content_type, topic, " +
      "status, source_id, source_url, created_at, updated_at",
    )
    .order("updated_at", { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapDraftRow(row as unknown as DraftRow))
}

export async function getAdminDraftById(id: string): Promise<Draft | null> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("drafts")
    .select(
      "id, title, excerpt, body_markdown, content_type, topic, " +
      "status, source_id, source_url, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle()

  if (error) throw error
  if (!data)  return null
  return mapDraftRow(data as unknown as DraftRow)
}

// ─── Posts ────────────────────────────────────────────────────────────────────
//
// Telegram distribution state lives in distribution_jobs, not in posts.
// Strategy:
//   1. Fetch all posts ordered by updated_at DESC.
//   2. Fetch all telegram distribution_jobs (channel = 'telegram').
//   3. Build a Map<post_id, channel_status> and merge during mapping.
//
// This avoids complex Supabase embedded-relation filters and keeps the
// mapping logic explicit and easy to reason about.

export async function getAdminPosts(): Promise<Post[]> {
  const supabase = getServerClient()

  const [
    { data: postRows, error: postErr },
    telegramRows,
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, excerpt, content_type, topic, status, " +
        "slug, published_at, created_at, updated_at, " +
        "body_markdown, featured, cover_image_url",
      )
      .order("updated_at", { ascending: false }),
    fetchAllTelegramJobs(),
  ])

  if (postErr) throw postErr

  const telegramIndex = buildTelegramIndex(telegramRows)
  const rows = (postRows ?? []) as unknown as PostRow[]

  return rows.map((row) => mapPostRow(row, telegramIndex.get(row.id)))
}

export async function getAdminPostById(id: string): Promise<Post | null> {
  const supabase = getServerClient()

  // For a single post, fetch only the telegram job for that specific post_id.
  const [
    { data: postRow, error: postErr },
    { data: telegramRow, error: tgErr },
  ] = await Promise.all([
    supabase
      .from("posts")
      .select(
        "id, title, excerpt, content_type, topic, status, " +
        "slug, published_at, created_at, updated_at, " +
        "body_markdown, featured, cover_image_url",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("distribution_jobs")
      .select("post_id, status")
      .eq("channel", "telegram")
      .eq("post_id", id)
      .maybeSingle(),
  ])

  if (postErr) throw postErr
  if (tgErr)   throw tgErr
  if (!postRow) return null

  return mapPostRow(
    postRow as unknown as PostRow,
    (telegramRow as unknown as TelegramJobRow | null)?.status ?? null,
  )
}
