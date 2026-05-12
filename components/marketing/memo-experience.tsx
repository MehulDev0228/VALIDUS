"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { RadarBreakdown } from "@/components/radar-breakdown"
import { ScoreGauge } from "@/components/score-gauge"
import { ease, timing } from "@/lib/motion"

/**
 * MemoExperience — the trust section, presented as a real document.
 *
 * Full sample memo on-page: borders and type do the layout (no heavy chrome).
 */
export function MemoExperience() {
  return (
    <section
      id="sample-memo"
      data-section="memo"
      className="relative isolate bg-ink-0 py-24 md:py-32"
    >
      <div className="relative mx-auto max-w-[1100px] px-6 md:px-10">
        {/* Section eyebrow + headline — large but not theatrical */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-15%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
            className="mb-16 grid grid-cols-1 gap-8 md:mb-20 md:grid-cols-12 md:items-end md:gap-10"
          >
          <div className="md:col-span-7">
            <p className="marketing-label">Sample output</p>
            <h2 className="marketing-display mt-4 text-[clamp(1.75rem,3.8vw,3.25rem)]">
              This is the page you get — not a transcript.
            </h2>
          </div>
          <div className="md:col-span-5 md:pb-2">
            <p className="marketing-body max-w-[560px] md:pb-2">
              Verdict strip, seven angle rows, tensions, a compression breakdown,
              and a 48-hour test list. After a real run you can copy a share link and optionally list on{" "}
              <a href="/explore" className="text-bone-1 underline underline-offset-4 hover:text-ember">
                Explore
              </a>
              . Illustrative copy here only.
            </p>
          </div>
        </motion.div>

        {/* The document — no outer chrome, structured by typography and
            hairline rules. */}
        <motion.article
          initial={{ opacity: 0, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-10%" }}
          transition={{ duration: timing.section.mid, ease: ease.editorial }}
          className="relative rounded-xl border border-white/[0.08] bg-ink-1 px-6 py-2 shadow-[0_24px_80px_-48px_rgb(0_0_0_/_0.55)] md:px-10"
        >
          <DocHeader />

          <div className="border-t border-white/[0.08] bg-ink-0/[0.35] py-10 md:-mx-10 md:px-10 md:py-12">
            <DecisionFrame />
          </div>

          <div className="border-t border-white/[0.08] py-10 md:-mx-10 md:px-10 md:py-12">
            <ContrastingReads />
          </div>

          <div className="border-t border-white/[0.08] bg-ink-0/[0.22] py-10 md:-mx-10 md:px-10 md:py-12">
            <OpportunityDecomposition />
          </div>

          <div className="border-t border-white/[0.08] py-10 md:-mx-10 md:px-10 md:py-12">
            <PressureHorizon />
          </div>

          <DocFooter />
        </motion.article>
      </div>
    </section>
  )
}

/* -------------------------------------------------------------------------- */
/*  Header                                                                    */
/* -------------------------------------------------------------------------- */

function DocHeader() {
  return (
    <header className="pt-10 pb-10">
      <p className="doc-meta tabular text-balance">
        memo 0142-IM · 2026-05-08 09:14 UTC · private · not for distribution
      </p>

      <p className="doc-kicker mt-10">Idea</p>
      <h3 className="mt-3 font-display text-bone-0 text-[clamp(22px,2.4vw,30px)] font-semibold leading-[1.2] tracking-[-0.02em]">
        A vertical CRM for solo immigration lawyers, priced at $99/mo.
      </h3>
      <p className="mt-4 max-w-[68ch] text-[15.5px] leading-[1.6] text-bone-1">
        Solo lawyers run cases in spreadsheets. The wedge is workflow primitives
        the generic CRMs do not carry. The buyer is the user, not procurement.
      </p>
    </header>
  )
}

/* -------------------------------------------------------------------------- */
/*  Decision frame                                                            */
/* -------------------------------------------------------------------------- */

function DecisionFrame() {
  return (
    <div>
      <p className="doc-kicker">Verdict</p>

      <div className="mt-8 grid grid-cols-1 gap-10 md:grid-cols-[auto_1fr] md:gap-14">
        {/* Verdict — sized to the page, not the wall. */}
        <div className="rounded-xl bg-gradient-to-br from-verdict-build/[0.14] via-ink-1/30 to-transparent p-6 ring-1 ring-white/[0.06] md:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-8">
            <div>
              <div className="flex items-baseline gap-3">
                <span className="h-2.5 w-2.5 translate-y-[-6px] rounded-full bg-verdict-build shadow-[0_0_20px_rgb(52_211_153_/_0.45)]" />
                <span className="font-sans text-[56px] font-medium leading-none tracking-[-0.025em] text-verdict-build md:text-[72px]">
                  BUILD
                </span>
              </div>
              <p className="mt-3 text-[14px] leading-[1.5] text-bone-2">
                confidence: <span className="text-bone-0">moderate-high</span>
              </p>
            </div>
            <ScoreGauge score={72} verdict="BUILD" size={100} className="mx-auto sm:mx-0" />
          </div>
        </div>

        {/* Frame body — hairline divided, no card cells */}
        <div className="grid grid-cols-1 gap-y-8 md:grid-cols-2 md:gap-x-10">
          <div className="md:border-r md:border-white/[0.08] md:pr-10">
            <p className="doc-kicker text-verdict-build/90">If it survives</p>
            <p className="mt-3 text-[15.5px] leading-[1.6] text-bone-0">
              Solo segment lock-in via niche workflow primitives the generic
              tools structurally cannot ship. $99 captures budget below
              procurement. Case-driven UX wins on retention.
            </p>
          </div>
          <div>
            <p className="doc-kicker text-ash/90">If it collapses</p>
            <p className="mt-3 text-[15.5px] leading-[1.6] text-bone-0">
              Generic CRM plus a niche template wins on price. You spend nine
              months building integrations the buyer did not need to switch.
            </p>
          </div>
        </div>
      </div>

      {/* Contradiction trace */}
      <div className="mt-10 border-l-[2px] border-ash/40 pl-6 md:pl-8">
        <p className="doc-kicker text-ash/90">Contradiction · resolved this pass</p>
        <p className="mt-2 text-[15.5px] leading-[1.6] text-bone-0">
          Earlier reads framed this as enterprise-grade workflow tooling, but
          the wedge described is solo-practitioner UX.{" "}
          <span className="text-bone-2">
            Resolved: solo segment is the wedge. Enterprise is a later
            distribution motion, not the build.
          </span>
        </p>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Contrasting reads — pure tabular ledger                                   */
/* -------------------------------------------------------------------------- */

const READS: Array<{ tag: string; name: string; tone: "build" | "pivot" | "kill"; line: string }> = [
  { tag: "MKT", name: "market reality",        tone: "build", line: "Solo immigration practices in the US: roughly 14,000. ICP density is workable. Segment-specific workflow gaps are real." },
  { tag: "CMP", name: "competitive pressure",  tone: "pivot", line: "Clio plus niche templates covers about 70% of the surface for $39. Switching cost vs. perceived gain is thin." },
  { tag: "REV", name: "revenue economics",     tone: "build", line: "$99 captures discretionary budget below procurement. Buyer is the user. Short, predictable cycle." },
  { tag: "BLD", name: "build cost",            tone: "pivot", line: "Integration surface (state-bar APIs, USCIS forms) is bigger than the wedge. 6 to 9 months to substantive demo." },
  { tag: "ICP", name: "buyer psychology",      tone: "build", line: "Status incentive is moderate. Solo lawyers buy when peers ship results. Content motion compounds." },
  { tag: "RSK", name: "failure modes",         tone: "kill",  line: "If Clio acquires a vertical-template vendor in Q3, the wedge compresses to a 6-month window." },
  { tag: "TST", name: "what to test",          tone: "build", line: "48h: 12 paid pilots from one referral channel, or kill the wedge as framed. No moral victories." },
]

function ContrastingReads() {
  // Hover dims the others. No blur, no padding shift. Just a quiet
  // focus pull, the kind of thing you'd find in a Linear table.
  const [active, setActive] = useState<number | null>(null)

  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="doc-kicker">Angle notes · seven rows</p>
        <span className="tabular text-[13px] text-bone-2">3 build · 3 pivot · 1 kill</span>
      </div>

      <ul
        className="mt-8 divide-y divide-white/[0.08]"
        onMouseLeave={() => setActive(null)}
      >
        {READS.map((r, i) => {
          const isActive = active === i
          const isOther = active !== null && active !== i
          return (
            <motion.li
              key={r.tag}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{
                duration: timing.section.min,
                delay: i * 0.03,
                ease: ease.editorial,
              }}
              onMouseEnter={() => setActive(i)}
              style={{
                opacity: isOther ? 0.55 : 1,
                transition: "opacity 200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
              }}
              className="grid cursor-default grid-cols-[44px_140px_64px_1fr] items-baseline gap-4 py-4 md:gap-6"
            >
              <span className="font-mono text-[11px] tabular-nums text-bone-2">{r.tag}</span>
              <span className="text-[14px] text-bone-0">{r.name}</span>
              <span
                className={`font-mono text-[11px] tabular-nums ${
                  r.tone === "build"
                    ? "text-verdict-build"
                    : r.tone === "pivot"
                      ? "text-verdict-pivot"
                      : "text-verdict-kill"
                }`}
              >
                {r.tone.toUpperCase()}
              </span>
              <span
                className={`text-[14.5px] leading-[1.55] transition-colors duration-200 ${
                  isActive ? "text-bone-0" : "text-bone-0/65"
                }`}
              >
                {r.line}
              </span>
            </motion.li>
          )
        })}
      </ul>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Opportunity decomposition                                                 */
/* -------------------------------------------------------------------------- */

function OpportunityDecomposition() {
  const factors = [
    { label: "Wedge specificity",  v: 78, body: "case-driven workflow primitives are structurally different" },
    { label: "Buyer reachability", v: 64, body: "content and referral motion compounds inside the solo segment" },
    { label: "Substitution risk",  v: 42, body: "Clio plus templates remains a credible 70% solution at a lower price" },
    { label: "Capital efficiency", v: 56, body: "integration surface is heavy, but each integration thickens the moat" },
  ]
  const radarSample = {
    market: 7.2,
    competition: 5.8,
    monetization: 6.5,
    execution: 8.1,
    founderFit: 4.9,
  }
  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="doc-kicker">Compression score · breakdown</p>
        <span className="tabular text-[13px] text-bone-2">Composite · 72/100</span>
      </div>

      <div className="mt-8 grid grid-cols-1 items-start gap-10 lg:grid-cols-[1fr_minmax(220px,280px)] lg:gap-12">
        <ul className="space-y-6">
          {factors.map((f, i) => (
            <motion.li
              key={f.label}
              initial={{ opacity: 0, y: 4 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-15%" }}
              transition={{ duration: timing.section.min, delay: i * 0.04, ease: ease.editorial }}
            >
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-[15.5px] text-bone-0">{f.label}</span>
                <span className="tabular text-[13px] text-bone-1">{f.v}/100</span>
              </div>
              <div className="mt-2.5 h-px w-full bg-bone-0/[0.1]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${f.v}%` }}
                  viewport={{ once: true, margin: "-15%" }}
                  transition={{ duration: timing.section.max, delay: 0.1 + i * 0.05, ease: ease.editorial }}
                  className={`h-px ${f.v >= 60 ? "bg-verdict-build/80" : f.v >= 50 ? "bg-verdict-pivot/80" : "bg-ash/70"}`}
                />
              </div>
              <p className="mt-2.5 text-[14px] leading-[1.5] text-bone-2">{f.body}</p>
            </motion.li>
          ))}
        </ul>
        <div className="flex flex-col items-center justify-center rounded-lg border border-white/[0.06] bg-ink-0/40 px-4 py-6 lg:sticky lg:top-28">
          <p className="mono-caption mb-2 text-center text-bone-2">Five-dimension shape</p>
          <RadarBreakdown values={radarSample} />
        </div>
      </div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  48h pressure horizon — three rows, hairline divided                       */
/* -------------------------------------------------------------------------- */

function PressureHorizon() {
  const moves = [
    { hour: "0-12h",  body: "Pull 200 solo immigration lawyer LinkedIn profiles. Send 30 outbound DMs with the wedge framed in one line." },
    { hour: "12-36h", body: "Run 8 calls. Score each conversation against three primitives the generic CRMs do not carry: case-state, deadline-aware tasks, client-facing portal." },
    { hour: "36-48h", body: "Close 12 paid pilots at $99/mo, no discounts. If fewer than 12, kill the wedge as framed and rewrite from the buyer's actual workflow." },
  ]
  return (
    <div>
      <div className="flex items-end justify-between">
        <p className="doc-kicker">48-hour test plan</p>
        <span className="tabular text-[13px] text-bone-2">Starts when you decide</span>
      </div>

      <ol className="mt-8 divide-y divide-bone-0/[0.08]">
        {moves.map((m) => (
          <li key={m.hour} className="grid grid-cols-[88px_1fr] items-baseline gap-6 py-5 md:grid-cols-[120px_1fr] md:gap-10">
            <span className="tabular text-[14px] font-medium text-ember">{m.hour}</span>
            <p className="text-[15px] leading-[1.6] text-bone-0">{m.body}</p>
          </li>
        ))}
      </ol>

      <p className="mt-8 text-[14px] leading-[1.55] text-bone-1">
        48 hours is enough to disprove the framing. The point is to test
        before you build.
      </p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*  Footer                                                                    */
/* -------------------------------------------------------------------------- */

function DocFooter() {
  return (
    <footer className="border-t border-white/[0.08] pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-[13px] text-bone-2">7 contrasting reads · decision frame · 48h test plan</span>
        <span className="text-[13px] text-bone-2">Revisable · private</span>
      </div>
    </footer>
  )
}
