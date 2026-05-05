import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { HeroTriptych } from "@/components/marketing/hero-triptych"
import { VerdictTape } from "@/components/marketing/verdict-tape"
import { InlineTry } from "@/components/marketing/inline-try"
import { MemoProof } from "@/components/marketing/memo-proof"
import { SystemScroll } from "@/components/marketing/system-scroll"
import { AgentRoster } from "@/components/marketing/agent-roster"
import { ReportPreview } from "@/components/marketing/report-preview"
import { Deliverables } from "@/components/marketing/deliverables"
import { Faq } from "@/components/marketing/faq"
import { EmotionalHook } from "@/components/marketing/emotional-hook"
import { EditorialFooter } from "@/components/marketing/editorial-footer"

export default function HomePage() {
  return (
    <InteractiveShell>
      <main className="min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />
        <HeroTriptych />
        <VerdictTape />
        <InlineTry />
        <MemoProof />
        <SystemScroll />
        <AgentRoster />
        <ReportPreview />
        <Deliverables />
        <Faq />
        <EmotionalHook />
        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
