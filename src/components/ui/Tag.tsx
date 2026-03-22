import type { Topic } from "@/types"

type TagProps = {
  topic: Topic
  className?: string
}

export default function Tag({ topic, className = "" }: TagProps) {
  return (
    <span
      className={[
        "inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-zinc-600",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {topic}
    </span>
  )
}
