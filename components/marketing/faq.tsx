"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ease } from "@/lib/motion"

interface QA {
  q: string
  a: string
}

const QAS: QA[] = [
  {
    q: "Is this just another GPT wrapper?",
    a: "No. The system chains seven specialist agents and a Final Judge. Each agent has one job and is paid to find a specific kind of weakness. The output is a memo, not a chat reply. The shape of the document — verdict, opportunity score, agent panels, fatal risks, 48-hour plan — is the product, not the model.",
  },
  {
    q: "What if my idea is genuinely strong?",
    a: "Then it survives the bench. The verdict is BUILD, with a sharp 'works because…' and a 48-hour falsification window. The system is not biased toward KILL — it is biased toward truth. Most ideas fail because most ideas have specific, identifiable problems. We name them.",
  },
  {
    q: "Why only two memos a day?",
    a: "Because the answer is the memo, not the volume. Two memos a day forces you to bring substance. The system is not a slot machine. If you need ten verdicts a day, you don't need verdicts — you need to commit.",
  },
  {
    q: "Do I need to sign up?",
    a: "Yes. The first memo files behind a free account so the ledger of your decisions, attempts, and verdicts has somewhere to live. No card. No upsell. The teaser above is the only thing that runs anonymously.",
  },
  {
    q: "What does the system not do?",
    a: "It does not write your code, raise your round, or hire your team. It rules on the brief you bring. The 48-hour falsification plan tells you exactly what to do next — but the doing is yours.",
  },
  {
    q: "How brutal is 'brutally honest'?",
    a: "If your idea has a fatal flaw, the system names it before it praises anything. The Risk & Failure agent is paid to break it. The Final Judge does not hedge. If you want validation theatre, this is the wrong product.",
  },
  {
    q: "What happens after the verdict?",
    a: "You log falsification attempts on the dashboard — what you tried, what you learned, whether the result killed or strengthened the idea. The Iteration engine refines the brief. Your ledger keeps every version on file. This is a continuous decision system, not a one-shot tool.",
  },
]

export function Faq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section
      data-section="faq"
      className="relative border-t border-bone-0/[0.06] py-24 md:py-32"
    >
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
          <div className="md:col-span-4">
            <p className="mono-caption">07 — Office hours</p>
            <h2 className="mt-6 font-serif text-[clamp(36px,5vw,68px)] leading-[1.02] tracking-[-0.03em]">
              Standing
              <br />
              <em className="font-serif italic text-bone-1">objections.</em>
            </h2>
            <p className="mt-6 max-w-[360px] text-[15px] leading-[1.55] text-bone-1">
              The seven questions every founder asks before they file. Answered plainly.
            </p>
          </div>

          <div className="md:col-span-8">
            <ul className="border-t border-bone-0/[0.1]">
              {QAS.map((qa, i) => {
                const isOpen = open === i
                return (
                  <li key={qa.q} className="border-b border-bone-0/[0.1]">
                    <button
                      type="button"
                      onClick={() => setOpen(isOpen ? null : i)}
                      aria-expanded={isOpen}
                      className="grid w-full grid-cols-[40px_1fr_auto] items-baseline gap-4 py-6 text-left transition-colors duration-200 hover:bg-bone-0/[0.02] md:grid-cols-[60px_1fr_auto] md:gap-8"
                      data-cursor="qa"
                    >
                      <span className="font-mono text-[11px] tabular tracking-[0.1em] text-bone-2">
                        Q.{String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-serif text-[clamp(19px,2.2vw,26px)] leading-[1.2] tracking-[-0.015em] text-bone-0">
                        {qa.q}
                      </span>
                      <motion.span
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={{ duration: 0.3, ease: ease.editorial }}
                        className="font-mono text-[18px] tabular text-bone-1"
                        aria-hidden
                      >
                        +
                      </motion.span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          key="answer"
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: ease.editorial }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-[40px_1fr] gap-4 pb-7 md:grid-cols-[60px_1fr] md:gap-8">
                            <span className="font-mono text-[11px] tabular tracking-[0.1em] text-bone-2">
                              A.
                            </span>
                            <p className="max-w-[640px] text-[15px] leading-[1.6] text-bone-1 md:text-[16px]">
                              {qa.a}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
