import type { IdeaInput } from "@/lib/schemas/idea"
import type {
  BusinessModelClass,
  BuyerType,
  ComplexityType,
  DeploymentModel,
  IndustryClassification,
  IndustryVertical,
  OperationalStructure,
} from "@/lib/intelligence/industry-types"

function corpus(idea: IdeaInput): string {
  const feat = (idea.keyFeatures || []).join(" ")
  return `${idea.title} ${idea.description} ${idea.industry || ""} ${idea.targetMarket || ""} ${idea.revenueModel || ""} ${feat}`.toLowerCase()
}

function scoreKeys(t: string, keys: string[], weight = 1): number {
  let n = 0
  for (const k of keys) {
    if (t.includes(k)) n += weight
  }
  return n
}

/** Strong signals that this is NOT a consumer marketplace (industrial B2B language). */
function industrialB2BAnchor(t: string): number {
  return scoreKeys(t, [
    "factory",
    "manufacturing",
    "cnc",
    "plc",
    "scada",
    "mes",
    "oee",
    "throughput",
    "cobot",
    "industrial robot",
    "assembly line",
    "production line",
    "work cell",
    "oems",
    "oem",
    "tier 1",
    "tier-1",
    "plant manager",
    "shop floor",
    "andon",
    "automation cell",
    "pick and place",
    "vision system",
    "safety interlock",
  ])
}

const VERTEX_WEIGHTS: Array<{
  id: IndustryVertical
  keys: string[]
  w?: number
}> = [
  {
    id: "manufacturing_robotics",
    keys: [
      "robot",
      "robotic",
      "cobot",
      "factory",
      "manufacturing",
      "assembly",
      "cnc",
      "plc",
      "scada",
      "mes",
      "oee",
      "industrial automation",
      "shop floor",
      "production line",
      "work cell",
      "vision inspection",
    ],
    w: 1.3,
  },
  {
    id: "industrial_infra",
    keys: [
      "industrial",
      "power plant",
      "grid",
      "substation",
      "process control",
      "dcs",
      "turbine",
      "compressor",
      "pump skids",
      "ot network",
      "ot security",
    ],
  },
  {
    id: "logistics",
    keys: [
      "warehouse",
      "fulfillment",
      "3pl",
      "wms",
      "tms",
      "last mile",
      "freight",
      "carrier",
      "dock",
      "cross dock",
      "fleet",
      "routing",
      "slotting",
    ],
  },
  {
    id: "healthcare",
    keys: [
      "clinical",
      "ehr",
      "emr",
      "hipaa",
      "patient",
      "provider",
      "payer",
      "reimbursement",
      "cpt",
      "prior authorization",
      "prior auth",
      "fda cleared",
      "fda approved",
      "medical device",
      "hospital",
      "physician",
      "nursing",
      "pharma",
      "lab ",
      "diagnostic",
    ],
  },
  {
    id: "biotech",
    keys: [
      "biotech",
      "clinical trial",
      "fda approval",
      "therapeutic",
      "antibody",
      "crispr",
      "wet lab",
      "assay",
      "cell therapy",
      "gene therapy",
      "cro ",
    ],
  },
  {
    id: "fintech",
    keys: [
      "payment",
      "lending",
      "credit",
      "underwriting",
      "bank",
      "issuer",
      "card ",
      "wallet",
      "ach",
      "wire",
      "kyc",
      "aml",
      "pci",
      "fraud",
      "ledger",
      "banking",
      "neo bank",
      "remittance",
      "bnpl",
    ],
  },
  {
    id: "cybersecurity",
    keys: [
      "security",
      "soc ",
      "siem",
      "edr",
      "xdr",
      "zero trust",
      "cve",
      "pentest",
      "ransomware",
      "identity provider",
      "sso",
      "mfa",
      "cspm",
      "iam ",
    ],
  },
  {
    id: "developer_tools",
    keys: [
      "sdk",
      "api",
      "developer",
      "kubernetes",
      "ci/cd",
      "git ",
      "observability",
      "devtools",
      "npm",
      "terraform",
      "pulumi",
      "cli ",
      "ide ",
    ],
  },
  {
    id: "ai_infrastructure",
    keys: [
      "gpu cluster",
      "model serving",
      "inference",
      "vector db",
      "embedding",
      "fine tune",
      "eval harness",
      "llm ops",
      "ml ops",
      "feature store",
      "training pipeline",
      "foundation model",
      "eval suite",
    ],
  },
  {
    id: "saas",
    keys: ["saas", "subscription", "per seat", "workflow software", "cloud software"],
    w: 0.85,
  },
  {
    id: "smb_software",
    keys: ["smb", "small business", "main street", "quickbooks", "local merchant", "mom and pop"],
  },
  {
    id: "enterprise_workflow",
    keys: ["enterprise", "salesforce", "servicenow", "procurement", "shared services", "sso ", "it governance"],
  },
  {
    id: "marketplaces",
    keys: [
      "marketplace",
      "two-sided",
      "two sided",
      "take rate",
      "rake",
      "buyers and sellers",
      "liquidity",
      "disintermediation",
      "cold start",
      "hosts and guests",
    ],
    w: 1.2,
  },
  {
    id: "consumer_social",
    keys: ["social network", "social app", "friends", "feed ", "viral", "tiktok", "instagram-like", "short video social"],
  },
  {
    id: "creator_economy",
    keys: ["creator", "audience", "membership", "substack", "patron", "tips ", "course ", "digital products"],
  },
  {
    id: "ecommerce",
    keys: ["dtc", "ecommerce", "sku", "merchant", "checkout", "cart ", "shopify", "consumer brand"],
  },
  {
    id: "education",
    keys: ["curriculum", "lms", "student", "district", "accreditation", "university", "k-12", "edtech"],
  },
  {
    id: "climate_energy",
    keys: [
      "carbon",
      "renewable",
      "solar",
      "battery",
      "energy storage",
      "grid",
      "cleantech",
      "climate",
      "ev charging",
      "heat pump",
    ],
  },
  {
    id: "deeptech",
    keys: ["semiconductor", "photonics", "quantum", "material science", "new chemistry", "satellite", "space hardware"],
  },
]

function scoreVerticals(t: string): Array<{ id: IndustryVertical; score: number }> {
  const indAnchor = industrialB2BAnchor(t)
  const out: Array<{ id: IndustryVertical; score: number }> = []
  for (const row of VERTEX_WEIGHTS) {
    const mult = row.w ?? 1
    let s = scoreKeys(t, row.keys) * mult
    /** Penalize marketplace bucket when text is clearly industrial/Ops — avoids robotics → marketplace. */
    if (row.id === "marketplaces" && indAnchor >= 3) {
      s -= indAnchor * 2.2
    }
    if (row.id === "consumer_social" && indAnchor >= 2) {
      s -= 4
    }
    out.push({ id: row.id, score: s })
  }
  out.sort((a, b) => b.score - a.score)
  return out
}

function inferBusinessModel(t: string, primary: IndustryVertical): BusinessModelClass {
  if (/\bmarketplace\b|\btwo-sided\b|\btake rate\b|\brace\b|\bcommission\b/i.test(t)) return "marketplace_rake"
  if (/\btransaction\b|\binterchange\b|\bpsp\b|\bprocessing fee\b/i.test(t)) return "transaction_or_take_rate"
  if (/\bgpu\b|\btoken\b|\bmetered\b|\busage-based\b|\bper api call\b/i.test(t)) return "usage_or_metered"
  if (/\bhardware\b|\bdevice\b|\bcapex\b|\bon-prem appliance\b/i.test(t)) return "hardware_plus_service"
  if (/\blicens/i.test(t) || /\bio\b/.test(t)) return "licensing_ip"
  if (/\bmanaged service\b|\boutcome-based\b|\bsla\b.*\bfield\b/i.test(t)) return "managed_service"
  if (primary === "marketplaces") return "marketplace_rake"
  if (primary === "fintech" && /payment|card|wallet/i.test(t)) return "transaction_or_take_rate"
  if (/\bsubscription\b|\bsaas\b|\bper seat\b|\bannual contract\b/i.test(t)) return "saas_subscription"
  return "mixed_unclear"
}

function inferOperationalStructure(t: string, primary: IndustryVertical): OperationalStructure {
  if (/\bmarketplace\b|\btwo-sided\b/i.test(t) || primary === "marketplaces") return "two_sided_platform"
  if (industrialB2BAnchor(t) >= 2 || /hardware|robot|capex|field install/i.test(t)) return "software_plus_ops"
  if (/fda|clinical trial|regulated medical/i.test(t) || primary === "healthcare" || primary === "biotech")
    return "regulated_services"
  if (/device firmware|edge|plc|robot controller/i.test(t)) return "hardware_heavy"
  return "software_only"
}

function inferComplexity(t: string, primary: IndustryVertical): ComplexityType {
  if (/clinical trial|fda|phase [12]|wet lab/i.test(t) || primary === "biotech") return "scientific_or_regulated"
  if (/enterprise|procurement|rfp|security review|soc 2/i.test(t)) return "high_touch_enterprise"
  if (industrialB2BAnchor(t) >= 2 || /field engineer|install|commissioning/i.test(t)) return "field_ops_heavy"
  if (/plg|self serve|signup|freemium/i.test(t)) return "low_touch_plg"
  return "mid_touch_sales"
}

function inferBuyer(t: string, primary: IndustryVertical): BuyerType {
  if (/consumer app| end user|download the app|instagram/i.test(t) || primary === "consumer_social") return "consumer_end_user"
  if (/cfo|procurement|committee|rfb|rfp/i.test(t)) return "procurement_committee"
  if (/plant manager|director of manufacturing|head of engineering ops/i.test(t)) return "practitioner_champion"
  if (/vp |cio|cto|head of/i.test(t)) return "economic_buyer_exec"
  if (primary === "healthcare" && /physician|clinician|nurse/i.test(t)) return "practitioner_champion"
  return "mixed_unclear"
}

function inferDeployment(t: string, primary: IndustryVertical): DeploymentModel {
  if (/on.prem|private cloud|vpc|air gap|factory network/i.test(t)) return "on_prem_or_private"
  if (/edge|plc|robot controller|device firmware|ot\b/i.test(t)) return "edge_or_device"
  if (/saas|hosted|multi.tenant/i.test(t)) return "cloud_saas"
  if (primary === "manufacturing_robotics" || primary === "industrial_infra") return "hybrid"
  return "cloud_saas"
}

/** True when the founder pitch explicitly describes a two-sided marketplace (not industrial supply-chain wording). */
export function isExplicitTwoSidedMarketplaceText(t: string): boolean {
  const s = t.toLowerCase()
  return /\bmarketplace\b|\btwo-sided\b|\btwo sided\b|\btake rate\b|\brake\b|\bdisintermediation\b|\bbuyers and sellers\b|\bgig economy\b/i.test(
    s,
  )
}

export function isExplicitTwoSidedMarketplace(idea: IdeaInput): boolean {
  return isExplicitTwoSidedMarketplaceText(corpus(idea))
}

export function classifyIndustryFromIdea(idea: IdeaInput): IndustryClassification {
  const t = corpus(idea)
  const ranked = scoreVerticals(t)
  const best = ranked[0]
  const second = ranked[1]

  let primary: IndustryVertical = best.id
  let conf = 0.55
  if (best.score >= 4) conf = 0.82
  else if (best.score >= 2.5) conf = 0.72
  else if (best.score >= 1.2) conf = 0.62

  if (
    second &&
    second.score > 0 &&
    best.score > 0 &&
    second.score >= best.score * 0.85 &&
    second.id !== best.id
  ) {
    conf = Math.max(0.45, conf - 0.08)
  }

  const secondary: IndustryVertical | null =
    second && second.score >= 1 && second.id !== primary && second.score >= best.score * 0.35 ? second.id : null

  /** Weak scores — fall back to generic SaaS-shaped software unless marketplace clearly wins */
  if (best.score < 0.9) {
    primary = "saas"
    conf = 0.48
  }

  const rationale = `top=${best.id}(${best.score.toFixed(2)}) second=${second?.id ?? "none"}(${second?.score.toFixed(2) ?? "0"}) industrial_anchor=${industrialB2BAnchor(t)}`

  return {
    primaryVertical: primary,
    secondaryVertical: secondary,
    confidence01: Math.min(0.92, conf),
    businessModel: inferBusinessModel(t, primary),
    operationalStructure: inferOperationalStructure(t, primary),
    complexityType: inferComplexity(t, primary),
    buyerType: inferBuyer(t, primary),
    deploymentModel: inferDeployment(t, primary),
    rationale,
  }
}
