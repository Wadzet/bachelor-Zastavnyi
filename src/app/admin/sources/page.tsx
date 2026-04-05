import { getAdminSources } from "@/lib/data/admin"
import SourcesClient from "@/components/admin/SourcesClient"

// Revalidate every 60 seconds — keeps the source list fresh without a full rebuild.
export const revalidate = 60

export default async function AdminSourcesPage() {
  const sources = await getAdminSources()
  return <SourcesClient sources={sources} />
}
