import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import InsightsListing from "@/components/content/InsightsListing"

export const metadata: Metadata = {
  title: `Insights — ${BRAND.name}`,
  description:
    "In-depth analysis and business intelligence on AI strategy, operations, and leadership.",
}

export default function InsightsPage() {
  return <InsightsListing />
}
