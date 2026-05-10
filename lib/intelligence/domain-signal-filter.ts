import type { IndustryClassification } from "@/lib/intelligence/industry-types"
import type { InevitabilitySignal } from "@/lib/intelligence/asymmetry-engine"
import { isExplicitTwoSidedMarketplaceText } from "@/lib/intelligence/industry-classification"

const INDUSTRIAL_VERTICALS = new Set([
  "manufacturing_robotics",
  "industrial_infra",
  "logistics",
  "climate_energy",
  "deeptech",
  "biotech",
])

/**
 * Removes viral/marketplace-shaped inevitability signals when domain is industrial
 * and the pitch is not explicitly a marketplace.
 */
export function filterInevitabilitySignalsForIndustry(
  signals: InevitabilitySignal[],
  ideaText: string,
  ic: IndustryClassification,
): InevitabilitySignal[] {
  const t = ideaText.toLowerCase()
  const ind = INDUSTRIAL_VERTICALS.has(ic.primaryVertical) || INDUSTRIAL_VERTICALS.has(ic.secondaryVertical ?? "")
  if (!ind || isExplicitTwoSidedMarketplaceText(t)) return signals

  return signals.filter((s) => {
    if (s.type !== "distribution_compounding") return true
    const r = `${s.reasoning} ${s.evidence.join(" ")}`.toLowerCase()
    /** Keep only if reasoning already cites industrial distribution (integrators, pilots), not invites */
    if (/\bintegrator\b|\bpilot line\b|\boem\b|\bplant\b|\boutbound engineer\b|\bsi\b|\bmes\b/i.test(r)) return true
    return false
  })
}
