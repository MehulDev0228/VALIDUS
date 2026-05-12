import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { formatRunId } from "@/lib/validation/extract-run-meta"

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function tokens(text: string): Set<string> {
  return new Set(normalize(text).split(/\s+/).filter((w) => w.length > 2))
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0
  let inter = 0
  for (const x of a) if (b.has(x)) inter++
  const union = a.size + b.size - inter
  return union === 0 ? 0 : inter / union
}

export type SimilarBriefMatch = {
  runId: string
  previewTitle: string
  createdAt: string
  score: number
}

/** Detect prior validation runs that look like the same brief (title + description overlap). */
export async function findSimilarValidationRunForUser(
  userId: string,
  title: string,
  description: string,
): Promise<SimilarBriefMatch | null> {
  const admin = getSupabaseAdmin()
  if (!admin) return null

  const nt = normalize(title)
  const nd = normalize(description.slice(0, 600))
  const titleTok = tokens(title)
  const descTok = tokens(description.slice(0, 600))
  const combo = new Set([...titleTok, ...descTok])

  const { data, error } = await admin
    .from("validation_runs")
    .select("id, idea_title, results, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(35)

  if (error || !data?.length) return null

  let best: SimilarBriefMatch | null = null

  for (const row of data) {
    const results = row.results as Record<string, unknown> | null
    const ic = results?.ideaContext as Record<string, unknown> | undefined
    const core = typeof ic?.coreIdea === "string" ? ic.coreIdea : ""
    const prob = typeof ic?.problem === "string" ? ic.problem : ""
    const ideaTitle = String(row.idea_title || "")
    const blob = normalize(`${ideaTitle} ${core} ${prob}`)
    const blobTok = tokens(blob)

    let score = jaccard(combo, blobTok)
    const ot = normalize(ideaTitle)
    if (nt.length >= 8 && ot.length >= 8 && (nt === ot || nt.includes(ot) || ot.includes(nt))) {
      score = Math.max(score, 0.88)
    }
    if (nd.length >= 24 && blob.includes(nd.slice(0, Math.min(48, nd.length)))) {
      score = Math.max(score, 0.82)
    }

    if (score < 0.52) continue

    const previewTitle = ideaTitle.slice(0, 120) || core.slice(0, 120) || "Prior memo"
    const candidate: SimilarBriefMatch = {
      runId: formatRunId(row.id as string),
      previewTitle,
      createdAt: String(row.created_at),
      score,
    }
    if (!best || candidate.score > best.score) best = candidate
  }

  return best
}
