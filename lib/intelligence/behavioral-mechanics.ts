import type { BehavioralDependency, StartupPattern } from "@/lib/intelligence/startup-patterns"

export function deriveBehavioralMechanics(p: StartupPattern): string[] {
  const lines: string[] = []
  const push = (s: string) => lines.push(s)

  switch (p.behavioralDependency as BehavioralDependency) {
    case "trust":
      push(
        "Trust mechanics: failure is emotional variance — search for moments where users fear being fooled more than being inconvenienced.",
      )
      push("Trust products monetize risk reduction — prove legibility (signals, guarantees, escrow) before abstract UX polish.")
      break
    case "habit":
      push("Habit loops: measure daily active intent, not signups — absent ritual slots, growth is a firework.")
      break
    case "utility":
      push("Utility adoption: time/money saved must be obvious in first session — subtle value dies in procurement purgatory.")
      break
    case "status":
      push("Status-driven adoption: identity signals decay fast — map who gains prestige from using you vs hiding usage.")
      break
    case "identity":
      push("Identity tools: users adopt to signal craft — migration wars are about reputation and portfolio, not price lists.")
      break
    case "fear":
      push("Fear-driven buying: negative selection in sales — nail the failure mode customers actually lose sleep over.")
      break
    case "social_validation":
      push("Social validation: graph density beats feature depth early — seed micro-communities with tangible status rewards.")
      break
  }

  if (p.patternTags?.some((t) => t.includes("low_trust"))) {
    push(
      "Low-trust marketplace: demand appears only when substitute quality variance is transparently legible (photos, reviews, escrow).",
    )
  }

  return lines
}
