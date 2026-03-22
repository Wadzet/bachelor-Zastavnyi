import type { SourceStatus, DraftStatus, PostStatus, TelegramStatus } from "@/types"

type AnyStatus = SourceStatus | DraftStatus | PostStatus | TelegramStatus

type StatusConfig = {
  label: string
  className: string
}

const statusConfig: Record<AnyStatus, StatusConfig> = {
  // SourceStatus
  active:     { label: "Active",     className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  paused:     { label: "Paused",     className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  error:      { label: "Error",      className: "border-red-400/20 bg-red-400/10 text-red-400" },
  // DraftStatus
  pending:    { label: "Pending",    className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  generating: { label: "Generating", className: "border-blue-400/20 bg-blue-400/10 text-blue-400" },
  review:     { label: "Review",     className: "border-amber-400/20 bg-amber-400/10 text-amber-400" },
  approved:   { label: "Approved",   className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  rejected:   { label: "Rejected",   className: "border-red-400/20 bg-red-400/10 text-red-400" },
  // PostStatus ("draft" is different from DraftStatus — it's a post-level state)
  draft:      { label: "Draft",      className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  published:  { label: "Published",  className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  archived:   { label: "Archived",   className: "border-zinc-700 bg-zinc-800 text-zinc-400" },
  // TelegramStatus
  ready:      { label: "TG Ready",   className: "border-amber-400/20 bg-amber-400/10 text-amber-400" },
  scheduled:  { label: "Scheduled",  className: "border-blue-400/20 bg-blue-400/10 text-blue-400" },
  sent:       { label: "TG Sent",    className: "border-emerald-400/20 bg-emerald-400/10 text-emerald-400" },
  failed:     { label: "Failed",     className: "border-red-400/20 bg-red-400/10 text-red-400" },
}

type StatusBadgeProps = {
  status: AnyStatus
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const { label, className } = statusConfig[status]
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
