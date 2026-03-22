import type { ReactNode } from "react"

type ArticleBodyProps = {
  body: string
}

function parseBody(body: string): ReactNode[] {
  return body
    .split(/\n\n+/)
    .map((block, i) => {
      const trimmed = block.trim()
      if (!trimmed) return null

      if (trimmed.startsWith("## ")) {
        return (
          <h2
            key={i}
            className="mt-12 mb-4 text-xl font-bold tracking-tight text-white"
          >
            {trimmed.slice(3)}
          </h2>
        )
      }

      if (trimmed.startsWith("### ")) {
        return (
          <h3
            key={i}
            className="mt-8 mb-3 text-base font-semibold text-white"
          >
            {trimmed.slice(4)}
          </h3>
        )
      }

      return (
        <p key={i} className="leading-[1.85] text-zinc-300">
          {trimmed}
        </p>
      )
    })
    .filter(Boolean) as ReactNode[]
}

export default function ArticleBody({ body }: ArticleBodyProps) {
  return (
    <div className="space-y-6 text-base">
      {parseBody(body)}
    </div>
  )
}
