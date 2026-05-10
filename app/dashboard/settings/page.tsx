"use client"

import type { ReactNode } from "react"
import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { DashboardNav } from "@/components/dashboard-nav"
import { useAuth } from "@/contexts/auth-context"
import { microcopy } from "@/lib/microcopy"

export default function SettingsPage() {
  const { user, loading, signOut, authConfigured } = useAuth()
  const router = useRouter()
  const [exporting, setExporting] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/auth?next=/dashboard/settings")
    }
  }, [loading, user, router])

  async function startCheckout(tier: "pro" | "team" = "pro") {
    setCheckoutLoading(true)
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "subscription", tier }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.ok && typeof j?.url === "string") {
        window.location.href = j.url
        return
      }
    } finally {
      setCheckoutLoading(false)
    }
  }

  async function handleExport() {
    setExporting(true)
    try {
      const res = await fetch("/api/decision-history", { credentials: "same-origin" })
      const data = await res.json().catch(() => ({}))
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `verdikt-export-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setExporting(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-ink-0">
        <DashboardNav />
        <div className="mx-auto max-w-[860px] px-6 py-24 md:px-10">
          <p className="mono-caption text-bone-2">{microcopy.dashboard.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-ink-0 text-bone-0">
      <DashboardNav />

      <main className="mx-auto max-w-[860px] px-6 py-16 pb-32 md:px-10">
        <p className="mono-caption text-bone-2">Account</p>
        <h1 className="font-serif text-[clamp(1.75rem,3vw,2.25rem)] font-light tracking-[-0.02em]">Settings</h1>
        <p className="mt-4 max-w-[560px] text-[17px] leading-relaxed text-bone-1">
          Profile and data controls. Billing hooks to Stripe when checkout is enabled in your deployment.
        </p>

        {!authConfigured && (
          <div className="mt-10 rounded-sm border border-dusk/30 bg-dusk/[0.06] px-4 py-3 text-[14px] text-bone-0">
            Supabase environment variables are missing locally — auth state may not persist across reloads.
          </div>
        )}

        <section className="mt-14 space-y-10">
          <SettingsCard eyebrow="Profile" title="Signed-in identity">
            <dl className="space-y-4 text-[15px]">
              <div>
                <dt className="mono-caption text-bone-2">Email</dt>
                <dd className="mt-1 text-bone-0">{user.email || "—"}</dd>
              </div>
              <div>
                <dt className="mono-caption text-bone-2">User id</dt>
                <dd className="mt-1 font-mono text-[12px] text-bone-1">{user.id}</dd>
              </div>
            </dl>
            <p className="mt-6 text-[14px] text-bone-2">
              Avatar and display name ship with the Supabase profile row once{" "}
              <code className="font-mono text-[12px] text-bone-1">profiles</code> is wired in production.
            </p>
          </SettingsCard>

          <SettingsCard eyebrow="Billing" title="Plan & usage">
            <p className="text-[15px] leading-relaxed text-bone-1">
              Free tier: two memo runs per day (UTC). Upgrade routes through Stripe checkout when{" "}
              <span className="font-mono text-[13px] text-bone-0">STRIPE_*</span> keys and webhook handlers are live.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void startCheckout("pro")}
                disabled={checkoutLoading}
                className="tab-cta inline-flex disabled:pointer-events-none disabled:opacity-50"
              >
                <span>{checkoutLoading ? "Redirecting…" : "Subscribe · Pro"}</span>
                <span className="tab-cta-arrow">→</span>
              </button>
              <button
                type="button"
                onClick={() => void startCheckout("team")}
                disabled={checkoutLoading}
                className="tab-cta tab-cta-quiet inline-flex disabled:pointer-events-none disabled:opacity-50"
              >
                <span>{checkoutLoading ? "Redirecting…" : "Subscribe · Team"}</span>
                <span className="tab-cta-arrow">→</span>
              </button>
              <Link href="/pricing" className="tab-cta tab-cta-quiet inline-flex">
                <span>Plans & early access</span>
                <span className="tab-cta-arrow">→</span>
              </Link>
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="API" title="Team keys">
            <p className="text-[15px] text-bone-1">
              API access is scoped to the Team plan. Keys are issued here once the gateway is connected — nothing secret
              ships in this MVP shell.
            </p>
            <div className="mt-4 rounded-sm border border-bone-0/[0.08] bg-bone-0/[0.02] px-4 py-3 font-mono text-[12px] text-bone-2">
              verdikt_live_••••••••••••••••
            </div>
          </SettingsCard>

          <SettingsCard eyebrow="Data" title="Export & deletion">
            <p className="text-[15px] text-bone-1">
              Download decision history as JSON today; PDF memo export lands behind Pro when the export pipeline reads from
              Supabase archives.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleExport()}
                disabled={exporting}
                className="tab-cta inline-flex disabled:pointer-events-none disabled:opacity-50"
              >
                <span>{exporting ? "Preparing…" : "Download JSON export"}</span>
                <span className="tab-cta-arrow">→</span>
              </button>
            </div>
            <p className="mt-8 text-[14px] text-bone-2">
              To delete your account, email support from this address — automated deletion hooks to Supabase Auth admin
              next.
            </p>
          </SettingsCard>

          <div className="border-t border-bone-0/[0.06] pt-10">
            <button
              type="button"
              onClick={() => void signOut().then(() => router.push("/"))}
              className="mono-caption text-bone-2 underline-offset-4 transition-colors hover:text-ash"
            >
              Sign out everywhere
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function SettingsCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <div className="warm-surface rounded-sm border border-bone-0/[0.06] p-8">
      <p className="mono-caption text-bone-2">{eyebrow}</p>
      <h2 className="mt-2 font-serif text-[1.25rem] font-light tracking-[-0.02em]">{title}</h2>
      <div className="mt-6">{children}</div>
    </div>
  )
}
