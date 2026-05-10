import type { IdeaInput } from "@/lib/schemas/idea"

export type IterateRefined = {
  title: string
  description: string
  targetMarket: string
  industry: string
  revenueModel: string
  keyFeatures: string[]
  keyChanges: string[]
  whyChanged: string[]
}

function collectWeaknesses(lv: Record<string, unknown> | undefined): string[] {
  if (!lv || typeof lv !== "object") return []
  const out: string[] = []
  const fr = lv.finalVerdict as Record<string, unknown> | undefined
  if (fr?.topReasons) out.push(...((fr.topReasons as string[]) ?? []).slice(0, 5))
  if (fr?.topRisks) out.push(...((fr.topRisks as string[]) ?? []).slice(0, 5))
  const wf = lv.whyThisIdeaWillLikelyFail as string[] | undefined
  if (wf) out.push(...wf.slice(0, 5))
  const kr = lv.keyRisks as string[] | undefined
  if (kr) out.push(...kr.slice(0, 3))
  const risks = lv.topRisks as string[] | undefined
  if (risks) out.push(...risks.slice(0, 5))
  return Array.from(new Set(out.map((s) => String(s).trim()).filter(Boolean))).slice(0, 12)
}

/**
 * Offline / no-LLM refinement: tighten copy around surfaced weaknesses + founder logs.
 */
export function buildDeterministicIterateRefinement(
  idea: IdeaInput,
  lastValidation: Record<string, unknown> | undefined,
  attempts: Array<{ actionTaken: string; result: string; learnings: string }>,
): IterateRefined {
  const weaker = collectWeaknesses(lastValidation)
  const logLines = attempts
    .slice(0, 8)
    .flatMap((a) => [
      a.actionTaken && `Did: ${a.actionTaken}`,
      a.result && `Saw: ${a.result}`,
      a.learnings && `Learned: ${a.learnings}`,
    ])
    .filter(Boolean)

  const tensionBlock =
    weaker.length > 0
      ? `\n\n--- From the memo (address explicitly) ---\n${weaker.map((w) => `• ${w}`).join("\n")}`
      : ""

  const logBlock =
    logLines.length > 0 ? `\n\n--- From your validation log ---\n${logLines.map((l) => `• ${l}`).join("\n")}` : ""

  const description = `${idea.description.trim()}${tensionBlock}${logBlock}`.slice(0, 8000)

  const keyChanges = [
    weaker.length ? `Surfaced ${Math.min(weaker.length, 5)} memo tensions directly in the brief.` : "Anchored the brief to memo tensions.",
    attempts.length ? `Folded in ${attempts.length} validation log entr${attempts.length === 1 ? "y" : "ies"}.` : "Ready for your next experiment notes.",
  ]

  const whyChanged = [
    "Gemini isn’t configured or failed — this is a deterministic merge so you’re never blocked.",
    weaker.length
      ? "Weak lines from the verdict are copied in so the next run debates the same risks."
      : "No extracted weaknesses — tighten manually after the next conversation.",
  ]

  return {
    title: idea.title.slice(0, 200),
    description,
    targetMarket: idea.targetMarket?.slice(0, 2000) ?? "",
    industry: idea.industry ?? "other",
    revenueModel: idea.revenueModel ?? "other",
    keyFeatures: idea.keyFeatures?.length ? [...idea.keyFeatures] : ["Sharpen wedge after memo read", "Prove buyer pull cheaply"],
    keyChanges,
    whyChanged,
  }
}
