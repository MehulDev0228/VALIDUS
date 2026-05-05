"use client"

import { useEffect, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"
import { ease } from "@/lib/motion"

/**
 * SelectionQuote
 *
 * When the user selects any text on the page, a small forensic popover
 * appears above the selection: "ON THE RECORD — Copy ↵". It writes the
 * selection to the clipboard with the brand-stamp suffix appended, so any
 * shared screenshot or paste carries the system's voice.
 *
 * Bespoke detail: the popover's left edge is a verdict-pulse rule that
 * scans across once when it appears — same rhythm as the nav.
 */
export function SelectionQuote() {
  const [coords, setCoords] = useState<{ x: number; y: number } | null>(null)
  const [text, setText] = useState("")
  const [copied, setCopied] = useState(false)
  const popRef = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const handle = () => {
      const sel = window.getSelection()
      if (!sel || sel.isCollapsed) {
        setCoords(null)
        return
      }
      const value = sel.toString().trim()
      if (value.length < 6 || value.length > 600) {
        setCoords(null)
        return
      }
      // Don't re-show inside our own popover.
      const anchor = sel.anchorNode?.parentElement
      if (anchor && popRef.current && popRef.current.contains(anchor)) return
      const range = sel.getRangeAt(0)
      const rect = range.getBoundingClientRect()
      if (!rect || (rect.width === 0 && rect.height === 0)) return
      setCoords({ x: rect.left + rect.width / 2, y: rect.top })
      setText(value)
      setCopied(false)
    }
    const onDown = (e: MouseEvent) => {
      // Hide popover on outside click.
      if (popRef.current && popRef.current.contains(e.target as Node)) return
      setCoords(null)
    }
    document.addEventListener("selectionchange", handle)
    document.addEventListener("mousedown", onDown)
    return () => {
      document.removeEventListener("selectionchange", handle)
      document.removeEventListener("mousedown", onDown)
    }
  }, [])

  const onCopy = async () => {
    if (!text) return
    const stamp = `\n\n— Filed via FutureValidate · futurevalidate.ai`
    try {
      await navigator.clipboard.writeText(`"${text}"${stamp}`)
      setCopied(true)
      window.setTimeout(() => setCoords(null), 700)
    } catch {
      setCopied(false)
    }
  }

  return (
    <AnimatePresence>
      {coords && (
        <motion.div
          ref={popRef}
          initial={{ opacity: 0, y: -4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -4, scale: 0.98 }}
          transition={{ duration: 0.22, ease: ease.editorial }}
          style={{
            position: "fixed",
            top: Math.max(12, coords.y - 56),
            left: Math.max(80, Math.min(window.innerWidth - 80, coords.x)),
            transform: "translateX(-50%)",
            zIndex: 70,
          }}
          className="pointer-events-auto select-none border border-bone-0/15 bg-ink-1/95 backdrop-blur-md"
        >
          <div className="flex items-center gap-3 px-3 py-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inset-0 rounded-full bg-bone-0/40" />
              <motion.span
                className="absolute inset-0 rounded-full bg-bone-0"
                animate={reduce ? undefined : { scale: [1, 1.6, 1], opacity: [1, 0, 1] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              />
            </span>
            <span className="mono-caption tabular text-bone-1">ON THE RECORD</span>
            <span className="h-3 w-px bg-bone-0/10" />
            <button
              type="button"
              onClick={onCopy}
              data-cursor="cite"
              className="mono-caption text-bone-0 transition-colors hover:text-verdict-build"
            >
              {copied ? "Copied ✓" : "Copy ↵"}
            </button>
          </div>
          {/* Verdict scan rule */}
          <div className="relative h-px overflow-hidden bg-bone-0/10">
            {!reduce && (
              <motion.span
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 0.8, ease: ease.editorial }}
                className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-bone-0 to-transparent"
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
