import type { Topic } from "@/types"

type ContentHeaderProps = {
  topic: Topic
  title: string
  publishedAt: string
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(iso))
}

export default function ContentHeader({ topic, title, publishedAt }: ContentHeaderProps) {
  return (
    <header className="mb-10">
      <span className="inline-block rounded-full border border-zinc-700/50 bg-zinc-800/60 px-3 py-1 text-[11px] font-medium uppercase tracking-widest text-zinc-400">
        {topic}
      </span>
      <h1 className="mt-5 text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-tight">
        {title}
      </h1>
      <time
        dateTime={publishedAt}
        className="mt-4 block text-sm text-zinc-500"
      >
        {formatDate(publishedAt)}
      </time>
    </header>
  )
}
