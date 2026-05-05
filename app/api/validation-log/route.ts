import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { fdsAppendValidationLog, fdsListValidationLogs } from "@/lib/founder-workflow/server-store"

const PostBodySchema = z.object({
  ideaId: z.string().min(1).max(128),
  actionTaken: z.string().min(1).max(2000),
  result: z.string().min(1).max(2000),
  learnings: z.string().min(1).max(4000),
  timestamp: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const raw = await request.json()
    const parsed = PostBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { ok, record } = await fdsAppendValidationLog(parsed.data)
    return NextResponse.json({ success: true, persisted: ok, log: record })
  } catch (e) {
    console.error("POST /api/validation-log", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const ideaId = request.nextUrl.searchParams.get("ideaId")
    if (!ideaId?.trim()) {
      return NextResponse.json({ success: false, error: "Missing ideaId" }, { status: 400 })
    }
    const logs = await fdsListValidationLogs(ideaId.trim())
    return NextResponse.json({ success: true, logs })
  } catch (e) {
    console.error("GET /api/validation-log", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
