import type { IndustryClassification } from "@/lib/intelligence/industry-types"
import { getDomainPack } from "@/lib/intelligence/domain-packs"

/** Generic startup-Twitter / memo-template phrases — use only when domain pack explicitly allows equivalent concepts with real nouns. */
export const GLOBAL_FRAMEWORK_PHRASES: RegExp[] = [
  /\bcompounding hinges\b/i,
  /\britual density\b/i,
  /\binvite geometry\b/i,
  /\btraction arc\b/i,
  /\bcategory-native proofs\b/i,
  /\bstakeholder alignment\b/i,
  /\bpressure surface\b/i,
  /\bcategory tailwinds\b/i,
]

export function stripGlobalFrameworkPhrases(text: string): string {
  let t = text
  for (const re of GLOBAL_FRAMEWORK_PHRASES) {
    t = t.replace(re, "").replace(/\s+/g, " ").trim()
  }
  return t
}

/** Extra phrases to strip when vertical pack forbids them */
export function forbiddenPhrasePatternsForIndustry(ic: IndustryClassification): RegExp[] {
  const pack = getDomainPack(ic.primaryVertical)
  return [...pack.forbiddenFrameworkLanguage.map((w) => new RegExp(`\\b${escapeRegExp(w)}\\b`, "gi"))]
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

export function sanitizeIndustryLanguage(text: string, ic: IndustryClassification): string {
  let t = stripGlobalFrameworkPhrases(text)
  for (const re of forbiddenPhrasePatternsForIndustry(ic)) {
    t = t.replace(re, "").replace(/\s+/g, " ").trim()
  }
  return t
}

export function asymmetryInstructionForIndustry(ic: IndustryClassification): string {
  const v = ic.primaryVertical
  if (v === "manufacturing_robotics" || v === "industrial_infra") {
    return "ASYMMETRY / INEVITABILITY — prioritize throughput, scrap, downtime, integration/commissioning risk, CapEx cycles, and OEM/SI channel reality. Ban consumer invite/liquidity language unless the pitch is explicitly two-sided."
  }
  if (v === "healthcare" || v === "biotech") {
    return "ASYMMETRY / INEVITABILITY — prioritize workflow minutes, liability, reimbursement/payer logic, and validation burden. Ban marketplace liquidity/rake framing unless literally a marketplace."
  }
  if (v === "fintech") {
    return "ASYMMETRY / INEVITABILITY — prioritize fraud loss, compliance gates, ledger correctness, sponsor rails, and underwriting edge. Ban factory/OEE metaphors."
  }
  if (v === "consumer_social") {
    return "ASYMMETRY / INEVITABILITY — prioritize retention, moderation cost, habit frequency, and creator economics. Ban procurement/RFQ/deal-desk language unless enterprise sales is explicit."
  }
  if (v === "marketplaces") {
    return "ASYMMETRY / INEVITABILITY — liquidity, trust/fraud, cold start geography, and rake economics are fair game here because this domain is two-sided."
  }
  return "ASYMMETRY / INEVITABILITY — cite mechanisms that are native to the DOMAIN_ROUTING vertical (see DOMAIN_PACK), not recycled startup-template abstractions."
}

export function domainLanguageContract(ic: IndustryClassification): string {
  const pack = getDomainPack(ic.primaryVertical)
  return [
    "LANGUAGE_CONTRACT (mandatory):",
    `- Write like an operator in: ${pack.label}.`,
    `- Prefer concrete nouns from this list where honest: ${pack.nativeLanguage.slice(0, 18).join(", ")}.`,
    `- Do NOT import vocabulary from unrelated domains (example: manufacturing memo must not discuss liquidity/disintermediation unless this is literally a marketplace).`,
    `- Ban fake-intelligent abstractions unless tied to measurable mechanics in THIS domain.`,
    `- Forbidden unless literally justified by the pitch: ${pack.forbiddenFrameworkLanguage.join("; ")}.`,
    `- Also avoid empty buzzphrases: compounding hinges, ritual density, invite geometry, traction arc, category-native proofs, stakeholder alignment, pressure surface.`,
  ].join("\n")
}
