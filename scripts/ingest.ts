import fs from "node:fs"
import path from "node:path"

import seedData from "../lib/kg/seed.json"

interface KGItem {
  id: string
  name: string
  type: "startup" | "pitch" | "article" | "deck"
  text: string
  url?: string
  tags: string[]
  createdAt?: string
}

interface KGVectorIndexItem {
  id: string
  embedding: number[]
  tags: string[]
}

interface KGVectorIndex {
  model: string
  createdAt: string
  items: KGVectorIndexItem[]
}

const OPENAI_API_KEY = process.env.OPENAI_API_KEY
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"
const EMBEDDING_MODEL = process.env.KG_EMBEDDING_MODEL || "text-embedding-3-small"

function loadSeedItems(): KGItem[] {
  return seedData as KGItem[]
}

function loadJsonlEntries(filePath: string): KGItem[] {
  if (!fs.existsSync(filePath)) return []
  const lines = fs.readFileSync(filePath, "utf8").split(/\r?\n/).filter(Boolean)
  return lines.map((line) => JSON.parse(line) as KGItem)
}

function concatText(item: KGItem): string {
  return [item.name, item.text, item.tags.join(" ")].join(" \n")
}

async function embedBatch(texts: string[]): Promise<number[][]> {
  if (!OPENAI_API_KEY) {
    // Deterministic fake embeddings (hash-based) for local/offline runs.
    return texts.map((t) => {
      const hash = Array.from(t).reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
      const v = [hash % 97, (hash * 7) % 97, (hash * 13) % 97]
      const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0)) || 1
      return v.map((x) => x / norm)
    })
  }

  const res = await fetch(`${OPENAI_BASE_URL}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: texts,
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Embedding API error ${res.status}: ${text}`)
  }

  const data = await res.json()
  return data.data.map((d: any) => d.embedding as number[])
}

async function buildVectorIndex(): Promise<KGVectorIndex> {
  const seedItems = loadSeedItems()
  const extraPath = path.join(process.cwd(), "data", "kg", "entries.jsonl")
  const extraItems = loadJsonlEntries(extraPath)
  const allItems: KGItem[] = [...seedItems, ...extraItems]

  if (allItems.length === 0) {
    throw new Error("No KG items found to index.")
  }

  const texts = allItems.map((item) => concatText(item))
  const embeddings = await embedBatch(texts)

  const indexItems: KGVectorIndexItem[] = allItems.map((item, idx) => ({
    id: item.id,
    embedding: embeddings[idx],
    tags: item.tags,
  }))

  return {
    model: EMBEDDING_MODEL,
    createdAt: new Date().toISOString(),
    items: indexItems,
  }
}

async function main() {
  try {
    const outDir = path.join(process.cwd(), "data", "kg")
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })

    const index = await buildVectorIndex()
    const outPath = path.join(outDir, "vector-index.json")
    fs.writeFileSync(outPath, JSON.stringify(index, null, 2), "utf8")

    // eslint-disable-next-line no-console
    console.log(`KG vector index written to ${outPath}`)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("KG ingestion failed:", err)
    process.exitCode = 1
  }
}

// Only run when executed directly via `node scripts/ingest.ts` or `npm run ingest:kg`.
if (require.main === module) {
  void main()
}
