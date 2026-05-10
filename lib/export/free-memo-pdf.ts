import PDFDocument from "pdfkit"
import type { FreeValidationResponse } from "@/lib/schemas/free-validation"

export async function generateFallbackMemoPdf(ideaId: string, raw: unknown): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 })
  const chunks: Buffer[] = []
  const text = typeof raw === "object" ? JSON.stringify(raw, null, 2).slice(0, 12000) : String(raw).slice(0, 12000)

  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", (err: Error) => reject(err))
    doc.fontSize(14).text("VERDIKT — memo export (raw)", { align: "center" }).moveDown()
    doc.fontSize(9).text(`Idea id · ${ideaId}`, { align: "left" }).moveDown()
    doc.fontSize(8).text(text, { align: "left" })
    doc.end()
  })
}

export async function generateFreeMemoPdf(ideaId: string, data: FreeValidationResponse): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 })
  const chunks: Buffer[] = []

  return await new Promise((resolve, reject) => {
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", (err: Error) => reject(err))

    doc.fontSize(16).text("VERDIKT — memo export", { align: "center" }).moveDown(0.5)
    doc.fontSize(10).fillColor("#585D65").text(`Idea id · ${ideaId}`, { align: "center" }).moveDown(1)
    doc.fillColor("#171A1F")

    const v = data.finalVerdict?.decision
    doc.fontSize(12).text(`Verdict: ${v ?? "—"}`, { underline: true }).moveDown(0.5)
    doc.fontSize(10).text(data.summary || "—", { align: "left" }).moveDown(1)

    if (data.ideaContext) {
      doc.fontSize(11).text("Decoded brief", { underline: true }).moveDown(0.3)
      doc.fontSize(9).text(JSON.stringify(data.ideaContext, null, 2).slice(0, 8000))
      doc.moveDown(0.8)
    }

    if (data.fastestWayToProveWrong48h?.length) {
      doc.fontSize(11).text("48-hour checks", { underline: true }).moveDown(0.3)
      data.fastestWayToProveWrong48h.slice(0, 20).forEach((line, i) => {
        doc.fontSize(9).text(`${i + 1}. ${line}`)
      })
    }

    doc.moveDown(1)
    doc.fontSize(8).fillColor("#7E838F").text("Exported from VERDIKT — confidential memo.", {
      align: "right",
    })

    doc.end()
  })
}
