/**
 * Lightweight JSON file persistence for FDS (Founder Decision System).
 * Works on a single Node host (next start / Docker). On ephemeral serverless disks,
 * writes may fail silently — API routes fall back to client-only storage.
 */

import { mkdir, readFile, writeFile } from "fs/promises"
import { dirname, join } from "path"

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

export async function fdsAppendValidationLog(entry: Omit<ValidationLogRecord, "id" | "timestamp"> & { timestamp?: string }): Promise<{ ok: boolean; record: ValidationLogRecord }> {
  const record: ValidationLogRecord = {
    id: `vlog_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    ideaId: entry.ideaId.slice(0, 128),
    actionTaken: entry.actionTaken.slice(0, 2000),
    result: entry.result.slice(0, 2000),
    learnings: entry.learnings.slice(0, 4000),
    timestamp: entry.timestamp || new Date().toISOString(),
  }
  const store = await readStore()
  store.validationLogs.unshift(record)
  store.validationLogs = store.validationLogs.slice(0, MAX_LOGS)
  const ok = await writeStore(store)
  return { ok, record }
}

export async function fdsListValidationLogs(ideaId: string): Promise<ValidationLogRecord[]> {
  const store = await readStore()
  return store.validationLogs.filter((l) => l.ideaId === ideaId.slice(0, 128))
}

export async function fdsAppendDecision(entry: Omit<DecisionHistoryRecord, "id" | "timestamp"> & { timestamp?: string }): Promise<{ ok: boolean; record: DecisionHistoryRecord }> {
  const ts = Date.parse(entry.timestamp || new Date().toISOString())
  const record: DecisionHistoryRecord = {
    id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    ideaId: entry.ideaId.slice(0, 128),
    ideaTitle: entry.ideaTitle.slice(0, 200),
    verdict: entry.verdict,
    opportunityScore: entry.opportunityScore,
    summary: entry.summary?.slice(0, 500),
    timestamp: entry.timestamp || new Date().toISOString(),
  }
  const store = await readStore()
  // Avoid duplicates from refreshes within ~2 minutes for same ideaId
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

export async function fdsListDecisions(): Promise<DecisionHistoryRecord[]> {
  const store = await readStore()
  return [...store.decisions].sort((a, b) => b.timestamp.localeCompare(a.timestamp))
}
