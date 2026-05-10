import type { IdeaInput } from "@/lib/schemas/idea"

/**
 * Reconstruct the validate form payload from a free memo JSON blob when
 * `lastIdeaInput` was never written (e.g. opened results via ?run= link or new tab).
 */
export function ideaInputFromFreeValidation(v: Record<string, unknown>): IdeaInput {
  const ic = v.ideaContext as Record<string, unknown> | undefined
  const meta = v.metadata as Record<string, unknown> | undefined

  const core =
    (typeof v.idea_title === "string" && v.idea_title.trim()) ||
    (ic && typeof ic.coreIdea === "string" && ic.coreIdea.trim()) ||
    (typeof v.ideaSummary === "string" && v.ideaSummary.trim()) ||
    "Untitled idea"

  let title = core.slice(0, 200)
  if (title.trim().length < 3) title = `${title.trim() || "Idea"} ··`.slice(0, 200)

  const problem = ic && typeof ic.problem === "string" ? ic.problem.trim() : ""
  const target = ic && typeof ic.targetUser === "string" ? ic.targetUser.trim() : ""
  const market = ic && typeof ic.market === "string" ? ic.market.trim() : ""
  const ideaLine = ic && typeof ic.coreIdea === "string" ? ic.coreIdea.trim() : ""

  const descriptionParts = [problem, target && `Buyer: ${target}`, market && `Market: ${market}`, ideaLine].filter(
    Boolean,
  )
  let description = descriptionParts.join("\n\n").trim()
  if (description.length < 10) {
    description = `${core}\n\n${typeof v.summary === "string" ? v.summary.slice(0, 4000) : "Brief reconstructed from memo output."}`
  }
  description = description.slice(0, 8000)

  const industryRaw =
    (typeof meta?.industry === "string" && meta.industry) ||
    market.split(/[,;]/)[0]?.trim() ||
    "other"

  return {
    title,
    description,
    industry: industryRaw.slice(0, 80),
    targetMarket: market.slice(0, 2000) || undefined,
    revenueModel: "other",
    keyFeatures: [],
    useMode: "free",
  }
}
