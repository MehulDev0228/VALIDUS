"use client"

import { CursorCompanion } from "./cursor-companion"
import { DwellTicker } from "./dwell-ticker"
import { FileMemoPill } from "./file-memo-pill"

/**
 * InteractiveShell — wraps marketing pages with the bespoke interaction
 * layer (cursor companion, dwell ticker, conversion pill). Mounts once on
 * the home route; respects reduced-motion and pointer-coarse internally.
 */
export function InteractiveShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <CursorCompanion />
      <DwellTicker />
      <FileMemoPill />
      {children}
    </>
  )
}
