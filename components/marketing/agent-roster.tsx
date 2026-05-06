"use client"

import { useState } from "react"
import { motion, useInView } from "framer-motion"
import { useRef } from "react"
import { ease } from "@/lib/motion"

interface Agent {
  n: string
  name: string
  role: string
  signature: string
  weapon: string
  accent: "build" | "pivot" | "kill" | "neutral"
}

const AGENTS: Agent[] = [
  {
    n: "01",
    name: "MarketResearchAgent",
    role: "Reads markets like a partner, not a Wikipedia article.",
    signature: "Cites specific country, segment, and budget line. Hates vague trend lines.",
    weapon: "Country-specific market geometry",
    accent: "neutral",
  },
  {
    n: "02",
    name: "CompetitorAgent",
    role: "Treats founder claims as guilty until proven unique.",
    signature: "Lists named alternatives, including the spreadsheet they have to beat.",
    weapon: "Saturation map",
    accent: "kill",
  },
  {
    n: "03",
    name: "MonetizationAgent",
    role: "Asks who has the budget. If no one has it, kills it.",
    signature: "Names the buyer, the line item, and the price ceiling. Practical, not theoretical.",
    weapon: "Willingness-to-pay reality check",
    accent: "build",
  },
  {
    n: "04",
    name: "FeasibilityAgent",
    role: "Maps the systems-architecture cost of every promise.",
    signature: "Hours, headcount, infra. The cost of staying built. No romance.",
    weapon: "Execution complexity index",
    accent: "neutral",
  },
  {
    n: "05",
    name: "ICPAgent",
    role: "Understands the buyer's psychology better than the buyer.",
    signature: "Names the moment of pain, the language they'd google, the slack they'd post in.",
    weapon: "Pain forensics",
    accent: "pivot",
  },
  {
    n: "06",
    name: "RiskFailureAgent",
    role: "Paid to find the way this dies.",
    signature: "Brutal, destructive, never reassuring. If the idea is fragile, this agent breaks it.",
    weapon: "Failure mode index",
    accent: "kill",
  },
  {
    n: "07",
    name: "ValidationStrategyAgent",
    role: "Designs the falsification window in 48 hours.",
    signature: "Tactical: who to talk to, what to ship, what to measure, when to quit.",
    weapon: "48-hour falsification protocol",
    accent: "build",
  },
]

const accentMap = {
  build: "text-verdict-build",
  pivot: "text-verdict-pivot",
  kill: "text-verdict-kill",
  neutral: "text-bone-0",
}

export function AgentRoster() {
  const [active, setActive] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const inView = useInView(sectionRef, { once: true, margin: "-20%" })

  return (
    <section
      ref={sectionRef}
      data-section="agents"
      className="relative border-t border-bone-0/[0.06] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-5">
            <p className="mono-caption">04 · Perspective stack</p>
            <h2 className="mt-6 font-serif text-[clamp(36px,5vw,68px)] leading-[1.02] tracking-[-0.03em]">
              Seven tension lenses.
              <br />
              <em className="font-serif italic text-bone-1">One decision frame.</em>
            </h2>
            <p className="mt-8 max-w-[420px] text-[16px] leading-[1.55] text-bone-1">
              Not a swarm of chat personas. Each lens reads your brief from a hardened angle so contradictions survive long enough for you to see them clearly.
            </p>
            <div className="mt-8 inline-flex items-center gap-3 bg-bone-0/[0.03] px-4 py-3">
              <span className="font-serif text-[20px] italic text-bone-0">+</span>
              <div>
                <div className="mono-caption text-bone-2">Closer read</div>
                <div className="text-[14px] leading-snug text-bone-0">Synthesis + ruling language when the dust settles.</div>
              </div>
            </div>
          </div>

          <div className="md:col-span-7">
            <ul className="border-t border-bone-0/[0.08]">
              {AGENTS.map((a, i) => (
                <motion.li
                  key={a.n}
                  initial={{ opacity: 0, y: 16 }}
                  animate={inView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.04 * i, ease: ease.editorial }}
                  className="group relative border-b border-bone-0/[0.08]"
                  onMouseEnter={() => setActive(i)}
                  onMouseLeave={() => setActive((cur) => (cur === i ? null : cur))}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive((cur) => (cur === i ? null : cur))}
                  data-cursor="dossier"
                >
                  <button
                    type="button"
                    className="grid w-full grid-cols-[40px_1fr_auto] items-center gap-4 py-5 text-left transition-colors duration-300 hover:bg-bone-0/[0.02] md:grid-cols-[64px_1fr_auto] md:gap-6 md:py-6"
                    aria-expanded={active === i}
                  >
                    <span
                      className={`font-mono text-[12px] tabular tracking-[0.1em] transition-colors duration-300 ${active === i ? accentMap[a.accent] : "text-bone-2"}`}
                    >
                      {a.n}
                    </span>

                    <div>
                      <div className="font-serif text-[clamp(20px,2.4vw,28px)] leading-tight tracking-[-0.015em] text-bone-0">
                        {a.name}
                      </div>
                      <div className="mt-1 text-[14px] leading-snug text-bone-1 md:text-[15px]">
                        {a.role}
                      </div>
                    </div>

                    <span
                      className={`font-mono text-[18px] tabular transition-transform duration-300 ${active === i ? "translate-x-1 text-bone-0" : "text-bone-2"}`}
                      aria-hidden
                    >
                      →
                    </span>
                  </button>

                  <motion.div
                    initial={false}
                    animate={{
                      height: active === i ? "auto" : 0,
                      opacity: active === i ? 1 : 0,
                    }}
                    transition={{ duration: 0.32, ease: ease.editorial }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-1 gap-4 pb-6 pl-[56px] pr-4 md:grid-cols-[1fr_240px] md:gap-8 md:pl-[88px]">
                      <p className="font-serif text-[17px] italic leading-[1.5] text-bone-1">
                        {a.signature}
                      </p>
                      <div className="border-t border-bone-0/[0.06] pt-3 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                        <div className="mono-caption text-bone-2">WEAPON</div>
                        <div className={`mt-1 text-[14px] leading-snug ${accentMap[a.accent]}`}>
                          {a.weapon}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
