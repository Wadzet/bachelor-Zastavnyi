import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { BRAND } from "@/config/brand"
import AdminLoginForm from "@/components/admin/AdminLoginForm"
import { getAdminUser } from "@/lib/auth/admin"

export const metadata: Metadata = {
  title: `Admin Login — ${BRAND.name}`,
}

// If already authenticated as admin, skip the login page entirely.
export default async function AdminLoginPage() {
  const user = await getAdminUser()
  if (user) redirect("/admin")

  return <AdminLoginForm />
}
