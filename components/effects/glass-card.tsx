import type { ReactNode } from "react"
import { cn } from "@/lib/utils"

export function GlassCard({
  className,
  children,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-white/[0.08] bg-white/[0.03] shadow-[0_8px_40px_-24px_rgb(0_0_0_/_0.6)] backdrop-blur-xl",
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
