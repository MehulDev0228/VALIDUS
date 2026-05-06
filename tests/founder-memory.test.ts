import { describe, expect, it } from "vitest"
import { deriveFounderProfile } from "@/lib/founder-memory/profile"
import { inferBlindSpots } from "@/lib/founder-memory/blind-spots"
import { buildIdeaLineages } from "@/lib/founder-memory/lineage"
import { buildWhatChangedDigest } from "@/lib/founder-memory/change-detection"
import { deriveExecutionTaskItems } from "@/lib/founder-memory/execution-tasks"
import { inferExecutionPatterns } from "@/lib/founder-memory/execution-memory"
import { buildValidationEvolution } from "@/lib/founder-memory/validation-evolution"
import { buildJourneySurface } from "@/lib/founder-memory/journey-surface"
import { SKIP_ONBOARDING_DEFAULTS } from "@/lib/founder-memory/onboarding-schema"
import type { TimelineEvent } from "@/lib/founder-memory/types"

describe("founder-memory profile + blind spots", () => {
  it("inferBlindSpots flags repeated viral-before-paid language", () => {
    const timeline: TimelineEvent[] = [
      {
        kind: "validation_verdict",
        id: "v1",
        at: new Date().toISOString(),
        ideaId: "i1",
        ideaTitle: "Virality-first consumer app",
        ideaExcerpt: "We unlock growth through viral invite loops.",
        verdict: "PIVOT",
      },
      {
        kind: "validation_verdict",
        id: "v2",
        at: new Date().toISOString(),
        ideaId: "i2",
        ideaTitle: "Friends graph growth",
        ideaExcerpt: "Network effects and TikTok funnel for acquisition.",
        verdict: "PIVOT",
      },
    ]
    const spots = inferBlindSpots(timeline)
    expect(spots.some((s) => s.id === "virality_vs_wallets")).toBe(true)
  })

  it("deriveFounderProfile labels ai Adjacent repetition", () => {
    const timeline: TimelineEvent[] = [
      {
        kind: "validation_verdict",
        id: "a1",
        at: new Date().toISOString(),
        ideaId: "x",
        ideaTitle: "GPT for invoices",
        ideaExcerpt: "OpenAI wrapper summarizes PDFs.",
        verdict: "PIVOT",
      },
      {
        kind: "validation_verdict",
        id: "a2",
        at: new Date().toISOString(),
        ideaId: "y",
        ideaTitle: "LLM cockpit",
        ideaExcerpt: "ChatGPT UX for spreadsheets.",
        verdict: "BUILD",
      },
    ]
    const p = deriveFounderProfile(timeline)
    expect(p.founderArchetype).toBe("ai_adjacent")
    expect(p.verdictCounts.PIVOT + p.verdictCounts.BUILD).toBe(2)
  })

  it("buildIdeaLineages merges two filings with same ideaKey", () => {
    const key = "stable-key-abc"
    const timeline: TimelineEvent[] = [
      {
        kind: "validation_verdict",
        id: "v1",
        at: "2026-01-02T00:00:00.000Z",
        ideaId: "run_a",
        ideaKey: key,
        ideaTitle: "Payment tool",
        ideaExcerpt: "Description A",
        verdict: "PIVOT",
        memoSnapshot: {
          risks: ["fraud tail"],
          assumptions: ["buyer pays"],
          validationGaps: [],
          topReasons: [],
          pivotTitles: [],
          verdict: "PIVOT",
          opportunityScore: 40,
        },
      },
      {
        kind: "validation_verdict",
        id: "v2",
        at: "2026-01-10T00:00:00.000Z",
        ideaId: "run_b",
        ideaKey: key,
        ideaTitle: "Payment tool v2",
        ideaExcerpt: "Description B",
        verdict: "BUILD",
        memoSnapshot: {
          risks: ["fraud tail", "procurement stall"],
          assumptions: ["buyer pays", "pci scope"],
          validationGaps: [],
          topReasons: [],
          pivotTitles: [],
          verdict: "BUILD",
          opportunityScore: 62,
        },
      },
    ]
    const L = buildIdeaLineages(timeline)
    expect(L).toHaveLength(1)
    expect(L[0]!.versions).toHaveLength(2)
    const digest = buildWhatChangedDigest(L[0]!)
    expect(digest).not.toBeNull()
    expect(digest!.verdictShift).toBe("PIVOT → BUILD")
    expect(digest!.worsened.some((x) => /procurement/i.test(x))).toBe(true)
  })

  it("deriveExecutionTaskItems returns 3–5 operator anchors", () => {
    const tasks = deriveExecutionTaskItems(
      {
        risks: ["Teams export CSV manually every close"],
        assumptions: ["Finance will adopt without IT review"],
        validationGaps: ["No proof of payment timing"],
        topReasons: [],
        pivotTitles: [],
        verdict: "PIVOT",
        opportunityScore: 55,
        ifFailsBecause: "Procurement stalls in mid-market",
      },
      {
        ideaTitle: "Close automation",
        ideaExcerpt: "Replace spreadsheet chaos for finance teams.",
        verdict: "PIVOT",
      },
    )
    expect(tasks.length).toBeGreaterThanOrEqual(3)
    expect(tasks.length).toBeLessThanOrEqual(5)
    expect(tasks.some((t) => t.anchor === "risk")).toBe(true)
    expect(tasks.every((t) => t.text.length > 40)).toBe(true)
  })

  it("inferExecutionPatterns surfaces ignored skew from check-ins", () => {
    const timeline: TimelineEvent[] = [
      {
        kind: "execution_plan",
        id: "plan_x",
        at: "2026-02-01T12:00:01.000Z",
        ideaId: "i1",
        ideaKey: "k1",
        sourceVerdictEventId: "v1",
        sourceVerdictAt: "2026-02-01T12:00:00.000Z",
        tasks: [{ taskId: "t1", text: "interview pricing for annual renewals", anchor: "assumption" }],
      },
      {
        kind: "execution_checkin",
        id: "c1",
        at: "2026-02-02T12:00:00.000Z",
        planId: "plan_x",
        taskId: "t1",
        status: "ignored",
        note: "",
      },
      {
        kind: "execution_checkin",
        id: "c2",
        at: "2026-02-03T12:00:00.000Z",
        planId: "plan_x",
        taskId: "t1",
        status: "ignored",
        note: "",
      },
      {
        kind: "execution_checkin",
        id: "c3",
        at: "2026-02-04T12:00:00.000Z",
        planId: "plan_x",
        taskId: "t1",
        status: "ignored",
        note: "",
      },
      {
        kind: "execution_checkin",
        id: "c4",
        at: "2026-02-05T12:00:00.000Z",
        planId: "plan_x",
        taskId: "t1",
        status: "ignored",
        note: "",
      },
    ]
    const lines = inferExecutionPatterns(timeline)
    expect(lines.some((l) => l.id === "ignored_vs_done")).toBe(true)
  })

  it("buildValidationEvolution carries score delta across versions", () => {
    const timeline: TimelineEvent[] = [
      {
        kind: "validation_verdict",
        id: "v1",
        at: "2026-01-02T00:00:00.000Z",
        ideaId: "run_a",
        ideaKey: "key-z",
        ideaTitle: "Tool",
        ideaExcerpt: "Brief",
        verdict: "PIVOT",
        opportunityScore: 40,
      },
      {
        kind: "validation_verdict",
        id: "v2",
        at: "2026-01-12T00:00:00.000Z",
        ideaId: "run_b",
        ideaKey: "key-z",
        ideaTitle: "Tool",
        ideaExcerpt: "Brief",
        verdict: "BUILD",
        opportunityScore: 71,
      },
    ]
    const L = buildIdeaLineages(timeline)[0]
    expect(L).toBeDefined()
    const ev = buildValidationEvolution([L!])[0]
    expect(ev!.scoreDelta).toBe(31)
    expect(ev!.points.map((p) => p.verdict)).toEqual(["PIVOT", "BUILD"])
  })

  it("buildJourneySurface mentions skipped framing when flagged", () => {
    const lines = buildJourneySurface({
      timeline: [],
      onboarding: { filledAt: "2026-01-01T00:00:00.000Z", skipped: true, ...SKIP_ONBOARDING_DEFAULTS },
      trustSignals: null,
      memoFilings: 0,
      ideaThreads: 0,
      unresolvedAssumptionCount: 0,
      experimentEvents: 0,
      progressionPatterns: [],
    })
    expect(lines.some((l) => /deferred/i.test(l))).toBe(true)
  })
})
