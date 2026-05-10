"use client"

import Link from "next/link"
import { microcopy } from "@/lib/microcopy"

export function EditorialFooter() {
  const year = new Date().getFullYear()

  return (
    <footer
      data-section="footer"
      className="relative border-t border-white/[0.06] bg-gradient-to-b from-ink-1/30 to-ink-0"
    >
      <div className="mx-auto max-w-[1320px] px-6 py-20 md:px-10 md:py-24">
        <div className="flex flex-col gap-12 md:flex-row md:items-end md:justify-between">
          <div className="max-w-xl">
            <p className="font-display text-[clamp(1.5rem,2.8vw,2.25rem)] font-medium italic leading-tight tracking-[-0.02em] text-bone-1">
              {microcopy.footer.taglineShort}
            </p>
            <p className="marketing-body mt-5 max-w-[52ch] text-bone-2">{microcopy.footer.manifesto}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/auth?next=/dashboard/validate"
              className="tab-cta tab-cta-warm rounded-full border-ember/35 px-5 py-2.5"
            >
              <span>Run a memo</span>
              <span className="tab-cta-arrow">→</span>
            </Link>
            <Link href="/alpha" className="tab-cta tab-cta-quiet rounded-full px-5 py-2.5">
              <span>Early access</span>
            </Link>
          </div>
        </div>

        <nav
          aria-label="Footer"
          className="mt-16 flex flex-wrap gap-x-8 gap-y-3 border-t border-white/[0.06] pt-10 text-[14px] text-bone-2"
        >
          {microcopy.footer.columns.product.map((item) => (
            <Link
              key={item}
              href={
                item === "New run"
                  ? "/auth?next=/dashboard/validate"
                  : item === "Examples"
                    ? "/product/more"
                    : "#sample-memo"
              }
              className="transition-colors hover:text-bone-0"
            >
              {item}
            </Link>
          ))}
          {microcopy.footer.columns.method.map((item) => (
            <Link
              key={item}
              href={item === "FAQ" ? "#faq" : "#how-it-works"}
              className="transition-colors hover:text-bone-0"
            >
              {item}
            </Link>
          ))}
          {microcopy.footer.columns.house.map((item) => (
            <Link
              key={item}
              href={item === "Early access" ? "/alpha" : "/changelog"}
              className="transition-colors hover:text-bone-0"
            >
              {item}
            </Link>
          ))}
          <Link href="/" className="ml-auto transition-colors hover:text-bone-0">
            Home
          </Link>
        </nav>

        <p className="mt-8 text-[13px] text-bone-2">
          © {year} {microcopy.footer.legal}
        </p>
      </div>
    </footer>
  )
}
