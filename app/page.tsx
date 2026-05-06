import dynamic from "next/dynamic"
import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { HeroTriptych } from "@/components/marketing/hero-triptych"
import { InlineTry } from "@/components/marketing/inline-try"
import { EditorialFooter } from "@/components/marketing/editorial-footer"
import { BreathingStat } from "@/components/marketing/breathing-stat"

const AgentRoster = dynamic(() => import("@/components/marketing/agent-roster").then((m) => ({ default: m.AgentRoster })), {
  loading: () => <div className="min-h-[240px]" aria-hidden />,
})
const ReportPreview = dynamic(() => import("@/components/marketing/report-preview").then((m) => ({ default: m.ReportPreview })), {
  loading: () => <div className="min-h-[200px]" aria-hidden />,
})
const Faq = dynamic(() => import("@/components/marketing/faq").then((m) => ({ default: m.Faq })), {
  loading: () => <div className="min-h-[120px]" aria-hidden />,
})
const EmotionalHook = dynamic(() =>
  import("@/components/marketing/emotional-hook").then((m) => ({ default: m.EmotionalHook })),
)

export default function HomePage() {
  return (
    <InteractiveShell>
      <main className="min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />
        <HeroTriptych />
        <BreathingStat />
        <InlineTry />
        <ReportPreview />
        <AgentRoster />
        <Faq />
        <EmotionalHook />
        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
