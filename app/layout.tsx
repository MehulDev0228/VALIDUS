import type React from "react"
import type { Metadata } from "next"
import { Inter_Tight, Instrument_Serif, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers"
import { AuthProvider } from "@/contexts/auth-context"

const sans = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
})

const serif = Instrument_Serif({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400"],
  style: ["normal", "italic"],
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500"],
})

export const metadata: Metadata = {
  title: "FutureValidate — private founder reflection",
  description:
    "A calm room for founders — file what you're thinking, receive structured tension and a single decision frame. No audience. No performance.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`dark ${sans.variable} ${serif.variable} ${mono.variable}`}>
      <body className="font-sans bg-ink-0 text-bone-0 antialiased">
        <Providers>
          <AuthProvider>{children}</AuthProvider>
        </Providers>
      </body>
    </html>
  )
}
