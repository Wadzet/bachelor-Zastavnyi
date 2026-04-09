export type Topic =
  | "AI Strategy"
  | "Operations"
  | "Leadership"
  | "Automation"
  | "Case Study"
  | "Market Trends"

export type Author = {
  name: string
  role: string // e.g. "Senior Editor", "Contributing Analyst"
  avatar?: string
}

export type Guest = {
  name: string
  role: string // e.g. "CEO"
  company: string
  avatar?: string
  bio?: string
}

export type Insight = {
  slug: string
  title: string
  excerpt: string
  body: string // markdown
  author: Author
  publishedAt: string // ISO date
  topic: Topic
  coverImage?: string
  featured?: boolean
}

export type Interview = {
  slug: string
  title: string
  excerpt: string
  guest: Guest
  qa: { question: string; answer: string }[]
  author: Author // editorial contributor who conducted/edited the interview
  publishedAt: string // ISO date
  topic: Topic
  coverImage?: string
  featured?: boolean
}

// ─── Admin types ──────────────────────────────────────────────────────────────

export type SourceType = "newsletter" | "blog" | "podcast" | "social" | "news" | "research"
export type SourceStatus = "active" | "paused" | "error"

export type Source = {
  id: string
  name: string
  url: string
  type: SourceType
  status: SourceStatus
  lastChecked: string // ISO date
  description?: string
}

export type ContentType = "insight" | "interview" | "article" | "news"
export type DraftStatus = "pending" | "generating" | "review" | "approved" | "rejected"

export type Draft = {
  id: string
  title: string
  excerpt: string
  body: string
  sourceUrl?: string
  sourceId?: string
  type: ContentType
  topic: Topic
  status: DraftStatus
  createdAt: string // ISO date
  updatedAt: string // ISO date
}

export type PostStatus = "draft" | "review" | "published" | "archived"
export type TelegramStatus = "ready" | "scheduled" | "sent" | "failed"

export type Post = {
  id: string
  title: string
  excerpt: string
  body?: string        // body_markdown — undefined for interview posts
  type: ContentType
  topic: Topic
  status: PostStatus
  slug: string
  featured?: boolean
  coverImage?: string  // cover_image_url
  publishedAt?: string // ISO date
  createdAt: string    // ISO date
  updatedAt: string    // ISO date
  telegramStatus?: TelegramStatus
}
