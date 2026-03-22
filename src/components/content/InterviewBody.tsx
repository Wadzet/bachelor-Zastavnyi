type QAPair = {
  question: string
  answer: string
}

type InterviewBodyProps = {
  qa: QAPair[]
}

export default function InterviewBody({ qa }: InterviewBodyProps) {
  if (qa.length === 0) {
    return <p className="text-sm text-zinc-600">No questions available.</p>
  }

  return (
    <div className="space-y-12">
      {qa.map(({ question, answer }, i) => (
        <div key={i} className="grid gap-4">
          {/* Question */}
          <div className="flex gap-4">
            <span className="mt-[3px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-amber-400">
              Q
            </span>
            <p className="text-base font-semibold leading-snug text-white">
              {question}
            </p>
          </div>
          {/* Answer */}
          <div className="flex gap-4">
            <span className="mt-[3px] shrink-0 text-[11px] font-bold uppercase tracking-widest text-zinc-600">
              A
            </span>
            <p className="text-base leading-[1.85] text-zinc-300">
              {answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
