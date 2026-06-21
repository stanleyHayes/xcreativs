import { ImageResponse } from "next/og";

// Branded social-share image, generated at the edge. Next auto-injects it as
// og:image (and Twitter falls back to og:image for its summary_large_image card)
// across the whole marketing site.
export const alt = "XCreativs Technologies — Intelligent digital systems for governments and enterprises";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0b0c0f",
          padding: "72px 80px",
          fontFamily: "sans-serif",
          position: "relative",
        }}
      >
        {/* signal glow */}
        <div
          style={{
            position: "absolute",
            top: -220,
            right: -160,
            width: 640,
            height: 640,
            display: "flex",
            background: "radial-gradient(circle, rgba(0,102,204,0.40), rgba(11,12,15,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -260,
            left: -180,
            width: 560,
            height: 560,
            display: "flex",
            background: "radial-gradient(circle, rgba(91,147,255,0.18), rgba(11,12,15,0) 70%)",
          }}
        />

        {/* wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              display: "flex",
              background: "#0066cc",
              boxShadow: "0 12px 40px rgba(0,102,204,0.55)",
            }}
          />
          <div style={{ fontSize: 32, color: "#ffffff", fontWeight: 700, letterSpacing: -0.5 }}>
            XCreativs
          </div>
        </div>

        {/* headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 26 }}>
          <div
            style={{
              display: "flex",
              fontSize: 66,
              color: "#ffffff",
              fontWeight: 700,
              lineHeight: 1.04,
              letterSpacing: -1.6,
              maxWidth: 940,
            }}
          >
            Intelligent digital systems for governments and enterprises.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 27,
              color: "rgba(255,255,255,0.62)",
              maxWidth: 860,
              lineHeight: 1.4,
            }}
          >
            National-scale platforms, AI integration, and strategic advisory.
          </div>
        </div>

        {/* footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", fontSize: 23, color: "rgba(255,255,255,0.46)" }}>
            xcreativs.com
          </div>
          <div style={{ display: "flex", fontSize: 23, color: "#5b93ff", fontWeight: 600 }}>
            XCreativs Technologies
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
