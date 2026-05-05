"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { ease } from "@/lib/motion"

type Verdict = "BUILD" | "PIVOT" | "KILL"
type Phase = "idle" | "thinking" | "ruled"

const SAMPLE_PROMPTS = [
  "An AI that auto-summarises investor calls",
  "A marketplace for freelance compliance officers",
  "A CLI that catches infra-cost regressions in CI",
  "A social network for indie game devs",
  "A vertical SaaS for boutique law firms",
]

/**
 * Heuristic verdict.
 *
 * This is intentionally lightweight — it exists to let visitors taste the
 * tone of the system, then escalate them to a real memo. We deliberately
 * lean toward critical verdicts: the brand is "brutally honest," and a
 * teaser that hands out BUILD verdicts cheaply would corrode trust.
 */
function judgeIdea(input: string): { verdict: Verdict; brutalLine: string; oneSignal: string } {
  const t = input.toLowerCase().trim()

  let buildScore = 0
  let pivotScore = 0
  let killScore = 0

  // Build signals — narrow, professional, tooling
  if (/(tool|cli|api|sdk|dashboard|integration|workflow|compliance|finops|secops|devops|infra|automation)/i.test(t)) buildScore += 2
  if (/(for (engineers|accountants|lawyers|compliance|founders|recruiters|sales|operators|finance|ops))/i.test(t)) buildScore += 2
  if (/(b2b|saas|enterprise|vertical)/i.test(t)) buildScore += 1
  if (/(catches|prevents|detects|reduces|cuts)/i.test(t)) buildScore += 1

  // Pivot signals — broad platform, marketplace
  if (/(marketplace|platform|community|app for everyone|social)/i.test(t)) pivotScore += 2
  if (/(uber for|airbnb for|tinder for|notion for)/i.test(t)) pivotScore += 2
  if (/(everyone|anyone|consumers|general public)/i.test(t)) pivotScore += 1

  // Kill signals — saturated, hype, vague
  if (/(blockchain|nft|web3|crypto|metaverse)/i.test(t)) killScore += 3
  if (/(dating|social network|tiktok|youtube|email client)/i.test(t)) killScore += 2
  if (/(ai (writer|chatbot|assistant)( for)? general)/i.test(t)) killScore += 2
  if (/(another|better|reinvent|disrupt)/i.test(t)) killScore += 1
  if (t.length > 0 && t.length < 24) killScore += 1

  let verdict: Verdict = "PIVOT"
  if (killScore >= buildScore && killScore >= pivotScore && killScore > 0) verdict = "KILL"
  else if (buildScore > pivotScore && buildScore > killScore) verdict = "BUILD"

  const excerpt = input.slice(0, 80).trim().replace(/\s+/g, " ")

  const lines: Record<Verdict, { brutal: string; signal: string }> = {
    KILL: {
      brutal: `Saturated category. "${excerpt}" has no defensible wedge against incumbents who price at zero. Distribution dies before differentiation can.`,
      signal: "Solution looking for a problem.",
    },
    PIVOT: {
      brutal: `Right pain in "${excerpt}". Wrong shape. The buyer with budget is not the user you've described — and the system you've drawn around it does not bill anyone.`,
      signal: "Real problem, wrong wedge.",
    },
    BUILD: {
      brutal: `Narrow, painful, paid. "${excerpt}" is a wedge — falsifiable inside a week if you sell to ten of the right people. The risk is execution, not category.`,
      signal: "Wedge has shape. Now go find ten.",
    },
  }

  return { verdict, brutalLine: lines[verdict].brutal, oneSignal: lines[verdict].signal }
}

const verdictColor: Record<Verdict, string> = {
  BUILD: "text-verdict-build",
  PIVOT: "text-verdict-pivot",
  KILL: "text-verdict-kill",
}

const verdictBg: Record<Verdict, string> = {
  BUILD: "bg-verdict-build",
  PIVOT: "bg-verdict-pivot",
  KILL: "bg-verdict-kill",
}

export function InlineTry() {
  const [phase, setPhase] = useState<Phase>("idle")
  const [input, setInput] = useState("")
  const [result, setResult] = useState<ReturnType<typeof judgeIdea> | null>(null)
  const [samplePrompt, setSamplePrompt] = useState(SAMPLE_PROMPTS[0])
  const taRef = useRef<HTMLTextAreaElement | null>(null)

  // Rotate placeholder for liveness
  useEffect(() => {
    let i = 0
    const id = setInterval(() => {
      i = (i + 1) % SAMPLE_PROMPTS.length
      setSamplePrompt(SAMPLE_PROMPTS[i])
    }, 4500)
    return () => clearInterval(id)
  }, [])

  function autosize(el: HTMLTextAreaElement | null) {
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${Math.min(el.scrollHeight, 240)}px`
  }

  function handleSubmit() {
    if (!input.trim() || input.trim().length < 8) return
    setPhase("thinking")
    setResult(null)
    // Theatrical delay — feel the agents conferring
    setTimeout(() => {
      setResult(judgeIdea(input))
      setPhase("ruled")
    }, 1100)
  }

  function handleReset() {
    setPhase("idle")
    setResult(null)
    setInput("")
    setTimeout(() => taRef.current?.focus(), 0)
  }

  function handleEscalate() {
    try {
      const payload = {
        title: input.slice(0, 80).trim(),
        description: input.trim(),
        problem_solving: "",
        target_market: "",
      }
      localStorage.setItem("fv_prefill_validate", JSON.stringify(payload))
    } catch {}
  }

  return (
    <section
      data-section="try"
      className="relative border-y border-bone-0/[0.06] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <p className="mono-caption">02 — Inline draft</p>
            <h2 className="mt-6 font-serif text-[clamp(32px,4vw,52px)] leading-[1.05] tracking-[-0.025em]">
              Try a sentence. <em className="font-serif italic text-bone-1">See the tone.</em>
            </h2>
            <p className="mt-6 max-w-[360px] text-[15px] leading-[1.55] text-bone-1">
              Type a one-line idea. The system stamps a teaser verdict so you can taste the voice. Then file a real memo and seven agents argue it on the record.
            </p>
            <p className="mono-caption mt-6 text-bone-2">
              No card. No sign-up to taste. Sign-up only when you file a real one.
            </p>
          </div>

          <div className="md:col-span-8">
            <div
              data-cursor={phase === "ruled" ? "verdict" : "input"}
              className="relative border border-bone-0/[0.08] bg-ink-1/40 p-6 md:p-10"
            >
              <div className="absolute left-0 top-0 h-full w-px bg-gradient-to-b from-bone-0/30 via-bone-0/10 to-transparent" />

              {/* Header strip */}
              <div className="flex items-center justify-between gap-4 border-b border-bone-0/[0.06] pb-4">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping bg-bone-0 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 bg-bone-0" />
                  </span>
                  <span className="mono-caption tabular text-bone-1">
                    {phase === "idle" && "INTAKE OPEN"}
                    {phase === "thinking" && "AGENTS CONFERRING…"}
                    {phase === "ruled" && "VERDICT FILED"}
                  </span>
                </div>
                <span className="mono-caption tabular text-bone-2 hidden sm:inline">
                  TEASER · NOT FOR THE LEDGER
                </span>
              </div>

              <AnimatePresence mode="wait">
                {phase !== "ruled" && (
                  <motion.div
                    key="form"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: ease.editorial }}
                  >
                    <label className="mono-caption mt-6 block text-bone-2">
                      One-line idea
                    </label>
                    <textarea
                      ref={taRef}
                      rows={2}
                      value={input}
                      disabled={phase === "thinking"}
                      onChange={(e) => {
                        setInput(e.target.value)
                        autosize(e.currentTarget)
                      }}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                          handleSubmit()
                        }
                      }}
                      placeholder={samplePrompt}
                      className="mt-3 w-full resize-none border-0 border-b border-bone-0/15 bg-transparent pb-4 font-serif text-[clamp(22px,2.6vw,34px)] leading-[1.2] tracking-[-0.015em] text-bone-0 placeholder:text-bone-2/70 focus:border-bone-0 focus:outline-none"
                    />

                    <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                      <span className="mono-caption tabular text-bone-2">
                        {input.length > 0 ? `${input.length} chars` : "0 chars"} · ⌘⏎ to file
                      </span>
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={input.trim().length < 8 || phase === "thinking"}
                        className={`tab-cta ${input.trim().length < 8 || phase === "thinking" ? "pointer-events-none opacity-40" : ""}`}
                      >
                        <span>{phase === "thinking" ? "Filing teaser…" : "Tease the verdict"}</span>
                        <span className="tab-cta-arrow">→</span>
                      </button>
                    </div>
                  </motion.div>
                )}

                {phase === "ruled" && result && (
                  <motion.div
                    key="ruling"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: ease.editorial }}
                    className="pt-6"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`h-3 w-3 ${verdictBg[result.verdict]}`} />
                      <span className="mono-caption tabular text-bone-2">
                        TEASER VERDICT · {new Date().toUTCString().slice(17, 25)} UTC
                      </span>
                    </div>

                    <div
                      className={`mt-4 font-serif text-[clamp(48px,9vw,120px)] leading-[0.95] tracking-[-0.04em] ${verdictColor[result.verdict]}`}
                    >
                      {result.verdict.split("").map((c, i) => (
                        <motion.span
                          key={i}
                          initial={{ y: "100%", opacity: 0 }}
                          animate={{ y: 0, opacity: 1 }}
                          transition={{ delay: i * 0.05, duration: 0.42, ease: ease.editorial }}
                          className="inline-block"
                        >
                          {c}
                        </motion.span>
                      ))}
                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-[180px_1fr]">
                      <div>
                        <p className="mono-caption text-bone-2">SIGNAL</p>
                        <p className="mt-2 text-[15px] leading-snug text-bone-0">
                          {result.oneSignal}
                        </p>
                      </div>
                      <div className="border-l-0 border-t border-bone-0/[0.06] pt-6 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                        <p className="mono-caption text-bone-2">FINAL JUDGE — TEASER LINE</p>
                        <p className="mt-2 font-serif text-[18px] italic leading-[1.45] text-bone-0 md:text-[20px]">
                          "{result.brutalLine}"
                        </p>
                      </div>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-bone-0/[0.06] pt-6">
                      <p className="max-w-[420px] text-[13px] leading-[1.5] text-bone-2">
                        This is one line from one judge. The full memo runs <span className="text-bone-0">7 agents</span>, finds <span className="text-bone-0">5 fatal risks</span>, and ships a <span className="text-bone-0">48-hour falsification plan</span>.
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <button
                          type="button"
                          onClick={handleReset}
                          className="tab-cta tab-cta-quiet"
                        >
                          <span>Try another</span>
                          <span className="tab-cta-arrow">↻</span>
                        </button>
                        <Link
                          href="/auth?next=/dashboard/validate"
                          onClick={handleEscalate}
                          className="tab-cta"
                          data-cursor="file"
                        >
                          <span>File the real memo</span>
                          <span className="tab-cta-arrow">→</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {phase === "thinking" && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-x-0 bottom-0 h-px overflow-hidden"
                >
                  <motion.div
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 1.05, ease: "linear" }}
                    className="h-px w-full bg-bone-0"
                  />
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
