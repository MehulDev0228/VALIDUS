import Link from "next/link"
import { MarketingNav } from "@/components/marketing/marketing-nav"
import { EditorialFooter } from "@/components/marketing/editorial-footer"
import { InteractiveShell } from "@/components/marketing/interactive-shell"

export const metadata = {
  title: "Changelog · VERDIKT",
  description: "Product updates and shipping notes.",
}

const entries = [
  {
    date: "2026-05-10",
    title: "VERDIKT foundation",
    body: "Supabase-backed sessions, Redis-first rate limits, pricing and settings surfaces, and brand cutover from the MVP codebase.",
  },
]

export default function ChangelogPage() {
  return (
    <InteractiveShell>
      <main className="min-h-screen bg-ink-0 text-bone-0">
        <MarketingNav />

        <article className="mx-auto max-w-[860px] px-6 pt-28 pb-24 md:px-10 md:pt-36">
          <p className="mono-caption text-bone-2">Ship log</p>
          <h1 className="marketing-display mt-4">Changelog</h1>
          <p className="marketing-body mt-6 text-bone-1">
            Plain notes on what changed. No hype — useful if you’re integrating or comparing exports over time.
          </p>

          <ol className="mt-16 space-y-14 border-t border-bone-0/[0.06] pt-12">
            {entries.map((e) => (
              <li key={e.date}>
                <time className="mono-caption text-bone-2 tabular" dateTime={e.date}>
                  {e.date}
                </time>
                <h2 className="mt-3 font-serif text-[clamp(1.25rem,2vw,1.5rem)] font-light tracking-[-0.02em]">
                  {e.title}
                </h2>
                <p className="mt-4 text-[17px] leading-relaxed text-bone-1">{e.body}</p>
              </li>
            ))}
          </ol>

          <Link href="/" className="mono-caption mt-16 inline-block text-bone-2 transition-colors hover:text-bone-0">
            ← Home
          </Link>
        </article>

        <EditorialFooter />
      </main>
    </InteractiveShell>
  )
}
