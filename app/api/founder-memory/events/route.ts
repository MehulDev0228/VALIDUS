import { type NextRequest, NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { PostFounderEventBodySchema } from "@/lib/founder-memory/schema"
import { appendFounderEvent } from "@/lib/founder-memory/store"

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json()
    const parsed = PostFounderEventBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const { ok, event } = await appendFounderEvent(session.user.id, parsed.data)
    return NextResponse.json({
      success: true,
      persisted: ok,
      event,
    })
  } catch (e) {
    console.error("POST /api/founder-memory/events", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
