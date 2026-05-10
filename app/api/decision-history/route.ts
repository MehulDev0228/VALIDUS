import { type NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import { fdsAppendDecision, fdsListDecisions } from "@/lib/founder-workflow/server-store"

const PostBodySchema = z.object({
  ideaId: z.string().min(1).max(128),
  ideaTitle: z.string().min(1).max(200),
  verdict: z.enum(["BUILD", "PIVOT", "KILL"]),
  opportunityScore: z.number().min(0).max(100).optional(),
  summary: z.string().max(500).optional(),
  timestamp: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getAuthSession()
    const uid = session?.user?.id
    if (!uid) {
      return NextResponse.json({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }, { status: 401 })
    }
    const decisions = await fdsListDecisions(uid)
    return NextResponse.json({ success: true, decisions })
  } catch (e) {
    console.error("GET /api/decision-history", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession()
    const uid = session?.user?.id
    if (!uid) {
      return NextResponse.json({ success: false, error: "Sign-in required.", code: "AUTH_REQUIRED" }, { status: 401 })
    }

    const raw = await request.json()
    const parsed = PostBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid body", details: parsed.error.flatten() },
        { status: 400 },
      )
    }
    const { ok, record } = await fdsAppendDecision(uid, parsed.data)
    return NextResponse.json({ success: true, persisted: ok, decision: record })
  } catch (e) {
    console.error("POST /api/decision-history", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
