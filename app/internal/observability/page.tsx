import Link from "next/link"
import { notFound } from "next/navigation"
import { getAuthSession } from "@/lib/auth"
import { aggregateProductIntel, isInternalObsViewer } from "@/lib/product-intelligence/store"

export const metadata = {
  title: "Internal observability · FutureValidate",
  robots: { index: false, follow: false },
}

export default async function InternalObservabilityPage() {
  const session = await getAuthSession()
  if (!isInternalObsViewer(session?.user?.email)) {
    notFound()
  }

  const agg = await aggregateProductIntel(70_000)

  return (
    <div className="min-h-screen bg-zinc-950 px-6 py-12 font-sans text-zinc-100 md:px-12">
      <header className="mx-auto flex max-w-5xl flex-col gap-2 border-b border-zinc-800 pb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Internal · product intelligence</p>
        <h1 className="text-2xl font-semibold tracking-tight">Founder behavior signals</h1>
        <p className="max-w-[640px] text-sm leading-relaxed text-zinc-400">
          Append-only aggregates from authenticated clients — revisit, dwell, reflections, executions. Pseudonymous subject keys only.
          Not a founder-facing dashboard.
        </p>
        <Link href="/dashboard" className="mt-2 text-sm text-amber-200/90 underline underline-offset-4 hover:text-amber-100">
          Exit to home →
        </Link>
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-12">
        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Totals (recent scan)</h2>
          <p className="mt-2 text-xs text-zinc-500">{agg.scannedLines} lines since {agg.sinceIso || "—"}</p>
          <dl className="mt-6 grid gap-px border border-zinc-800 bg-zinc-800 sm:grid-cols-2 md:grid-cols-4">
            <Metric k="memo opens (first)" v={agg.memoOpens} />
            <Metric k="memo revisits" v={agg.revisitCount} />
            <Metric k="specialist toggle" v={agg.specialistToggleCount} />
            <Metric k="reflections logged" v={agg.byKind["reflection_submitted"] ?? 0} />
          </dl>
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Events by kind</h2>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-zinc-500">
                <th className="py-2 font-medium">Kind</th>
                <th className="py-2 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(agg.byKind)
                .sort((a, b) => b[1] - a[1])
                .map(([k, v]) => (
                  <tr key={k} className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-xs text-zinc-300">{k}</td>
                    <td className="py-2 tabular text-zinc-200">{v}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Section dwell (sum ms)</h2>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-zinc-500">
                <th className="py-2 font-medium">Section</th>
                <th className="py-2 font-medium">Σ ms</th>
                <th className="py-2 font-medium">Samples</th>
              </tr>
            </thead>
            <tbody>
              {agg.dwellBySection.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-zinc-500">
                    No dwell aggregates yet — results page engagement tracker populates these.
                  </td>
                </tr>
              ) : (
                agg.dwellBySection.map((r) => (
                  <tr key={r.sectionId} className="border-b border-zinc-900">
                    <td className="py-2 font-mono text-xs text-zinc-300">{r.sectionId}</td>
                    <td className="py-2 tabular text-zinc-200">{r.totalMs}</td>
                    <td className="py-2 tabular text-zinc-400">{r.samples}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Heavy threads (pseudo idea ids)</h2>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-zinc-500">
                <th className="py-2 font-medium">ideaId slice</th>
                <th className="py-2 font-medium">Signals</th>
              </tr>
            </thead>
            <tbody>
              {agg.topIdeaIds.length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-zinc-500">
                    —
                  </td>
                </tr>
              ) : (
                agg.topIdeaIds.map((r) => (
                  <tr key={r.ideaId} className="border-b border-zinc-900">
                    <td className="break-all py-2 font-mono text-xs text-zinc-300">{r.ideaId}</td>
                    <td className="py-2 tabular text-zinc-200">{r.events}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </section>

        <section>
          <h2 className="text-sm font-medium uppercase tracking-wider text-zinc-400">Reflection prompt hits</h2>
          <table className="mt-6 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-zinc-700 text-left text-zinc-500">
                <th className="py-2 font-medium">promptId</th>
                <th className="py-2 font-medium">Count</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(agg.reflectionsByPrompt).length === 0 ? (
                <tr>
                  <td colSpan={2} className="py-4 text-zinc-500">
                    —
                  </td>
                </tr>
              ) : (
                Object.entries(agg.reflectionsByPrompt)
                  .sort((a, b) => b[1] - a[1])
                  .map(([pid, v]) => (
                    <tr key={pid} className="border-b border-zinc-900">
                      <td className="py-2 font-mono text-xs text-zinc-300">{pid}</td>
                      <td className="py-2 tabular text-zinc-200">{v}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  )
}

function Metric({ k, v }: { k: string; v: number }) {
  return (
    <div className="bg-zinc-950 px-5 py-4">
      <div className="text-xs uppercase tracking-wide text-zinc-500">{k}</div>
      <div className="mt-2 tabular text-3xl font-medium text-zinc-100">{v}</div>
    </div>
  )
}
