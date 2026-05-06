/**
 * System calibration runner — evaluates output quality across a fixed dataset.
 *
 * Prerequisites:
 *   - GEMINI_API_KEY in `.env.local` (loaded automatically below)
 *   - Optional: GEMINI_MODEL
 *
 * Usage:
 *   npx tsx scripts/calibration-runner.ts
 *   npx tsx scripts/calibration-runner.ts --limit 5
 *   npx tsx scripts/calibration-runner.ts --dataset data/calibration/bad-delusion-stress.json
 *   npx tsx scripts/calibration-runner.ts --allow-degraded   # heuristic-only (not comparable to full runs)
 *   npm run calibration -- --limit 10     # pass flags after `--` so npm does not eat them
 *
 * Outputs: data/calibration/runs/run-<ISO>.json
 */

import fs from "node:fs"
import path from "node:path"

import type { CalibrationDataset, CalibrationRowResult } from "@/lib/calibration/types"
import { evaluateCalibrationRow, summarizeRun } from "@/lib/calibration/evaluate"
import type { IdeaInput } from "@/lib/schemas/idea"
import { runFreeValidation } from "@/lib/agents/free-validator"
import { formatGeminiEnvWarning, getGeminiEnvStatus } from "@/lib/llm/gemini-status"

function loadEnvLocal(): void {
  const p = path.join(process.cwd(), ".env.local")
  if (!fs.existsSync(p)) return
  const raw = fs.readFileSync(p, "utf8")
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim()
    if (!t || t.startsWith("#")) continue
    const eq = t.indexOf("=")
    if (eq < 1) continue
    const key = t.slice(0, eq).trim()
    let val = t.slice(eq + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = val
  }
}

function parseArgs(argv: string[]) {
  let limit = Infinity
  let allowDegraded = false
  let delayMs = 750
  let datasetRelative = path.join("data", "calibration", "ideas.json")
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--limit" && argv[i + 1]) {
      limit = Number(argv[++i])
    } else if (a === "--allow-degraded") {
      allowDegraded = true
    } else if (a === "--delay-ms" && argv[i + 1]) {
      delayMs = Number(argv[++i])
    } else if (a === "--dataset" && argv[i + 1]) {
      datasetRelative = argv[++i]
    }
  }
  return { limit, allowDegraded, delayMs, datasetRelative }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms))
}

/** Blind input: do not leak calibration outcome into the model prompt */
function toIdeaInput(row: CalibrationDataset["ideas"][0]): IdeaInput {
  const industry = row.category.split("/")[0]?.trim() || "General"
  return {
    title: row.name.slice(0, 200),
    description: row.description.slice(0, 8000),
    industry: industry.slice(0, 120),
    targetMarket: "",
    revenueModel: "",
    keyFeatures: [],
    useMode: "free",
  }
}

async function main(): Promise<void> {
  loadEnvLocal()
  const { limit, allowDegraded, delayMs, datasetRelative } = parseArgs(process.argv)

  const status = getGeminiEnvStatus()
  if (!status.ok && !allowDegraded) {
    console.error(formatGeminiEnvWarning())
    console.error("\nAborting calibration. Gemini is required for real calibration.")
    console.error("Pass --allow-degraded ONLY to score heuristic fallback (not comparable).")
    process.exit(1)
  }

  if (!status.ok && allowDegraded) {
    console.warn("[calibration] GEMINI_API_KEY not set — use --allow-degraded for heuristic-only scoring (not comparable to full runs).")
    console.warn("  See .env.example. First validation call will log the full env warning once.\n")
  } else {
    console.log(`[calibration] Gemini OK — model: ${status.model}`)
  }

  const datasetPath = path.isAbsolute(datasetRelative)
    ? datasetRelative
    : path.join(process.cwd(), datasetRelative)
  if (!fs.existsSync(datasetPath)) {
    console.error("Missing dataset:", datasetPath)
    process.exit(1)
  }

  const dataset = JSON.parse(fs.readFileSync(datasetPath, "utf8")) as CalibrationDataset
  const sliceEnd = Number.isFinite(limit) ? limit : dataset.ideas.length
  const ideas = dataset.ideas.slice(0, Math.max(0, sliceEnd))

  const rows: CalibrationRowResult[] = []
  const errors: Array<{ id: string; error: string }> = []

  for (let i = 0; i < ideas.length; i++) {
    const ideaRow = ideas[i]
    process.stdout.write(`\r[${i + 1}/${ideas.length}] ${ideaRow.id} …`)
    try {
      const resp = await runFreeValidation(toIdeaInput(ideaRow))
      rows.push(evaluateCalibrationRow(ideaRow, resp))
    } catch (e) {
      errors.push({
        id: ideaRow.id,
        error: e instanceof Error ? e.message : String(e),
      })
    }
    if (i < ideas.length - 1) await sleep(delayMs)
  }
  process.stdout.write("\n")

  const summary = summarizeRun(rows)
  const runId = new Date().toISOString().replace(/[:.]/g, "-")
  const outDir = path.join(process.cwd(), "data", "calibration", "runs")
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
  const outPath = path.join(outDir, `run-${runId}.json`)

  const payload = {
    runId,
    createdAt: new Date().toISOString(),
    gemini: status.ok ? { model: status.model } : { configured: false },
    summary,
    errors,
    rows,
  }
  fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8")

  console.log("—".repeat(60))
  console.log("Calibration complete")
  console.log(`  Written: ${outPath}`)
  console.log(`  Ideas OK: ${rows.length}  Errors: ${errors.length}`)
  console.log(`  Avg composite: ${summary.avgComposite.toFixed(1)}`)
  console.log(`  Gemini runs: ${summary.geminiCount}  Degraded: ${summary.degradedCount}`)
  console.log("  Avg dimensions:", JSON.stringify(summary.avgByDimension, null, 2))
  if (errors.length) console.log("  Sample errors:", errors.slice(0, 3))
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
