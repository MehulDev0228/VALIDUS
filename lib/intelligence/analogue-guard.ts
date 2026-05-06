import type { IdeaInput } from "@/lib/schemas/idea"
import type { KGItem } from "@/lib/kg"
import type { HistoricalMechanismProfile } from "@/lib/intelligence/startup-patterns"

const GENERIC_TOKEN = new Set([
  "the",
  "and",
  "for",
  "with",
  "that",
  "this",
  "from",
  "your",
  "our",
  "app",
  "api",
  "saas",
  "b2b",
  "b2c",
  "new",
  "best",
  "easy",
  "help",
  "tool",
  "tools",
  "platform",
  "solution",
  "solutions",
  "software",
  "service",
  "services",
  "product",
  "digital",
  "online",
  "web",
  "mobile",
  "data",
  "smart",
  "using",
  "based",
  "powered",
  "generic",
  "dashboard",
  "analytics",
  "insights",
  "community",
  "users",
  "user",
  "customer",
  "customers",
  "startup",
  "business",
  "enterprise",
  "small",
  "make",
  "build",
  "create",
  "manage",
  "track",
  "first",
  "audio",
  "video",
  "content",
  "social",
  "media",
  "marketplace",
  "market",
  "ai",
  "ml",
  "gpt",
  "llm",
])

const WEAK_NAME_REGEXES = [
  /^generic\b/i,
  /\bgeneric\s+ai\b/i,
  /^audio-first\b/i,
  /\bai-first\b/i,
  /\bgeneric\s+dashboard\b/i,
  /\bai\s+dashboard\b/i,
  /^untitled\b/i,
  /^example\b/i,
  /^sample\b/i,
]

function normalizeTokens(text: string): string[] {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 2 && !GENERIC_TOKEN.has(t))
}

function ideaTokenSet(idea: IdeaInput): Set<string> {
  const blob = [
    idea.title,
    idea.description,
    idea.industry,
    idea.targetMarket,
    idea.revenueModel,
    ...(idea.keyFeatures || []),
  ]
    .filter(Boolean)
    .join(" ")
  return new Set(normalizeTokens(blob))
}

function itemTokenSet(item: KGItem): Set<string> {
  const blob = `${item.name} ${item.text || ""}`.slice(0, 600)
  return new Set(normalizeTokens(blob))
}

function intersectionSize(a: Set<string>, b: Set<string>): number {
  let n = 0
  for (const x of a) {
    if (b.has(x)) n += 1
  }
  return n
}

export function isWeakComparableName(name: string): boolean {
  const n = name.trim()
  if (n.length < 3) return true
  return WEAK_NAME_REGEXES.some((re) => re.test(n))
}

/** Drop synthetic / generic KG labels and require minimum token overlap with the idea */
export function filterPlausibleKgItems(idea: IdeaInput, items: KGItem[]): KGItem[] {
  const ideaWords = ideaTokenSet(idea)
  return items.filter((item) => {
    if (!item?.name?.trim()) return false
    if (isWeakComparableName(item.name)) return false
    const itemWords = itemTokenSet(item)
    const overlap = intersectionSize(ideaWords, itemWords)
    /** Need at least two substantive overlaps OR the item name prominently appears inside the idea corpus */
    const corpusBlob = [...ideaWords].join(" ")
    const nameLc = item.name.toLowerCase()
    const anchored =
      corpusBlob.includes(nameLc.replace(/\s+/g, " ")) ||
      normalizeTokens(idea.title).some((w) => nameLc.includes(w) && w.length > 5)
    if (overlap >= 2 || anchored) return true
    if (overlap === 1 && itemWords.size >= 8) return false
    return false
  })
}

function capitalizeId(id: string): string {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}

export function buildMechanismAwareComparables(
  kgFiltered: KGItem[],
  historical: HistoricalMechanismProfile[],
): { name: string; reason: string; url?: string }[] {
  const out: { name: string; reason: string; url?: string }[] = []
  const seen = new Set<string>()

  for (const h of historical.slice(0, 2)) {
    const label = `${capitalizeId(h.id)} · mechanism anchor`
    const key = label.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    out.push({
      name: label,
      reason: `Why it mattered: ${h.whyWorkedOneLiner} · Distribution spine: ${h.distributionAdvantageOneLiner}`,
      url: undefined,
    })
  }

  for (const k of kgFiltered) {
    if (out.length >= 5) break
    const key = k.name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    const reason =
      (k.text && k.text.trim().slice(0, 220)) ||
      "KG overlap — verify mechanism match manually; do not treat name alone as proof."
    out.push({
      name: k.name,
      reason: reason.endsWith(".") ? reason : `${reason}.`,
      url: k.url,
    })
  }

  return out
}
