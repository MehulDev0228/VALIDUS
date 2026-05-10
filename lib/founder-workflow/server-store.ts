/**
 * Founder Decision System persistence — Supabase Postgres when configured,
 * else JSON file (single-host / dev).
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export interface ValidationLogRecord {
  id: string
  ideaId: string
  actionTaken: string
  result: string
  learnings: string
  timestamp: string
}

export interface DecisionHistoryRecord {
  id: string
  ideaId: string
  ideaTitle: string
  verdict: "BUILD" | "PIVOT" | "KILL"
  opportunityScore?: number
  summary?: string
  timestamp: string
}

export interface FdsStoreFile {
  validationLogs: ValidationLogRecord[]
  decisions: DecisionHistoryRecord[]
}

const MAX_LOGS = 500
const MAX_DECISIONS = 120

export function getFdsStorePath(): string {
  if (process.env.FDS_STORE_PATH) return process.env.FDS_STORE_PATH
  return join(process.cwd(), "data", "fds-store.json")
}

async function readStore(): Promise<FdsStoreFile> {
  try {
    const raw = await readFile(getFdsStorePath(), "utf-8")
    const parsed = JSON.parse(raw) as FdsStoreFile
    return {
      validationLogs: Array.isArray(parsed.validationLogs) ? parsed.validationLogs : [],
      decisions: Array.isArray(parsed.decisions) ? parsed.decisions : [],
    }
  } catch {
    return { validationLogs: [], decisions: [] }
  }
}

async function writeStore(store: FdsStoreFile): Promise<boolean> {
  try {
    const path = getFdsStorePath()
    await mkdir(dirname(path), { recursive: true })
    await writeFile(path, JSON.stringify(store, null, 2), "utf-8")
    return true
  } catch (e) {
    console.warn("[fds-store] write failed:", e)
    return false
  }
}

function mapDecisionRow(row: {
  id: string
  idea_key: string
  idea_title: string | null
  verdict: string
  opportunity_score: number | null
  notes: string | null
  created_at: string
}): DecisionHistoryRecord {
  return {
    id: row.id,
    ideaId: row.idea_key,
    ideaTitle: row.idea_title ?? "",
    verdict: row.verdict as DecisionHistoryRecord["verdict"],
    opportunityScore: row.opportunity_score ?? undefined,
    summary: row.notes ?? undefined,
    timestamp: row.created_at,
  }
}

function mapValidationLogRow(row: {
  id: string
  idea_id: string
  action_taken: string
  result: string
  learnings: string
  created_at: string
}): ValidationLogRecord {
  return {
    id: row.id,
    ideaId: row.idea_id,
    actionTaken: row.action_taken,
    result: row.result,
    learnings: row.learnings,
    timestamp: row.created_at,
  }
}

export async function fdsAppendValidationLog(
  userId: string,
  entry: Omit<ValidationLogRecord, "id" | "timestamp"> & { timestamp?: string },
): Promise<{ ok: boolean; record: ValidationLogRecord }> {
  const timestamp = entry.timestamp || new Date().toISOString()

  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from("validation_logs")
      .insert({
        user_id: userId,
        idea_id: entry.ideaId.slice(0, 128),
        action_taken: entry.actionTaken.slice(0, 2000),
        result: entry.result.slice(0, 2000),
        learnings: entry.learnings.slice(0, 4000),
        created_at: timestamp,
      })
      .select("id, idea_id, action_taken, result, learnings, created_at")
      .single()

    if (!error && data) {
      return { ok: true, record: mapValidationLogRow(data as Parameters<typeof mapValidationLogRow>[0]) }
    }
    console.error("[fds] validation_logs insert:", error)
  }

  const record: ValidationLogRecord = {
    id: `vlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ideaId: entry.ideaId.slice(0, 128),
    actionTaken: entry.actionTaken.slice(0, 2000),
    result: entry.result.slice(0, 2000),
    learnings: entry.learnings.slice(0, 4000),
    timestamp,
  }
  const store = await readStore()
  store.validationLogs.unshift(record)
  store.validationLogs = store.validationLogs.slice(0, MAX_LOGS)
  const ok = await writeStore(store)
  return { ok, record }
}

export async function fdsListValidationLogs(userId: string, ideaId: string): Promise<ValidationLogRecord[]> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from("validation_logs")
      .select("id, idea_id, action_taken, result, learnings, created_at")
      .eq("user_id", userId)
      .eq("idea_id", ideaId.slice(0, 128))
      .order("created_at", { ascending: false })
      .limit(200)

    if (!error && data?.length) {
      return data.map((row) => mapValidationLogRow(row as Parameters<typeof mapValidationLogRow>[0]))
    }
    if (error) console.error("[fds] validation_logs list:", error)
  }

  const store = await readStore()
  return store.validationLogs.filter((l) => l.ideaId === ideaId.slice(0, 128))
}

export async function fdsAppendDecision(
  userId: string,
  entry: Omit<DecisionHistoryRecord, "id" | "timestamp"> & { timestamp?: string },
): Promise<{ ok: boolean; record: DecisionHistoryRecord }> {
  const ts = Date.parse(entry.timestamp || new Date().toISOString())
  const timestamp = entry.timestamp || new Date().toISOString()

  const admin = getSupabaseAdmin()
  if (admin) {
    const { data: recentRows } = await admin
      .from("decisions")
      .select("created_at")
      .eq("user_id", userId)
      .eq("idea_key", entry.ideaId.slice(0, 128))
      .order("created_at", { ascending: false })
      .limit(5)

    const dup = recentRows?.some((r) => {
      const dt = Date.parse((r as { created_at: string }).created_at)
      return Number.isFinite(dt) && Number.isFinite(ts) && Math.abs(dt - ts) < 120_000
    })
    if (dup) {
      const { data: last } = await admin
        .from("decisions")
        .select("id, idea_key, idea_title, verdict, opportunity_score, notes, created_at")
        .eq("user_id", userId)
        .eq("idea_key", entry.ideaId.slice(0, 128))
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
      if (last) {
        return { ok: true, record: mapDecisionRow(last as Parameters<typeof mapDecisionRow>[0]) }
      }
    }

    const { data, error } = await admin
      .from("decisions")
      .insert({
        user_id: userId,
        idea_key: entry.ideaId.slice(0, 128),
        idea_title: entry.ideaTitle.slice(0, 200),
        verdict: entry.verdict,
        opportunity_score: entry.opportunityScore ?? null,
        notes: entry.summary?.slice(0, 500) ?? null,
        created_at: timestamp,
      })
      .select("id, idea_key, idea_title, verdict, opportunity_score, notes, created_at")
      .single()

    if (!error && data) {
      return { ok: true, record: mapDecisionRow(data as Parameters<typeof mapDecisionRow>[0]) }
    }
    console.error("[fds] Supabase decision insert failed:", error)
  }

  const record: DecisionHistoryRecord = {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ideaId: entry.ideaId.slice(0, 128),
    ideaTitle: entry.ideaTitle.slice(0, 200),
    verdict: entry.verdict,
    opportunityScore: entry.opportunityScore,
    summary: entry.summary?.slice(0, 500),
    timestamp,
  }
  const store = await readStore()
  store.decisions = store.decisions.filter((d) => {
    const dt = Date.parse(d.timestamp)
    if (Number.isNaN(dt) || Number.isNaN(ts)) return true
    if (d.ideaId !== record.ideaId) return true
    return Math.abs(dt - ts) >= 120_000
  })
  store.decisions.unshift(record)
  store.decisions = store.decisions.slice(0, MAX_DECISIONS)
  const ok = await writeStore(store)
  return { ok, record }
}

export async function fdsListDecisions(userId: string): Promise<DecisionHistoryRecord[]> {
  const admin = getSupabaseAdmin()
  if (admin) {
    const { data, error } = await admin
      .from("decisions")
      .select("id, idea_key, idea_title, verdict, opportunity_score, notes, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(MAX_DECISIONS)

    if (!error && data?.length) {
      return data.map((row) =>
        mapDecisionRow(row as Parameters<typeof mapDecisionRow>[0]),
      )
    }
    if (error) console.error("[fds] list decisions:", error)
  }

  const store = await readStore()
  return [...store.decisions].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
