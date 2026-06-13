import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// Backend API origin used by the dev/preview proxy. In production the platform
// is fronted by a reverse proxy, but this keeps `/api/*` working when the
// frontend is run standalone. Configurable via API_PROXY_URL.
const API_PROXY_URL = process.env.API_PROXY_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
    : []),
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_URL}/api/:path*`,
      },
      {
        source: "/offline",
        destination: "/en/offline",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=3600" },
        ],
      },
      {
        source: "/icon-:size.svg",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, immutable" },
        ],
      },
    ];
  },
  images: {
    remotePatterns: [],
  },
};

export default withNextIntl(nextConfig);
