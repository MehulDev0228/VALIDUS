import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { ProductIntelBatchSchema } from "@/lib/product-intelligence/schema"
import { appendProductIntelEvents, subjectKeyFromUserId } from "@/lib/product-intelligence/store"
import type { ProductIntelEventV1 } from "@/lib/product-intelligence/types"

/**
 * Lightweight, authenticated product signals — no third-party trackers.
 */
export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = ProductIntelBatchSchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid payload", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const recvAt = Date.now()
    const subjectKey = subjectKeyFromUserId(session.user.id)
    const out: ProductIntelEventV1[] = parsed.data.events.map((e, i) => ({
      v: 1,
      at: new Date(recvAt + i).toISOString(),
      subjectKey,
      kind: e.kind,
      ideaId: e.ideaId,
      ideaKey: e.ideaKey,
      verdict: e.verdict,
      sectionId: e.sectionId,
      dwellMs: e.dwellMs,
      meta: e.meta && Object.keys(e.meta).length ? e.meta : undefined,
    }))

    const persisted = await appendProductIntelEvents(out)
    return NextResponse.json({ success: persisted, count: out.length })
  } catch (e) {
    console.error("POST /api/product-events", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
