import dynamic from "next/dynamic"
import { InteractiveShell } from "@/components/marketing/interactive-shell"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { HeroTriptych } from "@/components/marketing/hero-triptych"
import { InlineTry } from "@/components/marketing/inline-try"
import { MemoProof } from "@/components/marketing/memo-proof"
import { EditorialFooter } from "@/components/marketing/editorial-footer"

const VerdictTape = dynamic(() => import("@/components/marketing/verdict-tape").then((m) => ({ default: m.VerdictTape })), {
  loading: () => <div className="min-h-[120px] border-b border-bone-0/[0.06]" aria-hidden />,
})
const SystemScroll = dynamic(() => import("@/components/marketing/system-scroll").then((m) => ({ default: m.SystemScroll })), {
  loading: () => <div className="min-h-[200px]" aria-hidden />,
})
const AgentRoster = dynamic(() => import("@/components/marketing/agent-roster").then((m) => ({ default: m.AgentRoster })), {
  loading: () => <div className="min-h-[240px]" aria-hidden />,
})
const ReportPreview = dynamic(() => import("@/components/marketing/report-preview").then((m) => ({ default: m.ReportPreview })), {
  loading: () => <div className="min-h-[200px]" aria-hidden />,
})
const Deliverables = dynamic(() => import("@/components/marketing/deliverables").then((m) => ({ default: m.Deliverables })), {
  loading: () => <div className="min-h-[160px]" aria-hidden />,
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
