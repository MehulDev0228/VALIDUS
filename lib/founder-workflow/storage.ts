import type { DecisionRecord, ValidationAttempt } from "@/lib/founder-workflow/types"

const KEY_HISTORY = "fv_decision_history_v1"
const KEY_TRACKER = "fv_validation_tracker_v1"
const MAX_HISTORY = 80
const MAX_TRACKER = 200

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // ignore quota
  }
}

export function readDecisionHistory(): DecisionRecord[] {
  return readJson<DecisionRecord[]>(KEY_HISTORY, [])
}

export function appendDecisionRecord(record: DecisionRecord): void {
  const list = readDecisionHistory()
  const next = [record, ...list.filter((r) => r.id !== record.id)].slice(0, MAX_HISTORY)
  writeJson(KEY_HISTORY, next)
}

export function readValidationAttempts(filterIdeaKey?: string): ValidationAttempt[] {
  const all = readJson<ValidationAttempt[]>(KEY_TRACKER, [])
  if (!filterIdeaKey) return all
  return all.filter((a) => a.ideaKey === filterIdeaKey).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function appendValidationAttempt(attempt: Omit<ValidationAttempt, "id" | "createdAt">): ValidationAttempt {
  const row: ValidationAttempt = {
    ...attempt,
    id: `attempt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
  }
  const list = readJson<ValidationAttempt[]>(KEY_TRACKER, [])
  writeJson(KEY_TRACKER, [row, ...list].slice(0, MAX_TRACKER))
  return row
}
