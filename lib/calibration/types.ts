import type { FreeValidationResponse } from "@/lib/schemas/free-validation"

export type CalibrationOutcome =
  | "major_success"
  | "success"
  | "mixed"
  | "failure"
  | "infamous_failure"

export interface CalibrationIdea {
  id: string
  name: string
  category: string
  /** What the founder would type — do not leak ground-truth labels here (blind prompts). */
  description: string
  outcome: CalibrationOutcome
  outcome_notes: string
  /** Stress-test taxonomy (seductive-but-fragile ideas); optional descriptive labels only. */
  ideaType?:
    | "ai_wrapper_garbage"
    | "fake_marketplace"
    | "founder_ego_product"
    | "hype_consumer_app"
    | "fake_community"
    | "ai_saas_no_real_pain"
  whyWeakFoundersBuyIn?: string
  structuralWeakness?: string
  likelyFailureMode?: string
}

export interface CalibrationDataset {
  version: number
  ideas: CalibrationIdea[]
}

export interface QualityDimensions {
  /** 0–100: concrete nouns, numbers, named segments vs fluff */
  specificity: number
  /** 0–100: spread of agent verdict leans */
  contradictionQuality: number
  /** 0–100: quotable one-liners, strong hooks */
  memorability: number
  /** 0–100: low hedge / ban language */
  sharpness: number
  /** 0–100: startup-native vocabulary and mechanisms */
  realism: number
}

export interface CalibrationRowResult {
  ideaId: string
  ideaName: string
  category: string
  calibrationOutcome: CalibrationOutcome
  enginePath?: NonNullable<FreeValidationResponse["metadata"]>["enginePath"]
  degraded: boolean
  degradedReason: string | null
  verdict: "BUILD" | "PIVOT" | "KILL"
  opportunityScore: number | null
  summary: string
  topReasons: string[]
  topRisks: string[]
  agentVerdictSpread: Record<string, number>
  dimensions: QualityDimensions
  composite: number
  rawSnapshot: Pick<
    FreeValidationResponse,
    | "finalVerdict"
    | "agentInsights"
    | "researchInsights"
    | "whyThisIdeaWillLikelyFail"
    | "executionPlanner48h"
    | "metadata"
  >
}
