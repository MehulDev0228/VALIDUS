import { NextResponse } from "next/server"
import { z } from "zod"
import { getAuthSession } from "@/lib/auth"
import {
  FounderOnboardingBodySchema,
  type FounderOnboardingAnswers,
  SKIP_ONBOARDING_DEFAULTS,
} from "@/lib/founder-memory/onboarding-schema"
import { saveFounderOnboarding } from "@/lib/founder-memory/store"

const PostBodySchema = z.union([FounderOnboardingBodySchema, z.object({ skip: z.literal(true) })])

export async function POST(request: Request) {
  try {
    const session = await getAuthSession()
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const raw = await request.json().catch(() => null)
    const parsed = PostBodySchema.safeParse(raw)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid onboarding body", details: parsed.error.flatten() },
        { status: 400 },
      )
    }

    const ok =
      "skip" in parsed.data
        ? await saveFounderOnboarding(session.user.id, { ...SKIP_ONBOARDING_DEFAULTS, skipped: true })
        : await saveFounderOnboarding(session.user.id, parsed.data as FounderOnboardingAnswers)
    return NextResponse.json({ success: ok, persisted: ok })
  } catch (e) {
    console.error("POST /api/founder-memory/onboarding", e)
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 })
  }
}
