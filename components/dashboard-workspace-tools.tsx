"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

/**
 * ⌘K quick jump palette + ? shortcuts overlay — lightweight, no extra deps.
 */
export function DashboardWorkspaceTools() {
  const router = useRouter()
  const [palette, setPalette] = useState(false)
  const [help, setHelp] = useState(false)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const meta = e.metaKey || e.ctrlKey
      if (meta && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setPalette((v) => !v)
        setHelp(false)
        return
      }
      if (e.key === "?" && !meta && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault()
        setHelp((v) => !v)
        setPalette(false)
      }
      if (e.key === "Escape") {
        setPalette(false)
        setHelp(false)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  function go(href: string) {
    setPalette(false)
    router.push(href)
  }

  return (
    <>
      {palette ? (
        <div
          role="dialog"
          aria-modal
          aria-label="Quick navigation"
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[min(18vh,160px)] backdrop-blur-sm"
          onMouseDown={() => setPalette(false)}
        >
          <div
            className="w-full max-w-lg rounded-lg border border-white/[0.1] bg-ink-1 p-4 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="mono-caption text-bone-2">Quick jump · ⌘K</p>
            <ul className="mt-4 space-y-1">
              <QuickRow label="New memo" onClick={() => go("/dashboard/validate")} />
              <QuickRow label="Compare memos" onClick={() => go("/dashboard/compare")} />
              <QuickRow label="Founder workspace" onClick={() => go("/dashboard/founder")} />
              <QuickRow label="Explore public memos" onClick={() => go("/explore")} />
              <QuickRow label="Settings" onClick={() => go("/dashboard/settings")} />
            </ul>
            <p className="mono-caption mt-4 text-bone-2">Esc to close</p>
          </div>
        </div>
      ) : null}

      {help ? (
        <div
          role="dialog"
          aria-modal
          aria-label="Keyboard shortcuts"
          className="fixed inset-0 z-[200] flex items-start justify-center bg-black/70 px-4 pt-[min(18vh,160px)] backdrop-blur-sm"
          onMouseDown={() => setHelp(false)}
        >
          <div
            className="w-full max-w-md rounded-lg border border-white/[0.1] bg-ink-1 p-6 shadow-2xl"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <p className="mono-caption text-ember/80">Shortcuts</p>
            <ul className="mt-4 space-y-3 text-[14px] text-bone-1">
              <li className="flex justify-between gap-4">
                <span>Quick jump</span>
                <kbd className="rounded border border-white/10 bg-ink-0 px-2 py-0.5 font-mono text-[11px] text-bone-0">
                  ⌘K
                </kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>This help</span>
                <kbd className="rounded border border-white/10 bg-ink-0 px-2 py-0.5 font-mono text-[11px] text-bone-0">
                  ?
                </kbd>
              </li>
              <li className="flex justify-between gap-4">
                <span>Submit brief (on validate)</span>
                <kbd className="rounded border border-white/10 bg-ink-0 px-2 py-0.5 font-mono text-[11px] text-bone-0">
                  ⌘↵
                </kbd>
              </li>
            </ul>
            <Link
              href="/dashboard/validate"
              className="tab-cta mt-8 inline-flex"
              onClick={() => setHelp(false)}
            >
              <span>Go to validate</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
            <p className="mono-caption mt-4 text-bone-2">Esc to close</p>
          </div>
        </div>
      ) : null}
    </>
  )
}

function QuickRow({ label, hint, onClick }: { label: string; hint?: string; onClick: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-md px-3 py-2.5 text-left text-[14px] text-bone-0 transition hover:bg-white/[0.05]"
      >
        <span>{label}</span>
        {hint ? <span className="mono-caption text-bone-2">{hint}</span> : null}
      </button>
    </li>
  )
}
