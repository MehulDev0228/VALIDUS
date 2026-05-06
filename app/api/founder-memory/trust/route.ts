import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import { bumpFounderTrustSignal } from "@/lib/founder-memory/store"

const BodySchema = z.object({
  kind: z.enum(["results_view", "dashboard_session"]),
})

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = BodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Invalid body" }, { status: 400 })
    }

    const ok = await bumpFounderTrustSignal(session.user.id, parsed.data.kind)
    return NextResponse.json({ success: ok, persisted: ok })
  } catch (e) {
    console.error("POST /api/founder-memory/trust", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
