import { NextResponse } from "next/server"
import { z } from "zod"
import { FreeValidationResponseSchema } from "@/lib/schemas/free-validation"
import { generateFallbackMemoPdf, generateFreeMemoPdf } from "@/lib/export/free-memo-pdf"
import { getAuthSession } from "@/lib/auth"
import { loadValidationRun } from "@/lib/validation-run-store"
import { userHasUnlimitedMemos } from "@/lib/services/billing"

export const runtime = "nodejs"

const BodySchema = z.object({
  runId: z.string().min(8).max(128),
})

export async function POST(request: Request) {
  const session = await getAuthSession()
  const uid = session?.user?.id
  if (!uid) {
    return NextResponse.json({ error: "Sign-in required" }, { status: 401 })
  }

  const unlimited = await userHasUnlimitedMemos(uid)
  if (!unlimited) {
    return NextResponse.json(
      { error: "PDF export requires Pro or Team. Upgrade to export memos.", code: "PLAN_REQUIRED" },
      { status: 402 },
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body", details: parsed.error.flatten() }, { status: 400 })
  }

  const rec = await loadValidationRun(uid, parsed.data.runId)
  if (!rec) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 })
  }

  const vr = FreeValidationResponseSchema.safeParse(rec.validation_results)
  const pdf = vr.success
    ? await generateFreeMemoPdf(rec.ideaId, vr.data)
    : await generateFallbackMemoPdf(rec.ideaId, rec.validation_results)

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="verdikt-memo-${rec.ideaId.slice(0, 24)}.pdf"`,
    },
  })
}
