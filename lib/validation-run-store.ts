/** Server-side persistence for memo results (per signed-in user). Primary store: Supabase Postgres. */
import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { extractRunMeta, formatRunId, parseRunUuid } from "@/lib/validation/extract-run-meta"

export interface ValidationRunRecord {
  userId: string
  ideaId: string
  validation_results: unknown
  createdAt: string
  isPublic: boolean
  listedInLibrary: boolean
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
  is_public?: boolean | null
  listed_in_library?: boolean | null
}): ValidationRunRecord {
  const brief = row.idea_brief as Record<string, unknown> | null
  const ideaId = typeof brief?.ideaId === "string" ? brief.ideaId : row.idea_title.slice(0, 256)
  return {
    userId: row.user_id,
    ideaId,
    validation_results: row.results,
    createdAt: row.created_at,
    isPublic: Boolean(row.is_public),
    listedInLibrary: Boolean(row.listed_in_library),
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
        is_public: false,
        listed_in_library: false,
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
          isPublic: false,
          listedInLibrary: false,
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
    isPublic: false,
    listedInLibrary: false,
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

/**
 * Maps each stored idea id (in `validation_runs.idea_brief.ideaId`) to the newest run's public id.
 * Used to deep-link ledger rows to memo results when `decisions.run_id` was not persisted yet.
 */
export async function buildIdeaIdToLatestRunMap(userId: string): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const admin = getSupabaseAdmin()
  if (!admin) return map

  const { data, error } = await admin
    .from("validation_runs")
    .select("id, idea_brief")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(200)

  if (error || !data?.length) return map

  for (const row of data) {
    const brief = row.idea_brief as Record<string, unknown> | null
    const ideaId = typeof brief?.ideaId === "string" ? brief.ideaId.trim() : ""
    if (!ideaId || map.has(ideaId)) continue
    map.set(ideaId, formatRunId(row.id as string))
  }
  return map
}

export async function loadValidationRun(userId: string, runIdRaw: string): Promise<ValidationRunRecord | null> {
  const runId = normalizeRunId(runIdRaw)
  if (!runId) return null

  const uuid = parseRunUuid(runId)
  const admin = getSupabaseAdmin()

  if (admin && uuid) {
    const { data, error } = await admin
      .from("validation_runs")
      .select("user_id, idea_brief, idea_title, results, created_at, is_public, listed_in_library")
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
      return normalizeRecordShape(rec)
    } catch {
      return null
    }
  }

  const local = memoryByRunId.get(runId)
  if (!local || local.userId !== userId) return null
  return normalizeRecordShape(local)
}

function normalizeRecordShape(rec: ValidationRunRecord): ValidationRunRecord {
  return {
    ...rec,
    isPublic: Boolean(rec.isPublic),
    listedInLibrary: Boolean(rec.listedInLibrary),
  }
}

/** Read-only public memo when owner enabled sharing (Postgres or Redis/memory fallback). */
export async function loadPublicValidationRun(runIdRaw: string): Promise<ValidationRunRecord | null> {
  const runId = normalizeRunId(runIdRaw)
  if (!runId) return null

  const uuid = parseRunUuid(runId)
  const admin = getSupabaseAdmin()

  if (admin && uuid) {
    const { data, error } = await admin
      .from("validation_runs")
      .select("user_id, idea_brief, idea_title, results, created_at, is_public, listed_in_library")
      .eq("id", uuid)
      .eq("is_public", true)
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
      if (!rec.isPublic) return null
      return normalizeRecordShape(rec)
    } catch {
      return null
    }
  }

  const local = memoryByRunId.get(runId)
  if (!local?.isPublic) return null
  return normalizeRecordShape(local)
}

export async function updateRunVisibility(
  userId: string,
  runIdRaw: string,
  patch: { isPublic?: boolean; listedInLibrary?: boolean },
): Promise<{ ok: boolean; error?: string }> {
  const runId = normalizeRunId(runIdRaw)
  if (!runId) return { ok: false, error: "Invalid run id" }

  const uuid = parseRunUuid(runId)
  const admin = getSupabaseAdmin()

  const nextPublic = patch.isPublic
  const nextListed = patch.listedInLibrary

  if (admin && uuid) {
    const row: Record<string, unknown> = {}
    if (typeof nextPublic === "boolean") {
      row.is_public = nextPublic
      if (nextPublic === false) row.listed_in_library = false
    }
    if (typeof nextListed === "boolean") {
      row.listed_in_library = nextListed
      if (nextListed && typeof nextPublic === "undefined") {
        row.is_public = true
      }
    }
    if (Object.keys(row).length === 0) return { ok: false, error: "Nothing to update" }

    const { error } = await admin.from("validation_runs").update(row).eq("id", uuid).eq("user_id", userId)

    if (error) {
      console.error("[validation-run-store] update visibility", error)
      return { ok: false, error: "Could not update run" }
    }

    const { data: fresh } = await admin
      .from("validation_runs")
      .select("user_id, idea_brief, idea_title, results, created_at, is_public, listed_in_library")
      .eq("id", uuid)
      .eq("user_id", userId)
      .maybeSingle()

    if (fresh) {
      const record = rowToRecord(fresh as Parameters<typeof rowToRecord>[0])
      await persistMirror(runId, record)
    }
    return { ok: true }
  }

  const redis = await getRedis()
  const key = `fv:v1:run:${runId}`
  if (redis) {
    const raw = await redis.get<string>(key)
    if (!raw || typeof raw !== "string") return { ok: false, error: "Not found" }
    try {
      const rec = JSON.parse(raw) as ValidationRunRecord
      if (rec.userId !== userId) return { ok: false, error: "Not found" }
      if (typeof nextPublic === "boolean") {
        rec.isPublic = nextPublic
        if (nextPublic === false) rec.listedInLibrary = false
      }
      if (typeof nextListed === "boolean") {
        rec.listedInLibrary = nextListed
        if (nextListed) rec.isPublic = true
      }
      await redis.set(key, JSON.stringify(rec), { ex: RUN_TTL_SEC })
      return { ok: true }
    } catch {
      return { ok: false, error: "Not found" }
    }
  }

  const local = memoryByRunId.get(runId)
  if (!local || local.userId !== userId) return { ok: false, error: "Not found" }
  if (typeof nextPublic === "boolean") {
    local.isPublic = nextPublic
    if (nextPublic === false) local.listedInLibrary = false
  }
  if (typeof nextListed === "boolean") {
    local.listedInLibrary = nextListed
    if (nextListed) local.isPublic = true
  }
  memoryByRunId.set(runId, local)
  return { ok: true }
}

async function persistMirror(runId: string, record: ValidationRunRecord) {
  const redis = await getRedis()
  if (redis) {
    await redis.set(`fv:v1:run:${runId}`, JSON.stringify(record), { ex: RUN_TTL_SEC })
    return
  }
  pruneMemoryIfNeeded()
  memoryByRunId.set(runId, record)
}

export async function listPublicLibraryRuns(limit = 24): Promise<
  Array<{
    runId: string
    ideaTitle: string
    verdict: string | null
    opportunityScore: number | null
    createdAt: string
    industry: string | null
  }>
> {
  const admin = getSupabaseAdmin()
  if (!admin) return []

  const { data, error } = await admin
    .from("validation_runs")
    .select("id, idea_title, verdict, opportunity_score, created_at, results")
    .eq("is_public", true)
    .eq("listed_in_library", true)
    .order("created_at", { ascending: false })
    .limit(Math.min(100, Math.max(1, limit)))

  if (error || !data) {
    console.error("[validation-run-store] listPublicLibraryRuns", error)
    return []
  }

  return data.map((row) => {
    const results = row.results as Record<string, unknown> | null
    const meta = results?.metadata as { industry?: string } | undefined
    const ic = results?.ideaContext as { market?: string } | undefined
    const industry =
      meta?.industry ||
      (typeof ic?.market === "string" ? ic.market.split(/[,;]/)[0]?.trim() : null) ||
      null
    return {
      runId: formatRunId(row.id as string),
      ideaTitle: (row.idea_title as string)?.slice(0, 200) || "Idea",
      verdict: (row.verdict as string | null) ?? null,
      opportunityScore: typeof row.opportunity_score === "number" ? row.opportunity_score : null,
      createdAt: row.created_at as string,
      industry,
    }
  })
}
