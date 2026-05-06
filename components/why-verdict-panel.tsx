import type { InsightConfidence, WhyVerdictLine } from "@/lib/memo/why-verdict"
import { microcopy } from "@/lib/microcopy"

function confidenceStyles(c: InsightConfidence): string {
  if (c === "high") return "border-verdict-build/35 text-verdict-build"
  if (c === "medium") return "border-verdict-pivot/35 text-verdict-pivot"
  return "border-bone-0/25 text-bone-2"
}

/**
 * Partner sidebar transparency — explicit confidence avoids false parity across claims.
 */
export function WhyVerdictPanel({ lines }: { lines: WhyVerdictLine[] }) {
  if (!lines.length) return null
  const mc = microcopy.results
  return (
    <div
      id="memo-section-why_verdict"
      data-pi-section="why_verdict"
      className="bg-gradient-to-b from-bone-0/[0.03] to-transparent px-5 py-8 md:px-8 md:py-10"
    >
      <div className="mono-caption text-bone-2">{mc.whyVerdictTitle}</div>
      <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-bone-1">{mc.whyVerdictSubtitle}</p>
      <ul className="mt-8 space-y-8">
        {lines.map((l) => (
          <li key={l.id} className="border-l-2 border-bone-0/10 pl-4">
            <div className="flex flex-wrap items-baseline gap-3 gap-y-2">
              <span className="mono-caption text-bone-0">{l.headline}</span>
              <span
                className={`mono-caption border px-2 py-0.5 text-[11px] uppercase tracking-wide ${confidenceStyles(l.confidence)}`}
              >
                {l.confidence} signal
              </span>
            </div>
            <p className="mt-2 text-[13px] leading-relaxed italic text-bone-2">{l.confidenceLabel}</p>
            <p className="mt-3 text-[14px] leading-relaxed text-bone-1">{l.body}</p>
          </li>
        ))}
      </ul>
    </div>
  )
}
