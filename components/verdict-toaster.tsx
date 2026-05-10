"use client"

import { Toaster } from "sonner"

/**
 * Sonner — tokens aligned with VERDIKT surfaces (no next-themes coupling).
 */
export function VerdictToaster() {
  return (
    <Toaster
      theme="dark"
      position="bottom-center"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "group border border-white/[0.08] bg-[rgb(var(--ink-1))] text-[rgb(var(--bone-0))] shadow-[0_24px_56px_-28px_rgb(0_0_0_/_0.55)] backdrop-blur-xl",
          title: "font-sans text-[14px] font-medium tracking-tight text-[rgb(var(--bone-0))]",
          description: "font-sans text-[13px] text-bone-2",
          actionButton:
            "rounded-md border border-white/[0.12] bg-white/[0.06] px-3 py-1.5 text-[12px] uppercase tracking-wide text-bone-0 hover:bg-white/[0.1]",
          cancelButton: "text-bone-2",
          closeButton:
            "border-white/[0.1] bg-transparent text-bone-2 hover:bg-white/[0.06] hover:text-bone-0",
        },
      }}
    />
  )
}
