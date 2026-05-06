/**
 * Investor-memo fingerprint reduction — deterministic variety, not random gibberish.
 */

import type { ExecutionPlannerLite } from "@/lib/intelligence/distribution-mechanics"

/** Phrases that cluster across runs; strip or replace lightly. */
export const INVESTOR_MEMO_FINGERPRINTS: Array<{ re: RegExp; alts: string[] }> = [
  {
    re: /\bscale\s+narrative\b/gi,
    alts: ["expansion plot", "size-up storyline", "ramp thesis"],
  },
  {
    re: /\bgrowth\s+story\b/gi,
    alts: ["traction arc", "ramp narrative", "expansion thread"],
  },
  {
    re: /\bshow\s+receipts\b|\bcategory-native\s+receipts?\b/gi,
    alts: ["prove with cited signals", "ground claims in attributable proof", "evidence-backed trail"],
  },
  {
    re: /\bworkflow\b(?!\s+cadence)/gi,
    alts: ["operating path", "job loop", "repeat ritual"],
  },
  {
    re: /\bworkflow\s+cadence\b/gi,
    alts: ["weekly ritual timing", "repeat rhythm in the job", "how often the task actually fires"],
  },
  {
    re: /\btighten\s+the\s+wedge\b|\bnarrow\s+the\s+wedge\b/gi,
    alts: ["shrink SKU to one hostage failure", "collapse scope to one measurable break", "pick one sharp failure mode"],
  },
  {
    re: /\binvestor\s+curiosity\b/gi,
    alts: ["spectator interest", "deck-page intrigue", "slide-deck attention"],
  },
  {
    re: /\bnamed\s+first\s+buyer\b/gi,
    alts: ["one identifiable payer", "specific economic signer", "single budget line you can name"],
  },
  {
    re: /\bcategory-native\s+proofs?\b/gi,
    alts: ["category-specific receipts", "native-to-the-workload evidence"],
  },
  {
    re: /\boperator\s+theater\b/gi,
    alts: ["performative busywork", "motion without a kill metric"],
  },
]

/** Execution / GTM template words — diversify when they dominate a line. */
const EXEC_LEX_REPLACEMENTS: Array<{ re: RegExp; alts: string[] }> = [
  {
    re: /\bfake\s+door\b/gi,
    alts: ["smoke SKU page", "pre-product demand page", "kill-switch landing"],
  },
  {
    re: /\bcollect\s+deposits?\b|\bdeposit\s+prefund\b/gi,
    alts: ["capture prepayment", "take a modest hold fee", "card-on-file wedge"],
  },
  {
    re: /\bremoval\s+test\b/gi,
    alts: ["rip-out drill", "vanishMonday thought experiment", "subtract-and-see"],
  },
  { re: /\binstrument\b/gi, alts: ["log", "measure", "tally", "record"] },
  { re: /\binstrumentation\b/gi, alts: ["logging", "telemetry", "counts"] },
  { re: /\bretention\s+cohort\b/gi, alts: ["returning-user slice", "D2/D7 revisit cohort", "repeat-use bucket"] },
  { re: /\bbudget\s+owner\b/gi, alts: ["economic signer", "cardholder buyer", "who signs the PO"] },
  {
    re: /\binvite\s+loop\b|\binvite\s+geometry\b/gi,
    alts: ["second-seat pull", "distribution hop", "bring-a-colleague pull"],
  },
]

function pickAlt(alts: string[], salt: number): string {
  return alts[Math.abs(salt) % alts.length]!
}

/** Replace first match per pattern; salt shifts choice. */
export function diversifyMemoLanguage(text: string, seed: number): string {
  let out = text
  let salt = seed
  for (const { re, alts } of INVESTOR_MEMO_FINGERPRINTS) {
    re.lastIndex = 0
    if (!re.test(out)) continue
    re.lastIndex = 0
    out = out.replace(re, () => {
      salt = (salt * 31 + 17) >>> 0
      return pickAlt(alts, salt)
    })
  }
  return out.replace(/\s+/g, " ").trim()
}

/** Softer pass on execution rows — one substitution per field per row max to stay readable. */
export function diversifyExecutionLexicon(steps: ExecutionPlannerLite[], seed: number): ExecutionPlannerLite[] {
  let salt = seed
  return steps.map((step, idx) => {
    salt = (salt + idx * 997) >>> 0
    const morph = (s: string): string => {
      let t = s
      for (const { re, alts } of EXEC_LEX_REPLACEMENTS) {
        if (!re.test(t)) continue
        re.lastIndex = 0
        salt = (salt * 13 + 9) >>> 0
        t = t.replace(re, () => pickAlt(alts, salt))
        break
      }
      return t
    }
    return {
      ...step,
      order: idx + 1,
      action: morph(step.action),
      expectedSignals: morph(step.expectedSignals),
      successIf: morph(step.successIf),
      failIf: morph(step.failIf),
    }
  })
}

/** Collapse duplicated clause openers across bullets (light pass). */
export function dedupeOpeningJitter(lines: string[], seed: number): string[] {
  const seen = new Set<string>()
  return lines.map((line, i) => {
    const m = line.match(/^([^:]{0,22}:)/)
    const prefix = m?.[1]?.toLowerCase() ?? ""
    if (prefix && seen.has(prefix)) {
      const prefixes = ["Lens: ", "Mechanism: ", "Friction: ", "Buyer truth: "]
      const stub = line.includes(":") ? line.slice(line.indexOf(":") + 1).trim() : line
      return `${prefixes[(seed + i) % prefixes.length]}${stub}`
    }
    if (prefix) seen.add(prefix)
    return line
  })
}
