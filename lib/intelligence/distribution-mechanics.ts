import type { DistributionModel, StartupPattern } from "@/lib/intelligence/startup-patterns"

/** Non-generic execution guidance tied to distribution primitives */
export function deriveDistributionMechanics(p: StartupPattern): string[] {
  const lines: string[] = []
  const push = (s: string) => lines.push(s)

  switch (p.distributionModel) {
    case "bottom_up":
      push("Bottoms-up: instrument active workspaces, invite loops, and integration installs — not landing page vanity traffic.")
      push("Win on time-to-wow inside a real repo or team, then climb security review with receipts.")
      break
    case "sales_led":
      push("Sales-led: force crisp ROI math + procurement trail in week one — champion mapping beats volume outreach.")
      break
    case "viral":
      push("Viral: design recipient-side activation (shared links, invites, co-create) with observability on each hop.")
      break
    case "creator_led":
      push("Creator-led: seed supply that ships recurring content units — density in one subculture beats global billboards.")
      break
    case "seo":
      push("SEO-led: own pain-intent queries with durable assets — program capture, not blog poetry.")
      break
    case "community":
      push("Community-led: mod trusted spaces with practitioner proof — lurkers convert when peers narrate failures/successes.")
      break
    case "paid_acquisition":
      push("Paid UA: model cohort LTV with creative fatigue + CAC step-changes — channel tax can flip overnight.")
      break
    case "supply_side_first":
      push("Supply-first: fake-door + manual concierge supply until repeat transactions prove liquidity in one geography.")
      push("Measure supply quality variance — bad supply poisons demand-side trust faster than marketing recovers it.")
      break
    default:
      push("Name the primary distribution spine explicitly — paid, product-led, partner, or supply-led — then test that spine only.")
  }

  if (p.platformRisk === "high") {
    push("Platform risk high: assume reach tax — build capturable data/workflows that survive algorithm or API rug pulls.")
  }

  return lines
}

export type ExecutionPlannerLite = {
  order: number
  day: string
  action: string
  platforms: string[]
  expectedSignals: string
  successIf: string
  failIf: string
}

/** Pattern-native 48h plan — replaces Reddit/LinkedIn boilerplate when model has no primary signal */
export function buildPatternExecutionFallback(p: StartupPattern): ExecutionPlannerLite[] {
  switch (p.distributionModel) {
    case "supply_side_first":
      return [
        {
          order: 1,
          day: "Day 1 (0-24h)",
          action:
            "Manually recruit 12 high-quality supply units in one city; run structured interviews on why they'd trust routing payments through you.",
          platforms: ["Field", "Phone", "Local community groups"],
          expectedSignals: "Supply names specific trust fail-s with incumbents; agrees to pilot with deposits or escrows.",
          successIf: "≥6 supply-side LOIs or deposits for pilot slots → expand matching tests Day 2.",
          failIf: "Supply treats you as lead-gen only or refuses financial commitment → fix wedge or kill city thesis.",
        },
        {
          order: 2,
          day: "Day 1-2",
          action:
            "Run demand-side fake door for the exact SKU with paid intent (not waitlist) in the same micro-market only.",
          platforms: ["Local ads", "Niche communities", "Partner storefronts"],
          expectedSignals: "CTR + paid conversion, plus verbatim fear words on trust/safety.",
          successIf: "Paid conversion ≥ defined threshold you set pre-test → keep city; else rewrite offer once.",
          failIf: "Clicks without dollars after 48h → kill local wedge before scaling.",
        },
        {
          order: 3,
          day: "Day 2 (24-48h)",
          action: "Simulate disintermediation attack — attempt to complete transaction off-platform; measure leakage incentives.",
          platforms: ["Scripted user tests", "Phone"],
          expectedSignals: "Clear moments where users try to cut you out; note pricing + trust triggers.",
          successIf: "You can enforce repeat rake with product hooks (insurance, guarantees) → continue.",
          failIf: "Disintermediation trivial → pivot economics or kill marketplace story.",
        },
      ]
    case "bottom_up":
      return [
        {
          order: 1,
          day: "Day 1 (0-24h)",
          action:
            "Ship a 15-minute integration or template into an existing team workflow; measure activation inside one real account.",
          platforms: ["GitHub", "Slack/Teams", "Customer sandbox"],
          expectedSignals: "Second user invited organically; recurring event logged within 24h.",
          successIf: "≥2 organic invites or repeat session event → double down on that workflow surface.",
          failIf: "Single-player usage only → cut scope to one collaborative moment.",
        },
        {
          order: 2,
          day: "Day 1-2",
          action: "Run 5 live screen shares with practitioners; watch where they hesitate to invite teammates.",
          platforms: ["Zoom", "Meet"],
          expectedSignals: "Permission, embarrassment, or trust blockers surface in their language.",
          successIf: "You can remove the blocker with a product tweak or policy → ship immediately.",
          failIf: "Blocker is existential (no collaborative job) → pivot wedge.",
        },
        {
          order: 3,
          day: "Day 2 (24-48h)",
          action:
            "Instrument upgrade moment (SSO, billing, exports) and attempt to collect dollars or signed expansion email.",
          platforms: ["Email", "CRM"],
          expectedSignals: "Procurement questions vs brush-offs; who holds budget.",
          successIf: "Payment or written expansion criteria → continue land-and-expand.",
          failIf: "No path to budget owner → kill bottoms-up story for this ICP.",
        },
      ]
    case "viral":
    case "creator_led":
      return [
        {
          order: 1,
          day: "Day 1 (0-24h)",
          action:
            "Seed 3 micro-creators with assets that force recipient-side interaction (shared link, duet, remix, invite).",
          platforms: ["TikTok", "IG", "YouTube Shorts", "Discord"],
          expectedSignals: "Recipient-side signups or re-shares attributable to specific asset IDs.",
          successIf: "≥1 asset achieves ≥2 hop re-share chain → double production of that format.",
          failIf: "Only creator vanity metrics → kill format; test new ritual.",
        },
        {
          order: 2,
          day: "Day 1-2",
          action: "Run retention cohort on day-1 vs day-2 return broken down by subculture cluster, not geography.",
          platforms: ["Product analytics", "Discord"],
          expectedSignals: "One cluster shows habit signal; others are tourists.",
          successIf: "Cluster-level D2 retention beats baseline → pour fuel there only.",
          failIf: "No cluster retains → novelty decay beat you; pivot loop or kill.",
        },
        {
          order: 3,
          day: "Day 2 (24-48h)",
          action: "Launch paid experiment on the winning cluster with clear unit economics kill switch.",
          platforms: ["Paid social", "Creator whitelists"],
          expectedSignals: "CAC payback window vs organic contribution margin.",
          successIf: "Paid accelerates organic loop (not replaces it) → continue.",
          failIf: "Paid users ghost → fix product habit before spend.",
        },
      ]
    case "sales_led":
      return [
        {
          order: 1,
          day: "Day 1 (0-24h)",
          action: "Build a 1-page ROI sheet + champion email; book 5 calls with titled economic buyers in one vertical.",
          platforms: ["LinkedIn", "Warm intros", "Phone"],
          expectedSignals: "Buyer schedules with budget language, not exploration.",
          successIf: "≥3 serious calls → continue; else rewrite pain metric.",
          failIf: "Exploratory nos only → kill vertical hypothesis.",
        },
        {
          order: 2,
          day: "Day 1-2",
          action: "Run discovery with security/procurement on the call — surface hard gates early, not post-pilot.",
          platforms: ["Zoom"],
          expectedSignals: "Specific blockers: SSO, DPA, data residency, legal rider.",
          successIf: "You can clear or scope around blockers in <2 weeks → proceed pilot SOW.",
          failIf: "Hard legal wall with no narrow workaround → pivot segment.",
        },
        {
          order: 3,
          day: "Day 2 (24-48h)",
          action: "Send SOW with success criteria + kill clause; ask for signature or PO path.",
          platforms: ["Email", "DocuSign"],
          expectedSignals: "Paper process momentum vs silent stall.",
          successIf: "Signed or scheduled legal review with owner → continue build.",
          failIf: "No paper movement → kill opportunity; do not build features hoping.",
        },
      ]
    default:
      return [
        {
          order: 1,
          day: "Day 1 (0-24h)",
          action:
            "Pick one distribution spine from the pattern graph and run a single-channel falsification with pre-written kill thresholds.",
          platforms: ["Self-selected primary channel"],
          expectedSignals: "Measurable leading indicator tied to that spine (install, reply, deposit, invite).",
          successIf: "Threshold hit → double volume only on that spine.",
          failIf: "Miss threshold → rewrite offer once, then kill channel thesis.",
        },
      ]
  }
}
