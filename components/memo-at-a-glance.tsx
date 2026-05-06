import Link from "next/link"
import { microcopy } from "@/lib/microcopy"

const mc = microcopy.results

/**
 * First-read band — sharpest synthesis + primary pressure without duplicating the verdict slab.
 */
export function MemoAtAGlance({
  summaryLine,
  topPressure,
  partnerReadHref = "#memo-partner-read",
}: {
  summaryLine: string
  topPressure?: string | null
  partnerReadHref?: string
}) {
  return (
    <aside
      className="mt-10 bg-gradient-to-br from-bone-0/[0.04] via-transparent to-transparent px-5 py-8 md:mt-14 md:px-10 md:py-11"
      aria-label="Memo opening read"
    >
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between md:gap-10">
        <div className="min-w-0 flex-1">
          <div className="mono-caption text-bone-2">{mc.atAGlanceEyebrow}</div>
          <p className="mono-caption mt-2 max-w-[520px] text-bone-2/90">{mc.atAGlanceLead}</p>
          <p className="mt-5 font-serif text-[clamp(18px,2.25vw,24px)] leading-snug tracking-[-0.015em] text-bone-0 text-pretty">
            {summaryLine || "The partner-through read below threads the argument without rushing you."}
          </p>
          {topPressure ? (
            <p className="mt-6 max-w-[720px] border-l-2 border-bone-0/12 pl-4 text-[14px] leading-relaxed text-bone-1">
              <span className="mono-caption text-bone-2">Pressure to hold · </span>
              {topPressure.length > 280 ? `${topPressure.slice(0, 278)}…` : topPressure}
            </p>
          ) : null}
        </div>
        <Link
          href={partnerReadHref}
          className="mono-caption shrink-0 self-start border-b border-bone-0/15 pb-1 text-bone-1 transition-colors hover:border-bone-0/35 hover:text-bone-0 md:mt-10"
        >
          Partner-through read ↓
        </Link>
      </div>
    </aside>
  )
}
