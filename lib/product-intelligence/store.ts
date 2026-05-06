/**
 * Append-only JSONL for internal observability — not founder-facing.
 * Local-first; replace with queue/warehouse in hosted environments.
 */

import { appendFile, mkdir } from "node:fs/promises"
import { createHash } from "node:crypto"
import { dirname, join } from "node:path"
import type { ProductIntelEventV1, ProductIntelAggregate } from "@/lib/product-intelligence/types"

export function productIntelDir(): string {
  return process.env.PRODUCT_INTEL_DIR || join(process.cwd(), "data", "product-intelligence")
}

function dayFilePath(): string {
  const day = new Date().toISOString().slice(0, 10)
  return join(productIntelDir(), `events-${day}.jsonl`)
}

export function subjectKeyFromUserId(userId: string): string {
  const pepper = process.env.PRODUCT_INTEL_PEPPER || "fv-alpha-local-pepper-change-in-prod"
  return createHash("sha256").update(`${pepper}:${userId}`).digest("hex").slice(0, 14)
}

export async function appendProductIntelEvents(events: ProductIntelEventV1[]): Promise<boolean> {
  if (events.length === 0) return true
  try {
    const path = dayFilePath()
    await mkdir(dirname(path), { recursive: true })
    const chunk = events.map((e) => JSON.stringify(e)).join("\n") + "\n"
    await appendFile(path, chunk, "utf8")
    return true
  } catch (e) {
    console.warn("[product-intelligence] append failed:", e)
    return false
  }
}

async function readRecentJsonlPaths(maxDays = 32): Promise<string[]> {
  const { readdir } = await import("node:fs/promises")
  const base = productIntelDir()
  let names: string[] = []
  try {
    names = await readdir(base)
  } catch {
    return []
  }
  return names
    .filter((n) => n.startsWith("events-") && n.endsWith(".jsonl"))
    .sort()
    .reverse()
    .slice(0, maxDays)
    .map((n) => join(base, n))
}

/** Bounded scan — suitable for MVP internal dashboard */
export async function aggregateProductIntel(maxLines = 50_000): Promise<ProductIntelAggregate> {
  const paths = await readRecentJsonlPaths(45)
  const byKind: Record<string, number> = {}
  const dwellMap = new Map<string, { total: number; n: number }>()
  const ideaCount = new Map<string, number>()
  const reflectionsByPrompt: Record<string, number> = {}
  let scanned = 0
  let revisitCount = 0
  let memoOpens = 0
  let specialistToggleCount = 0
  let oldestAt = ""

  outer: for (const p of paths) {
    const { readFile } = await import("node:fs/promises")
    let raw = ""
    try {
      raw = await readFile(p, "utf8")
    } catch {
      continue
    }
    const lines = raw.split("\n").filter(Boolean)
    for (const line of lines) {
      if (scanned >= maxLines) break outer
      scanned++
      let ev: ProductIntelEventV1
      try {
        ev = JSON.parse(line) as ProductIntelEventV1
      } catch {
        continue
      }
      if (!oldestAt || ev.at < oldestAt) oldestAt = ev.at
      byKind[ev.kind] = (byKind[ev.kind] ?? 0) + 1
      if (ev.kind === "memo_revisit") revisitCount++
      if (ev.kind === "memo_first_open") memoOpens++
      if (ev.kind === "reflection_submitted") {
        const pid = typeof ev.meta?.promptId === "string" ? ev.meta.promptId : "unknown"
        reflectionsByPrompt[pid] = (reflectionsByPrompt[pid] ?? 0) + 1
      }
      if (ev.kind === "specialist_notes_expand" || ev.kind === "specialist_notes_collapse") {
        specialistToggleCount++
      }
      if (ev.kind === "section_dwell" && ev.sectionId && typeof ev.dwellMs === "number") {
        const cur = dwellMap.get(ev.sectionId) ?? { total: 0, n: 0 }
        cur.total += ev.dwellMs
        cur.n += 1
        dwellMap.set(ev.sectionId, cur)
      }
      if (ev.ideaId) ideaCount.set(ev.ideaId, (ideaCount.get(ev.ideaId) ?? 0) + 1)
    }
  }

  const dwellBySection = [...dwellMap.entries()]
    .map(([sectionId, { total, n }]) => ({ sectionId, totalMs: total, samples: n }))
    .sort((a, b) => b.totalMs - a.totalMs)

  const topIdeaIds = [...ideaCount.entries()]
    .map(([ideaId, events]) => ({ ideaId, events }))
    .sort((a, b) => b.events - a.events)
    .slice(0, 20)

  return {
    scannedLines: scanned,
    sinceIso: oldestAt || new Date().toISOString(),
    byKind,
    dwellBySection,
    revisitCount,
    memoOpens,
    topIdeaIds,
    reflectionsByPrompt,
    specialistToggleCount,
  }
}

export function isInternalObsViewer(email: string | null | undefined): boolean {
  const raw = process.env.FV_INTERNAL_OBS_EMAILS || ""
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
  if (!email || allow.length === 0) return false
  return allow.includes(email.toLowerCase())
}
