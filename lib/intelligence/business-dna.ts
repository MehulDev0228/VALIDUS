import type { IdeaInput } from "@/lib/schemas/idea"
import {
  type BusinessDNA,
  BusinessDNASchema,
  AdoptionCadenceSchema,
  ComplianceSensitivitySchema,
  DeploymentComplexitySchema,
  EndUserTypeDNASchema as EndUserEnum,
  HumanBehaviorDependencySchema,
  ImplementationModelSchema,
  InfrastructureDependencySchema,
  IntegrationBurdenSchema,
  MoatStructureSchema,
  OnboardingBurdenSchema,
  ProcurementFrictionSchema,
  ReplacementFrequencySchema,
  RetentionMechanismSchema,
  SalesMotionSchema,
  SwitchingDifficultySchema,
  TrustDependencySchema,
  BuyerTypeDNASchema as BuyerEnum,
} from "@/lib/schemas/business-dna"
import type { IndustryClassification } from "@/lib/intelligence/industry-types"
import { generateGeminiJson } from "@/lib/llm/gemini-json"
import { isGeminiApiKeyPresent } from "@/lib/llm/gemini-status"

const DNA_GEMINI_THRESHOLD = 0.72

function corpus(idea: IdeaInput): string {
  const feat = (idea.keyFeatures || []).join(" ")
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${idea.revenueModel || ""} ${feat}`.toLowerCase()
}

function hits(t: string, keys: string[]): number {
  return keys.reduce((n, k) => n + (t.includes(k) ? 1 : 0), 0)
}

function pickEnum<T extends string>(raw: unknown, allowed: readonly T[], fallback: T): T {
  const s = typeof raw === "string" ? raw.trim().toLowerCase().replace(/\s+/g, "_") : ""
  if (allowed.includes(s as T)) return s as T
  for (const a of allowed) {
    if (s.includes(a.replace(/_/g, "")) || s.includes(a)) return a
  }
  return fallback
}

function normalizeBusinessDNA(raw: unknown, fallback: BusinessDNA): BusinessDNA {
  const o = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>
  const merged = {
    fundamentalOffering: String(o.fundamentalOffering || fallback.fundamentalOffering).slice(0, 520),
    buyerType: pickEnum(o.buyerType, BuyerEnum.options, fallback.buyerType),
    endUserType: pickEnum(o.endUserType, EndUserEnum.options, fallback.endUserType),
    salesMotion: pickEnum(o.salesMotion, SalesMotionSchema.options, fallback.salesMotion),
    deploymentComplexity: pickEnum(o.deploymentComplexity, DeploymentComplexitySchema.options, fallback.deploymentComplexity),
    implementationModel: pickEnum(o.implementationModel, ImplementationModelSchema.options, fallback.implementationModel),
    switchingDifficulty: pickEnum(o.switchingDifficulty, SwitchingDifficultySchema.options, fallback.switchingDifficulty),
    retentionMechanism: pickEnum(o.retentionMechanism, RetentionMechanismSchema.options, fallback.retentionMechanism),
    moatStructure: pickEnum(o.moatStructure, MoatStructureSchema.options, fallback.moatStructure),
    trustDependency: pickEnum(o.trustDependency, TrustDependencySchema.options, fallback.trustDependency),
    integrationBurden: pickEnum(o.integrationBurden, IntegrationBurdenSchema.options, fallback.integrationBurden),
    infrastructureDependency: pickEnum(
      o.infrastructureDependency,
      InfrastructureDependencySchema.options,
      fallback.infrastructureDependency,
    ),
    adoptionCadence: pickEnum(o.adoptionCadence, AdoptionCadenceSchema.options, fallback.adoptionCadence),
    replacementFrequency: pickEnum(o.replacementFrequency, ReplacementFrequencySchema.options, fallback.replacementFrequency),
    operationalBottleneck: String(o.operationalBottleneck || fallback.operationalBottleneck).slice(0, 400),
    coreEconomicDriver: String(o.coreEconomicDriver || fallback.coreEconomicDriver).slice(0, 320),
    procurementFriction: pickEnum(o.procurementFriction, ProcurementFrictionSchema.options, fallback.procurementFriction),
    onboardingBurden: pickEnum(o.onboardingBurden, OnboardingBurdenSchema.options, fallback.onboardingBurden),
    humanBehaviorDependency: pickEnum(
      o.humanBehaviorDependency,
      HumanBehaviorDependencySchema.options,
      fallback.humanBehaviorDependency,
    ),
    complianceSensitivity: pickEnum(o.complianceSensitivity, ComplianceSensitivitySchema.options, fallback.complianceSensitivity),
    scalabilityConstraints: Array.isArray(o.scalabilityConstraints)
      ? o.scalabilityConstraints.map((x) => String(x).slice(0, 160)).filter(Boolean).slice(0, 8)
      : fallback.scalabilityConstraints,
    wedgeStrategy: String(o.wedgeStrategy || fallback.wedgeStrategy).slice(0, 400),
    expansionVector: String(o.expansionVector || fallback.expansionVector).slice(0, 400),
    hiddenOperationalRisk: String(o.hiddenOperationalRisk || fallback.hiddenOperationalRisk).slice(0, 400),
    founderMisconception: String(o.founderMisconception || fallback.founderMisconception).slice(0, 400),
    extractionConfidence01: Math.min(
      1,
      Math.max(0, Number(o.extractionConfidence01 ?? fallback.extractionConfidence01)),
    ),
    extractionSource: pickEnum(o.extractionSource, ["heuristic", "gemini", "merged"] as const, fallback.extractionSource),
  }
  const parsed = BusinessDNASchema.safeParse(merged)
  return parsed.success ? parsed.data : fallback
}

function inferOperationalAxes(t: string) {
  const industrial =
    hits(t, [
      "factory",
      "plant",
      "manufacturing",
      "assembly",
      "plc",
      "scada",
      "mes",
      "robot",
      "cobot",
      "welding",
      "oee",
      "production line",
      "shop floor",
      "commissioning",
      "spare parts",
      "downtime",
      "throughput",
    ]) >= 3

  const marketplace =
    hits(t, ["marketplace", "two-sided", "take rate", "buyers and sellers", "liquidity", "disintermediation"]) >= 2

  const regulatedMed =
    hits(t, ["fda", "hipaa", "clinical", "patient", "ehr", "reimbursement", "prior auth"]) >= 2

  const fintech =
    hits(t, ["payment", "ledger", "kyc", "aml", "underwriting", "fraud", "pci", "wallet", "bank"]) >= 2

  const consumerApp =
    hits(t, ["consumer app", "mobile app", "social", "feed", "friends", "creator"]) >= 2 && !industrial

  const devtools =
    hits(t, ["api", "sdk", "developer", "kubernetes", "ci/cd", "git ", "observability"]) >= 2

  const enterprise =
    hits(t, ["enterprise", "procurement", "security review", "soc 2", "rfp", "vp ", "cio"]) >= 2

  const hardwareHeavy =
    hits(t, ["hardware", "device", "sensor", "edge", "robot arm", "camera line"]) >= 2

  return { industrial, marketplace, regulatedMed, fintech, consumerApp, devtools, enterprise, hardwareHeavy }
}

function heuristicConfidence(signals: number, industryConf: number): number {
  const base = 0.38 + Math.min(0.34, signals * 0.045)
  return Math.min(0.94, (base + industryConf * 0.12) / 1.12)
}

/**
 * Deterministic operational DNA — runs locally with zero LLM calls.
 * Prefer `extractBusinessDNA` in async pipelines for optional Gemini refinement when confidence is low.
 */
export function extractBusinessDNAHeuristic(idea: IdeaInput, industry: IndustryClassification): BusinessDNA {
  const t = corpus(idea)
  const ax = inferOperationalAxes(t)

  let signalStrength = 0
  if (ax.industrial) signalStrength += 3
  if (ax.marketplace) signalStrength += 2
  if (ax.regulatedMed) signalStrength += 2
  if (ax.fintech) signalStrength += 2
  if (ax.consumerApp) signalStrength += 2
  if (ax.devtools) signalStrength += 2
  if (ax.enterprise) signalStrength += 2
  if (ax.hardwareHeavy) signalStrength += 2

  const fundamentalOffering = ax.industrial
    ? "Operational systems integrated into production reality — uptime, yield, safety, and integration into existing OT/MES stacks — not generic productivity SaaS."
    : ax.marketplace
      ? "Matching, clearing, trust, and payout infrastructure connecting distinct sides with liquidity and fraud surfaces."
      : ax.regulatedMed
        ? "Clinical workflow and reimbursement-adjacent software with liability, evidence, and integration into EHR/clinical ops."
        : ax.fintech
          ? "Money movement, compliance, fraud/risk, and ledger correctness wrapped in regulated partner rails."
          : ax.consumerApp
            ? "Consumer habit, attention, and lightweight monetization — retention and marginal cost of engagement dominate."
            : ax.devtools
              ? "Developer throughput and integration spine — migration cost and reliability versus hyperscaler/OSS substitutes."
              : "B2B workflow software sold on ROI — expansion inside accounts competes with suite incumbents."

  const buyerType = ax.consumerApp
    ? ("consumer_household" as const)
    : ax.enterprise || ax.industrial
      ? ("economic_buyer_exec" as const)
      : ax.marketplace
        ? ("mixed_unclear" as const)
        : ax.regulatedMed
          ? ("department_head" as const)
          : ("mixed_unclear" as const)

  const endUserType = ax.industrial
    ? ("frontline_operator" as const)
    : ax.regulatedMed
      ? ("clinician_practitioner" as const)
      : ax.devtools
        ? ("developer_engineer" as const)
        : ax.consumerApp
          ? ("consumer_end_user" as const)
          : ax.marketplace
            ? ("dual_sided_supply_demand" as const)
            : ("same_as_buyer" as const)

  const salesMotion = ax.marketplace
    ? ("marketplace_operator" as const)
    : ax.consumerApp
      ? ("consumer_self_serve" as const)
      : ax.devtools && !ax.enterprise
        ? ("plg_bottom_up" as const)
        : ax.enterprise || ax.industrial
          ? ("enterprise_field" as const)
          : ax.fintech
            ? ("sales_led_midmarket" as const)
            : ("hybrid_unclear" as const)

  const deploymentComplexity =
    ax.industrial || ax.hardwareHeavy ? ("extreme" as const) : ax.enterprise ? ("high" as const) : ("medium" as const)

  const implementationModel = ax.industrial
    ? ("embedded_integration_project" as const)
    : ax.regulatedMed
      ? ("professional_services_heavy" as const)
      : ax.devtools
        ? ("guided_onboarding" as const)
        : ("mixed" as const)

  const switchingDifficulty =
    ax.industrial || ax.regulatedMed ? ("extreme" as const) : ax.enterprise ? ("high" as const) : ("medium" as const)

  const retentionMechanism = ax.marketplace
    ? ("network_density" as const)
    : ax.industrial || ax.hardwareHeavy
      ? ("asset_runtime_dependency" as const)
      : ax.regulatedMed
        ? ("compliance_record" as const)
        : ax.devtools
          ? ("workflow_lock_in" as const)
          : ("contract_budget_line" as const)

  const moatStructure = ax.industrial
    ? ("performance_reliability_ops" as const)
    : ax.fintech
      ? ("regulatory_license" as const)
      : ax.marketplace
        ? ("switching_cost_integration" as const)
        : ax.devtools
          ? ("switching_cost_integration" as const)
          : ("switching_cost_integration" as const)

  const trustDependency = ax.fintech || ax.regulatedMed ? ("existential" as const) : ax.marketplace ? ("high" as const) : ("medium" as const)

  const integrationBurden =
    ax.industrial || ax.regulatedMed ? ("high" as const) : ax.enterprise ? ("high" as const) : ("medium" as const)

  const infrastructureDependency = ax.industrial
    ? ("edge_ot_device" as const)
    : ax.regulatedMed
      ? ("regulated_hosted" as const)
      : ax.devtools
        ? ("cloud_only" as const)
        : ("hybrid_cloud_on_prem" as const)

  const adoptionCadence = ax.consumerApp
    ? ("instant_self_serve" as const)
    : ax.industrial || ax.enterprise
      ? ("enterprise_quarters" as const)
      : ("team_pilot_weeks" as const)

  const replacementFrequency = ax.industrial
    ? ("weekly_operational" as const)
    : ax.consumerApp
      ? ("continuous_daily" as const)
      : ax.marketplace
        ? ("continuous_daily" as const)
        : ("annual_contract" as const)

  const operationalBottleneck = ax.industrial
    ? "Commissioning, OT security acceptance, and line-stop risk during integration."
    : ax.regulatedMed
      ? "Clinical adoption drag and payer rule variability versus demo hype."
      : ax.marketplace
        ? "Cold-start liquidity and trust/fraud before rake economics work."
        : ax.fintech
          ? "Compliance gates and fraud losses versus thin spread."
          : "Proof of recurring workflow value versus incumbent bundles."

  const coreEconomicDriver = ax.industrial
    ? "Measurable downtime/scrap/labor avoidance — finance cares about CapEx and utilization."
    : ax.fintech
      ? "Net revenue after fraud/default and fixed compliance overhead."
      : ax.marketplace
        ? "Take rate × liquidity depth minus subsidy leakage."
        : ax.consumerApp
          ? "Retention cohorts and monetization per engaged user."
          : "Seat expansion and renewal against procurement churn."

  const procurementFriction =
    ax.industrial || ax.enterprise ? ("extreme" as const) : ax.regulatedMed ? ("high" as const) : ("medium" as const)

  const onboardingBurden =
    ax.industrial || ax.regulatedMed ? ("high" as const) : ax.devtools ? ("medium" as const) : ("medium" as const)

  const humanBehaviorDependency = ax.consumerApp
    ? ("high" as const)
    : ax.industrial
      ? ("high" as const)
      : ax.regulatedMed
        ? ("medium" as const)
        : ("medium" as const)

  const complianceSensitivity = ax.regulatedMed || ax.fintech ? ("existential" as const) : ("medium" as const)

  const scalabilityConstraints = ax.industrial
    ? [
        "Field engineering capacity per plant.",
        "Site-specific OT variance.",
        "Capital cycles gate timing.",
      ]
    : ax.marketplace
      ? ["Local liquidity limits national scaling.", "Moderation and fraud scale nonlinearly."]
      : ax.fintech
        ? ["Regulatory perimeter.", "Partner bank appetite.", "Fraud rings."]
        : ["Sales headcount vs PLG ceiling.", "Integration backlog.", "Incumbent bundle pricing."]

  const wedgeStrategy = ax.industrial
    ? "Win one measurable defect class or downtime bucket on one line with paid pilot KPIs — prove ROI before plant-wide rollout."
    : ax.marketplace
      ? "Depth in one geography + one supply wedge before claiming national liquidity."
      : ax.devtools
        ? "Own one CI/deploy bottleneck path with teams who already pay for reliability."
        : "Land one department KPI your champion owns — expand through workflow mesh."

  const expansionVector = ax.industrial
    ? "Adjacent lines → sites → enterprise fleet agreements once reliability is proven."
    : ax.regulatedMed
      ? "Department depth → additional specialties → payer-sponsored bundles."
      : ax.devtools
        ? "Seat expansion + enterprise gate after bottom-up proof."
        : "Seat expansion, SKU attach, or geographic replication depending on motion."

  const hiddenOperationalRisk = ax.industrial
    ? "Maintenance burden and liability when vision models drift under real lighting/oil/dust conditions."
    : ax.marketplace
      ? "Disintermediation once sides recognize each other — rake evaporates."
      : ax.fintech
        ? "Silent fraud shifts that blow unit economics after scale."
        : "Services drag masquerading as software margin."

  const founderMisconception = ax.industrial
    ? "That factories adopt like PLG SaaS — reality is pilot KPIs, integration hours, and OT politics."
    : ax.consumerApp
      ? "That novelty equals retention — habit and moderation economics dominate."
      : ax.devtools
        ? "That developers adopt forever without procurement — enterprise kill switches exist."
        : "That category labels (AI/SaaS) imply GTM — economics follow operational bottleneck."

  const conf = heuristicConfidence(signalStrength, industry.confidence01)

  return {
    fundamentalOffering,
    buyerType,
    endUserType,
    salesMotion,
    deploymentComplexity,
    implementationModel,
    switchingDifficulty,
    retentionMechanism,
    moatStructure,
    trustDependency,
    integrationBurden,
    infrastructureDependency,
    adoptionCadence,
    replacementFrequency,
    operationalBottleneck,
    coreEconomicDriver,
    procurementFriction,
    onboardingBurden,
    humanBehaviorDependency,
    complianceSensitivity,
    scalabilityConstraints,
    wedgeStrategy,
    expansionVector,
    hiddenOperationalRisk,
    founderMisconception,
    extractionConfidence01: conf,
    extractionSource: "heuristic",
  }
}

function geminiDnaPrompt(idea: IdeaInput, industry: IndustryClassification, prior: BusinessDNA): string {
  const keys = [
    "fundamentalOffering",
    "buyerType",
    "endUserType",
    "salesMotion",
    "deploymentComplexity",
    "implementationModel",
    "switchingDifficulty",
    "retentionMechanism",
    "moatStructure",
    "trustDependency",
    "integrationBurden",
    "infrastructureDependency",
    "adoptionCadence",
    "replacementFrequency",
    "operationalBottleneck",
    "coreEconomicDriver",
    "procurementFriction",
    "onboardingBurden",
    "humanBehaviorDependency",
    "complianceSensitivity",
    "scalabilityConstraints",
    "wedgeStrategy",
    "expansionVector",
    "hiddenOperationalRisk",
    "founderMisconception",
    "extractionConfidence01",
    "extractionSource",
  ].join(",")
  return `You extract OPERATIONAL business reality (how the company actually runs and sells), not startup category labels.

OUTPUT RULES:
- Return STRICT JSON ONLY. No markdown, no prose, no keys beyond the schema.
- Strings must describe operational truth (deployment, procurement, economics). Ban generic "AI SaaS productivity platform" unless accurate.
- extractionConfidence01 is your confidence 0–1 in this extraction.
- extractionSource must be exactly "gemini".

ENUM CONSTRAINTS — values MUST be one of these literals:

buyerType: economic_buyer_exec | department_head | practitioner_end_user | consumer_household | procurement_committee | technical_buyer_engineering | mixed_unclear

endUserType: same_as_buyer | frontline_operator | clinician_practitioner | developer_engineer | consumer_end_user | dual_sided_supply_demand | mixed_unclear

salesMotion: plg_bottom_up | product_led_sales_assist | sales_led_midmarket | enterprise_field | channel_partner | marketplace_operator | consumer_self_serve | usage_land_expand | hybrid_unclear

deploymentComplexity: low | medium | high | extreme

implementationModel: self_serve | guided_onboarding | professional_services_heavy | embedded_integration_project | mixed

switchingDifficulty: low | medium | high | extreme

retentionMechanism: habit_loop | workflow_lock_in | data_gravity | contract_budget_line | network_density | compliance_record | asset_runtime_dependency | mixed

moatStructure: distribution_brand | switching_cost_integration | regulatory_license | data_network_proprietary | supply_exclusive | performance_reliability_ops | none_obvious

trustDependency: low | medium | high | existential

integrationBurden: low | medium | high

infrastructureDependency: cloud_only | hybrid_cloud_on_prem | edge_ot_device | regulated_hosted | mixed

adoptionCadence: instant_self_serve | team_pilot_weeks | enterprise_quarters | capital_cycle_asset | seasonal_budget

replacementFrequency: continuous_daily | weekly_operational | annual_contract | multi_year_asset | episodic_project

procurementFriction: low | medium | high | extreme

onboardingBurden: low | medium | high

humanBehaviorDependency: low | medium | high

complianceSensitivity: low | medium | high | existential

scalabilityConstraints: JSON array of 1–8 short strings (real constraints).

INDUSTRY_HINT (weak prior): ${JSON.stringify(industry)}
HEURISTIC_PRIOR (refine or replace if wrong): ${JSON.stringify(prior)}
IDEA: ${JSON.stringify(idea)}

JSON shape keys exactly: {${keys}}
`
}

/**
 * Async extraction: deterministic first; optional Gemini structured JSON when confidence is below threshold.
 */
export async function extractBusinessDNA(
  idea: IdeaInput,
  industry: IndustryClassification,
): Promise<BusinessDNA> {
  const prior = extractBusinessDNAHeuristic(idea, industry)
  if (prior.extractionConfidence01 >= DNA_GEMINI_THRESHOLD || !isGeminiApiKeyPresent()) {
    return prior
  }
  try {
    const raw = await generateGeminiJson(geminiDnaPrompt(idea, industry, prior))
    const normalized = normalizeBusinessDNA(raw, prior)
    const next: BusinessDNA = {
      ...normalized,
      extractionSource: "gemini",
      extractionConfidence01: Math.max(prior.extractionConfidence01, 0.78, normalized.extractionConfidence01),
    }
    const parsed = BusinessDNASchema.safeParse(next)
    return parsed.success ? parsed.data : prior
  } catch {
    return prior
  }
}

/** Memo / prompt block — place BEFORE vertical routing so agents reason from operational truth first */
export function formatBusinessDNAForPrompt(dna: BusinessDNA): string {
  return [
    "BUSINESS_DNA (operational substrate — reason from this, not generic archetypes):",
    JSON.stringify(dna, null, 0),
  ].join("\n")
}