import type { FreeValidationResponse } from "@/lib/schemas/free-validation"
import type { IndustryClassification } from "@/lib/intelligence/industry-types"
import { getDomainPack } from "@/lib/intelligence/domain-packs"
import { sanitizeIndustryLanguage } from "@/lib/intelligence/domain-vocabulary"

export interface CognitionAudit {
  mismatchedFrameworkTerms: string[]
  suspectedArchetypeBleed: string[]
}

function collectStrings(res: FreeValidationResponse): string[] {
  const out: string[] = []
  if (res.summary) out.push(res.summary)
  if (res.finalVerdict?.brutalSummary) out.push(res.finalVerdict.brutalSummary)
  if (res.finalVerdict?.ifWorksBecause) out.push(res.finalVerdict.ifWorksBecause)
  if (res.finalVerdict?.ifFailsBecause) out.push(res.finalVerdict.ifFailsBecause)
  if (res.finalVerdict?.topReasons) out.push(...res.finalVerdict.topReasons)
  if (res.finalVerdict?.topRisks) out.push(...res.finalVerdict.topRisks)
  if (res.whyThisIdeaWillLikelyFail) out.push(...res.whyThisIdeaWillLikelyFail)
  if (res.agentInsights) out.push(...res.agentInsights.flatMap((a) => [...a.insights, ...a.evidence]))
  if (res.researchInsights)
    out.push(
      ...res.researchInsights.flatMap((r) =>
        [r.title, r.finding, r.implication, r.trendObservation, r.whyItMatters, r.strategicImplication].filter(
          Boolean,
        ) as string[],
      ),
    )
  return out
}

const MARKETPLACE_LEX = /\b(liquidity|disintermediation|take rate|rake|two-sided|invite geometry|cold start density)\b/i
const INDUSTRIAL_DOMAIN = new Set([
  "manufacturing_robotics",
  "industrial_infra",
  "logistics",
  "deeptech",
  "climate_energy",
])
const HEALTH_LEX = /\b(HIPAA|reimbursement|clinical|EHR|prior auth)\b/i
const FIN_LEX = /\b(KYC|AML|PCI|chargeback|ledger|underwriting)\b/i

export function auditDomainMismatch(ic: IndustryClassification, memoTextBlob: string): CognitionAudit {
  const mismatched: string[] = []
  const bleed: string[] = []
  const pack = getDomainPack(ic.primaryVertical)
  const t = memoTextBlob.toLowerCase()

  for (const forbidden of pack.forbiddenFrameworkLanguage) {
    if (new RegExp(`\\b${forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(t)) {
      mismatched.push(forbidden)
    }
  }

  if (INDUSTRIAL_DOMAIN.has(ic.primaryVertical) && MARKETPLACE_LEX.test(t) && ic.primaryVertical !== "marketplaces") {
    bleed.push("marketplace_lexicon_in_industrial_domain")
  }
  if (ic.primaryVertical === "healthcare" && /\b(take rate|rake|liquidity)\b/i.test(t)) {
    bleed.push("marketplace_lexicon_in_healthcare")
  }
  if (ic.primaryVertical === "fintech" && /\b(OEE|scrap rate|PLC)\b/i.test(t)) {
    bleed.push("industrial_lexicon_in_fintech")
  }
  if (ic.primaryVertical === "consumer_social" && /\b(procurement|RFQ|PPAP)\b/i.test(t)) {
    bleed.push("enterprise_procurement_lexicon_in_consumer_social")
  }

  if (HEALTH_LEX.test(t) && (ic.primaryVertical === "marketplaces" || ic.primaryVertical === "consumer_social")) {
    /* allowed if secondary vertical */
    if (ic.secondaryVertical !== "healthcare") bleed.push("health_lexicon_outside_health_domain")
  }
  if (FIN_LEX.test(t) && ic.primaryVertical !== "fintech" && ic.secondaryVertical !== "fintech") {
    bleed.push("fintech_lexicon_without_fintech_classification")
  }

  return { mismatchedFrameworkTerms: mismatched, suspectedArchetypeBleed: bleed }
}

export function sanitizeFreeValidationLanguage(
  res: FreeValidationResponse,
  ic: IndustryClassification,
): FreeValidationResponse {
  const patchString = (s: string | undefined) => (s ? sanitizeIndustryLanguage(s, ic) : s)

  const next: FreeValidationResponse = {
    ...res,
    summary: patchString(res.summary) || res.summary,
    finalVerdict: res.finalVerdict
      ? {
          ...res.finalVerdict,
          brutalSummary: patchString(res.finalVerdict.brutalSummary),
          ifWorksBecause: patchString(res.finalVerdict.ifWorksBecause),
          ifFailsBecause: patchString(res.finalVerdict.ifFailsBecause),
          topReasons: res.finalVerdict.topReasons?.map((x) => patchString(x) || x),
          topRisks: res.finalVerdict.topRisks?.map((x) => patchString(x) || x),
        }
      : res.finalVerdict,
    whyThisIdeaWillLikelyFail: res.whyThisIdeaWillLikelyFail?.map((x) => patchString(x) || x),
    agentInsights: res.agentInsights?.map((a) => ({
      ...a,
      insights: a.insights.map((x) => patchString(x) || x),
      evidence: a.evidence.map((x) => patchString(x) || x),
    })),
    researchInsights: res.researchInsights?.map((r) => ({
      ...r,
      title: patchString(r.title) || r.title || "",
      finding: patchString(r.finding) || r.finding || "",
      implication: patchString(r.implication) || r.implication || "",
      trendObservation: patchString(r.trendObservation),
      whyItMatters: patchString(r.whyItMatters),
      strategicImplication: patchString(r.strategicImplication),
    })),
    fastestWayToProveWrong48h: res.fastestWayToProveWrong48h?.map((x) => patchString(x) || x),
    executionPlan: res.executionPlan?.map((x) => patchString(x) || x),
    executionPlanner48h: res.executionPlanner48h?.map((step) => ({
      ...step,
      action: patchString(step.action) || step.action,
      expectedSignals: patchString(step.expectedSignals),
      successIf: patchString(step.successIf) || step.successIf,
      failIf: patchString(step.failIf) || step.failIf,
    })),
  }

  return next
}

export function attachCognitionAudit(
  res: FreeValidationResponse,
  ic: IndustryClassification,
): FreeValidationResponse {
  const blob = collectStrings(res).join("\n")
  const audit = auditDomainMismatch(ic, blob)
  const needsReview =
    audit.mismatchedFrameworkTerms.length > 0 || audit.suspectedArchetypeBleed.length > 0
  const reasons: string[] = []
  if (audit.mismatchedFrameworkTerms.length) reasons.push(`framework_terms:${audit.mismatchedFrameworkTerms.join(",")}`)
  if (audit.suspectedArchetypeBleed.length) reasons.push(`bleed:${audit.suspectedArchetypeBleed.join(",")}`)

  return {
    ...res,
    metadata: {
      ...res.metadata,
      needsReview: res.metadata?.needsReview || needsReview,
      needsReviewReason:
        needsReview && reasons.length
          ? [res.metadata?.needsReviewReason, ...reasons].filter(Boolean).join(" | ")
          : res.metadata?.needsReviewReason ?? null,
      cognitionMismatch: audit,
    },
  }
}
