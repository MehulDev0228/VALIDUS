"use client"

import { useCallback, useState } from "react"
import Link from "next/link"

type Hit = {
  runId: string
  ideaTitle: string
  verdict: string | null
  createdAt: string
}

export function MemoArchiveSearch() {
  const [q, setQ] = useState("")
  const [hits, setHits] = useState<Hit[]>([])
  const [busy, setBusy] = useState(false)

  const search = useCallback(async (term: string) => {
    if (term.trim().length < 2) {
      setHits([])
      return
    }
    setBusy(true)
    try {
      const r = await fetch(`/api/archive/search?q=${encodeURIComponent(term)}`, { credentials: "same-origin" })
      const j = await r.json()
      if (j?.success && Array.isArray(j.runs)) setHits(j.runs)
      else setHits([])
    } catch {
      setHits([])
    } finally {
      setBusy(false)
    }
  }, [])

  return (
    <div className="border-t border-bone-0/[0.06] pt-10">
      <p className="mono-caption text-bone-2">Archive search</p>
      <p className="mt-2 text-[14px] text-bone-1">Find memos by title (requires Supabase).</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void search(q)
          }}
          placeholder="Search titles…"
          className="w-full max-w-md border border-bone-0/[0.08] bg-white px-3 py-2 text-[14px] text-bone-0 outline-none focus:border-ember/40"
          aria-label="Search memo archive"
        />
        <button
          type="button"
          onClick={() => void search(q)}
          disabled={busy}
          className="tab-cta tab-cta-quiet inline-flex shrink-0 disabled:opacity-50"
        >
          <span>{busy ? "Searching…" : "Search"}</span>
          <span className="tab-cta-arrow">→</span>
        </button>
      </div>
      {hits.length > 0 && (
        <ul className="mt-6 space-y-2 border-t border-bone-0/[0.06] pt-6">
          {hits.map((h) => (
            <li key={h.runId}>
              <Link
                href={`/dashboard/validate/results?run=${encodeURIComponent(h.runId)}`}
                className="group flex flex-wrap items-baseline justify-between gap-2 text-[14px] text-bone-1 hover:text-bone-0"
              >
                <span>{h.ideaTitle}</span>
                <span className="mono-caption text-bone-2 tabular">
                  {h.verdict ?? "—"} · {h.createdAt?.slice(0, 10)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
