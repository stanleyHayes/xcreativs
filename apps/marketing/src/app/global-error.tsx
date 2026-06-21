"use client";

// Root-level safety net: renders only when the root layout itself throws, so it
// must provide its own <html>/<body> and inline styles (app CSS may be absent).
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          padding: "0 24px",
          background: "#ffffff",
          color: "#0b0c0f",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif",
        }}
      >
        <div style={{ maxWidth: 440, textAlign: "center" }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0, letterSpacing: "-0.01em" }}>
            Something went sideways
          </h1>
          <p style={{ marginTop: 12, fontSize: 14, lineHeight: 1.6, color: "rgba(11,12,15,0.6)" }}>
            A hiccup on our end interrupted this page — nothing you did. Please try
            again.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 28,
              padding: "12px 22px",
              fontSize: 14,
              fontWeight: 600,
              color: "#ffffff",
              background: "#0066cc",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
            }}
          >
            Try again
          </button>
          {error.digest ? (
            <p
              style={{
                marginTop: 24,
                fontSize: 11,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: "rgba(11,12,15,0.4)",
              }}
            >
              Reference {error.digest}
            </p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
