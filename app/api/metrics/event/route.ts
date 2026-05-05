import { type NextRequest, NextResponse } from "next/server"

// In-memory event log for now; replace with Supabase / Postgres in production.
const events: Array<{
  name: string
  at: string
  payload: any
}> = []

export async function POST(request: NextRequest) {
  try {
    const { name, payload } = await request.json()
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Missing event name" }, { status: 400 })
    }

    events.push({ name, at: new Date().toISOString(), payload })
    // For now we just log; in a real deployment, stream to analytics/DB.
    console.log("metrics:event", name, payload)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error("/api/metrics/event error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
