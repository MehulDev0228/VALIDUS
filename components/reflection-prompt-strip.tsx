"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import type { VerdictLean } from "@/lib/founder-memory/types"

const PRESETS: Array<{ id: string; label: string }> = [
  { id: "surprise", label: "What surprised you most?" },
  { id: "assumption_shift", label: "Which assumption changed after testing?" },
  { id: "weaker", label: "What now feels weaker than before?" },
  { id: "stronger", label: "What became more convincing after execution?" },
]

/**
 * Short reflective capture — stored privately; not therapy framing.
 */
export function ReflectionPromptStrip({
  ideaId,
  ideaKey,
  verdict,
  trigger,
  autoRevealMs = 55_000,
  revealImmediately = false,
}: {
  ideaId: string | null
  ideaKey?: string | null
  verdict: VerdictLean
  trigger: string
  /** Show after quiet reading time */
  autoRevealMs?: number
  /** Skip delay (e.g. right after logging an experiment) */
  revealImmediately?: boolean
}) {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [promptId, setPromptId] = useState(PRESETS[0]!.id)
  const [note, setNote] = useState("")
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (revealImmediately) {
      setOpen(true)
      return
    }
    const t = window.setTimeout(() => setOpen(true), autoRevealMs)
    return () => clearTimeout(t)
  }, [autoRevealMs, revealImmediately])

  if (!open || done) return null

  const preset = PRESETS.find((p) => p.id === promptId) ?? PRESETS[0]!

  async function save() {
    setErr(null)
    if (!user?.id) {
      setErr("Sign in to append reflections to your private founder file.")
      return
    }
    if (!note.trim()) {
      setErr("A line or two is enough — empty notes are not stored.")
      return
    }
    setBusy(true)
    try {
      const idea = ideaId ?? undefined
      const key = ideaKey ?? undefined
      const body = {
        kind: "founder_reflection" as const,
        ideaId: idea,
        ideaKey: key,
        trigger,
        promptId: preset.id,
        promptLabel: preset.label,
        note: note.trim(),
      }
      const res = await fetch("/api/founder-memory/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(body),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(j.error || "Could not save reflection")

      void fetch("/api/product-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          events: [
            {
              kind: "reflection_submitted",
              ideaId: idea,
              ideaKey: key,
              verdict,
              meta: { promptId: preset.id, trigger },
            },
          ],
        }),
      }).catch(() => {})

      setDone(true)
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Could not save")
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="border border-bone-0/10 bg-ink-1/20 p-6 md:p-8">
      <div className="mono-caption text-bone-2">Private note · ~60 seconds</div>
      <p className="mt-3 max-w-[640px] text-[15px] leading-relaxed text-bone-0">
        Anchor what shifted for you — the archive remembers receipts, but not what it felt like to read them.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setPromptId(p.id)}
            className={`border px-3 py-2 text-[12px] transition-colors ${
              promptId === p.id ? "border-bone-0 text-bone-0" : "border-bone-0/15 text-bone-2 hover:border-bone-0/35"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="One or two sentences — what moved for you after reading this memo?"
        rows={3}
        className="mt-4 w-full resize-y border border-bone-0/10 bg-transparent px-3 py-3 text-[14px] text-bone-0 outline-none placeholder:text-bone-2 focus:border-bone-0/25"
        maxLength={4000}
      />
      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          type="button"
          disabled={busy || !user?.id}
          onClick={() => void save()}
          className={`mono-caption border border-bone-0/20 px-4 py-2 hover:border-bone-0/40 disabled:opacity-40`}
        >
          {busy ? "Saving…" : "Save to founder file"}
        </button>
        <button type="button" onClick={() => setDone(true)} className="mono-caption text-bone-2 underline-offset-4 hover:text-bone-0">
          Dismiss
        </button>
      </div>
      {!user?.id ? (
        <p className="mono-caption mt-3 text-bone-2">Sign in to save — prompts are visible either way.</p>
      ) : !ideaId ? (
        <p className="mono-caption mt-3 text-bone-2">Re-file from validate to attach a run id to this thread.</p>
      ) : null}
      {err ? <p className="mono-caption mt-3 text-verdict-kill">{err}</p> : null}
    </div>
  )
}
