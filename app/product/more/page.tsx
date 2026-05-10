import Link from "next/link"
import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { WhyReturn } from "@/components/marketing/why-return"
import { TensionsGrid } from "@/components/marketing/tensions-grid"
import { FinalCTA } from "@/components/marketing/final-cta"
import { EditorialFooter } from "@/components/marketing/editorial-footer"
import { microcopy } from "@/lib/microcopy"

export const metadata = {
  title: "More — patterns & examples · VERDIKT",
  description: microcopy.productMore.lead,
}

export default function ProductMorePage() {
  const pm = microcopy.productMore
  return (
    <InteractiveShell>
      <main className="min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />

        <section className="mx-auto max-w-[1320px] px-6 pb-12 pt-28 md:px-10 md:pt-36">
          <Link
            href="/"
            className="marketing-label inline-block text-ember transition-colors hover:text-bone-0"
          >
            ← Home
          </Link>
          <h1 className="marketing-display mt-10 max-w-[780px]">{pm.title}</h1>
          <p className="marketing-body mt-6 max-w-[560px]">{pm.lead}</p>
        </section>

        <WhyReturn />
        <TensionsGrid />
        <FinalCTA />
        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
