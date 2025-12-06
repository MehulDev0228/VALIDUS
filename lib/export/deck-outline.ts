import { FullValidationResponse } from "@/lib/schemas/premium-validation"

export interface DeckSlide {
  title: string
  bullets: string[]
}

export interface DeckOutline {
  title: string
  slides: DeckSlide[]
}

export function buildPitchDeckOutline(result: FullValidationResponse): DeckOutline {
  const slides: DeckSlide[] = []

  slides.push({
    title: "Problem",
    bullets: result.swot.weaknesses.slice(0, 3).length
      ? result.swot.weaknesses.slice(0, 3)
      : ["Founders face an important but under-served problem."],
  })

  slides.push({
    title: "Solution",
    bullets: [result.gtmPlan.usp, result.gtmPlan.businessModel],
  })

  slides.push({
    title: "Market",
    bullets: [
      `TAM: ${result.tamSamSom.TAM}`,
      `SAM: ${result.tamSamSom.SAM}`,
      `SOM: ${result.tamSamSom.SOM}`,
    ],
  })

  slides.push({
    title: "Product & Differentiation",
    bullets: [
      result.gtmPlan.positioning || "Clear positioning vs incumbents.",
      ...result.swot.strengths.slice(0, 3),
    ],
  })

  slides.push({
    title: "Go-To-Market",
    bullets: [result.gtmPlan.gtmSummary],
  })

  const topFlags = result.redFlags.slice(0, 3).map((rf) => `${rf.label} (${rf.severity})`)
  slides.push({
    title: "Moat & Risks",
    bullets: topFlags.length ? topFlags : ["Execution risk and competition to be validated with early customers."],
  })

  slides.push({
    title: "30 / 60 / 90 Plan",
    bullets: [
      `Next 30 days: ${result.executionRoadmap.days30.slice(0, 2).join("; ") || "Ship MVP and talk to customers."}`,
      `Next 60 days: ${result.executionRoadmap.days60.slice(0, 2).join("; ") || "Iterate with design partners."}`,
      `Next 90 days: ${result.executionRoadmap.days90.slice(0, 2).join("; ") || "Prepare for fundraising or launch."}`,
    ],
  })

  slides.push({
    title: "Team & Ask",
    bullets: [
      `Founder readiness: ${result.founderDNA.overallScore}/100`,
      `Investor appeal: ${result.investorAppeal.overallScore}/100`,
      "Funding ask and use of proceeds to be specified.",
    ],
  })

  return {
    title: "Investor Pitch Deck Outline",
    slides,
  }
}
