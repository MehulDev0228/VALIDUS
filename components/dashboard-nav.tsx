"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { ease } from "@/lib/motion"

/**
 * DashboardNav — single hairline header that replaces the legacy sidebar.
 *
 * Brand mark on the left, segmented section indicator in the centre, account
 * affordance + filing CTA on the right. Identical visual language to the
 * marketing nav so the dashboard does not feel like a different product.
 */
export function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const links = [
    { href: "/dashboard", label: "Ledger" },
    { href: "/dashboard/validate", label: "File a memo" },
  ]

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href)

  const initials = user?.email?.charAt(0).toUpperCase() ?? "·"

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-colors duration-300 ${
        scrolled ? "border-bone-0/[0.06] bg-ink-0/85 backdrop-blur-xl" : "border-transparent bg-ink-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3" data-cursor="cite">
            <span className="h-2 w-2 bg-bone-0" />
            <span className="mono-caption text-bone-0">
              Future<span className="text-bone-1">/</span>Validate
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                data-cursor="read"
                className={`relative px-3 py-2 mono-caption transition-colors duration-200 ${
                  isActive(l.href) ? "text-bone-0" : "text-bone-2 hover:text-bone-0"
                }`}
              >
                {l.label}
                {isActive(l.href) && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ duration: 0.32, ease: ease.editorial }}
                    className="absolute inset-x-3 bottom-1 h-px bg-bone-0"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/validate" className="tab-cta hidden md:inline-flex" data-cursor="file">
            <span>File a memo</span>
            <span className="tab-cta-arrow">→</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Account"
            className="flex items-center gap-3 border border-bone-0/10 px-3 py-1.5 transition-colors hover:border-bone-0/40"
            data-cursor="read"
          >
            <span className="grid h-6 w-6 place-items-center bg-bone-0 text-[11px] font-medium text-ink-0">
              {initials}
            </span>
            <span className="mono-caption tabular hidden md:inline">{user?.email?.split("@")[0] || "anon"}</span>
            <span className={`mono-caption transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.28, ease: ease.editorial }}
            className="absolute right-6 top-[calc(100%+8px)] w-[280px] border border-bone-0/10 bg-ink-1 p-5 md:right-10"
          >
            <div className="mono-caption mb-4 tabular text-bone-2">{user?.email || "anonymous session"}</div>
            <div className="space-y-1 border-y border-bone-0/[0.06] py-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block px-2 py-2 text-[14px] text-bone-1 hover:text-bone-0"
              >
                Ledger
              </Link>
              <Link
                href="/dashboard/validate"
                onClick={() => setOpen(false)}
                className="block px-2 py-2 text-[14px] text-bone-1 hover:text-bone-0"
              >
                File a memo
              </Link>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block px-2 py-2 text-[14px] text-bone-1 hover:text-bone-0"
              >
                Marketing site
              </Link>
            </div>
            <button
              type="button"
              onClick={async () => {
                setOpen(false)
                if (signOut) {
                  await signOut()
                }
                router.push("/")
              }}
              className="mt-3 block w-full px-2 py-2 text-left text-[14px] text-verdict-kill hover:text-bone-0"
            >
              {user ? "Sign out" : "Return to marketing"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
