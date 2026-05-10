import Link from "next/link"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { EditorialFooter } from "@/components/marketing/editorial-footer"
import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { microcopy } from "@/lib/microcopy"

export const metadata = {
  title: "Early access · VERDIKT",
  description:
    "VERDIKT is pre-launch — we open in waves. Request access instead of comparing price tables.",
}

export default function PricingPage() {
  return (
    <InteractiveShell>
      <main className="min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />

        <section className="border-b border-white/[0.06] pt-32 pb-20 md:pt-40 md:pb-28">
          <div className="mx-auto max-w-[720px] px-6 md:px-10">
            <p className="marketing-label text-ember/90">{microcopy.preLaunch.ribbonEyebrow}</p>
            <h1 className="marketing-display mt-5 font-display font-bold">
              No public pricing yet.
            </h1>
            <p className="marketing-body mt-6 text-bone-1">
              {microcopy.preLaunch.ribbonBody} We&apos;ll publish plans when the memo format is
              stable in real founder workflows — not before.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/alpha"
                className="tab-cta tab-cta-warm rounded-full px-5 py-2.5 hover:scale-[1.02] active:scale-[0.97]"
              >
                <span>{microcopy.preLaunch.ribbonCta}</span>
                <span className="tab-cta-arrow">→</span>
              </Link>
              <Link href="/" className="tab-cta tab-cta-quiet rounded-lg">
                <span>Back home</span>
                <span className="tab-cta-arrow">←</span>
              </Link>
            </div>
          </div>
        </section>

        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
