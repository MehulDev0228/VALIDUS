import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { PublicMemoExperience } from "@/app/dashboard/validate/results/validation-results-client"
import { extractRunMeta } from "@/lib/validation/extract-run-meta"
import { loadPublicValidationRun } from "@/lib/validation-run-store"

export async function generateMetadata({
  params,
}: {
  params: Promise<{ runId: string }>
}): Promise<Metadata> {
  const { runId } = await params
  const rec = await loadPublicValidationRun(runId)
  if (!rec) {
    return { title: "Memo · VERDIKT", description: "Shared validation memo." }
  }

  const meta = extractRunMeta(rec.ideaId, rec.validation_results)
  const verdict = meta.verdict ?? "MEMO"
  const score = meta.opportunityScore
  const titleBase = meta.ideaTitle.slice(0, 72)
  const description = `${verdict}${score != null ? ` · ${score}/100` : ""} — ${titleBase}`
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ?? ""

  return {
    title: `${verdict} · ${titleBase}`,
    description,
    openGraph: {
      title: `${verdict}${score != null ? ` ${score}/100` : ""}`,
      description,
      type: "article",
      url: `${base}/memo/${encodeURIComponent(runId)}`,
      siteName: "VERDIKT",
    },
    twitter: {
      card: "summary_large_image",
      title: `${verdict}${score != null ? ` · ${score}/100` : ""}`,
      description,
    },
  }
}

export default async function PublicMemoPage({
  params,
}: {
  params: Promise<{ runId: string }>
}) {
  const { runId } = await params
  const rec = await loadPublicValidationRun(runId)
  if (!rec) notFound()

  return <PublicMemoExperience free={rec.validation_results as Record<string, unknown>} />
}
