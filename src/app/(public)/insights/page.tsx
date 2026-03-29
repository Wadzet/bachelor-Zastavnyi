import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import InsightsListing from "@/components/content/InsightsListing"
import { getInsights } from "@/lib/data/posts"

export const metadata: Metadata = {
  title: `Insights — ${BRAND.name}`,
  description:
    "In-depth analysis and business intelligence on AI strategy, operations, and leadership.",
}

// Revalidate every 60 seconds so new published posts appear without a full rebuild.
export const revalidate = 60

export default async function InsightsPage() {
  const insights = await getInsights()
  return <InsightsListing insights={insights} />
}
