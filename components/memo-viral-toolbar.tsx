"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { buildTwitterThreadFromMemo } from "@/lib/viral/build-twitter-thread"

function appOrigin(): string {
  if (typeof window !== "undefined") return window.location.origin
  const env = process.env.NEXT_PUBLIC_APP_URL
  return env?.replace(/\/$/, "") || ""
}

export function MemoViralToolbar({
  runId,
  ideaTitle,
  memoPayload,
}: {
  runId: string | null
  ideaTitle: string
  memoPayload: Record<string, unknown>
}) {
  const [isPublic, setIsPublic] = useState(false)
  const [listed, setListed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!runId) return
    try {
      const r = await fetch(`/api/validation-run?id=${encodeURIComponent(runId)}`, { credentials: "same-origin" })
      const data = (await r.json().catch(() => null)) as {
        isPublic?: boolean
        listedInLibrary?: boolean
      } | null
      if (data?.isPublic != null) setIsPublic(Boolean(data.isPublic))
      if (data?.listedInLibrary != null) setListed(Boolean(data.listedInLibrary))
    } catch {
      /** ignore */
    }
  }, [runId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const shareUrl =
    runId && isPublic ? `${appOrigin()}/memo/${encodeURIComponent(runId)}` : null

  const patch = async (body: Record<string, unknown>) => {
    if (!runId) return
    setBusy(true)
    try {
      const r = await fetch("/api/validation-run", {
        method: "PATCH",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: runId, ...body }),
      })
      if (r.ok) await refresh()
    } finally {
      setBusy(false)
    }
  }

  const copyText = async (label: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(label)
      setTimeout(() => setCopied(null), 2000)
    } catch {
      setCopied(null)
    }
  }

  const thread = buildTwitterThreadFromMemo(memoPayload, { siteUrl: appOrigin() })

  if (!runId) {
    return (
      <aside className="rounded-sm border border-bone-0/[0.08] bg-bone-0/[0.02] px-4 py-4 md:px-6">
        <div className="mono-caption text-bone-2">Share & viral</div>
        <p className="mt-2 text-[14px] leading-relaxed text-bone-2">
          Save this memo to your account run history to get a shareable link and library listing.
        </p>
      </aside>
    )
  }

  return (
    <aside
      className="rounded-sm border border-bone-0/[0.08] bg-gradient-to-r from-bone-0/[0.03] to-transparent px-4 py-5 md:px-6"
      aria-label="Sharing and distribution"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mono-caption text-ember/70">Distribution</div>
          <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-bone-2">
            Public link + optional community gallery. Thread text is generated locally — paste into X.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => void patch({ is_public: !isPublic })}
            className="rounded-sm border border-bone-0/15 px-3 py-2 text-[12px] uppercase tracking-[0.14em] text-bone-1 hover:border-bone-0/30 hover:text-bone-0 disabled:opacity-50"
          >
            {isPublic ? "Stop sharing" : "Share publicly"}
          </button>
          <button
            type="button"
            disabled={busy || !isPublic}
            onClick={() => void patch({ listed_in_library: !listed })}
            className="rounded-sm border border-bone-0/15 px-3 py-2 text-[12px] uppercase tracking-[0.14em] text-bone-1 hover:border-bone-0/30 hover:text-bone-0 disabled:opacity-50"
          >
            {listed ? "Remove from explore" : "List on explore"}
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 border-t border-bone-0/[0.06] pt-5 md:flex-row md:flex-wrap md:items-center">
        {shareUrl ? (
          <button
            type="button"
            onClick={() => void copyText("link", shareUrl)}
            className="tab-cta inline-flex max-w-full text-left"
          >
            <span className="truncate">{copied === "link" ? "Copied link" : "Copy public link"}</span>
            <span className="tab-cta-arrow flex-shrink-0">→</span>
          </button>
        ) : (
          <span className="mono-caption text-bone-2">Enable public sharing to copy a link.</span>
        )}

        <button
          type="button"
          onClick={() => void copyText("thread", thread)}
          className="rounded-sm border border-bone-0/12 px-3 py-2 text-[12px] text-bone-1 hover:border-bone-0/25 hover:text-bone-0"
        >
          {copied === "thread" ? "Thread copied" : "Copy X thread"}
        </button>

        <Link
          href={`/dashboard/compare?a=${encodeURIComponent(runId)}&title=${encodeURIComponent(ideaTitle.slice(0, 80))}`}
          className="rounded-sm border border-bone-0/12 px-3 py-2 text-[12px] text-bone-1 hover:border-bone-0/25 hover:text-bone-0"
        >
          Compare memos
        </Link>

        <Link href="/explore" className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0">
          Explore public memos →
        </Link>
      </div>
    </aside>
  )
}
