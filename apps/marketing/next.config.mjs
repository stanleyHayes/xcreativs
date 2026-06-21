import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("../../packages/i18n/src/request.ts");

// Backend API origin for the `/api/*` rewrite below. This proxy runs in every
// environment (including production on Vercel), so browser calls stay
// same-origin and CORS-free, while SSR uses the same absolute URL. Set
// API_PROXY_URL to override; otherwise it falls back to NEXT_PUBLIC_API_URL
// (the deployed Render backend URL).
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

/** @type {import("next").NextConfig} */
const nextConfig = {
  poweredByHeader: false,
  transpilePackages: ["@xc/api", "@xc/i18n", "@xc/ui"],
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${API_PROXY_URL}/api/:path*` },
      { source: "/offline", destination: "/en/offline" },
    ];
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
      { source: "/manifest.json", headers: [{ key: "Cache-Control", value: "public, max-age=3600" }] },
      { source: "/icon-:size.svg", headers: [{ key: "Cache-Control", value: "public, max-age=86400, immutable" }] },
    ];
  },
  images: { remotePatterns: [] },
};

export default withNextIntl(nextConfig);
