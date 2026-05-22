import type { Metadata } from "next"
import { getAutomationSettings, getAutomationRuns } from "@/lib/data/automation"
import AutomationClient from "@/components/admin/AutomationClient"

export const metadata: Metadata = {
  title: "Automated Mode",
}

// Always render fresh — settings and run history change on admin action.
export const dynamic = "force-dynamic"

export default async function AdminAutomationPage() {
  const [settings, runs] = await Promise.all([
    getAutomationSettings(),
    getAutomationRuns(10),
  ])

  return <AutomationClient initialSettings={settings} initialRuns={runs} />
}
