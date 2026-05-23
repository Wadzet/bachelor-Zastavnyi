"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import type {
  AutomationSettings,
  AutomationRun,
  AutomationRunSummary,
  AutomationContentType,
  AutomationImageProvider,
} from "@/lib/automation/types"

// =============================================================================
// AutomationClient — Automated Mode admin console
// =============================================================================
//
// Renders four sections:
//   1. Status card with the master enable toggle + "Run automation now".
//   2. Editorial vs Automated explanation.
//   3. Settings form (content defaults + clearly-warned external switches).
//   4. Recent run history.
//
// All network calls go through the admin-only API routes. No secrets ever
// reach this component — it only sends/receives safe settings + run summaries.
// =============================================================================

const CONTENT_TYPES: { value: AutomationContentType; label: string }[] = [
  { value: "insight", label: "Insight" },
  { value: "article", label: "Article" },
  { value: "news",    label: "News"    },
]

const TOPICS = [
  "AI Strategy",
  "Operations",
  "Automation",
  "Market Trends",
  "Leadership",
  "Case Study",
] as const

const TEXT_MODELS = [
  { value: "",                     label: "Default (recommended)" },
  { value: "gemini-2.5-flash-lite", label: "gemini-2.5-flash-lite" },
  { value: "gemini-2.5-flash",      label: "gemini-2.5-flash"      },
] as const

const IMAGE_PROVIDERS: { value: AutomationImageProvider; label: string }[] = [
  { value: "auto",      label: "Auto (recommended)" },
  { value: "replicate", label: "Replicate (FLUX)"    },
  { value: "gemini",    label: "Gemini"              },
  { value: "svg",       label: "SVG placeholder"     },
]

const INTERVAL_OPTIONS: { value: number; label: string }[] = [
  { value: 15,   label: "Every 15 minutes" },
  { value: 30,   label: "Every 30 minutes" },
  { value: 60,   label: "Every hour"       },
  { value: 180,  label: "Every 3 hours"    },
  { value: 360,  label: "Every 6 hours"    },
  { value: 720,  label: "Every 12 hours"   },
  { value: 1440, label: "Every 24 hours"   },
]

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-800/60 px-3 py-2 text-sm text-white " +
  "placeholder-zinc-600 focus:border-amber-400/50 focus:outline-none focus:ring-1 " +
  "focus:ring-amber-400/30 disabled:opacity-50"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true,
  }).format(new Date(iso))
}

function runStatusClasses(status: AutomationRun["status"]): string {
  switch (status) {
    case "completed": return "bg-emerald-400/10 text-emerald-400"
    case "partial":   return "bg-amber-400/10 text-amber-400"
    case "failed":    return "bg-red-400/10 text-red-400"
    default:          return "bg-zinc-400/10 text-zinc-400" // running
  }
}

type RunMeta = {
  publishedPosts?:          number
  skippedSources?:          number
  imageGenerationFailures?: number
  notes:                    string[]
}

function parseRunMeta(metadata: unknown): RunMeta {
  try {
    const parsed = typeof metadata === "string" ? JSON.parse(metadata) : metadata
    if (parsed && typeof parsed === "object") {
      const obj   = parsed as Record<string, unknown>
      const notes = Array.isArray(obj.notes) ? obj.notes.map(String) : []
      return {
        publishedPosts:          typeof obj.publishedPosts === "number" ? obj.publishedPosts : undefined,
        skippedSources:          typeof obj.skippedSources === "number" ? obj.skippedSources : undefined,
        imageGenerationFailures: typeof obj.imageGenerationFailures === "number" ? obj.imageGenerationFailures : undefined,
        notes,
      }
    }
  } catch {
    // ignore malformed metadata
  }
  return { notes: [] }
}

function triggerClasses(trigger: string): string {
  return trigger === "scheduled"
    ? "bg-sky-400/10 text-sky-400"
    : "bg-zinc-400/10 text-zinc-400"
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AutomationClient({
  initialSettings,
  initialRuns,
}: {
  initialSettings: AutomationSettings
  initialRuns:     AutomationRun[]
}) {
  const router = useRouter()

  const [settings, setSettings] = useState<AutomationSettings>(initialSettings)
  const runs = initialRuns

  const [saving,  setSaving]  = useState(false)
  const [running, setRunning] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [notice,  setNotice]  = useState<string | null>(null)
  const [lastSummary, setLastSummary] = useState<AutomationRunSummary | null>(null)
  const [expandedRun, setExpandedRun] = useState<string | null>(null)

  function set<K extends keyof AutomationSettings>(key: K, value: AutomationSettings[K]) {
    setSettings((s) => ({ ...s, [key]: value }))
  }

  // ── Persist settings ──────────────────────────────────────────────────────
  async function saveSettings(patch: Partial<AutomationSettings>) {
    setSaving(true)
    setError(null)
    setNotice(null)
    try {
      const res = await fetch("/api/admin/automation/settings", {
        method:  "PUT",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(patch),
      })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "Failed to save settings.")
      }
      setSettings(data.settings as AutomationSettings)
      setNotice("Settings saved.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save settings.")
    } finally {
      setSaving(false)
    }
  }

  // ── Toggle the master switch immediately ──────────────────────────────────
  async function toggleEnabled(next: boolean) {
    set("enabled", next)
    await saveSettings({ enabled: next })
  }

  // ── Scheduling controls (immediate save) ──────────────────────────────────
  async function toggleScheduledChecks(next: boolean) {
    set("scheduledChecksEnabled", next)
    await saveSettings({ scheduledChecksEnabled: next })
  }

  async function changeInterval(next: number) {
    set("checkIntervalMinutes", next)
    await saveSettings({ checkIntervalMinutes: next })
  }

  // ── Save the full settings form ───────────────────────────────────────────
  async function onSaveForm(e: React.FormEvent) {
    e.preventDefault()
    await saveSettings({
      defaultContentType:   settings.defaultContentType,
      defaultTopic:         settings.defaultTopic,
      defaultTextModel:     settings.defaultTextModel,
      defaultImageProvider: settings.defaultImageProvider,
      createPostAfterDraft: settings.createPostAfterDraft,
      autoPublishWebsite:   settings.autoPublishWebsite,
      autoSendTelegram:     settings.autoSendTelegram,
      autoSendLinkedin:     settings.autoSendLinkedin,
      maxSourcesPerRun:     settings.maxSourcesPerRun,
    })
  }

  // ── Run automation now ────────────────────────────────────────────────────
  async function runNow() {
    setRunning(true)
    setError(null)
    setNotice(null)
    setLastSummary(null)
    try {
      const res = await fetch("/api/admin/automation/run", { method: "POST" })
      const data = await res.json()
      if (!res.ok || !data.success) {
        throw new Error(data.message ?? "Automation run failed.")
      }
      setLastSummary(data.summary as AutomationRunSummary)
      setNotice("Automation run finished.")
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Automation run failed.")
    } finally {
      setRunning(false)
    }
  }

  const busy = saving || running

  return (
    <div className="space-y-8">

      {/* ── Heading ─────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-bold text-white">Automated Mode</h2>
        <p className="mt-1 text-sm text-zinc-500">
          Generate AI drafts from your active trusted sources with one click — safely, under your control.
        </p>
      </div>

      {/* ── Alerts ──────────────────────────────────────── */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {notice && !error && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          {notice}
        </div>
      )}

      {/* ── Status card ─────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className={[
                  "inline-block h-2.5 w-2.5 rounded-full",
                  settings.enabled ? "bg-emerald-400" : "bg-zinc-600",
                ].join(" ")}
                aria-hidden="true"
              />
              <span className="text-sm font-semibold text-white">
                Automated Mode is {settings.enabled ? "enabled" : "disabled"}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">
              {settings.enabled
                ? "You can run automation manually below. No content is published or distributed unless you turn those options on."
                : "Enable Automated Mode to allow manual runs. Editorial Mode is unaffected and always available."}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {/* Enable toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={settings.enabled}
              disabled={busy}
              onClick={() => toggleEnabled(!settings.enabled)}
              className={[
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-50",
                settings.enabled ? "bg-emerald-500" : "bg-zinc-700",
              ].join(" ")}
            >
              <span
                className={[
                  "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150",
                  settings.enabled ? "translate-x-6" : "translate-x-1",
                ].join(" ")}
              />
            </button>

            <button
              type="button"
              onClick={runNow}
              disabled={busy || !settings.enabled}
              className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {running ? "Running…" : "Run automation now"}
            </button>
          </div>
        </div>

        {/* Last run summary */}
        {lastSummary && (
          <div className="mt-5 rounded-lg border border-zinc-800 bg-zinc-950/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
              Last run result
            </p>
            <p className="mt-2 text-sm text-zinc-300">
              Status <span className="font-medium text-white">{lastSummary.status}</span>
              {" · "}trigger <span className="font-medium text-white">{lastSummary.trigger}</span>
              {" · "}{lastSummary.processedSources} processed
              {" · "}{lastSummary.createdDrafts} draft(s)
              {" · "}{lastSummary.createdPosts} post(s)
              {" · "}{lastSummary.publishedPosts} published
              {lastSummary.skippedSources > 0 ? ` · ${lastSummary.skippedSources} skipped` : ""}
              {lastSummary.imageGenerationFailures > 0 ? ` · ${lastSummary.imageGenerationFailures} image warning(s)` : ""}
            </p>
            {lastSummary.notes.length > 0 && (
              <ul className="mt-3 space-y-1">
                {lastSummary.notes.map((note, i) => (
                  <li key={i} className="font-mono text-xs text-zinc-500">{note}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* ── Scheduled source checking ───────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white">Scheduled source checking</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-500">
              When enabled, due sources are checked automatically on the interval below. A periodic
              cron call decides timing from these settings — <span className="text-zinc-300">“Run automation now”</span>{" "}
              is a manual run, <span className="text-zinc-300">“Scheduled checks”</span> are automatic.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.scheduledChecksEnabled}
            aria-label="Enable scheduled checks"
            disabled={busy || !settings.enabled}
            onClick={() => toggleScheduledChecks(!settings.scheduledChecksEnabled)}
            className={[
              "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-40",
              settings.scheduledChecksEnabled ? "bg-emerald-500" : "bg-zinc-700",
            ].join(" ")}
          >
            <span
              className={[
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150",
                settings.scheduledChecksEnabled ? "translate-x-6" : "translate-x-1",
              ].join(" ")}
            />
          </button>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Check interval</span>
            <select
              className={inputCls}
              value={settings.checkIntervalMinutes}
              disabled={busy || !settings.enabled}
              onChange={(e) => changeInterval(parseInt(e.target.value, 10))}
            >
              {INTERVAL_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </label>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div>
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">Status</span>
              <span
                className={[
                  "inline-flex items-center rounded-full px-2 py-1 text-[11px] font-semibold",
                  settings.enabled && settings.scheduledChecksEnabled
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-zinc-400/10 text-zinc-400",
                ].join(" ")}
              >
                {settings.enabled && settings.scheduledChecksEnabled ? "Active" : "Inactive"}
              </span>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">Last scheduled run</span>
              <span className="text-xs text-zinc-300">
                {settings.lastScheduledRunAt ? formatDate(settings.lastScheduledRunAt) : "—"}
              </span>
            </div>
            <div>
              <span className="mb-1.5 block text-xs font-medium text-zinc-400">Next scheduled run</span>
              <span className="text-xs text-zinc-300">
                {settings.nextScheduledRunAt ? formatDate(settings.nextScheduledRunAt) : "—"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <p className="text-xs leading-relaxed text-amber-200/80">
            Scheduled checks only create content according to the selected workflow settings below.
            Telegram and LinkedIn distribution remain disabled unless explicitly enabled.
          </p>
        </div>
      </div>

      {/* ── Editorial vs Automated ──────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm font-semibold text-white">Editorial Mode (manual)</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            You drive every step: pick a URL or text, choose the content type, topic, AI model and image
            provider, review and edit the draft, then publish and distribute each post yourself. Nothing here
            changes — it is always available from Sources, Drafts and Posts.
          </p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
          <p className="text-sm font-semibold text-white">Automated Mode (assisted)</p>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            One click generates AI drafts from your active sources using the defaults below. By default it
            <span className="text-zinc-300"> only creates drafts in review</span> — it does not publish or
            distribute. You stay in control: drafts still need your approval before going live.
          </p>
        </div>
      </div>

      {/* ── Settings form ───────────────────────────────── */}
      <form onSubmit={onSaveForm} className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 space-y-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Default settings for automated runs
        </p>

        {/* Content defaults */}
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Content type</span>
            <select
              className={inputCls}
              value={settings.defaultContentType}
              disabled={busy}
              onChange={(e) => set("defaultContentType", e.target.value as AutomationContentType)}
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Topic</span>
            <select
              className={inputCls}
              value={settings.defaultTopic}
              disabled={busy}
              onChange={(e) => set("defaultTopic", e.target.value)}
            >
              {TOPICS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Text model</span>
            <select
              className={inputCls}
              value={settings.defaultTextModel ?? ""}
              disabled={busy}
              onChange={(e) => set("defaultTextModel", e.target.value === "" ? null : e.target.value)}
            >
              {TEXT_MODELS.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Image provider</span>
            <select
              className={inputCls}
              value={settings.defaultImageProvider}
              disabled={busy}
              onChange={(e) => set("defaultImageProvider", e.target.value as AutomationImageProvider)}
            >
              {IMAGE_PROVIDERS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-zinc-400">Max sources per run (1–20)</span>
            <input
              type="number"
              min={1}
              max={20}
              className={inputCls}
              value={settings.maxSourcesPerRun}
              disabled={busy}
              onChange={(e) => {
                const n = parseInt(e.target.value, 10)
                set("maxSourcesPerRun", Number.isNaN(n) ? 1 : Math.min(20, Math.max(1, n)))
              }}
            />
          </label>
        </div>

        {/* Safe step: create posts */}
        <div className="space-y-3 border-t border-zinc-800 pt-5">
          <ToggleRow
            label="Create a post after each draft"
            description="Promotes each generated draft into a post in review (still unpublished). Safe — nothing goes live."
            checked={settings.createPostAfterDraft}
            disabled={busy}
            onChange={(v) => set("createPostAfterDraft", v)}
          />
        </div>

        {/* Danger zone: publishing + distribution */}
        <div className="space-y-4 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">
            Publishing &amp; distribution — off by default
          </p>
          <p className="text-xs leading-relaxed text-amber-200/80">
            These options publish content publicly and send it to external channels automatically. Leave them
            off unless you fully trust your sources and defaults. Distribution only happens when a post is also
            auto-published.
          </p>

          <ToggleRow
            label="Auto-publish posts to the website"
            description="Publishes created posts to the public site immediately, without manual review."
            checked={settings.autoPublishWebsite}
            disabled={busy || !settings.createPostAfterDraft}
            warn
            onChange={(v) => set("autoPublishWebsite", v)}
          />
          <ToggleRow
            label="Auto-send to Telegram"
            description="Sends each auto-published post to your Telegram channel. Requires auto-publish."
            checked={settings.autoSendTelegram}
            disabled={busy || !settings.autoPublishWebsite}
            warn
            onChange={(v) => set("autoSendTelegram", v)}
          />
          <ToggleRow
            label="Auto-send to LinkedIn"
            description="Posts each auto-published post to LinkedIn. Requires auto-publish."
            checked={settings.autoSendLinkedin}
            disabled={busy || !settings.autoPublishWebsite}
            warn
            onChange={(v) => set("autoSendLinkedin", v)}
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="submit"
            disabled={busy}
            className="rounded-lg bg-amber-400 px-4 py-2 text-sm font-semibold text-zinc-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        </div>
      </form>

      {/* ── Run history ─────────────────────────────────── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
        <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Recent runs
        </p>

        {runs.length === 0 ? (
          <p className="text-sm text-zinc-600">No automation runs yet.</p>
        ) : (
          <ul role="list" className="space-y-0">
            {runs.map((run) => {
              const meta  = parseRunMeta(run.metadata)
              const notes = meta.notes
              const open  = expandedRun === run.id
              return (
                <li key={run.id} className="border-b border-zinc-800/60 py-3 last:border-0">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={["rounded-full px-2 py-0.5 text-[11px] font-semibold", runStatusClasses(run.status)].join(" ")}>
                          {run.status}
                        </span>
                        <span className={["rounded-full px-2 py-0.5 text-[11px] font-semibold", triggerClasses(run.trigger)].join(" ")}>
                          {run.trigger}
                        </span>
                        <span className="text-xs text-zinc-500">{formatDate(run.startedAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-zinc-500">
                        {run.processedSources} source(s) · {run.createdDrafts} draft(s) · {run.createdPosts} post(s)
                        {typeof meta.publishedPosts === "number" ? ` · ${meta.publishedPosts} published` : ""}
                        {typeof meta.skippedSources === "number" && meta.skippedSources > 0 ? ` · ${meta.skippedSources} skipped` : ""}
                        {typeof meta.imageGenerationFailures === "number" && meta.imageGenerationFailures > 0 ? ` · ${meta.imageGenerationFailures} image warning(s)` : ""}
                        {run.errorMessage ? ` · ${run.errorMessage}` : ""}
                      </p>
                    </div>
                    {notes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setExpandedRun(open ? null : run.id)}
                        className="shrink-0 text-xs text-amber-400 hover:text-amber-300"
                      >
                        {open ? "Hide notes" : "Show notes"}
                      </button>
                    )}
                  </div>
                  {open && notes.length > 0 && (
                    <ul className="mt-3 space-y-1 rounded-lg bg-zinc-950/40 p-3">
                      {notes.map((note, i) => (
                        <li key={i} className="font-mono text-xs text-zinc-500">{note}</li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// ─── Toggle row ───────────────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  disabled,
  warn,
  onChange,
}: {
  label:       string
  description: string
  checked:     boolean
  disabled?:   boolean
  warn?:       boolean
  onChange:    (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className={["text-sm font-medium", warn ? "text-amber-100" : "text-white"].join(" ")}>{label}</p>
        <p className="mt-0.5 text-xs leading-relaxed text-zinc-500">{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={[
          "relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-150 disabled:opacity-40",
          checked ? (warn ? "bg-amber-500" : "bg-emerald-500") : "bg-zinc-700",
        ].join(" ")}
      >
        <span
          className={[
            "inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-150",
            checked ? "translate-x-6" : "translate-x-1",
          ].join(" ")}
        />
      </button>
    </div>
  )
}
