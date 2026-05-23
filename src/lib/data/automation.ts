import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import type {
  AutomationSettings,
  AutomationRun,
  AutomationContentType,
  AutomationImageProvider,
} from "@/lib/automation/types"

// =============================================================================
// Automated Mode data-access layer (server-only, service role)
// =============================================================================

// ─── DB row shapes (manually typed — no generated Supabase types) ─────────────

type SettingsRow = {
  id:                       string
  enabled:                  boolean
  default_content_type:     string
  default_topic:            string
  default_text_model:       string | null
  default_image_provider:   string
  create_post_after_draft:  boolean
  auto_publish_website:     boolean
  auto_send_telegram:       boolean
  auto_send_linkedin:       boolean
  max_sources_per_run:      number
  scheduled_checks_enabled: boolean
  check_interval_minutes:   number
  last_scheduled_run_at:    string | null
  next_scheduled_run_at:    string | null
  scheduler_timezone:       string
  updated_at:               string
}

type RunRow = {
  id:                string
  status:            string
  trigger:           string
  started_at:        string
  completed_at:      string | null
  processed_sources: number
  created_drafts:    number
  created_posts:     number
  error_message:     string | null
  metadata:          unknown
}

const SETTINGS_COLUMNS =
  "id, enabled, default_content_type, default_topic, default_text_model, " +
  "default_image_provider, create_post_after_draft, auto_publish_website, " +
  "auto_send_telegram, auto_send_linkedin, max_sources_per_run, " +
  "scheduled_checks_enabled, check_interval_minutes, last_scheduled_run_at, " +
  "next_scheduled_run_at, scheduler_timezone, updated_at"

const RUN_COLUMNS =
  "id, status, trigger, started_at, completed_at, processed_sources, " +
  "created_drafts, created_posts, error_message, metadata"

// ─── Mappers ──────────────────────────────────────────────────────────────────

function mapSettings(row: SettingsRow): AutomationSettings {
  return {
    id:                     row.id,
    enabled:                row.enabled,
    defaultContentType:     row.default_content_type as AutomationContentType,
    defaultTopic:           row.default_topic,
    defaultTextModel:       row.default_text_model,
    defaultImageProvider:   row.default_image_provider as AutomationImageProvider,
    createPostAfterDraft:   row.create_post_after_draft,
    autoPublishWebsite:     row.auto_publish_website,
    autoSendTelegram:       row.auto_send_telegram,
    autoSendLinkedin:       row.auto_send_linkedin,
    maxSourcesPerRun:       row.max_sources_per_run,
    scheduledChecksEnabled: row.scheduled_checks_enabled,
    checkIntervalMinutes:   row.check_interval_minutes,
    lastScheduledRunAt:     row.last_scheduled_run_at,
    nextScheduledRunAt:     row.next_scheduled_run_at,
    schedulerTimezone:      row.scheduler_timezone,
    updatedAt:              row.updated_at,
  }
}

function mapRun(row: RunRow): AutomationRun {
  return {
    id:               row.id,
    status:           row.status as AutomationRun["status"],
    trigger:          (row.trigger as AutomationRun["trigger"]) ?? "manual",
    startedAt:        row.started_at,
    completedAt:      row.completed_at,
    processedSources: row.processed_sources,
    createdDrafts:    row.created_drafts,
    createdPosts:     row.created_posts,
    errorMessage:     row.error_message,
    metadata:         row.metadata,
  }
}

// ─── Settings ─────────────────────────────────────────────────────────────────

/**
 * Returns the single automation_settings row. If the seed row is somehow
 * missing (fresh DB before migration seed), inserts a safe default and returns it.
 */
export async function getAutomationSettings(): Promise<AutomationSettings> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("automation_settings")
    .select(SETTINGS_COLUMNS)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (data)  return mapSettings(data as unknown as SettingsRow)

  // No row — create the default singleton (safe: all switches false).
  const { data: inserted, error: insertError } = await supabase
    .from("automation_settings")
    .insert({ enabled: false })
    .select(SETTINGS_COLUMNS)
    .single()

  if (insertError) throw insertError
  return mapSettings(inserted as unknown as SettingsRow)
}

// Fields that may be patched via the settings API.
// NOTE: last_scheduled_run_at / next_scheduled_run_at are system-managed and
// intentionally NOT patchable here — see setSchedulerState().
export type AutomationSettingsPatch = {
  enabled?:                boolean
  defaultContentType?:     AutomationContentType
  defaultTopic?:           string
  defaultTextModel?:       string | null
  defaultImageProvider?:   AutomationImageProvider
  createPostAfterDraft?:   boolean
  autoPublishWebsite?:     boolean
  autoSendTelegram?:       boolean
  autoSendLinkedin?:       boolean
  maxSourcesPerRun?:       number
  scheduledChecksEnabled?: boolean
  checkIntervalMinutes?:   number
  schedulerTimezone?:      string
}

/** Update the single settings row (identified by is_singleton = true). */
export async function updateAutomationSettings(
  patch: AutomationSettingsPatch,
): Promise<AutomationSettings> {
  const supabase = getServerClient()

  // Translate camelCase patch → snake_case DB columns. Only defined keys are set.
  const dbPatch: Record<string, unknown> = {}
  if (patch.enabled               !== undefined) dbPatch.enabled                 = patch.enabled
  if (patch.defaultContentType    !== undefined) dbPatch.default_content_type    = patch.defaultContentType
  if (patch.defaultTopic          !== undefined) dbPatch.default_topic           = patch.defaultTopic
  if (patch.defaultTextModel      !== undefined) dbPatch.default_text_model      = patch.defaultTextModel
  if (patch.defaultImageProvider  !== undefined) dbPatch.default_image_provider  = patch.defaultImageProvider
  if (patch.createPostAfterDraft  !== undefined) dbPatch.create_post_after_draft = patch.createPostAfterDraft
  if (patch.autoPublishWebsite    !== undefined) dbPatch.auto_publish_website    = patch.autoPublishWebsite
  if (patch.autoSendTelegram      !== undefined) dbPatch.auto_send_telegram      = patch.autoSendTelegram
  if (patch.autoSendLinkedin      !== undefined) dbPatch.auto_send_linkedin      = patch.autoSendLinkedin
  if (patch.maxSourcesPerRun      !== undefined) dbPatch.max_sources_per_run     = patch.maxSourcesPerRun
  if (patch.scheduledChecksEnabled !== undefined) dbPatch.scheduled_checks_enabled = patch.scheduledChecksEnabled
  if (patch.checkIntervalMinutes  !== undefined) dbPatch.check_interval_minutes  = patch.checkIntervalMinutes
  if (patch.schedulerTimezone     !== undefined) dbPatch.scheduler_timezone      = patch.schedulerTimezone

  // Ensure the singleton row exists before updating.
  await getAutomationSettings()

  const { data, error } = await supabase
    .from("automation_settings")
    .update(dbPatch)
    .eq("is_singleton", true)
    .select(SETTINGS_COLUMNS)
    .single()

  if (error) throw error
  return mapSettings(data as unknown as SettingsRow)
}

/**
 * System-managed update of the scheduler's bookkeeping timestamps.
 * Called by the cron endpoint after a scheduled run — never by admin input.
 */
export async function setSchedulerState(state: {
  lastScheduledRunAt: string
  nextScheduledRunAt: string
}): Promise<void> {
  const supabase = getServerClient()
  const { error } = await supabase
    .from("automation_settings")
    .update({
      last_scheduled_run_at: state.lastScheduledRunAt,
      next_scheduled_run_at: state.nextScheduledRunAt,
    })
    .eq("is_singleton", true)

  if (error) {
    console.error("[automation] setSchedulerState error:", error.message)
    throw error
  }
}

// ─── Runs ─────────────────────────────────────────────────────────────────────

export async function getAutomationRuns(limit = 10): Promise<AutomationRun[]> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("automation_runs")
    .select(RUN_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []).map((row) => mapRun(row as unknown as RunRow))
}

export async function getLatestAutomationRun(): Promise<AutomationRun | null> {
  const supabase = getServerClient()

  const { data, error } = await supabase
    .from("automation_runs")
    .select(RUN_COLUMNS)
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null
  return mapRun(data as unknown as RunRow)
}
