import type React from "react"
import type { Metadata } from "next"
import { Inter, JetBrains_Mono, Sora } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AuthProvider } from "@/contexts/auth-context"

const display = Sora({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
})

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  title: "VERDIKT — structured idea validation for founders",
  description:
    "The memo before the build. Describe a startup idea in plain language. Get tradeoffs, a BUILD / PIVOT / KILL verdict, and a short test plan — private archive when you’re signed in.",
  openGraph: {
    title: "VERDIKT — The memo before the build",
    description:
      "Structured startup memos with BUILD / PIVOT / KILL verdicts, tensions visible, and 48-hour tests — before you sink months into build.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VERDIKT",
    description: "The memo before the build.",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${display.variable} ${sans.variable} ${mono.variable}`}
    >
      <body className="font-sans bg-ink-0 text-bone-0 antialiased">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
