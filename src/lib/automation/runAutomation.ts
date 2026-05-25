import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import { getAutomationSettings } from "@/lib/data/automation"
import { generateDraft } from "@/lib/drafts/generateDraft"
import { createPostFromDraft } from "@/lib/posts/createPostFromDraft"
import { generateCoverImageForPost } from "@/lib/posts/generateCoverImageForPost"
import { autoSendTelegram, autoSendLinkedIn } from "@/lib/automation/distribute"
import type {
  AutomationRunSummary,
  AutomationRunStatus,
  AutomationTrigger,
} from "@/lib/automation/types"

// =============================================================================
// runAutomation — Automated Mode orchestrator
// =============================================================================
//
// One synchronous pass over trusted sources using the saved settings.
// NO crawling, scheduling, queues, or background workers — sources are used
// exactly as stored (source.url is fed directly to draft generation).
//
// TRIGGER (both only ever touch active + automation-enabled sources)
//   • "manual"    — fired by an admin via "Run automation now". Processes every
//                   active, automation-enabled source, ignoring the schedule
//                   timing only. Disabled sources are NOT bypassed.
//   • "scheduled" — fired by the cron endpoint. Processes active,
//                   automation-enabled sources that are also DUE (by interval).
//
// Safe-by-default flow per source:
//   1. Generate a draft from source.url (status 'review').          [always]
//   2. Promote draft → post (status 'review', unpublished).         [if createPostAfterDraft]
//   3. Generate a cover image for the post.                         [if post created]
//   4. Publish the post to the website.                             [if autoPublishWebsite]
//   5. Send to Telegram.              [if autoPublishWebsite && autoSendTelegram]
//   6. Send to LinkedIn.              [if autoPublishWebsite && autoSendLinkedin]
//
// External distribution (5,6) is gated behind autoPublishWebsite — an
// unpublished post is never distributed. Only posts NEWLY created by this run
// are published; pre-existing posts are never auto-published. All of 2–6
// default to OFF.
//
// Resilience: each source is processed in its own try/catch. One failing source
// does not abort the run. A disabled/global error returns before any work.
//
// Security: server-only. No secrets are returned or stored. The run summary and
// automation_runs.metadata contain safe notes only.
// =============================================================================

export type RunAutomationOptions = {
  trigger?: AutomationTrigger
}

export type RunAutomationResult =
  | { ok: true;  summary: AutomationRunSummary }
  | { ok: false; status: number; message: string }

type SourceRow = {
  id:                     string
  name:                   string
  url:                    string
  automation_enabled:     boolean
  check_interval_minutes: number | null
  last_checked_at:        string | null
}

// ─── Helper: is a source due for a scheduled check? ───────────────────────────

function isSourceDue(
  source:             SourceRow,
  globalIntervalMin:  number,
  nowMs:              number,
): boolean {
  if (!source.last_checked_at) return true // never checked → always due
  const intervalMin = source.check_interval_minutes ?? globalIntervalMin
  const elapsedMin  = (nowMs - new Date(source.last_checked_at).getTime()) / 60_000
  return elapsedMin >= intervalMin
}

export async function runAutomation(
  opts: RunAutomationOptions = {},
): Promise<RunAutomationResult> {
  const trigger: AutomationTrigger = opts.trigger ?? "manual"
  const supabase = getServerClient()

  // ── 1. Load settings; refuse if disabled ──────────────────────────────────
  const settings = await getAutomationSettings()
  if (!settings.enabled) {
    return {
      ok: false,
      status: 400,
      message: "Automated mode is disabled. Enable it in the settings before running.",
    }
  }

  // ── 2. Create the run record (status 'running') ───────────────────────────
  const { data: runRow, error: runInsertError } = await supabase
    .from("automation_runs")
    .insert({ status: "running", trigger })
    .select("id")
    .single()

  if (runInsertError || !runRow) {
    console.error("[runAutomation] failed to create run row:", runInsertError?.message)
    return { ok: false, status: 500, message: "Failed to start automation run." }
  }
  const runId = runRow.id as string

  // ── 3. Fetch candidate sources (limited) ──────────────────────────────────
  // BOTH manual and scheduled runs only ever consider sources that are active
  // AND automation-enabled. Toggling automation_enabled off in /admin/sources
  // removes a source from Automated Mode entirely — a manual run does NOT
  // bypass it (manual only bypasses the schedule/interval timing).
  const { data: sourceRows, error: sourcesError } = await supabase
    .from("sources")
    .select("id, name, url, automation_enabled, check_interval_minutes, last_checked_at")
    .eq("status", "active")
    .eq("automation_enabled", true)
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(settings.maxSourcesPerRun)

  if (sourcesError) {
    console.error("[runAutomation] sources fetch error:", sourcesError.message)
    await finalizeRun(runId, "failed", emptyCounts(trigger), "Failed to load active sources.", [])
    return { ok: false, status: 500, message: "Failed to load active sources." }
  }

  const candidates = (sourceRows ?? []) as SourceRow[]

  // ── 4. Determine which sources are due ────────────────────────────────────
  const nowMs = Date.now()
  let sources: SourceRow[]
  let skippedSources: number

  if (trigger === "scheduled") {
    sources = candidates.filter((s) => isSourceDue(s, settings.checkIntervalMinutes, nowMs))
    skippedSources = candidates.length - sources.length
  } else {
    // Manual: process all active + automation-enabled sources, ignoring the
    // schedule/interval timing only (disabled sources are already filtered out).
    sources = candidates
    skippedSources = 0
  }

  // ── 5. Process each source ────────────────────────────────────────────────
  const notes: string[] = []
  let processed = 0
  let createdDrafts = 0
  let createdPosts = 0
  let publishedPosts = 0
  let imageFailures = 0
  let successes = 0
  let failures = 0

  // MVP limitation surfaced as a safe metadata note (never a raw error).
  notes.push("Note: deep listing-page crawling is not implemented (MVP) — source URLs are used directly.")

  if (trigger === "scheduled" && skippedSources > 0) {
    notes.push(`Skipped ${skippedSources} source(s) not yet due for a scheduled check.`)
  }

  if (sources.length === 0) {
    notes.push(
      trigger === "scheduled"
        ? "No sources are due for a scheduled check."
        : "No active, automation-enabled sources to process.",
    )
  }

  for (const source of sources) {
    processed++
    const label = source.name || source.url

    try {
      // 5.1 — Generate draft
      const draftResult = await generateDraft({
        mode:  "url",
        input: source.url,
        type:  settings.defaultContentType,
        topic: settings.defaultTopic,
        model: settings.defaultTextModel ?? undefined,
      })

      if (!draftResult.ok) {
        failures++
        notes.push(`✗ ${label}: draft failed — ${draftResult.message}`)
        continue
      }

      createdDrafts++
      notes.push(`✓ ${label}: draft created`)

      // Mark the source as checked (best-effort).
      await supabase
        .from("sources")
        .update({ last_checked_at: new Date().toISOString() })
        .eq("id", source.id)

      // 5.2 — Optionally promote to a post
      if (settings.createPostAfterDraft) {
        const postResult = await createPostFromDraft(draftResult.draftId, { fromAutomation: true })

        if (!postResult.ok) {
          failures++
          notes.push(`✗ ${label}: post creation failed — ${postResult.message}`)
          continue
        }

        const newlyCreated = !postResult.alreadyExists
        if (newlyCreated) createdPosts++
        notes.push(`✓ ${label}: post ${postResult.alreadyExists ? "already existed" : "created"} (review)`)

        const postId = postResult.postId

        // 5.3 — Generate a cover image (non-fatal)
        const imageResult = await generateCoverImageForPost({
          postId,
          provider: settings.defaultImageProvider,
        })
        if (imageResult.ok) {
          notes.push(`  • cover image generated (${imageResult.provider})`)
        } else {
          imageFailures++
          notes.push(`  • ⚠ cover image skipped — ${imageResult.message}`)
        }

        // 5.4 — Optionally publish to the website.
        // SAFETY: only publish posts NEWLY created by this run — never touch
        // pre-existing (e.g. manually created or earlier-run) posts.
        if (settings.autoPublishWebsite) {
          if (!newlyCreated) {
            notes.push("  • publish skipped — post not created by this run")
          } else {
            const { error: publishError } = await supabase
              .from("posts")
              .update({ status: "published", published_at: new Date().toISOString() })
              .eq("id", postId)
              .eq("status", "review") // guard: only flip review → published

            if (publishError) {
              failures++
              notes.push(`✗ ${label}: publish failed`)
              console.error("[runAutomation] publish error:", publishError.message)
              continue
            }
            publishedPosts++
            notes.push("  • published to website")

            // 5.5 — Optionally send to Telegram (only when published)
            if (settings.autoSendTelegram) {
              const tg = await autoSendTelegram(postId)
              notes.push(`  • Telegram: ${tg.reason ?? (tg.ok ? "sent" : "failed")}`)
            }

            // 5.6 — Optionally send to LinkedIn (only when published)
            if (settings.autoSendLinkedin) {
              const li = await autoSendLinkedIn(postId)
              notes.push(`  • LinkedIn: ${li.reason ?? (li.ok ? "sent" : "failed")}`)
            }
          }
        }
      }

      successes++
    } catch (err) {
      failures++
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`[runAutomation] source ${source.id} error:`, msg)
      notes.push(`✗ ${label}: unexpected error`)
    }
  }

  // ── 6. Finalise the run ───────────────────────────────────────────────────
  const status: AutomationRunStatus =
    failures > 0 && successes > 0 ? "partial"
    : failures > 0                ? "failed"
    :                              "completed"

  const errorSummary =
    failures > 0 ? `${failures} of ${processed} source(s) failed.` : null

  const counts: RunCounts = {
    trigger,
    dueSources:              sources.length,
    skippedSources,
    processedSources:        processed,
    createdDrafts,
    createdPosts,
    publishedPosts,
    imageGenerationFailures: imageFailures,
  }

  await finalizeRun(runId, status, counts, errorSummary, notes)

  return {
    ok: true,
    summary: {
      runId,
      status,
      trigger,
      dueSources:              sources.length,
      skippedSources,
      processedSources:        processed,
      createdDrafts,
      createdPosts,
      publishedPosts,
      imageGenerationFailures: imageFailures,
      notes,
    },
  }
}

// ─── Helper: terminal run state ───────────────────────────────────────────────

type RunCounts = {
  trigger:                 AutomationTrigger
  dueSources:              number
  skippedSources:          number
  processedSources:        number
  createdDrafts:           number
  createdPosts:            number
  publishedPosts:          number
  imageGenerationFailures: number
}

function emptyCounts(trigger: AutomationTrigger): RunCounts {
  return {
    trigger,
    dueSources:              0,
    skippedSources:          0,
    processedSources:        0,
    createdDrafts:           0,
    createdPosts:            0,
    publishedPosts:          0,
    imageGenerationFailures: 0,
  }
}

async function finalizeRun(
  runId:        string,
  status:       AutomationRunStatus,
  counts:       RunCounts,
  errorMessage: string | null,
  notes:        string[],
): Promise<void> {
  const supabase = getServerClient()
  const { error } = await supabase
    .from("automation_runs")
    .update({
      status,
      completed_at:      new Date().toISOString(),
      processed_sources: counts.processedSources,
      created_drafts:    counts.createdDrafts,
      created_posts:     counts.createdPosts,
      error_message:     errorMessage,
      metadata:          JSON.stringify({
        trigger:                 counts.trigger,
        dueSources:              counts.dueSources,
        skippedSources:          counts.skippedSources,
        processedSources:        counts.processedSources,
        createdDrafts:           counts.createdDrafts,
        createdPosts:            counts.createdPosts,
        publishedPosts:          counts.publishedPosts,
        imageGenerationFailures: counts.imageGenerationFailures,
        notes,
      }),
    })
    .eq("id", runId)

  if (error) {
    console.error("[runAutomation] failed to finalise run:", error.message)
  }
}
