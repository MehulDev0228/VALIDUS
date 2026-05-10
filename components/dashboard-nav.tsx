"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/contexts/auth-context"
import { ease } from "@/lib/motion"
import { microcopy } from "@/lib/microcopy"

/**
 * DashboardNav — warm, quiet header.
 *
 * Ember presence dot, clean section indicator, account affordance.
 * Same emotional language as marketing nav so the product feels continuous.
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

  const dn = microcopy.dashboard.nav
  const links = [
    { href: "/dashboard", label: dn.home },
    { href: "/dashboard/founder", label: dn.workspace },
    { href: "/dashboard/validate", label: dn.memo },
  ]

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname?.startsWith(href)

  const initials = user?.email?.charAt(0).toUpperCase() ?? "·"

  return (
    <header
      className={`sticky top-0 z-30 border-b transition-all duration-300 ${
        scrolled ? "border-bone-0/[0.06] bg-ink-0/90 backdrop-blur-xl" : "border-transparent bg-ink-0"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-3">
            <span className="h-2 w-2 shrink-0 rounded-full bg-ember breathe" />
            <span className="mono-caption text-bone-0">{microcopy.brand.name}</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`relative px-3 py-2 mono-caption transition-colors duration-200 ${
                  isActive(l.href) ? "text-bone-0" : "text-bone-2 hover:text-bone-0"
                }`}
              >
                {l.label}
                {isActive(l.href) && (
                  <motion.span
                    layoutId="dash-nav-active"
                    transition={{ duration: 0.32, ease: ease.editorial }}
                    className="absolute inset-x-3 bottom-1 h-px bg-ember/50"
                  />
                )}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/dashboard/validate" className="tab-cta hidden md:inline-flex">
            <span>{dn.memo}</span>
            <span className="tab-cta-arrow">→</span>
          </Link>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Account"
            className="flex items-center gap-3 rounded-sm border border-bone-0/[0.06] px-3 py-1.5 transition-colors hover:border-bone-0/15"
          >
            <span className="grid h-6 w-6 place-items-center rounded-full bg-ember/20 text-[11px] font-medium text-ember">
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
            className="absolute right-6 top-[calc(100%+8px)] w-[280px] rounded-sm border border-bone-0/[0.06] bg-ink-1/95 p-5 backdrop-blur-md md:right-10"
          >
            <div className="mono-caption mb-4 tabular text-bone-2">{user?.email || "anonymous session"}</div>
            <div className="space-y-1 border-y border-bone-0/[0.05] py-2">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-[14px] text-bone-1 transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
              >
                {dn.home}
              </Link>
              <Link
                href="/dashboard/founder"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-[14px] text-bone-1 transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
              >
                {dn.workspace}
              </Link>
              <Link
                href="/dashboard/validate"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-[14px] text-bone-1 transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
              >
                {dn.memo}
              </Link>
              <Link
                href="/dashboard/settings"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-[14px] text-bone-1 transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
              >
                {dn.settings}
              </Link>
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="block rounded-sm px-2 py-2 text-[14px] text-bone-1 transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
              >
                {microcopy.dashboard.marketingSite}
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
              className="mt-3 block w-full rounded-sm px-2 py-2 text-left text-[14px] text-ash transition-colors hover:bg-bone-0/[0.03] hover:text-bone-0"
            >
              {user ? "Sign out" : "Return home"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
