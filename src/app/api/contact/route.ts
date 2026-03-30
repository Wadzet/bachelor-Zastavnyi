import { NextResponse } from "next/server"
import { getServerClient } from "@/lib/supabase/server"

// Route handlers run only on the server — server-only import not needed here,
// but Supabase is accessed exclusively through getServerClient().

export async function POST(request: Request) {
  let body: unknown

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    )
  }

  if (
    typeof body !== "object" ||
    body === null ||
    Array.isArray(body)
  ) {
    return NextResponse.json(
      { success: false, message: "Invalid request body." },
      { status: 400 },
    )
  }

  const {
    fullName,
    email,
    company,
    role,
    message,
  } = body as Record<string, unknown>

  // ── Validation ────────────────────────────────────────────────────────────

  const errors: string[] = []

  if (!fullName || typeof fullName !== "string" || fullName.trim() === "") {
    errors.push("Full name is required.")
  }
  if (!email || typeof email !== "string" || !email.includes("@")) {
    errors.push("A valid email address is required.")
  }
  if (!company || typeof company !== "string" || company.trim() === "") {
    errors.push("Company name is required.")
  }
  if (!role || typeof role !== "string" || role.trim() === "") {
    errors.push("Role / job title is required.")
  }
  if (!message || typeof message !== "string" || message.trim() === "") {
    errors.push("Message is required.")
  } else if (message.trim().length > 5000) {
    errors.push("Message must be 5 000 characters or fewer.")
  }

  if (errors.length > 0) {
    return NextResponse.json(
      { success: false, message: errors[0] },
      { status: 422 },
    )
  }

  // ── Insert ────────────────────────────────────────────────────────────────

  const supabase = getServerClient()

  const { error } = await supabase.from("inquiries").insert({
    full_name: (fullName as string).trim(),
    email: (email as string).trim().toLowerCase(),
    company: (company as string).trim(),
    role: (role as string).trim(),
    message: (message as string).trim(),
    status: "new",
  })

  if (error) {
    console.error("[contact] Supabase insert error:", error.message)
    return NextResponse.json(
      { success: false, message: "Failed to save your request. Please try again." },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
