import { type NextRequest, NextResponse } from "next/server"
import { FullValidationResponseSchema } from "@/lib/schemas/premium-validation"
import { generateInvestorOnePagerPdf } from "@/lib/export/pdf"

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

    const pdfBuffer = await generateInvestorOnePagerPdf(parseResult.data)

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=FutureValidate-investor-one-pager.pdf",
      },
    })
  } catch (error: any) {
    console.error("/api/export/pdf error:", error)
    return NextResponse.json({ error: error?.message || "Internal server error" }, { status: 500 })
  }
}
