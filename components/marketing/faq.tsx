"use client"

import * as AccordionPrimitive from "@radix-ui/react-accordion"
import { cn } from "@/lib/utils"

interface QA {
  q: string
  a: string
}

const QAS: QA[] = [
  {
    q: "What is this in one sentence?",
    a: "You write a startup brief (plain words). VERDIKT responds with one structured memo: seven fixed angles of commentary, unresolved tensions kept visible, a BUILD/PIVOT/KILL verdict band, rough compression scoring, and a 48-hour test checklist.",
  },
  {
    q: "Is it 'AI validates my genius'?",
    a: "No. It's patterned analysis plus synthesis. Useful when you're missing obvious tradeoffs — not magic and not impartial truth. Skepticism stays your job.",
  },
  {
    q: "Why limit runs per day?",
    a: "To keep output legible instead of endlessly re-rolling drafts. Iterate on the hypothesis between runs.",
  },
  {
    q: "Do I need an account?",
    a: "The full memo flow uses a simple account so filings have a destination. Starter surfaces may differ; check the Validate page.",
  },
  {
    q: "What doesn't it do?",
    a: "No fundraising advice, recruiting, pitch polish, or code. It's for early wedge clarity — what's unclear, contradictory, expensive, or brittle.",
  },
  {
    q: "Is my text private?",
    a: "We treat filings as confidential workspace data — not SEO content. Inspect the Privacy page for specifics when we publish legal text.",
  },
  {
    q: "What happens after BUILD or PIVOT?",
    a: "You execute the checklist, log what broke or held, tighten the brief, and rerun. History stays searchable when you're signed in.",
  },
]

export function Faq() {
  return (
    <section id="faq" data-section="faq" className="relative border-t border-white/[0.06] bg-ink-1/80 py-24 md:py-32">
      <div className="mx-auto max-w-[1200px] px-6 md:px-10">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-12">
          <div className="md:col-span-4">
            <p className="marketing-label">FAQ</p>
            <h2 className="marketing-title mt-4 font-sans">Plain answers.</h2>
            <p className="marketing-body mt-4 max-w-[360px] text-bone-2">
              Seven common questions — no jargon wall.
            </p>
          </div>

          <div className="md:col-span-8">
            <AccordionPrimitive.Root type="single" collapsible defaultValue="item-0" className="border-t border-bone-0/[0.08]">
              {QAS.map((qa, i) => (
                <AccordionPrimitive.Item key={qa.q} value={`item-${i}`} className="border-b border-bone-0/[0.08]">
                  <AccordionPrimitive.Header>
                    <AccordionPrimitive.Trigger
                      className={cn(
                        "group grid w-full grid-cols-[40px_1fr_auto] items-baseline gap-4 border-l-2 border-transparent py-5 pl-3 text-left transition-colors md:grid-cols-[52px_1fr_auto] md:gap-8 md:pl-4",
                        "hover:bg-bone-0/[0.04] focus:outline-none focus-visible:ring-2 focus-visible:ring-ember/25",
                        "data-[state=open]:border-ember/45",
                      )}
                    >
                      <span className="tabular text-[13px] font-medium text-bone-2 group-data-[state=open]:text-bone-1">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[clamp(16px,1.6vw,19px)] leading-[1.3] tracking-[-0.01em] text-bone-0">
                        {qa.q}
                      </span>
                      <span
                        aria-hidden
                        className="font-mono text-[16px] tabular text-bone-2 transition-transform duration-300 group-data-[state=open]:rotate-45"
                        style={{ transitionTimingFunction: "cubic-bezier(0.25, 0.1, 0.25, 1)" }}
                      >
                        +
                      </span>
                    </AccordionPrimitive.Trigger>
                  </AccordionPrimitive.Header>
                  <AccordionPrimitive.Content
                    className="overflow-hidden text-bone-0 data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                  >
                    <div className="grid grid-cols-[40px_1fr] gap-4 pb-6 md:grid-cols-[52px_1fr] md:gap-8">
                      <span />
                      <p className="border-l-2 border-ember/35 pl-4 text-[15px] leading-[1.6] text-bone-1 md:pl-6">
                        {qa.a}
                      </p>
                    </div>
                  </AccordionPrimitive.Content>
                </AccordionPrimitive.Item>
              ))}
            </AccordionPrimitive.Root>
          </div>
        </div>
      </div>
    </section>
  )
}
