// Shared Automated Mode types.
// Plain types only (no "server-only") so both server data-access code and the
// client AutomationClient component can import them.

export type AutomationImageProvider = "auto" | "replicate" | "gemini" | "svg"

// Automated drafts can only be insight / article / news (interviews need
// guest + Q&A data that the draft pipeline does not capture).
export type AutomationContentType = "insight" | "article" | "news"

export type AutomationSettings = {
  id:                    string
  enabled:               boolean
  defaultContentType:    AutomationContentType
  defaultTopic:          string
  defaultTextModel:      string | null
  defaultImageProvider:  AutomationImageProvider
  createPostAfterDraft:  boolean
  autoPublishWebsite:    boolean
  autoSendTelegram:      boolean
  autoSendLinkedin:      boolean
  maxSourcesPerRun:      number
  updatedAt:             string
}

export type AutomationRunStatus = "running" | "completed" | "failed" | "partial"

export type AutomationRun = {
  id:               string
  status:           AutomationRunStatus
  startedAt:        string
  completedAt:      string | null
  processedSources: number
  createdDrafts:    number
  createdPosts:     number
  errorMessage:     string | null
  metadata:         unknown
}

// Summary returned by the run API to the admin UI (safe — no secrets).
export type AutomationRunSummary = {
  runId:            string
  status:           AutomationRunStatus
  processedSources: number
  createdDrafts:    number
  createdPosts:     number
  notes:            string[]
}
