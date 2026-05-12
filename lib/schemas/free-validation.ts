import { z } from "zod"
import { BusinessDNASchema } from "@/lib/schemas/business-dna"

const LongReportSchema = z.object({
  text: z.string().min(0), // enforcement of >=300 words happens in pipeline
  positives: z.array(z.string()).default([]),
  negatives: z.array(z.string()).default([]),
})

const ScoreBreakdownSchema = z.object({
  market: z.number().min(0).max(10),
  competition: z.number().min(0).max(10),
  monetization: z.number().min(0).max(10),
  execution: z.number().min(0).max(10),
  founderFit: z.number().min(0).max(10),
  weights: z.object({
    market: z.number(),
    competition: z.number(),
    monetization: z.number(),
    execution: z.number(),
    founderFit: z.number(),
  }),
  driversUp: z.array(z.string()).default([]),
  driversDown: z.array(z.string()).default([]),
  fixImpacts: z
    .array(
      z.object({
        label: z.string(),
        delta: z.number(),
      }),
    )
    .default([]),
})

const IdeaContextSchema = z.object({
  problem: z.string(),
  targetUser: z.string(),
  market: z.string(),
  coreIdea: z.string(),
  keywords: z.array(z.string()).default([]),
  searchQueries: z.array(z.string()).default([]),
  missingAssumptions: z.array(z.string()).default([]),
  validationGaps: z.array(z.string()).default([]),
})

const ResearchInsightSchema = z.object({
  title: z.string(),
  country: z.string().optional(),
  trendObservation: z.string().optional(),
  whyItMatters: z.string().optional(),
  strategicImplication: z.string().optional(),
  opportunityAngle: z.string().optional(),
  finding: z.string(),
  implication: z.string(),
  confidence: z.number().min(0).max(1),
  sourceType: z.enum(["nexus", "gemini-simulated", "kg"]),
})

const AgentInsightSchema = z.object({
  agent: z.string(),
  stance: z.enum(["supportive", "critical", "mixed"]),
  confidence: z.number().min(0).max(1),
  evidence: z.array(z.string()).default([]),
  insights: z.array(z.string()).default([]),
  verdictLean: z.enum(["BUILD", "PIVOT", "KILL"]),
})

const ExecutionPlannerStepSchema = z.object({
  order: z.number().optional(),
  /** e.g. "Day 1 (hours 0-24)" */
  day: z.string().optional(),
  action: z.string(),
  platforms: z.array(z.string()).optional(),
  /** What you expect to observe if the hypothesis holds */
  expectedSignals: z.string().optional(),
  successIf: z.string(),
  failIf: z.string(),
})

const FinalVerdictSchema = z.object({
  decision: z.enum(["BUILD", "PIVOT", "KILL"]),
  brutalSummary: z.string().optional(),
  /** One-line viral hook: if this succeeds, why (concrete mechanics). */
  ifWorksBecause: z.string().optional(),
  /** One-line viral hook: if this dies, why (fatal failure mode). */
  ifFailsBecause: z.string().optional(),
  confidence: z.number().min(0).max(1),
  topReasons: z.array(z.string()).min(1).max(3),
  topRisks: z.array(z.string()).min(1).max(5),
})

export const FreeValidationResponseSchema = z.object({
  ideaSummary: z.string().optional(),
  ideaContext: IdeaContextSchema.optional(),
  researchInsights: z.array(ResearchInsightSchema).optional(),
  agentInsights: z.array(AgentInsightSchema).optional(),
  keyRisks: z.array(z.string()).optional(),
  opportunityScore: z.number().min(0).max(100).optional(),
  finalVerdict: FinalVerdictSchema.optional(),
  whyThisIdeaWillLikelyFail: z.array(z.string()).optional(),
  fastestWayToProveWrong48h: z.array(z.string()).optional(),
  executionPlan: z.array(z.string()).optional(),
  executionPlanner48h: z.array(ExecutionPlannerStepSchema).optional(),
  classification: z.enum(["high", "possible", "low", "joke"]),
  score: z.number().min(0).max(10),
  summary: z.string(),
  // Optional long-form YC-partner-style memo for richer free reports.
  longReport: LongReportSchema.optional(),
  scoreBreakdown: ScoreBreakdownSchema.optional(),
  /** Same risks as `topRisks` / `finalVerdict.topRisks`, with presentation tier for UI. */
  annotatedRisks: z
    .array(
      z.object({
        text: z.string(),
        severity: z.enum(["critical", "high", "medium"]),
      }),
    )
    .optional(),
  /** Agents whose panel lean differed from the final verdict band — surfaced for transparency. */
  agentDissent: z
    .array(
      z.object({
        agent: z.string(),
        verdictLean: z.enum(["BUILD", "PIVOT", "KILL"]),
        dissentSummary: z.string(),
      }),
    )
    .optional(),
  topRisks: z.array(z.string()).max(5),
  pivots: z
    .array(
      z.object({
        title: z.string(),
        why: z.string(),
      }),
    )
    .max(10),
  comparables: z.array(
    z.object({
      name: z.string(),
      reason: z.string(),
      url: z.string().url().optional(),
    }),
  ),
  tamSamSom: z.object({
    TAM: z.string().optional(),
    SAM: z.string().optional(),
    SOM: z.string().optional(),
    confidence: z.enum(["low", "medium", "high"]).optional(),
    assumptions: z.array(z.string()).optional(),
  }),
  metadata: z.object({
    sourceKeysUsed: z.array(z.string()),
    cached: z.boolean(),
    generatedAt: z.string(),
    // Evidence & quality guards
    kgEvidenceIds: z.array(z.string()).optional(),
    dataFreshnessWarning: z.string().nullable().optional(),
    needsReview: z.boolean().optional(),
    needsReviewReason: z.string().nullable().optional(),
    /** True when Gemini was not used or pipeline failed and heuristic ran */
    degraded: z.boolean().optional(),
    degradedReason: z.string().nullable().optional(),
    enginePath: z.enum(["gemini_pipeline", "heuristic_fallback"]).optional(),
    /** Research step used Gemini + Google Search grounding */
    researchGrounding: z.boolean().optional(),
    industryClassification: z
      .object({
        primaryVertical: z.string(),
        secondaryVertical: z.string().nullable(),
        confidence01: z.number(),
        businessModel: z.string(),
        operationalStructure: z.string(),
        complexityType: z.string(),
        buyerType: z.string(),
        deploymentModel: z.string(),
        rationale: z.string(),
      })
      .optional(),
    cognitionMismatch: z
      .object({
        mismatchedFrameworkTerms: z.array(z.string()),
        suspectedArchetypeBleed: z.array(z.string()),
      })
      .optional(),
    businessDNA: BusinessDNASchema.optional(),
  }),
})

export type FreeValidationResponse = z.infer<typeof FreeValidationResponseSchema>
