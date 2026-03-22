import type { Metadata } from "next"
import { BRAND } from "@/config/brand"
import AdminShell from "@/components/admin/AdminShell"

export const metadata: Metadata = {
  title: {
    default: `Admin — ${BRAND.name}`,
    template: `%s · Admin — ${BRAND.name}`,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <AdminShell>{children}</AdminShell>
}
