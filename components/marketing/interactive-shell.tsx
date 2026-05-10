"use client"

import { FileMemoPill } from "./file-memo-pill"

/**
 * InteractiveShell — minimal wrapper around the marketing page.
 *
 * Earlier iterations attached a CursorCompanion (trailing caption near
 * the cursor), a DwellTicker (forensic log), a SelectionQuote (copy
 * popover), and an AmbientCursor (radial light). All of these were
 * "designer signatures" — they called attention to themselves rather
 * than helping the user. Removed.
 *
 * FileMemoPill is kept because it is a functional CTA, not ornament.
 */
export function InteractiveShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <FileMemoPill />
      {children}
    </>
  )
}
