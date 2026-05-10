/** Server-side persistence for memo results (per signed-in user). Primary store: Supabase Postgres. */
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { extractRunMeta, formatRunId, parseRunUuid } from "@/lib/validation/extract-run-meta"

export interface ValidationRunRecord {
  userId: string
  ideaId: string
  validation_results: unknown
  createdAt: string
}

const RUN_TTL_SEC = 90 * 24 * 60 * 60 // 90 days
const MAX_PAYLOAD_BYTES = 4_500_000

const memoryByRunId = new Map<string, ValidationRunRecord>()
const MEMORY_CAP = 400

async function getRedis() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) return null
  const { Redis } = await import("@upstash/redis")
  return new Redis({ url, token })
}

function pruneMemoryIfNeeded() {
  if (memoryByRunId.size <= MEMORY_CAP) return
  const oldest = [...memoryByRunId.entries()].sort(
    (a, b) => new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime(),
  )
  const drop = oldest.slice(0, Math.max(0, memoryByRunId.size - MEMORY_CAP + 20))
  for (const [k] of drop) memoryByRunId.delete(k)
}

export function normalizeRunId(raw: string): string | null {
  const s = raw.trim()
  if (!/^[a-zA-Z0-9_-]{8,128}$/.test(s)) return null
  return s
}

function rowToRecord(row: {
  user_id: string
  idea_brief: unknown
  idea_title: string
  results: unknown
  created_at: string
}): ValidationRunRecord {
  const brief = row.idea_brief as Record<string, unknown> | null
  const ideaId = typeof brief?.ideaId === "string" ? brief.ideaId : row.idea_title.slice(0, 256)
  return {
    userId: row.user_id,
    ideaId,
    validation_results: row.results,
    createdAt: row.created_at,
  }
}

export async function saveValidationRun(
  userId: string,
  ideaId: string,
  validationResults: unknown,
): Promise<string> {
  const json = JSON.stringify({ userId, ideaId, validation_results: validationResults, createdAt: new Date().toISOString() })
  if (new TextEncoder().encode(json).length > MAX_PAYLOAD_BYTES) {
    throw new Error("validation payload too large to store")
  }

  const meta = extractRunMeta(ideaId, validationResults)
  const admin = getSupabaseAdmin()

  if (admin) {
    const { data, error } = await admin
      .from("validation_runs")
      .insert({
        user_id: userId,
        idea_title: meta.ideaTitle.slice(0, 500),
        idea_brief: meta.ideaBrief,
        verdict: meta.verdict,
        opportunity_score: meta.opportunityScore,
        results: validationResults as Record<string, unknown>,
        model_version: meta.modelVersion,
      })
      .select("id")
      .single()

    if (!error && data?.id) {
      const runId = formatRunId(data.id as string)
      const redis = await getRedis()
      if (redis) {
        const record: ValidationRunRecord = {
          userId,
          ideaId: ideaId.slice(0, 256),
          validation_results: validationResults,
          createdAt: new Date().toISOString(),
        }
        await redis.set(`fv:v1:run:${runId}`, JSON.stringify(record), { ex: RUN_TTL_SEC })
      }
      return runId
    }
    console.error("[validation-run-store] Supabase insert failed, falling back:", error)
  }

  const createdAt = new Date().toISOString()
  const runId = `run_${crypto.randomUUID().replace(/-/g, "")}`
  const record: ValidationRunRecord = {
    userId,
    ideaId: ideaId.slice(0, 256),
    validation_results: validationResults,
    createdAt,
  }

  const redis = await getRedis()
  const key = `fv:v1:run:${runId}`
  if (redis) {
    await redis.set(key, JSON.stringify(record), { ex: RUN_TTL_SEC })
    return runId
  }

  pruneMemoryIfNeeded()
  memoryByRunId.set(runId, record)
  return runId
}

export async function loadValidationRun(userId: string, runIdRaw: string): Promise<ValidationRunRecord | null> {
  const runId = normalizeRunId(runIdRaw)
  if (!runId) return null

  const uuid = parseRunUuid(runId)
  const admin = getSupabaseAdmin()

  if (admin && uuid) {
    const { data, error } = await admin
      .from("validation_runs")
      .select("user_id, idea_brief, idea_title, results, created_at")
      .eq("id", uuid)
      .eq("user_id", userId)
      .maybeSingle()

    if (!error && data) {
      return rowToRecord(data as Parameters<typeof rowToRecord>[0])
    }
  }

  const redis = await getRedis()
  const key = `fv:v1:run:${runId}`

  if (redis) {
    const raw = await redis.get<string>(key)
    if (!raw || typeof raw !== "string") return null
    try {
      const rec = JSON.parse(raw) as ValidationRunRecord
      if (rec.userId !== userId) return null
      return rec
    } catch {
      return null
    }
  }

  const local = memoryByRunId.get(runId)
  if (!local || local.userId !== userId) return null
  return local
}
