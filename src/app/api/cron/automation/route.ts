import { NextResponse } from "next/server"
import { getAutomationSettings, setSchedulerState } from "@/lib/data/automation"
import { runAutomation } from "@/lib/automation/runAutomation"

// =============================================================================
// GET /api/cron/automation — scheduled Automated Mode trigger
// =============================================================================
//
// Designed to be called periodically by Vercel Cron (see vercel.json) or any
// external cron service. Vercel Cron automatically attaches
//   Authorization: Bearer <CRON_SECRET>
// when the CRON_SECRET env var is configured for the project.
//
// The endpoint is intentionally NOT behind admin auth (cron has no session).
// It is protected ONLY by CRON_SECRET. If CRON_SECRET is unset, the endpoint
// refuses to run — there is no unauthenticated fallback.
//
// Timing is decided HERE, from the database, not from the static cron schedule:
// Vercel may call this on a fixed schedule (daily on Hobby, more often on paid
// plans); the app runs automation only
// when scheduled checks are enabled AND the configured interval has elapsed.
//
// Security: server-only. CRON_SECRET and all provider tokens stay server-side
// and are never returned to the caller. Responses contain safe summaries only.
// =============================================================================

export const dynamic = "force-dynamic"

function unauthorized(message: string, status: number) {
  return NextResponse.json({ ok: false, ran: false, message }, { status })
}

export async function GET(request: Request) {
  // ── 1. Authorisation: require Bearer CRON_SECRET ──────────────────────────
  const secret = process.env.CRON_SECRET
  if (!secret) {
    // Misconfiguration — never run unauthenticated.
    console.error("[cron/automation] CRON_SECRET is not set; refusing to run.")
    return unauthorized("Cron endpoint is not configured.", 503)
  }

  const authHeader = request.headers.get("authorization") ?? ""
  const provided   = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
  if (provided !== secret) {
    return unauthorized("Unauthorized.", 401)
  }

  // ── 2. Load settings ──────────────────────────────────────────────────────
  let settings
  try {
    settings = await getAutomationSettings()
  } catch (err) {
    console.error("[cron/automation] settings load error:", err instanceof Error ? err.message : err)
    return NextResponse.json({ ok: false, ran: false, message: "Failed to load settings." }, { status: 500 })
  }

  // ── 3. Gate checks — all skips return 200 (cron success, just nothing to do) ─
  if (!settings.enabled) {
    return NextResponse.json({ ok: true, ran: false, skipped: "Automated mode is disabled." })
  }
  if (!settings.scheduledChecksEnabled) {
    return NextResponse.json({ ok: true, ran: false, skipped: "Scheduled checks are disabled." })
  }

  const now = Date.now()
  if (settings.nextScheduledRunAt && now < new Date(settings.nextScheduledRunAt).getTime()) {
    return NextResponse.json({
      ok:                true,
      ran:               false,
      skipped:           "Not yet due for a scheduled run.",
      nextScheduledRunAt: settings.nextScheduledRunAt,
    })
  }

  // ── 4. Due — run automation as a scheduled trigger ────────────────────────
  const result = await runAutomation({ trigger: "scheduled" })

  // ── 5. Advance the scheduler clock regardless of run outcome ──────────────
  // (Prevents a failing run from hot-looping on every cron tick.)
  const nowIso  = new Date().toISOString()
  const nextIso = new Date(now + settings.checkIntervalMinutes * 60_000).toISOString()
  try {
    await setSchedulerState({ lastScheduledRunAt: nowIso, nextScheduledRunAt: nextIso })
  } catch {
    // Already logged in setSchedulerState; the run itself still succeeded/failed on its own.
  }

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, ran: false, message: result.message, nextScheduledRunAt: nextIso },
      { status: result.status },
    )
  }

  return NextResponse.json({
    ok:                 true,
    ran:                true,
    summary:            result.summary,
    lastScheduledRunAt: nowIso,
    nextScheduledRunAt: nextIso,
  })
}
