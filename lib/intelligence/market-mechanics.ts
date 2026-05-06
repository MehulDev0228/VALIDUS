import type { MarketType, NetworkEffectType, RiskTier, StartupPattern, SwitchTier } from "@/lib/intelligence/startup-patterns"

/** Derive market-structure implications from explicit primitives */
export function deriveMarketMechanics(p: StartupPattern): string[] {
  const lines: string[] = []

  const mk = (s: string) => lines.push(s)

  if (p.marketType === "marketplace") {
    mk("Marketplace physics: cross-side liquidity + local density beat national vanity metrics.")
    mk("Watch disintermediation after first match — repeat transactions decide rake durability.")
  }
  if (p.marketType === "developer_tool" || p.marketType === "infra") {
    mk("Developer surface: time-to-first-value and migration tax beat slide-deck differentiation.")
    mk("Bundling threat from cloud incumbents is default — moat must live in workflow embed depth.")
  }
  if (p.marketType === "workflow" || p.marketType === "b2b_saas") {
    mk("Workflow surface: champion + economic buyer split kills expansion if success criteria stay fuzzy.")
    mk("Procurement + security review gates convert bottoms-up signals into revenue only with receipts.")
  }
  if (p.marketType === "consumer_social") {
    mk("Consumer social: novelty half-life + moderation/legal drag often outrun early growth charts.")
  }
  if (p.marketType === "fintech") {
    mk("Fintech: regulatory perimeter + fraud tails are first-class product risks, not footnotes.")
  }
  if (p.marketType === "ecommerce" || p.marketType === "creator_tool") {
    mk("Brand/creator SKUs: margin bridge (CAC, returns, COGS) matters as much as conversion rate.")
  }
  if (p.marketType === "ai_wrapper") {
    mk("AI wrappers: provider roadmap + eval liability compress windows — durable value needs owned workflow state.")
  }

  networkEffectNotes(p.networkEffectType, p.switchingCost).forEach(mk)
  timingNotes(p.timingSensitivity).forEach(mk)

  return dedupe(lines)
}

function networkEffectNotes(n: NetworkEffectType, switching: SwitchTier): string[] {
  const out: string[] = []
  if (n === "cross_side") {
    out.push("Cross-side effects: supply and demand learning curves are asymmetric — identify the scarcer side early.")
  }
  if (n === "direct") {
    out.push("Direct nfx: each incremental user should sharpen the value prop for the next — else growth is rent, not compounding.")
  }
  if (n === "data") {
    out.push("Data loops: label the feedback asset (what gets better, for whom) or it is cosplay moat language.")
  }
  if (n === "workflow_lockin") {
    out.push("Workflow lock-in: switching cost accrues in integrations, permissions, and comment graphs — not login walls.")
  }
  if (n === "none" && switching === "low") {
    out.push("Low switching with weak nfx: distribution and habit must carry retention — expect multi-homing.")
  }
  return out
}

function timingNotes(t: RiskTier): string[] {
  if (t === "high") {
    return [
      "Timing-sensitive: small calendar windows decide whether distribution channels stay open or get taxed by platforms/regulators.",
    ]
  }
  if (t === "medium") {
    return ["Timing medium: channel arbitrage still exists but requires faster iteration than incumbents copying features."]
  }
  return ["Timing low: durable execution and distribution depth matter more than being first-to-meme."]
}

function dedupe(lines: string[]): string[] {
  const seen = new Set<string>()
  return lines.filter((l) => {
    const k = l.toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}
