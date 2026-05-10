import type { BlindSpotObservation, TimelineEvent, ExperimentEvent, ValidationVerdictEvent } from "@/lib/founder-memory/types"

const IDEA_TEXT = (v: ValidationVerdictEvent) =>
  `${v.ideaTitle}\n${v.ideaExcerpt}`.toLowerCase()

function countIdeas(events: TimelineEvent[], re: RegExp): number {
  let n = 0
  for (const e of events) {
    if (e.kind !== "validation_verdict") continue
    if (re.test(IDEA_TEXT(e))) n++
  }
  return n
}

function concatExperiments(events: ExperimentEvent[]): string {
  return events.map((e) => `${e.actionTaken}\n${e.outcome}\n${e.learnings}`).join("\n").toLowerCase()
}

/**
 * Observation language only — hypotheses tied to repeats in YOUR history, not personality claims.
 */
export function inferBlindSpots(timeline: TimelineEvent[]): BlindSpotObservation[] {
  const verdicts = timeline.filter((e): e is ValidationVerdictEvent => e.kind === "validation_verdict")
  const experiments = timeline.filter((e): e is ExperimentEvent => e.kind === "experiment")
  const fb = timeline.filter((e) => e.kind === "report_feedback")

  const out: BlindSpotObservation[] = []

  const viralish = countIdeas(
    verdicts,
    /\b(viral|invite loop|loops?|network effect|tiktok|referral|credits)\b/i,
  )
  const paidish = countIdeas(verdicts, /\b(paid|pilots?|deposits?|subscription|pricing|invoice|rake)\b/i)
  if (viralish >= 2 && paidish <= 1) {
    out.push({
      id: "virality_vs_wallets",
      text: "Across several filings, geometric growth shows up often before anchored paid motion — pressure-test wallets earlier.",
      basis: "pattern_repeat",
      confidence: viralish >= 3 ? "medium" : "low",
    })
  }

  const aiish = countIdeas(verdicts, /\b(gpt|llm|copilot|openai|prompt|generative ai|chatgpt)\b/i)
  if (aiish >= 2) {
    out.push({
      id: "ai_adjacent_repeat",
      text: "You return to AI-surface wedges — note where hostage workflows differ so you aren't replaying wrapper geometry.",
      basis: "pattern_repeat",
      confidence: aiish >= 3 ? "medium" : "low",
    })
  }

  const silence = experiments.filter((e) =>
    /\b(nothing|nobody|no\s+(clicks?|responses?)|silence)\b/i.test(`${e.outcome} ${e.learnings}`),
  ).length
  if (silence >= 2) {
    out.push({
      id: "silent_distribution_tests",
      text: "Repeated experiments cite silence — narrow ICP and channel before iterating copy.",
      basis: "experiment_outcome",
      confidence: silence >= 3 ? "medium" : "low",
    })
  }

  const waitlistVsPay = concatExperiments(experiments)
  if (/waitlist|sign[- ]?ups?/.test(waitlistVsPay) && !/paid|deposit|card/i.test(waitlistVsPay) && experiments.length >= 3) {
    out.push({
      id: "waitlist_without_money",
      text: "Signal often stops at lists — tie the next falsification step to a payment artifact when honest.",
      basis: "experiment_outcome",
      confidence: "low",
    })
  }

  const asymWithoutOps = countIdeas(verdicts, /\b(platform|novel|paradigm|new behavior|cultural)\b/i)
  const opsAnchor = countIdeas(verdicts, /\b(workflow|ops|slack|zendesk|spreadsheet|ticket|inventory)\b/i)
  if (asymWithoutOps >= 2 && opsAnchor <= 1) {
    out.push({
      id: "narrative_before_workflow",
      text: "Briefs emphasize novel market frames more than hostage workflows — add the removal test on real rituals.",
      basis: "pattern_repeat",
      confidence: "low",
    })
  }

  const harsh = fb.filter((e) => e.tags.includes("too_harsh")).length
  if (harsh >= 2) {
    out.push({
      id: "tone_calibration",
      text: "You've marked memos too harsh repeatedly — tighten real-world snippets so critique stays grounded.",
      basis: "feedback_signal",
      confidence: "medium",
    })
  }

  const repetitive = fb.filter((e) => e.tags.includes("repetitive")).length
  if (repetitive >= 2) {
    out.push({
      id: "repetitive_memo_language",
      text: "Repetitive flags on memos suggest briefs converge — diversify what you're asking the analysis to puncture.",
      basis: "feedback_signal",
      confidence: "medium",
    })
  }

  return out.slice(0, 12)
}
