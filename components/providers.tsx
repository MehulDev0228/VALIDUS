"use client"

import type { ReactNode } from "react"
import { ViewTransitions } from "next-view-transitions"
import { NuqsAdapter } from "nuqs/adapters/next/app"
import { LenisProvider } from "@/components/lenis-provider"
import { ChamberCurtain } from "@/components/chamber"
import { VerdictToaster } from "@/components/verdict-toaster"

interface ProvidersProps {
  children: ReactNode
}

/**
 * Providers — stable mount above every page.
 *
 *   - ViewTransitions — cross-route view transition API (graceful fallback).
 *   - NuqsAdapter — type-safe URL state (e.g. pricing billing toggle).
 *   - LenisProvider — scroll surface (reduced-motion safe).
 *   - ChamberCurtain — chamber navigation veil.
 */
export function Providers({ children }: ProvidersProps) {
  return (
    <ViewTransitions>
      <NuqsAdapter>
        <LenisProvider>
          {children}
          <ChamberCurtain />
          <VerdictToaster />
        </LenisProvider>
      </NuqsAdapter>
    </ViewTransitions>
  )
}
