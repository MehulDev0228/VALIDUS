import Link from "next/link"
import { listPublicLibraryRuns } from "@/lib/validation-run-store"

export const revalidate = 120

export default async function ExplorePage() {
  const items = await listPublicLibraryRuns(36)

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <header className="border-b border-bone-0/10 px-6 py-12 md:px-10">
        <Link href="/" className="mono-caption text-bone-2 hover:text-bone-0">
          ← Home
        </Link>
        <p className="marketing-label mt-8 text-ember/80">Community</p>
        <h1 className="font-serif text-[clamp(28px,4vw,48px)] leading-tight tracking-[-0.025em]">
          Explorer
        </h1>
        <p className="marketing-body mt-4 max-w-[560px]">
          Founders who opted in — anonymized titles only. Open a read-only memo; sign up to run your own.
        </p>
      </header>

      <main className="mx-auto max-w-[960px] px-6 py-12 md:px-10">
        {items.length === 0 ? (
          <p className="text-[15px] text-bone-2">
            No public listings yet. Publish a memo from your results page → List on explore.
          </p>
        ) : (
          <ul className="divide-y divide-bone-0/[0.06] border-y border-bone-0/[0.06]">
            {items.map((row) => (
              <li key={row.runId} className="grid grid-cols-1 gap-4 py-8 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <div className="mono-caption text-bone-2">{row.createdAt.slice(0, 10)}</div>
                  <h2 className="mt-2 font-serif text-[20px] leading-snug text-bone-0">{row.ideaTitle}</h2>
                  {row.industry ? (
                    <p className="mono-caption mt-2 text-bone-2">{row.industry}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-4 md:justify-end">
                  {row.verdict ? (
                    <span
                      className={
                        row.verdict === "BUILD"
                          ? "text-verdict-build"
                          : row.verdict === "KILL"
                            ? "text-verdict-kill"
                            : "text-verdict-pivot"
                      }
                    >
                      <span className="mono-caption">{row.verdict}</span>
                    </span>
                  ) : null}
                  {row.opportunityScore != null ? (
                    <span className="tabular font-sans text-[18px] text-bone-0">{row.opportunityScore}/100</span>
                  ) : null}
                  <Link href={`/memo/${encodeURIComponent(row.runId)}`} className="tab-cta">
                    <span>Open</span>
                    <span className="tab-cta-arrow">→</span>
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  )
}
