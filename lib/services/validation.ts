import type { SupabaseClient } from "@supabase/supabase-js"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export type ValidationRunRow = {
  id: string
  user_id: string
  idea_title: string
  idea_brief: Record<string, unknown>
  verdict: "BUILD" | "PIVOT" | "KILL" | null
  opportunity_score: number | null
  results: Record<string, unknown>
  model_version: string | null
  created_at: string
}

export async function insertValidationRun(args: {
  userId: string
  ideaTitle: string
  ideaBrief: Record<string, unknown>
  verdict: "BUILD" | "PIVOT" | "KILL" | null
  opportunityScore: number | null
  results: Record<string, unknown>
  modelVersion?: string | null
}): Promise<{ ok: boolean; id?: string }> {
  const admin = getSupabaseAdmin()
  if (!admin) return { ok: false }

  const { data, error } = await admin
    .from("validation_runs")
    .insert({
      user_id: args.userId,
      idea_title: args.ideaTitle,
      idea_brief: args.ideaBrief,
      verdict: args.verdict,
      opportunity_score: args.opportunityScore,
      results: args.results,
      model_version: args.modelVersion ?? null,
    })
    .select("id")
    .single()

  if (error || !data) {
    console.error("[validation] insertValidationRun", error)
    return { ok: false }
  }
  return { ok: true, id: data.id as string }
}

export async function listValidationRunsForUser(
  client: SupabaseClient,
  userId: string,
  limit = 50,
): Promise<ValidationRunRow[]> {
  const { data, error } = await client
    .from("validation_runs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[validation] listValidationRunsForUser", error)
    return []
  }
  return (data ?? []) as ValidationRunRow[]
}
