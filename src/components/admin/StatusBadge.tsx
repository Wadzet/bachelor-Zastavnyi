import type { SourceStatus, DraftStatus, PostStatus, TelegramStatus, LinkedInStatus } from "@/types"

type AnyStatus = SourceStatus | DraftStatus | PostStatus | TelegramStatus

type StatusConfig = {
  label: string
  className: string
}

// ─── Telegram / generic channel statuses ──────────────────────────────────────
// "ready", "scheduled", "sent", "failed" values are shared by both channels,
// so this table uses explicit "TG" prefixes for Telegram-specific entries.

const statusConfig: Record<AnyStatus, StatusConfig> = {
  // SourceStatus
  active:     { label: "Active",      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  paused:     { label: "Paused",      className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  error:      { label: "Error",       className: "border-red-400/20 bg-red-400/10 text-red-400" },
  // DraftStatus
  pending:    { label: "Pending",     className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  generating: { label: "Generating",  className: "border-blue-400/20 bg-blue-400/10 text-blue-400" },
  review:     { label: "Review",      className: "border-amber-400/20 bg-amber-400/10 text-amber-400" },
  approved:   { label: "Approved",    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  rejected:   { label: "Rejected",    className: "border-red-400/20 bg-red-400/10 text-red-400" },
  // PostStatus ("draft" is a post-level state, distinct from DraftStatus)
  draft:      { label: "Draft",       className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  published:  { label: "Published",   className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  archived:   { label: "Archived",    className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  // TelegramStatus — prefixed "TG" to distinguish from LinkedIn badges
  ready:      { label: "TG Ready",    className: "border-amber-400/20 bg-amber-400/10 text-amber-400" },
  scheduled:  { label: "Scheduled",   className: "border-blue-400/20 bg-blue-400/10 text-blue-400" },
  sent:       { label: "TG Sent",     className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  failed:     { label: "Failed",      className: "border-red-400/20 bg-red-400/10 text-red-400" },
}

// ─── LinkedIn-specific channel statuses ───────────────────────────────────────
// Identical value strings to TelegramStatus but separate labels and sky styling.
// Used when StatusBadge receives channel="linkedin".

const linkedInStatusConfig: Record<LinkedInStatus, StatusConfig> = {
  ready:     { label: "LI Ready",     className: "border-sky-400/20 bg-sky-400/10 text-sky-400" },
  scheduled: { label: "LI Scheduled", className: "border-sky-400/20 bg-sky-400/10 text-sky-400" },
  sent:      { label: "LI Sent",      className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  failed:    { label: "LI Failed",    className: "border-red-400/20 bg-red-400/10 text-red-400" },
}

// ─── Component ────────────────────────────────────────────────────────────────

type StatusBadgeProps = {
  status:   AnyStatus
  // Pass channel="linkedin" when rendering a LinkedIn distribution badge.
  // Omit (or pass "telegram") for all other status types.
  channel?: "telegram" | "linkedin"
}

export default function StatusBadge({ status, channel }: StatusBadgeProps) {
  const config =
    channel === "linkedin" && status in linkedInStatusConfig
      ? linkedInStatusConfig[status as LinkedInStatus]
      : statusConfig[status]

  const { label, className } = config
  return (
    <span
      className={[
        "inline-flex shrink-0 items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className,
      ].join(" ")}
    >
      {label}
    </span>
  )
}
