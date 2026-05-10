/**
 * Per-founder JSON persistence. One file per account under data/founder-memory/.
 * Serverless ephemeral disks may drop writes — callers treat failure as soft.
 */

import { mkdir, readFile, writeFile } from "node:fs/promises"
import { dirname, join } from "node:path"
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import type {
  FounderMemoryStoreV1,
  FounderOnboardingInput,
  FounderOnboardingProfile,
  FounderTrustSignalsV1,
  TimelineEvent,
  ValidationVerdictEvent,
  ExperimentEvent,
  PivotNoteEvent,
  ReportFeedbackEvent,
  ExecutionPlanEvent,
  ExecutionCheckinEvent,
  FounderReflectionEvent,
} from "@/lib/founder-memory/types"
import type { PostFounderEventBody } from "@/lib/founder-memory/schema"
import { deriveExecutionTaskItems } from "@/lib/founder-memory/execution-tasks"

const MAX_EVENTS = 420

export function safeFounderFilename(userId: string): string {
  const s = userId.replace(/[^a-zA-Z0-9_-]+/g, "_").slice(0, 128)
  return s.length > 0 ? s : "anon"
}

export function getFounderMemoryFilePath(userId: string): string {
  const base = process.env.FOUNDER_MEMORY_DIR || join(process.cwd(), "data", "founder-memory")
  return join(base, `${safeFounderFilename(userId)}.json`)
}

function newId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

async function readFounderStoreFromSupabase(userId: string): Promise<FounderMemoryStoreV1 | null> {
  const admin = getSupabaseAdmin()
  if (!admin) return null
  const { data, error } = await admin
    .from("founder_memory_bundles")
    .select("bundle")
    .eq("user_id", userId)
    .maybeSingle()
  if (error || !data?.bundle) return null
  const bundle = data.bundle as FounderMemoryStoreV1
  if (!bundle || bundle.version !== 1 || !Array.isArray(bundle.timeline)) return null
  return {
    ...bundle,
    ownerId: safeFounderFilename(userId),
    timeline: [...bundle.timeline].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
  }
}

export async function readFounderStore(userId: string): Promise<FounderMemoryStoreV1> {
  const fromDb = await readFounderStoreFromSupabase(userId)
  if (fromDb) return fromDb

  const path = getFounderMemoryFilePath(userId)
  try {
    const raw = await readFile(path, "utf8")
    const data = JSON.parse(raw) as FounderMemoryStoreV1
    if (!data || data.version !== 1 || !Array.isArray(data.timeline)) {
      return emptyStore(userId)
    }
    return {
      ...data,
      ownerId: safeFounderFilename(userId),
      timeline: [...data.timeline].sort((a, b) => Date.parse(b.at) - Date.parse(a.at)),
    }
  } catch {
    return emptyStore(userId)
  }
}

function emptyStore(userId: string): FounderMemoryStoreV1 {
  return {
    version: 1,
    ownerId: safeFounderFilename(userId),
    timeline: [],
    updatedAt: new Date().toISOString(),
  }
}

async function persistStore(originalUserId: string, store: FounderMemoryStoreV1): Promise<boolean> {
  let ok = false
  const admin = getSupabaseAdmin()
  if (admin) {
    const { error } = await admin.from("founder_memory_bundles").upsert(
      {
        user_id: originalUserId,
        bundle: store as unknown as Record<string, unknown>,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    )
    ok = !error
    if (error) console.warn("[founder-memory] Supabase upsert failed:", error)
  }

  try {
    const path = getFounderMemoryFilePath(originalUserId)
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(store, null, 2), "utf8")
    return true
  } catch (e) {
    console.warn("[founder-memory] filesystem write failed:", e)
    return ok
  }
}

function executionPlanFromVerdict(v: ValidationVerdictEvent): ExecutionPlanEvent | null {
  if (!v.memoSnapshot) return null
  const tasks = deriveExecutionTaskItems(v.memoSnapshot, {
    ideaTitle: v.ideaTitle,
    ideaExcerpt: v.ideaExcerpt,
    verdict: v.verdict,
  })
  if (!tasks.length) return null
  const atMs = Math.max(0, Date.parse(v.at))
  const planAt = new Date(atMs + 1).toISOString()
  return {
    kind: "execution_plan",
    id: newId("exe"),
    at: planAt,
    ideaId: v.ideaId,
    ideaKey: v.ideaKey,
    sourceVerdictEventId: v.id,
    sourceVerdictAt: v.at,
    tasks,
  }
}

function toEvent(userId: string, body: PostFounderEventBody): TimelineEvent | null {
  const at = body.at && !Number.isNaN(Date.parse(body.at)) ? body.at : new Date().toISOString()
  switch (body.kind) {
    case "validation_verdict": {
      const excerpt = (body.ideaExcerpt || "").slice(0, 1200).trim()
      const ev: ValidationVerdictEvent = {
        kind: "validation_verdict",
        id: newId("ver"),
        at,
        ideaId: body.ideaId.slice(0, 128),
        ideaKey: body.ideaKey?.trim().slice(0, 200),
        ideaTitle: body.ideaTitle.slice(0, 220),
        ideaExcerpt: excerpt,
        verdict: body.verdict,
        opportunityScore: body.opportunityScore,
        summary: body.summary?.slice(0, 800),
        memoSnapshot: body.memoSnapshot,
      }
      return ev
    }
    case "experiment": {
      const ev: ExperimentEvent = {
        kind: "experiment",
        id: newId("exp"),
        at,
        ideaId: body.ideaId.slice(0, 128),
        ideaKey: body.ideaKey?.trim().slice(0, 200),
        ideaTitle: body.ideaTitle?.slice(0, 220),
        actionTaken: body.actionTaken.slice(0, 2000),
        outcome: body.outcome.slice(0, 4000),
        learnings: body.learnings.slice(0, 4000),
        observationTags: body.observationTags,
      }
      return ev
    }
    case "pivot_note": {
      const ev: PivotNoteEvent = {
        kind: "pivot_note",
        id: newId("pvt"),
        at,
        ideaId: body.ideaId?.slice(0, 128),
        body: body.body.slice(0, 8000),
      }
      return ev
    }
    case "report_feedback": {
      const ev: ReportFeedbackEvent = {
        kind: "report_feedback",
        id: newId("fb"),
        at,
        ideaId: body.ideaId?.slice(0, 128),
        verdict: body.verdict,
        tags: body.tags,
        note: body.note?.slice(0, 2000),
      }
      return ev
    }
    case "execution_checkin": {
      const noteRaw = typeof body.note === "string" ? body.note : ""
      const ev: ExecutionCheckinEvent = {
        kind: "execution_checkin",
        id: newId("chk"),
        at,
        ideaId: body.ideaId?.slice(0, 128),
        ideaKey: body.ideaKey?.trim().slice(0, 200),
        planId: body.planId.slice(0, 128),
        taskId: body.taskId.slice(0, 64),
        status: body.status,
        note: noteRaw.slice(0, 2000).trim(),
        linkedAssumption: body.linkedAssumption?.slice(0, 520),
      }
      return ev
    }
    case "founder_reflection": {
      const ev: FounderReflectionEvent = {
        kind: "founder_reflection",
        id: newId("ref"),
        at,
        ideaId: body.ideaId?.slice(0, 128),
        ideaKey: body.ideaKey?.trim().slice(0, 200),
        trigger: body.trigger.slice(0, 64),
        promptId: body.promptId.slice(0, 64),
        promptLabel: body.promptLabel.slice(0, 160),
        note: body.note.slice(0, 4000).trim(),
      }
      return ev
    }
  }
}

/** Skip duplicate verdict fingerprint within 90s — refresh double-posts */
function shouldSkipDuplicate(store: FounderMemoryStoreV1, incoming: TimelineEvent): boolean {
  if (incoming.kind !== "validation_verdict") return false
  const t0 = Date.parse(incoming.at)
  for (const row of store.timeline) {
    if (row.kind !== "validation_verdict") continue
    if (row.ideaId !== incoming.ideaId) continue
    if (row.verdict !== incoming.verdict) continue
    const dt = Math.abs(Date.parse(row.at) - t0)
    if (dt < 90_000) return true
  }
  return false
}

export async function appendFounderEvent(
  userId: string,
  body: PostFounderEventBody,
): Promise<{ ok: boolean; event: TimelineEvent | null }> {
  const event = toEvent(userId, body)
  if (!event) return { ok: false, event: null }

  let store = await readFounderStore(userId)
  store.ownerId = safeFounderFilename(userId)

  if (shouldSkipDuplicate(store, event)) {
    return { ok: true, event }
  }

  store.timeline.unshift(event)

  if (event.kind === "validation_verdict" && event.memoSnapshot) {
    const plan = executionPlanFromVerdict(event)
    if (plan) {
      store.timeline.unshift(plan)
    }
  }

  store.timeline.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))
  store.timeline = store.timeline.slice(0, MAX_EVENTS)
  store.updatedAt = new Date().toISOString()

  const ok = await persistStore(userId, store)
  return { ok, event }
}

/** Persists onboarding framing answers — replaces prior onboarding blob. */
export async function saveFounderOnboarding(userId: string, body: FounderOnboardingInput): Promise<boolean> {
  const store = await readFounderStore(userId)
  store.ownerId = safeFounderFilename(userId)
  const now = new Date().toISOString()
  const { skipped, ...answers } = body
  const next: FounderOnboardingProfile = skipped
    ? { filledAt: now, ...answers, skipped: true }
    : { filledAt: now, ...answers }
  store.onboarding = next
  store.updatedAt = now
  return persistStore(userId, store)
}

export async function bumpFounderTrustSignal(
  userId: string,
  kind: "results_view" | "dashboard_session",
): Promise<boolean> {
  const store = await readFounderStore(userId)
  store.ownerId = safeFounderFilename(userId)
  const now = new Date().toISOString()
  const prev = store.trustSignals
  const base: FounderTrustSignalsV1 = {
    resultsViewsTotal: prev?.resultsViewsTotal ?? 0,
    dashboardSessionsTotal: prev?.dashboardSessionsTotal ?? 0,
    lastResultsViewAt: prev?.lastResultsViewAt,
    lastDashboardOpenAt: prev?.lastDashboardOpenAt,
    updatedAt: now,
  }
  if (kind === "results_view") {
    base.resultsViewsTotal += 1
    base.lastResultsViewAt = now
  } else {
    base.dashboardSessionsTotal += 1
    base.lastDashboardOpenAt = now
  }
  store.trustSignals = base
  store.updatedAt = now
  return persistStore(userId, store)
}
