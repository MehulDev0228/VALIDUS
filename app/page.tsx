import dynamic from "next/dynamic"
import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { HeroSplit } from "@/components/marketing/hero-split"
import { BentoFeatures } from "@/components/marketing/bento-features"
import { ProductFlowStrip } from "@/components/marketing/product-flow-strip"
import { MemoExperience } from "@/components/marketing/memo-experience"
import { WhoItsFor } from "@/components/marketing/who-its-for"
import { FinalCTA } from "@/components/marketing/final-cta"
import { EditorialFooter } from "@/components/marketing/editorial-footer"

const Faq = dynamic(
  () => import("@/components/marketing/faq").then((m) => ({ default: m.Faq })),
  { loading: () => <div className="min-h-[120px]" aria-hidden /> },
)

/** Marketing home — pre-launch: no pricing; early-access ribbon + product story. */
export default function HomePage() {
  return (
    <InteractiveShell>
      <main className="marketing-page-bg marketing-grain relative min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />

        <HeroSplit />
        <BentoFeatures />
        <ProductFlowStrip />
        <MemoExperience />
        <WhoItsFor />
        <FinalCTA />
        <Faq />

        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
