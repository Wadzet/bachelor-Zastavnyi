import type { Topic } from "@/types"

export const ALL_TOPICS: Topic[] = [
  "AI Strategy",
  "Operations",
  "Leadership",
  "Automation",
  "Case Study",
  "Market Trends",
]

type FilterPillsProps = {
  active: Topic | "All"
  onChange: (topic: Topic | "All") => void
}

export default function FilterPills({ active, onChange }: FilterPillsProps) {
  const pills: (Topic | "All")[] = ["All", ...ALL_TOPICS]

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {pills.map((topic) => (
        <button
          key={topic}
          type="button"
          onClick={() => onChange(topic)}
          className={[
            "shrink-0 rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-150",
            active === topic
              ? "bg-amber-400 text-zinc-950"
              : "border border-zinc-700 bg-zinc-800 text-zinc-400 hover:border-zinc-600 hover:text-white",
          ].join(" ")}
        >
          {topic}
        </button>
      ))}
    </div>
  )
}
