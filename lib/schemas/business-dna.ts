import { z } from "zod"

/** Canonical categorical buckets — LM output is normalized into these via `normalizeBusinessDNA`. */
export const SalesMotionSchema = z.enum([
  "plg_bottom_up",
  "product_led_sales_assist",
  "sales_led_midmarket",
  "enterprise_field",
  "channel_partner",
  "marketplace_operator",
  "consumer_self_serve",
  "usage_land_expand",
  "hybrid_unclear",
])

export const DeploymentComplexitySchema = z.enum(["low", "medium", "high", "extreme"])

export const ImplementationModelSchema = z.enum([
  "self_serve",
  "guided_onboarding",
  "professional_services_heavy",
  "embedded_integration_project",
  "mixed",
])

export const SwitchingDifficultySchema = z.enum(["low", "medium", "high", "extreme"])

export const RetentionMechanismSchema = z.enum([
  "habit_loop",
  "workflow_lock_in",
  "data_gravity",
  "contract_budget_line",
  "network_density",
  "compliance_record",
  "asset_runtime_dependency",
  "mixed",
])

export const MoatStructureSchema = z.enum([
  "distribution_brand",
  "switching_cost_integration",
  "regulatory_license",
  "data_network_proprietary",
  "supply_exclusive",
  "performance_reliability_ops",
  "none_obvious",
])

export const TrustDependencySchema = z.enum(["low", "medium", "high", "existential"])

export const IntegrationBurdenSchema = z.enum(["low", "medium", "high"])

export const InfrastructureDependencySchema = z.enum([
  "cloud_only",
  "hybrid_cloud_on_prem",
  "edge_ot_device",
  "regulated_hosted",
  "mixed",
])

export const AdoptionCadenceSchema = z.enum([
  "instant_self_serve",
  "team_pilot_weeks",
  "enterprise_quarters",
  "capital_cycle_asset",
  "seasonal_budget",
])

export const ReplacementFrequencySchema = z.enum([
  "continuous_daily",
  "weekly_operational",
  "annual_contract",
  "multi_year_asset",
  "episodic_project",
])

export const ProcurementFrictionSchema = z.enum(["low", "medium", "high", "extreme"])

export const OnboardingBurdenSchema = z.enum(["low", "medium", "high"])

export const HumanBehaviorDependencySchema = z.enum(["low", "medium", "high"])

export const ComplianceSensitivitySchema = z.enum(["low", "medium", "high", "existential"])

export const BuyerTypeDNASchema = z.enum([
  "economic_buyer_exec",
  "department_head",
  "practitioner_end_user",
  "consumer_household",
  "procurement_committee",
  "technical_buyer_engineering",
  "mixed_unclear",
])

export const EndUserTypeDNASchema = z.enum([
  "same_as_buyer",
  "frontline_operator",
  "clinician_practitioner",
  "developer_engineer",
  "consumer_end_user",
  "dual_sided_supply_demand",
  "mixed_unclear",
])

export const BusinessDNASchema = z.object({
  /** Operational truth: what is fundamentally sold (capability, outcome, asset), not category label */
  fundamentalOffering: z.string().min(8),
  buyerType: BuyerTypeDNASchema,
  endUserType: EndUserTypeDNASchema,
  salesMotion: SalesMotionSchema,
  deploymentComplexity: DeploymentComplexitySchema,
  implementationModel: ImplementationModelSchema,
  switchingDifficulty: SwitchingDifficultySchema,
  retentionMechanism: RetentionMechanismSchema,
  moatStructure: MoatStructureSchema,
  trustDependency: TrustDependencySchema,
  integrationBurden: IntegrationBurdenSchema,
  infrastructureDependency: InfrastructureDependencySchema,
  adoptionCadence: AdoptionCadenceSchema,
  replacementFrequency: ReplacementFrequencySchema,
  operationalBottleneck: z.string().min(6),
  coreEconomicDriver: z.string().min(6),
  procurementFriction: ProcurementFrictionSchema,
  onboardingBurden: OnboardingBurdenSchema,
  humanBehaviorDependency: HumanBehaviorDependencySchema,
  complianceSensitivity: ComplianceSensitivitySchema,
  scalabilityConstraints: z.array(z.string()).min(1).max(8),
  wedgeStrategy: z.string().min(8),
  expansionVector: z.string().min(8),
  hiddenOperationalRisk: z.string().min(8),
  founderMisconception: z.string().min(8),
  extractionConfidence01: z.number().min(0).max(1),
  extractionSource: z.enum(["heuristic", "gemini", "merged"]),
})

export type BusinessDNA = z.infer<typeof BusinessDNASchema>
