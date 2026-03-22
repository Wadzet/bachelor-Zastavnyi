import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import InterviewsListing from "@/components/content/InterviewsListing"

export const metadata: Metadata = {
  title: `Interviews — ${BRAND.name}`,
  description:
    "Conversations with business leaders, executives, and practitioners on AI transformation.",
}

export default function InterviewsPage() {
  return <InterviewsListing />
}
