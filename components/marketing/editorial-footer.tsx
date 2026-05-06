"use client"

import Link from "next/link"
import { microcopy } from "@/lib/microcopy"

export function EditorialFooter() {
  const year = new Date().getFullYear()
  return (
    <footer data-section="footer" className="relative">
      <div className="mx-auto max-w-[1440px] px-6 pt-24 pb-12 md:px-10">
        <p className="font-serif text-[clamp(28px,3.4vw,44px)] leading-snug tracking-[-0.02em] text-bone-0">
          {microcopy.footer.manifesto}
        </p>

        <div className="mt-20 grid grid-cols-2 gap-12 border-t border-bone-0/10 pt-10 md:grid-cols-4">
          <div>
            <div className="mono-caption mb-4">Product</div>
            <ul className="space-y-2">
              {microcopy.footer.columns.product.map((item) => (
                <li key={item}>
                  <Link
                    href={
                      item === "Memo"
                        ? "/auth?next=/dashboard/validate"
                        : item === "Decision trail"
                          ? "/dashboard"
                          : item === "Private alpha"
                            ? "/alpha"
                            : "#preview"
                    }
                    className="text-[14px] text-bone-1 transition-colors hover:text-bone-0"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mono-caption mb-4">Method</div>
            <ul className="space-y-2">
              {microcopy.footer.columns.method.map((item) => (
                <li key={item}>
                  <Link
                    href="#system"
                    className="text-[14px] text-bone-1 transition-colors hover:text-bone-0"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mono-caption mb-4">House</div>
            <ul className="space-y-2">
              {microcopy.footer.columns.house.map((item) => (
                <li key={item}>
                  <Link
                    href="#"
                    className="text-[14px] text-bone-1 transition-colors hover:text-bone-0"
                  >
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:text-right">
            <div className="mono-caption mb-4">On record since</div>
            <div className="tabular font-sans text-[44px] font-medium leading-none tracking-[-0.03em] text-bone-0">
              {year}
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-3 border-t border-bone-0/10 pt-6 md:flex-row md:items-center md:justify-between">
          <span className="mono-caption">© {year} {microcopy.footer.legal}</span>
          <span className="mono-caption text-bone-2">Calm pacing · sharp read · no leaderboard cosplay.</span>
        </div>
      </div>
    </footer>
  )
}
