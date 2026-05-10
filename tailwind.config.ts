import type { Config } from "tailwindcss"

/**
 * VERDIKT Tailwind config
 *
 * Tokens are semantic (ink, bone, ember, verdict) so the entire product
 * recolors atomically when the palette shifts. Spacing follows an editorial
 * rhythm — generous, asymmetric — not a 4px grid.
 */
const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans:    ["var(--font-sans)", "ui-sans-serif", "system-ui"],
        display: ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui"],
        /** @deprecated use font-display — kept so legacy `font-serif` maps to Sora */
        serif:   ["var(--font-display)", "var(--font-sans)", "ui-sans-serif", "system-ui"],
        mono:    ["var(--font-mono)", "ui-monospace", "SFMono-Regular"],
      },
      colors: {
        ink: {
          0: "rgb(var(--ink-0) / <alpha-value>)",
          1: "rgb(var(--ink-1) / <alpha-value>)",
          2: "rgb(var(--ink-2) / <alpha-value>)",
          3: "rgb(var(--ink-3) / <alpha-value>)",
        },
        bone: {
          0: "rgb(var(--bone-0) / <alpha-value>)",
          1: "rgb(var(--bone-1) / <alpha-value>)",
          2: "rgb(var(--bone-2) / <alpha-value>)",
        },
        ember: "rgb(var(--ember) / <alpha-value>)",
        sage:  "rgb(var(--sage) / <alpha-value>)",
        dusk:  "rgb(var(--dusk) / <alpha-value>)",
        ash:   "rgb(var(--ash) / <alpha-value>)",
        mist:  "rgb(var(--mist) / <alpha-value>)",
        verdict: {
          build: "rgb(var(--verdict-build) / <alpha-value>)",
          pivot: "rgb(var(--verdict-pivot) / <alpha-value>)",
          kill:  "rgb(var(--verdict-kill) / <alpha-value>)",
        },
        background: "rgb(var(--background) / <alpha-value>)",
        foreground: "rgb(var(--foreground) / <alpha-value>)",
        card: {
          DEFAULT:    "rgb(var(--card) / <alpha-value>)",
          foreground: "rgb(var(--card-foreground) / <alpha-value>)",
        },
        popover: {
          DEFAULT:    "rgb(var(--popover) / <alpha-value>)",
          foreground: "rgb(var(--popover-foreground) / <alpha-value>)",
        },
        primary: {
          DEFAULT:    "rgb(var(--primary) / <alpha-value>)",
          foreground: "rgb(var(--primary-foreground) / <alpha-value>)",
        },
        secondary: {
          DEFAULT:    "rgb(var(--secondary) / <alpha-value>)",
          foreground: "rgb(var(--secondary-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT:    "rgb(var(--muted) / <alpha-value>)",
          foreground: "rgb(var(--muted-foreground) / <alpha-value>)",
        },
        accent: {
          DEFAULT:    "rgb(var(--accent) / <alpha-value>)",
          foreground: "rgb(var(--accent-foreground) / <alpha-value>)",
        },
        destructive: {
          DEFAULT:    "rgb(var(--destructive) / <alpha-value>)",
          foreground: "rgb(var(--destructive-foreground) / <alpha-value>)",
        },
        border: "rgb(var(--border) / 0.1)",
        input:  "rgb(var(--border) / 0.12)",
        ring:   "rgb(var(--ring) / 0.35)",
      },
      spacing: {
        "0.5": "2px",
        "1":   "4px",
        "2":   "8px",
        "3":   "12px",
        "4":   "16px",
        "6":   "24px",
        "8":   "32px",
        "12":  "48px",
        "16":  "64px",
        "24":  "96px",
        "40":  "160px",
        "56":  "224px",
        "64":  "256px",
      },
      fontSize: {
        "display-xl": ["clamp(64px, 11vw, 144px)", { lineHeight: "0.92", letterSpacing: "-0.045em" }],
        "display-l":  ["clamp(48px, 7vw, 96px)",   { lineHeight: "0.98", letterSpacing: "-0.035em" }],
        "h1":         ["clamp(36px, 5vw, 56px)",   { lineHeight: "1.05", letterSpacing: "-0.03em" }],
        "h2":         ["clamp(28px, 3.4vw, 40px)", { lineHeight: "1.15", letterSpacing: "-0.02em" }],
        "h3":         ["22px",                     { lineHeight: "1.3",  letterSpacing: "-0.01em" }],
        "body":       ["17px",                     { lineHeight: "1.65", letterSpacing: "0" }],
        "small":      ["14px",                     { lineHeight: "1.55", letterSpacing: "0" }],
        "caption":    ["11px",                     { lineHeight: "1.3",  letterSpacing: "0.06em" }],
      },
      borderRadius: {
        none: "0",
        sm:   "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md:   "var(--radius-md)",
        lg:   "var(--radius-lg)",
        xl:   "var(--radius-xl)",
        full: "9999px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to:   { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to:   { height: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(14px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "breathe": {
          "0%, 100%": { opacity: "0.4" },
          "50%":      { opacity: "0.9" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up":   "accordion-up 0.2s ease-out",
        "fade-up":        "fade-up 800ms cubic-bezier(0.25, 0.1, 0.25, 1) both",
        "breathe":        "breathe 4s ease-in-out infinite",
      },
      transitionTimingFunction: {
        "breath":  "cubic-bezier(0.25, 0.1, 0.25, 1)",
        "settle":  "cubic-bezier(0.32, 0.72, 0, 1)",
        "drift":   "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
export default config
