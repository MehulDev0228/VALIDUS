import { describe, expect, it } from "vitest"
import type { FreeValidationResponse } from "@/lib/schemas/free-validation"
import {
  compositeQuality,
  scoreAllDimensions,
  scoreContradictionQuality,
  scoreSpecificity,
} from "@/lib/calibration/evaluate"

function baseResponse(over: Partial<FreeValidationResponse> = {}): FreeValidationResponse {
  return {
    classification: "possible",
    score: 5,
    summary: "PIVOT: Test summary line.",
    topRisks: ["Risk one", "Risk two"],
    pivots: [],
    comparables: [],
    tamSamSom: {},
    finalVerdict: {
      decision: "PIVOT",
      brutalSummary: "PIVOT: Demand is unproved; sell a pilot before scaling.",
      ifWorksBecause: "Buyers already budget for this pain and you own one integration wedge.",
      ifFailsBecause: "No one switches from the incumbent without a forcing function.",
      confidence: 0.7,
      topReasons: ["WTP unclear", "GTM brittle", "Copyable wedge"],
      topRisks: ["Risk one"],
    },
    metadata: {
      sourceKeysUsed: ["test"],
      cached: false,
      generatedAt: new Date().toISOString(),
    },
    ...over,
  } as FreeValidationResponse
}

describe("calibration evaluate", () => {
  it("penalizes generic language in specificity", () => {
    const bad =
      "This is an interesting innovative idea with huge opportunity in a growing market with massive TAM synergy."
    const good =
      "Mid-market CFOs replace spreadsheet workflows; $120–240 per seat annually; SOC2 blocks procurement."
    expect(scoreSpecificity(bad)).toBeLessThan(scoreSpecificity(good))
  })

  it("scores higher contradiction spread when agents disagree", () => {
    const unanimous = baseResponse({
      agentInsights: [
        { agent: "A", stance: "critical", confidence: 0.7, evidence: [], insights: ["x"], verdictLean: "PIVOT" },
        { agent: "B", stance: "critical", confidence: 0.7, evidence: [], insights: ["y"], verdictLean: "PIVOT" },
      ],
    })
    const split = baseResponse({
      agentInsights: [
        { agent: "A", stance: "critical", confidence: 0.7, evidence: [], insights: ["x"], verdictLean: "BUILD" },
        { agent: "B", stance: "critical", confidence: 0.7, evidence: [], insights: ["y"], verdictLean: "KILL" },
        { agent: "C", stance: "critical", confidence: 0.7, evidence: [], insights: ["z"], verdictLean: "PIVOT" },
      ],
    })
    expect(scoreContradictionQuality(split)).toBeGreaterThan(scoreContradictionQuality(unanimous))
  })

  it("composite aggregates dimensions", () => {
    const d = scoreAllDimensions(baseResponse())
    expect(compositeQuality(d)).toBeGreaterThan(40)
    expect(compositeQuality(d)).toBeLessThanOrEqual(100)
  })
})
