type StatCardProps = {
  label: string
  value: string | number
  description?: string
  trend?: string
}

export default function StatCard({ label, value, description, trend }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">
        {label}
      </p>
      <p className="mt-3 text-4xl font-bold tracking-tight text-white">
        {value}
      </p>
      {description && (
        <p className="mt-1.5 text-xs leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
      {trend && (
        <p className="mt-3 text-xs font-medium text-amber-400">
          {trend}
        </p>
      )}
    </div>
  )
}
