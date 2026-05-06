import type {
  FounderOnboardingProfile,
  FounderTrustSignalsV1,
  ProgressionPatternLine,
  TimelineEvent,
} from "@/lib/founder-memory/types"

export type JourneySurfaceInput = {
  timeline: TimelineEvent[]
  onboarding?: FounderOnboardingProfile | null
  trustSignals?: FounderTrustSignalsV1 | null
  memoFilings: number
  ideaThreads: number
  unresolvedAssumptionCount: number
  experimentEvents: number
  progressionPatterns: ProgressionPatternLine[]
  executionFrictionLine?: string
  blindSpotsHeadline?: string
}

function stageLabel(s: FounderOnboardingProfile["founderStage"]): string {
  const map: Record<FounderOnboardingProfile["founderStage"], string> = {
    idea: "pre-build / idea",
    mvp: "MVP",
    early_revenue: "early revenue",
    scaling: "scaling",
    explorer: "exploring wedges",
  }
  return map[s]
}

function disprovenCheckinsLastDays(timeline: TimelineEvent[], days: number): number {
  const t0 = Date.now() - days * 86400_000
  return timeline.filter(
    (e) => e.kind === "execution_checkin" && e.status === "disproven" && Date.parse(e.at) >= t0,
  ).length
}

/** Calm continuity lines derived from behaviors already on file. */
export function buildJourneySurface(inp: JourneySurfaceInput): string[] {
  const lines: string[] = []
  const { memoFilings, ideaThreads } = inp

  if (memoFilings === 0) {
    lines.push("Archive is quiet — first memo stamps the ledger and opens the workspace thread.")
    if (inp.onboarding) {
      if (inp.onboarding.skipped) {
        lines.push("Neutral defaults on file — intake deferred until you want richer context.")
      } else {
        lines.push(
          `On file: ${stageLabel(inp.onboarding.founderStage)} · ${inp.onboarding.experience.replace("_", "-")} founder context.`,
        )
      }
    }
    return lines.slice(0, 5)
  }

  const threadBit =
    ideaThreads > 0
      ? `${ideaThreads} lineage thread${ideaThreads === 1 ? "" : "s"} grouped from your brief fingerprints`
      : "lineages still sparse — reuse the same core brief wording to group repeats"

  lines.push(`${memoFilings} memo filing${memoFilings === 1 ? "" : "s"} · ${threadBit}.`)

  if (inp.onboarding) {
    if (inp.onboarding.skipped) {
      lines.push("Neutral framing defaults on file — intake was deferred; memos stand on their own merits.")
    } else {
      const mk =
        inp.onboarding.market === "both"
          ? "B2B + B2C"
          : inp.onboarding.market === "unsure"
            ? "market TBD"
            : inp.onboarding.market.toUpperCase()
      lines.push(
        `Framing on file: ${stageLabel(inp.onboarding.founderStage)} · ${mk} · ${inp.onboarding.team.replace(/_/g, " ")} · traction: ${inp.onboarding.traction.replace(/_/g, " ")} · ${inp.onboarding.experience === "repeat" ? "repeat founder" : "first-time founder"}.`,
      )
    }
  }

  const dis30 = disprovenCheckinsLastDays(inp.timeline, 30)
  if (dis30 > 0) {
    lines.push(
      `Last 30 days: ${dis30} execution check-in${dis30 === 1 ? "" : "s"} marked disproven — negative evidence is part of the record.`,
    )
  }

  if (inp.unresolvedAssumptionCount > 0) {
    lines.push(`${inp.unresolvedAssumptionCount} assumption${inp.unresolvedAssumptionCount === 1 ? "" : "s"} still unresolved on the latest memos — workspace links them to experiments.`)
  }

  if (inp.experimentEvents > 0) {
    lines.push(`${inp.experimentEvents} experiment entr${inp.experimentEvents === 1 ? "y" : "ies"} logged in your founder timeline.`)
  }

  if ((inp.trustSignals?.resultsViewsTotal ?? 0) >= 6) {
    lines.push(
      `Results surfaced roughly ${inp.trustSignals!.resultsViewsTotal} times — if re-reads outpace field notes, carve one falsification receipt before the next pass.`,
    )
  }

  const pat = inp.progressionPatterns[0]
  if (pat) lines.push(pat.text)

  const fr = inp.executionFrictionLine?.trim()
  if (fr) lines.push(fr)

  const bs = inp.blindSpotsHeadline?.trim()
  if (bs) lines.push(bs)

  /** Dedup near-identical endings */
  const seen = new Set<string>()
  const out: string[] = []
  for (const ln of lines) {
    const k = ln.slice(0, 48).toLowerCase()
    if (seen.has(k)) continue
    seen.add(k)
    out.push(ln)
  }

  return out.slice(0, 6)
}
