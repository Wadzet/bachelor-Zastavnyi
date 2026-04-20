import { getAdminDrafts, getAdminSources } from "@/lib/data/admin"
import DraftsClient from "@/components/admin/DraftsClient"

// Revalidate every 60 seconds — keeps the draft list fresh without a full rebuild.
export const revalidate = 60

export default async function AdminDraftsPage() {
  const [drafts, sources] = await Promise.all([
    getAdminDrafts(),
    getAdminSources(),
  ])
  return <DraftsClient drafts={drafts} sources={sources} />
}
