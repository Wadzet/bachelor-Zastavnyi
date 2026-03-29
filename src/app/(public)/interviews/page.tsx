import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import InterviewsListing from "@/components/content/InterviewsListing"
import { getInterviews } from "@/lib/data/posts"

export const metadata: Metadata = {
  title: `Interviews — ${BRAND.name}`,
  description:
    "Conversations with business leaders, executives, and practitioners on AI transformation.",
}

// Revalidate every 60 seconds so new published interviews appear without a full rebuild.
export const revalidate = 60

export default async function InterviewsPage() {
  const interviews = await getInterviews()
  return <InterviewsListing interviews={interviews} />
}
