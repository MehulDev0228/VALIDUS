"use client"

import Link from "next/link"
import { microcopy } from "@/lib/microcopy"

/**
 * Pre-launch trust band — directs to waitlist instead of exposing pricing tables.
 */
export function WaitlistRibbon() {
  return (
    <section
      aria-label="Early access"
      className="border-y border-white/[0.06] bg-gradient-to-r from-white/[0.03] via-ink-1/50 to-white/[0.03] py-8 md:py-10"
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-between gap-6 px-6 md:px-10">
        <div className="max-w-[620px]">
          <p className="marketing-label text-ember/90">{microcopy.preLaunch.ribbonEyebrow}</p>
          <p className="font-display mt-2 text-xl font-semibold tracking-tight text-bone-0 md:text-2xl">
            {microcopy.preLaunch.ribbonTitle}
          </p>
          <p className="marketing-body mt-2 text-sm md:text-[15px]">{microcopy.preLaunch.ribbonBody}</p>
        </div>
        <Link
          href="/alpha"
          className="tab-cta tab-cta-warm shrink-0 rounded-full px-5 py-2.5 hover:scale-[1.02] active:scale-[0.97]"
        >
          <span>{microcopy.preLaunch.ribbonCta}</span>
          <span className="tab-cta-arrow">→</span>
        </Link>
      </div>
    </section>
  )
}
