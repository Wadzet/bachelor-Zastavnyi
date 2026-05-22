import { NextResponse }        from "next/server"
import { requireAdminApiAuth } from "@/lib/auth/admin"
import { runAutomation }       from "@/lib/automation/runAutomation"

// POST /api/admin/automation/run
//
// Triggers one synchronous Automated Mode pass (no crawling / queues / cron).
// Thin HTTP wrapper around the reusable runAutomation() orchestrator
// (src/lib/automation/runAutomation.ts).
//
// Requires admin auth. The orchestrator refuses to run when Automated Mode is
// disabled (returns 400). All API keys / tokens stay server-side; the returned
// summary contains safe notes only — never secrets or raw provider errors.
//
// Success: { success: true, summary }
// Error:   { success: false, message }

export async function POST() {
  const authError = await requireAdminApiAuth()
  if (authError) return authError

  const result = await runAutomation()

  if (!result.ok) {
    return NextResponse.json(
      { success: false, message: result.message },
      { status: result.status },
    )
  }

  return NextResponse.json(
    { success: true, summary: result.summary },
    { status: 200 },
  )
}
