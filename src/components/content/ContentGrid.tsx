// TODO: Implement responsive grid/list wrapper
// Used in: Insights index, Interviews index
// Wraps ContentCard or InterviewCard in a responsive grid layout

type ContentGridProps = {
  children: React.ReactNode
}

export default function ContentGrid({ children }: ContentGridProps) {
  return (
    <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </div>
  )
}
