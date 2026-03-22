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
