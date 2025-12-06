import { z } from "zod"

export const RedFlagSchema = z.object({
  id: z.string(),
  label: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  explanation: z.string(),
  suggestedFix: z.string().optional(),
})

export const CompetitorDetailedSchema = z.object({
  name: z.string(),
  marketShare: z.number().min(0).max(100).optional(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()).optional(),
  pricingNotes: z.string().optional(),
  url: z.string().url().optional(),
})

export const SWOTSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  opportunities: z.array(z.string()),
  threats: z.array(z.string()),
})

export const ExecutionRoadmapSchema = z.object({
  days30: z.array(z.string()),
  days60: z.array(z.string()),
  days90: z.array(z.string()),
  keyMetrics: z.array(z.string()),
  dataToCollect: z.array(z.string()),
})

export const FounderDNASchema = z.object({
  overallScore: z.number().min(0).max(100),
  founderMarketFit: z.number().min(0).max(100),
  ambition: z.number().min(0).max(100),
  executionRisk: z.number().min(0).max(100),
  clarityOfIdea: z.number().min(0).max(100),
  competitiveMoat: z.number().min(0).max(100),
  notes: z.string().optional(),
})

export const InvestorAppealSchema = z.object({
  overallScore: z.number().min(0).max(100),
  marketTiming: z.number().min(0).max(100),
  tamRealism: z.number().min(0).max(100),
  monetizationStrength: z.number().min(0).max(100),
  defensibility: z.number().min(0).max(100),
  distribution: z.number().min(0).max(100),
  notes: z.string().optional(),
})

export const ExportLinksSchema = z.object({
  pdfUrl: z.string().url().nullable().optional(),
  pitchOutlineUrl: z.string().url().nullable().optional(),
})

export const ProvenanceSchema = z.object({
  sources: z.array(
    z.object({
      label: z.string(),
      url: z.string().url().optional(),
    }),
  ),
  cached: z.boolean(),
  generatedAt: z.string(),
})

export const FullValidationResponseSchema = z.object({
  ideaId: z.string(),
  classification: z.enum(["high", "possible", "low", "joke"]),
  viabilityScore: z.number().min(0).max(10),
  summary: z.string(),
  tamSamSom: z.object({
    TAM: z.string(),
    SAM: z.string(),
    SOM: z.string(),
    assumptions: z.array(z.string()).optional(),
  }),
  swot: SWOTSchema,
  competitorsDetailed: z.array(CompetitorDetailedSchema),
  redFlags: z.array(RedFlagSchema),
  gtmPlan: z.object({
    usp: z.string(),
    businessModel: z.string(),
    positioning: z.string().optional(),
    pricingStrategy: z.string().optional(),
    gtmSummary: z.string(),
  }),
  executionRoadmap: ExecutionRoadmapSchema,
  founderDNA: FounderDNASchema,
  investorAppeal: InvestorAppealSchema,
  exportLinks: ExportLinksSchema,
  provenance: ProvenanceSchema,
})

export type FullValidationResponse = z.infer<typeof FullValidationResponseSchema>
