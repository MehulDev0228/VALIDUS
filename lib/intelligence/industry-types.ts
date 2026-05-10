/**
 * Domain cognition routing — industry layer is orthogonal to StartupArchetype
 * (pattern graph / memo mechanics). Archetype describes go-to-market shape;
 * vertical describes operational and economic reality.
 */

export type IndustryVertical =
  | "manufacturing_robotics"
  | "healthcare"
  | "fintech"
  | "developer_tools"
  | "ai_infrastructure"
  | "saas"
  | "marketplaces"
  | "consumer_social"
  | "enterprise_workflow"
  | "logistics"
  | "education"
  | "creator_economy"
  | "ecommerce"
  | "smb_software"
  | "industrial_infra"
  | "climate_energy"
  | "biotech"
  | "deeptech"
  | "cybersecurity"

export type BusinessModelClass =
  | "saas_subscription"
  | "usage_or_metered"
  | "transaction_or_take_rate"
  | "marketplace_rake"
  | "hardware_plus_service"
  | "managed_service"
  | "licensing_ip"
  | "mixed_unclear"

export type OperationalStructure =
  | "software_only"
  | "software_plus_ops"
  | "hardware_heavy"
  | "regulated_services"
  | "two_sided_platform"
  | "mixed"

export type ComplexityType =
  | "low_touch_plg"
  | "mid_touch_sales"
  | "high_touch_enterprise"
  | "field_ops_heavy"
  | "scientific_or_regulated"

export type BuyerType =
  | "economic_buyer_exec"
  | "practitioner_champion"
  | "consumer_end_user"
  | "procurement_committee"
  | "mixed_unclear"

export type DeploymentModel =
  | "cloud_saas"
  | "on_prem_or_private"
  | "edge_or_device"
  | "hybrid"
  | "managed_hosted"

export interface IndustryClassification {
  primaryVertical: IndustryVertical
  secondaryVertical: IndustryVertical | null
  confidence01: number
  businessModel: BusinessModelClass
  operationalStructure: OperationalStructure
  complexityType: ComplexityType
  buyerType: BuyerType
  deploymentModel: DeploymentModel
  /** Short rationale for debugging / audit */
  rationale: string
}
