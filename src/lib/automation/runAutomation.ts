import "server-only"

import { getServerClient } from "@/lib/supabase/server"
import { getAutomationSettings } from "@/lib/data/automation"
import { generateDraft } from "@/lib/drafts/generateDraft"
import { createPostFromDraft } from "@/lib/posts/createPostFromDraft"
import { generateCoverImageForPost } from "@/lib/posts/generateCoverImageForPost"
import { autoSendTelegram, autoSendLinkedIn } from "@/lib/automation/distribute"
import type { AutomationRunSummary, AutomationRunStatus } from "@/lib/automation/types"

// =============================================================================
// runAutomation — Automated Mode orchestrator (MVP)
// =============================================================================
//
// One synchronous pass over active trusted sources using the saved settings.
// NO crawling, scheduling, queues, or background workers — sources are used
// exactly as stored (source.url is fed directly to draft generation).
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
// unpublished post is never distributed. All of 2–6 default to OFF.
//
// Resilience: each source is processed in its own try/catch. One failing source
// does not abort the run. A disabled/global error returns before any work.
//
// Security: server-only. No secrets are returned or stored. The run summary and
// automation_runs.metadata contain safe notes only.
// =============================================================================

export type RunAutomationResult =
  | { ok: true;  summary: AutomationRunSummary }
  | { ok: false; status: number; message: string }

type SourceRow = { id: string; name: string; url: string }

export async function runAutomation(): Promise<RunAutomationResult> {
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
    .insert({ status: "running" })
    .select("id")
    .single()

  if (runInsertError || !runRow) {
    console.error("[runAutomation] failed to create run row:", runInsertError?.message)
    return { ok: false, status: 500, message: "Failed to start automation run." }
  }
  const runId = runRow.id as string

  // ── 3. Fetch active sources (limited) ─────────────────────────────────────
  const { data: sourceRows, error: sourcesError } = await supabase
    .from("sources")
    .select("id, name, url")
    .eq("status", "active")
    .order("last_checked_at", { ascending: true, nullsFirst: true })
    .limit(settings.maxSourcesPerRun)

  if (sourcesError) {
    console.error("[runAutomation] sources fetch error:", sourcesError.message)
    await finalizeRun(runId, "failed", 0, 0, 0, "Failed to load active sources.", [])
    return { ok: false, status: 500, message: "Failed to load active sources." }
  }

  const sources = (sourceRows ?? []) as SourceRow[]

  // ── 4. Process each source ────────────────────────────────────────────────
  const notes: string[] = []
  let processed = 0
  let createdDrafts = 0
  let createdPosts = 0
  let successes = 0
  let failures = 0

  if (sources.length === 0) {
    notes.push("No active sources to process.")
  }

  for (const source of sources) {
    processed++
    const label = source.name || source.url

    try {
      // 4.1 — Generate draft
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

      // 4.2 — Optionally promote to a post
      if (settings.createPostAfterDraft) {
        const postResult = await createPostFromDraft(draftResult.draftId, { fromAutomation: true })

        if (!postResult.ok) {
          failures++
          notes.push(`✗ ${label}: post creation failed — ${postResult.message}`)
          continue
        }

        if (!postResult.alreadyExists) createdPosts++
        notes.push(`✓ ${label}: post ${postResult.alreadyExists ? "already existed" : "created"} (review)`)

        const postId = postResult.postId

        // 4.3 — Generate a cover image (non-fatal)
        const imageResult = await generateCoverImageForPost({
          postId,
          provider: settings.defaultImageProvider,
        })
        notes.push(
          imageResult.ok
            ? `  • cover image generated (${imageResult.provider})`
            : `  • cover image skipped — ${imageResult.message}`,
        )

        // 4.4 — Optionally publish to the website
        if (settings.autoPublishWebsite) {
          const { error: publishError } = await supabase
            .from("posts")
            .update({ status: "published", published_at: new Date().toISOString() })
            .eq("id", postId)

          if (publishError) {
            failures++
            notes.push(`✗ ${label}: publish failed`)
            console.error("[runAutomation] publish error:", publishError.message)
            continue
          }
          notes.push("  • published to website")

          // 4.5 — Optionally send to Telegram (only when published)
          if (settings.autoSendTelegram) {
            const tg = await autoSendTelegram(postId)
            notes.push(`  • Telegram: ${tg.reason ?? (tg.ok ? "sent" : "failed")}`)
          }

          // 4.6 — Optionally send to LinkedIn (only when published)
          if (settings.autoSendLinkedin) {
            const li = await autoSendLinkedIn(postId)
            notes.push(`  • LinkedIn: ${li.reason ?? (li.ok ? "sent" : "failed")}`)
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

  // ── 5. Finalise the run ───────────────────────────────────────────────────
  const status: AutomationRunStatus =
    failures > 0 && successes > 0 ? "partial"
    : failures > 0                ? "failed"
    :                              "completed"

  const errorSummary =
    failures > 0 ? `${failures} of ${processed} source(s) failed.` : null

  await finalizeRun(runId, status, processed, createdDrafts, createdPosts, errorSummary, notes)

  return {
    ok: true,
    summary: {
      runId,
      status,
      processedSources: processed,
      createdDrafts,
      createdPosts,
      notes,
    },
  }
}

// ─── Helper: write the terminal run state ─────────────────────────────────────

async function finalizeRun(
  runId:        string,
  status:       AutomationRunStatus,
  processed:    number,
  drafts:       number,
  posts:        number,
  errorMessage: string | null,
  notes:        string[],
): Promise<void> {
  const supabase = getServerClient()
  const { error } = await supabase
    .from("automation_runs")
    .update({
      status,
      completed_at:      new Date().toISOString(),
      processed_sources: processed,
      created_drafts:    drafts,
      created_posts:     posts,
      error_message:     errorMessage,
      metadata:          JSON.stringify({ notes }),
    })
    .eq("id", runId)

  if (error) {
    console.error("[runAutomation] failed to finalise run:", error.message)
  }
}
