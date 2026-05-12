"use client"

import { useCallback, useEffect, useMemo, useState } from "react"

type PlanRow = { day?: string; action?: string; order?: number }

function storageKey(runId: string) {
  return `fv_48h_challenge_${runId}`
}

export function Challenge48hPanel({
  runId,
  plan,
  fallbackLines,
}: {
  runId: string | null
  plan?: PlanRow[] | null
  fallbackLines?: string[] | null
}) {
  const [optIn, setOptIn] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")

  const rows = useMemo(() => {
    if (Array.isArray(plan) && plan.length > 0) {
      return plan.slice(0, 6).map((p, i) => ({
        label: p.day || `Step ${i + 1}`,
        text: p.action || "",
      }))
    }
    if (Array.isArray(fallbackLines)) {
      return fallbackLines.slice(0, 6).map((t, i) => ({ label: `Day ${i < 2 ? 1 : 2}`, text: t }))
    }
    return []
  }, [plan, fallbackLines])

  useEffect(() => {
    if (typeof window === "undefined" || !runId) return
    try {
      const raw = localStorage.getItem(storageKey(runId))
      setOptIn(raw === "1")
    } catch {
      setOptIn(false)
    }
    setPermission(typeof Notification !== "undefined" ? Notification.permission : "denied")
  }, [runId])

  const persistOptIn = useCallback(
    (on: boolean) => {
      if (!runId) return
      try {
        if (on) localStorage.setItem(storageKey(runId), "1")
        else localStorage.removeItem(storageKey(runId))
      } catch {
        /** ignore */
      }
      setOptIn(on)
    },
    [runId],
  )

  const scheduleReminders = useCallback(async () => {
    if (typeof window === "undefined" || rows.length === 0) return
    let perm = Notification.permission
    if (perm === "default") {
      perm = await Notification.requestPermission()
      setPermission(perm)
    }
    if (perm !== "granted") return

    const delaysHours = [4, 24, 44]
    const title = "VERDIKT · 48h challenge"
    delaysHours.forEach((h, i) => {
      const ms = h * 60 * 60 * 1000
      const body =
        rows[i]?.text?.slice(0, 140) ||
        rows[0]?.text?.slice(0, 140) ||
        "Log what you learned from today's falsification."
      window.setTimeout(() => {
        try {
          new Notification(title, { body, tag: `fv48_${runId}_${i}` })
        } catch {
          /** ignore */
        }
      }, ms)
    })
  }, [rows, runId])

  const onToggle = async () => {
    if (optIn) {
      persistOptIn(false)
      return
    }
    persistOptIn(true)
    await scheduleReminders()
  }

  if (!runId || rows.length === 0) return null

  return (
    <section className="mt-14 border border-bone-0/[0.08] bg-bone-0/[0.02] px-6 py-8 md:px-10">
      <div className="mono-caption text-ember/70">Prove it wrong · 48h</div>
      <h2 className="mt-3 font-serif text-[clamp(22px,2.5vw,32px)] leading-tight tracking-[-0.02em]">
        Challenge mode
      </h2>
      <p className="mt-3 max-w-[640px] text-[14px] leading-relaxed text-bone-2">
        Opt in for browser reminders near your plan checkpoints (best-effort scheduling in this browser). After 48h,
        re-run Validate with what you learned — that closes the loop.
      </p>
      {permission === "denied" ? (
        <p className="mt-4 text-[13px] text-verdict-pivot">Notifications are blocked — enable them for this site to use reminders.</p>
      ) : null}
      <button
        type="button"
        onClick={() => void onToggle()}
        className="tab-cta mt-6"
      >
        <span>{optIn ? "Leave challenge" : "Opt into reminders"}</span>
        <span className="tab-cta-arrow">→</span>
      </button>
      <ul className="mt-8 divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
        {rows.map((r, i) => (
          <li key={i} className="grid grid-cols-1 gap-2 py-4 md:grid-cols-[120px_1fr] md:gap-6">
            <span className="mono-caption text-bone-2">{r.label}</span>
            <span className="text-[15px] leading-snug text-bone-0">{r.text}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
