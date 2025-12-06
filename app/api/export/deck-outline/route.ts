import { type NextRequest, NextResponse } from "next/server"
import { FullValidationResponseSchema } from "@/lib/schemas/premium-validation"
import { buildPitchDeckOutline } from "@/lib/export/deck-outline"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const payload = body?.validation_results ?? body

    const parseResult = FullValidationResponseSchema.safeParse(payload)
    if (!parseResult.success) {
      return NextResponse.json({ error: "Invalid FullValidationResponse payload", details: parseResult.error.flatten() }, {
        status: 400,
      })
    }

    const outline = buildPitchDeckOutline(parseResult.data)

    return NextResponse.json(outline, { status: 200 })
  } catch (error: any) {
    console.error("/api/export/deck-outline error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
