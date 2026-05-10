"use client"

import Link from "next/link"
import { useCallback, type MouseEvent, type ReactNode } from "react"
import NumberFlow from "@number-flow/react"
import { motion, useReducedMotion } from "framer-motion"
import { parseAsStringLiteral, useQueryState } from "nuqs"
import { microcopy } from "@/lib/microcopy"
import { ease } from "@/lib/motion"
import { cn } from "@/lib/utils"

const billingParser = parseAsStringLiteral(["monthly", "annual"] as const).withDefault(
  "monthly",
)

function useSpotlightGlow() {
  return useCallback((e: MouseEvent<HTMLElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    el.style.setProperty("--spot-x", `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty("--spot-y", `${((e.clientY - r.top) / r.height) * 100}%`)
  }, [])
}

export function PricingCards() {
  const [billing, setBilling] = useQueryState("billing", billingParser)
  const spotlightMove = useSpotlightGlow()

  const annual = billing === "annual"

  return (
    <div className="mx-auto max-w-[1320px] px-6 md:px-10">
      <BillingToggle annual={annual} onChange={(a) => void setBilling(a ? "annual" : "monthly")} />

      <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
        <PricingCard
          tier={microcopy.pricing.free.name}
          price={<span>$0</span>}
          period={microcopy.pricing.free.period}
          highlight={microcopy.pricing.free.highlight}
          bullets={microcopy.pricing.free.bullets}
          cta={microcopy.pricing.free.cta}
          href={microcopy.pricing.free.href}
          emphasized={false}
          onSpotlightMove={spotlightMove}
        />
        <PricingCard
          tier={microcopy.pricing.pro.name}
          price={
            <span className="inline-flex items-baseline gap-0.5">
              <span className="tabular">$</span>
              <NumberFlow
                className="tabular"
                isolate
                value={annual ? 19 : 29}
                format={{
                  notation: "standard",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }}
              />
            </span>
          }
          period="/mo"
          highlight={microcopy.pricing.pro.highlight}
          bullets={microcopy.pricing.pro.bullets}
          cta={microcopy.pricing.pro.cta}
          href={microcopy.pricing.pro.href}
          emphasized
          badge={microcopy.pricing.pro.badge}
          footnote={annual ? "Billed $228/year." : microcopy.pricing.pro.annualNote}
          onSpotlightMove={spotlightMove}
        />
        <PricingCard
          tier={microcopy.pricing.team.name}
          price={
            <span className="inline-flex items-baseline gap-0.5">
              <span className="tabular">$</span>
              <NumberFlow
                className="tabular"
                isolate
                value={annual ? 52 : 79}
                format={{
                  notation: "standard",
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }}
              />
            </span>
          }
          period="/mo"
          highlight={microcopy.pricing.team.highlight}
          bullets={microcopy.pricing.team.bullets}
          cta={microcopy.pricing.team.cta}
          href={microcopy.pricing.team.href}
          emphasized={false}
          onSpotlightMove={spotlightMove}
        />
      </div>

      <p className="mono-caption mx-auto mt-12 max-w-[820px] text-center text-bone-2">
        All plans include: Private memos · 7-angle analysis · BUILD / PIVOT / KILL verdict
      </p>
    </div>
  )
}

function BillingToggle({
  annual,
  onChange,
}: {
  annual: boolean
  onChange: (annual: boolean) => void
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <span className="mono-caption text-bone-2">Billing</span>
      <div
        role="group"
        aria-label="Billing period"
        className="inline-flex rounded-full border border-bone-0/[0.1] bg-bone-0/[0.03] p-1"
      >
        <button
          type="button"
          onClick={() => onChange(false)}
          className={cn(
            "rounded-full px-5 py-2 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors",
            !annual ? "bg-bone-0 text-ink-0" : "text-bone-2 hover:text-bone-0",
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => onChange(true)}
          className={cn(
            "rounded-full px-5 py-2 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors",
            annual ? "bg-bone-0 text-ink-0" : "text-bone-2 hover:text-bone-0",
          )}
        >
          Annual
          <span className="ml-2 text-[10px] font-normal normal-case tracking-normal text-ember/80">
            save ~34%
          </span>
        </button>
      </div>
    </div>
  )
}

function PricingCard({
  tier,
  price,
  period,
  highlight,
  bullets,
  cta,
  href,
  emphasized,
  badge,
  footnote,
  onSpotlightMove,
}: {
  tier: string
  price: ReactNode
  period: string
  highlight: string
  bullets: string[]
  cta: string
  href: string
  emphasized?: boolean
  badge?: string
  footnote?: string
  onSpotlightMove: (e: MouseEvent<HTMLElement>) => void
}) {
  const reduce = useReducedMotion()

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.55, ease: ease.editorial }}
      onMouseMove={onSpotlightMove}
      className={cn(
        "spotlight-card warm-surface flex flex-col rounded-sm border p-8 transition-shadow duration-300",
        emphasized
          ? "border-ember/40 shadow-[0_24px_80px_-48px_rgba(14,131,157,0.35)] ring-1 ring-ember/20"
          : "border-bone-0/[0.08]",
        !reduce && emphasized && "hover:shadow-[0_28px_90px_-44px_rgba(14,131,157,0.28)]",
      )}
    >
      {badge && (
        <span className="mono-caption mb-4 w-fit rounded-sm border border-ember/25 bg-ember/[0.06] px-2 py-1 text-[10px] text-ember">
          {badge}
        </span>
      )}
      <div className="mono-caption text-bone-2">{tier}</div>
      <div className="mt-3 flex items-baseline gap-1">
        <span className="font-serif text-[clamp(2rem,3.5vw,2.75rem)] font-light tracking-[-0.03em] text-bone-0">
          {price}
        </span>
        <span className="text-[15px] text-bone-2">{period}</span>
      </div>
      {footnote ? (
        <p className="mono-caption mt-2 text-bone-2">{footnote}</p>
      ) : null}
      <p className="mt-5 text-[15px] leading-relaxed text-bone-1">{highlight}</p>
      <ul className="mt-8 flex flex-1 flex-col gap-3 border-t border-bone-0/[0.06] pt-8">
        {bullets.map((b, i) => (
          <CheckRow key={b} text={b} index={i} />
        ))}
      </ul>
      <Link
        href={href}
        className={cn(
          "tab-cta mt-10 inline-flex",
          emphasized ? "tab-cta-warm" : "tab-cta-quiet",
        )}
      >
        <span>{cta}</span>
        <span className="tab-cta-arrow">→</span>
      </Link>
    </motion.article>
  )
}

function CheckRow({ text, index }: { text: string; index: number }) {
  const reduce = useReducedMotion()
  return (
    <motion.li
      initial={reduce ? false : { opacity: 0, x: -6 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.35, delay: index * 0.04, ease: ease.editorial }}
      className="flex gap-3 text-[14px] leading-snug text-bone-1"
    >
      <span className="mt-0.5 shrink-0 text-ember" aria-hidden>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <motion.path
            d="M3.5 8.2 6.4 11l6.1-6.1"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.45, delay: 0.08 + index * 0.04, ease: ease.editorial }}
          />
        </svg>
      </span>
      <span>{text}</span>
    </motion.li>
  )
}
