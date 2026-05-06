import { microcopy } from "@/lib/microcopy"

/**
 * Editorial pull — one contradiction / tension founders often screenshot.
 */
export function MemoResonanceLine({
  eyebrow,
  line,
}: {
  eyebrow: string
  line: string
}) {
  if (!line.trim()) return null
  return (
    <figure className="my-16 py-3 pl-5 md:my-20 md:border-l md:border-bone-0/10 md:pl-10">
      <figcaption className="mono-caption text-bone-2">{eyebrow}</figcaption>
      <p className="mono-caption mt-2 max-w-[480px] text-bone-2/90">{microcopy.results.resonanceHint}</p>
      <blockquote className="mt-6 max-w-[640px] font-serif text-[clamp(20px,2.75vw,30px)] leading-snug tracking-[-0.02em] text-bone-0 text-pretty">
        {line}
      </blockquote>
    </figure>
  )
}
