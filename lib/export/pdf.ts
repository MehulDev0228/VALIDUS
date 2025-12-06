import PDFDocument from "pdfkit"
import { FullValidationResponse } from "@/lib/schemas/premium-validation"

export async function generateInvestorOnePagerPdf(
  result: FullValidationResponse,
): Promise<Buffer> {
  const doc = new PDFDocument({ size: "A4", margin: 50 })
  const chunks: Buffer[] = []

  return await new Promise<Buffer>((resolve, reject) => {
    doc.on("data", (chunk) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", (err) => reject(err))

    // Header
    doc
      .fontSize(18)
      .text("FutureValidate – Investor One-Pager", { align: "center" })
      .moveDown(1)

    // Idea & score
    doc
      .fontSize(14)
      .text(`Idea ID: ${result.ideaId}`, { align: "left" })
      .moveDown(0.3)
    doc.text(`Classification: ${result.classification.toUpperCase()} | Score: ${result.viabilityScore}/10`)
    doc.moveDown(0.5)

    // Summary
    doc.fontSize(12).text("Summary", { underline: true }).moveDown(0.3)
    doc.fontSize(11).text(result.summary, { align: "left" }).moveDown(0.8)

    // Market section
    doc.fontSize(12).text("Market Overview (TAM / SAM / SOM)", { underline: true }).moveDown(0.3)
    doc
      .fontSize(11)
      .text(`TAM: ${result.tamSamSom.TAM}`)
      .text(`SAM: ${result.tamSamSom.SAM}`)
      .text(`SOM: ${result.tamSamSom.SOM}`)
    if (result.tamSamSom.assumptions && result.tamSamSom.assumptions.length > 0) {
      doc.moveDown(0.2).fontSize(10).text(`Assumptions: ${result.tamSamSom.assumptions.join("; ")}`)
    }
    doc.moveDown(0.8)

    // SWOT
    doc.fontSize(12).text("SWOT Snapshot", { underline: true }).moveDown(0.3)
    const { swot } = result
    const colWidth = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 2 - 10

    const startY = doc.y
    doc.fontSize(11).text("Strengths", { width: colWidth, continued: true }).text("Weaknesses", {
      width: colWidth,
      align: "left",
    })
    doc.moveDown(0.2)
    const maxLen = Math.max(swot.strengths.length, swot.weaknesses.length)
    for (let i = 0; i < maxLen; i++) {
      const s = swot.strengths[i]
      const w = swot.weaknesses[i]
      doc
        .fontSize(10)
        .text(s ? `• ${s}` : "", { width: colWidth, continued: true })
        .text(w ? `• ${w}` : "", { width: colWidth })
    }

    doc.moveDown(0.4)
    doc.fontSize(11).text("Opportunities", { width: colWidth, continued: true }).text("Threats", {
      width: colWidth,
      align: "left",
    })
    doc.moveDown(0.2)
    const maxLen2 = Math.max(swot.opportunities.length, swot.threats.length)
    for (let i = 0; i < maxLen2; i++) {
      const o = swot.opportunities[i]
      const t = swot.threats[i]
      doc
        .fontSize(10)
        .text(o ? `• ${o}` : "", { width: colWidth, continued: true })
        .text(t ? `• ${t}` : "", { width: colWidth })
    }

    doc.moveDown(0.8)

    // Risks & GTM
    doc.fontSize(12).text("Risks & GTM", { underline: true }).moveDown(0.3)
    doc.fontSize(11).text("Top Red Flags:")
    result.redFlags.slice(0, 3).forEach((rf) => {
      doc
        .fontSize(10)
        .text(`• [${rf.severity.toUpperCase()}] ${rf.label}: ${rf.explanation}`, { align: "left" })
    })

    doc.moveDown(0.4)
    doc.fontSize(11).text("GTM Highlights:")
    doc.fontSize(10).text(`USP: ${result.gtmPlan.usp}`)
    doc.fontSize(10).text(`Business model: ${result.gtmPlan.businessModel}`)
    if (result.gtmPlan.positioning) {
      doc.fontSize(10).text(`Positioning: ${result.gtmPlan.positioning}`)
    }
    if (result.gtmPlan.pricingStrategy) {
      doc.fontSize(10).text(`Pricing strategy: ${result.gtmPlan.pricingStrategy}`)
    }

    doc.moveDown(0.8)

    // 30 / 60 / 90
    doc.fontSize(12).text("30 / 60 / 90 Day Execution", { underline: true }).moveDown(0.3)
    const { executionRoadmap } = result
    const colW = (doc.page.width - doc.page.margins.left - doc.page.margins.right) / 3 - 10

    const yExec = doc.y
    doc.fontSize(11).text("30 Days", { width: colW, continued: true }).text("60 Days", {
      width: colW,
      continued: true,
    }).text("90 Days", { width: colW })
    doc.moveDown(0.2)

    const maxExec = Math.max(
      executionRoadmap.days30.length,
      executionRoadmap.days60.length,
      executionRoadmap.days90.length,
    )
    for (let i = 0; i < maxExec; i++) {
      const d30 = executionRoadmap.days30[i]
      const d60 = executionRoadmap.days60[i]
      const d90 = executionRoadmap.days90[i]
      doc
        .fontSize(10)
        .text(d30 ? `• ${d30}` : "", { width: colW, continued: true })
        .text(d60 ? `• ${d60}` : "", { width: colW, continued: true })
        .text(d90 ? `• ${d90}` : "", { width: colW })
    }

    doc.moveDown(0.8)

    // Founder & Investor appeal
    doc.fontSize(12).text("Founder & Investor Readiness", { underline: true }).moveDown(0.3)
    doc
      .fontSize(10)
      .text(
        `Founder DNA – overall: ${result.founderDNA.overallScore}/100, market fit: ${result.founderDNA.founderMarketFit}/100, execution risk: ${result.founderDNA.executionRisk}/100`,
      )
    if (result.founderDNA.notes) {
      doc.moveDown(0.2).fontSize(10).text(`Founder notes: ${result.founderDNA.notes}`)
    }

    doc.moveDown(0.3)
    doc
      .fontSize(10)
      .text(
        `Investor appeal – overall: ${result.investorAppeal.overallScore}/100, timing: ${result.investorAppeal.marketTiming}/100, TAM realism: ${result.investorAppeal.tamRealism}/100`,
      )
    if (result.investorAppeal.notes) {
      doc.moveDown(0.2).fontSize(10).text(`Investor notes: ${result.investorAppeal.notes}`)
    }

    doc.moveDown(0.6)
    doc.fontSize(9).text("Generated by FutureValidate", { align: "right" })

    doc.end()
  })
}
