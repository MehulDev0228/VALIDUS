import { ImageResponse } from "next/og"

export const runtime = "edge"

export const alt = "VERDIKT — The memo before the build."
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function TwitterImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 80,
          background: "linear-gradient(145deg, #FCFBF8 0%, #F6F5F1 55%, #FFFFFF 100%)",
          color: "#171A1F",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
          <div
            style={{
              width: 14,
              height: 14,
              borderRadius: 999,
              background: "#0E839D",
            }}
          />
          <span style={{ fontSize: 22, letterSpacing: "0.22em", textTransform: "uppercase", color: "#585D65" }}>
            VERDIKT
          </span>
        </div>
        <div style={{ fontSize: 64, fontWeight: 300, letterSpacing: "-0.03em", lineHeight: 1.05, maxWidth: 900 }}>
          The memo before the build.
        </div>
        <div style={{ marginTop: 28, fontSize: 26, color: "#585D65", maxWidth: 820, lineHeight: 1.45 }}>
          Structured BUILD / PIVOT / KILL memos — seven angles, tensions visible, 48-hour tests.
        </div>
      </div>
    ),
    { ...size },
  )
}
