import { IdeaInput } from "@/lib/schemas/idea"
import { FullValidationResponse, FullValidationResponseSchema } from "@/lib/schemas/premium-validation"
import { validateIdeaWithMultipleAgents, type IdeaData, type ValidationResult } from "@/lib/ai-agents"

function mapIdeaInputToIdeaData(input: IdeaInput): IdeaData {
  return {
    title: input.title,
    description: input.description,
    industry: input.industry ?? "other",
    target_market: input.targetMarket ?? "",
    revenue_model: input.revenueModel ?? "",
    key_features: (input.keyFeatures ?? []).join(", "),
    problem_solving: "",
    competitive_advantage: "",
    market_size_estimate: "",
    timeline: "",
  }
}

function classificationFromScore(score: number): FullValidationResponse["classification"] {
  if (score >= 8) return "high"
  if (score >= 6) return "possible"
  if (score <= 2) return "joke"
  return "low"
}

function mapToFullResponse(ideaId: string, result: ValidationResult): FullValidationResponse {
  const classification = classificationFromScore(result.viability_score)

  const tamSamSom = {
    TAM: `$${(result.tam_data.total_market / 1_000_000_000).toFixed(0)}B+ overall market (est.)`,
    SAM: `$${(result.sam_data.serviceable_market / 1_000_000_000).toFixed(0)}B serviceable segment (est.)`,
    SOM: `$${(result.som_data.obtainable_market / 1_000_000_000).toFixed(1)}B realistically obtainable (5y est.)`,
    assumptions: [
      "Heuristic split: SAM ~30% of TAM, SOM ~5% of SAM.",
    ],
  }

  const competitorsDetailed = (result.competitor_analysis?.direct_competitors ?? []).map((c) => ({
    name: c.name,
    marketShare: c.market_share,
    strengths: c.strengths,
    weaknesses: [],
    pricingNotes: undefined,
    url: undefined,
  }))

  const redFlags = result.red_flags ?? []

  const gtmPlan = {
    usp: result.usp,
    businessModel: result.business_model,
    positioning: result.benchmarking?.overall_positioning,
    pricingStrategy: undefined,
    gtmSummary: result.business_plan,
  }

  const executionRoadmap = {
    days30: result.execution_roadmap?.days_30 ?? [],
    days60: result.execution_roadmap?.days_60 ?? [],
    days90: result.execution_roadmap?.days_90 ?? [],
    keyMetrics: result.execution_roadmap?.key_metrics ?? [],
    dataToCollect: result.execution_roadmap?.data_to_collect ?? [],
  }

  const founderScorecard = result.founder_scorecard
  const founderDNA = {
    overallScore: founderScorecard?.overall_score ?? 70,
    founderMarketFit: founderScorecard?.founder_market_fit ?? 65,
    ambition: founderScorecard?.ambition ?? 80,
    executionRisk: founderScorecard?.execution_risk ?? 60,
    clarityOfIdea: founderScorecard?.clarity_of_idea ?? 75,
    competitiveMoat: founderScorecard?.competitive_moat ?? 55,
    notes: founderScorecard?.notes,
  }

  const investor = result.investor_appeal
  const investorAppeal = {
    overallScore: investor?.overall_score ?? 70,
    marketTiming: investor?.market_timing ?? 75,
    tamRealism: investor?.tam_realism ?? 70,
    monetizationStrength: investor?.monetization_strength ?? 60,
    defensibility: investor?.defensibility ?? 55,
    distribution: investor?.distribution ?? 50,
    notes: investor?.notes,
  }

  const swot = result.swot_analysis

  const exportLinks = {
    pdfUrl: null,
    pitchOutlineUrl: null,
  }

  const provenance = {
    sources: [],
    cached: false,
    generatedAt: new Date().toISOString(),
  }

  const summary = result.business_plan

  const raw: FullValidationResponse = {
    ideaId,
    classification,
    viabilityScore: result.viability_score,
    summary,
    tamSamSom,
    swot,
    competitorsDetailed,
    redFlags,
    gtmPlan,
    executionRoadmap,
    founderDNA,
    investorAppeal,
    exportLinks,
    provenance,
  }

  // Validate against schema to ensure contract correctness
  return FullValidationResponseSchema.parse(raw)
}

export async function runPremiumValidationServer(idea: IdeaInput, ideaId: string): Promise<FullValidationResponse> {
  const ideaData = mapIdeaInputToIdeaData(idea)
  const result = await validateIdeaWithMultipleAgents(ideaData)
  return mapToFullResponse(ideaId, result)
}
