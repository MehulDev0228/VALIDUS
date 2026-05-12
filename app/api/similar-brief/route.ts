import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import { findSimilarValidationRunForUser } from "@/lib/validation/similar-brief"

const BodySchema = z.object({
  title: z.string().min(2).max(300),
  description: z.string().min(8).max(8000),
})

export async function POST(request: NextRequest) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ success: false, error: "Sign-in required." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 })
  }

  const match = await findSimilarValidationRunForUser(uid, parsed.data.title, parsed.data.description)
  return NextResponse.json({ success: true, match })
}
