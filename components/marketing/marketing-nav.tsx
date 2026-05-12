"use client"

import type { ReactNode } from "react"
import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { motion, useMotionValueEvent, useScroll } from "framer-motion"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { microcopy } from "@/lib/microcopy"
import { ease, spring } from "@/lib/motion"
import { cn } from "@/lib/utils"

/**
 * Floating glass pill — hides on scroll down, returns on scroll up.
 */
export function MarketingNav() {
  const [hidden, setHidden] = useState(false)
  const lastY = useRef(0)
  const { scrollY } = useScroll()

  useMotionValueEvent(scrollY, "change", (y) => {
    const prev = lastY.current
    lastY.current = y
    if (y < 56) {
      setHidden(false)
      return
    }
    if (y > prev + 6) setHidden(true)
    else if (y < prev - 6) setHidden(false)
  })

  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    lastY.current = typeof window !== "undefined" ? window.scrollY : 0
  }, [])

  return (
    <motion.header
      initial={false}
      animate={{
        y: hidden ? -100 : 0,
        opacity: hidden ? 0 : 1,
      }}
      transition={{ duration: 0.35, ease: ease.editorial }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-5 md:px-6"
    >
      <div className="pointer-events-auto glass-nav-pill mx-auto flex w-full max-w-[min(1040px,calc(100vw-2rem))] items-center justify-between gap-3 px-4 py-2.5 md:gap-6 md:px-6">
        <motion.div
          className="inline-flex shrink-0"
          whileHover={{ scale: 1.03 }}
          transition={spring.magnetic}
        >
          <Link href="/" aria-label="VERDIKT — home" className="flex items-center gap-2">
            <span className="block h-1.5 w-1.5 shrink-0 rounded-full bg-ember shadow-[0_0_12px_rgb(6_182_212_/_0.5)]" />
            <span className="font-display text-[13px] font-semibold tracking-tight text-bone-0">
              {microcopy.brand.name}
            </span>
          </Link>
        </motion.div>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          <NavLink href="#features-bento">Product</NavLink>
          <NavLink href="#how-it-works">Workflow</NavLink>
          <NavLink href="#sample-memo">Sample</NavLink>
          <NavLink href="/explore">Explore</NavLink>
          <DropdownMenu>
            <DropdownMenuTrigger
              className={cn(
                "rounded-full px-3 py-2 text-[13px] font-medium text-bone-2 transition-colors hover:bg-white/[0.06] hover:text-bone-0",
                "outline-none focus-visible:ring-2 focus-visible:ring-ember/35",
              )}
            >
              {microcopy.nav.secondary} ▾
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="center"
              sideOffset={12}
              className="rounded-xl border border-white/[0.08] bg-ink-1/95 p-5 text-bone-0 shadow-2xl shadow-black/40 backdrop-blur-xl"
            >
              <p className="marketing-label mb-4 text-[10px] text-bone-2">Stages</p>
              <div className="space-y-3">
                {microcopy.system.stages.map((s) => (
                  <Link
                    key={s.n}
                    href="#how-it-works"
                    className="block rounded-lg border border-transparent px-2 py-2 transition-colors hover:border-white/[0.08] hover:bg-white/[0.04]"
                  >
                    <span className="font-display text-[11px] font-semibold text-ember/90">{s.n}</span>
                    <div className="mt-1 text-[14px] font-medium">{s.title}</div>
                  </Link>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <NavLink href="/product/more">{microcopy.nav.examplesDeep}</NavLink>
          <NavLink href="/alpha">{microcopy.nav.earlyAccess}</NavLink>
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <Link
            href="/auth?next=/dashboard/validate"
            className="tab-cta tab-cta-warm rounded-full border-ember/35 px-4 py-2"
          >
            <span>{microcopy.nav.cta}</span>
            <span className="tab-cta-arrow">→</span>
          </Link>
        </div>

        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              aria-label={microcopy.nav.mobileMenuOpen}
              className="rounded-full p-2 text-bone-0 lg:hidden"
            >
              <span className="block h-0.5 w-5 bg-bone-0" />
              <span className="mt-1.5 block h-0.5 w-5 bg-bone-0" />
            </button>
          </DrawerTrigger>
          <DrawerContent className="border-white/[0.08] bg-ink-1 text-bone-0">
            <DrawerHeader className="text-left">
              <DrawerTitle className="font-display text-xl font-semibold">{microcopy.brand.name}</DrawerTitle>
            </DrawerHeader>
            <nav className="flex flex-col gap-1 px-4 pb-10">
              <DrawerClose asChild>
                <Link href="#features-bento" className="rounded-lg px-3 py-3 text-lg font-medium">
                  Product
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link href="#how-it-works" className="rounded-lg px-3 py-3 text-lg font-medium">
                  Workflow
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link href="/product/more" className="rounded-lg px-3 py-3 text-lg">
                  {microcopy.nav.examplesDeep}
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link href="/explore" className="rounded-lg px-3 py-3 text-lg font-medium">
                  Explore
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link href="/alpha" className="rounded-lg px-3 py-3 text-lg">
                  {microcopy.nav.earlyAccess}
                </Link>
              </DrawerClose>
              <DrawerClose asChild>
                <Link
                  href="/auth?next=/dashboard/validate"
                  className="mt-4 inline-flex rounded-full tab-cta tab-cta-warm px-5 py-3"
                >
                  <span>{microcopy.nav.cta}</span>
                  <span className="tab-cta-arrow">→</span>
                </Link>
              </DrawerClose>
            </nav>
          </DrawerContent>
        </Drawer>
      </div>
    </motion.header>
  )
}

function NavLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-2 text-[13px] font-medium text-bone-2 transition-colors hover:bg-white/[0.06] hover:text-bone-0"
    >
      {children}
    </Link>
  )
}
