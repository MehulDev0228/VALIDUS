import { NextResponse } from "next/server"
import { getAuthSession } from "@/lib/auth"
import { loadFounderMemoryBundle } from "@/lib/founder-memory/bundle"

/** Full founder-memory bundle — profile, blind spots, timeline preview. Authenticated only. */
export async function GET() {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const bundle = await loadFounderMemoryBundle(session.user.id)
    return NextResponse.json({
      success: true,
      timelinePreview: bundle.timelinePreview,
      profile: bundle.profile,
      blindSpots: bundle.blindSpots,
      feedbackSummary: bundle.feedbackSummary,
      storeMeta: bundle.storeMeta,
      progression: bundle.progression,
      execution: bundle.execution,
      onboarding: bundle.onboarding,
      trustSignals: bundle.trustSignals,
      journeyLines: bundle.journeyLines,
    })
  } catch (e) {
    console.error("GET /api/founder-memory", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
