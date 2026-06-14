import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@xc/ui/concierge/ChatWidget";
import ThemeProvider from "@xc/ui/ThemeProvider";
import CurrencyProvider from "@xc/ui/CurrencyProvider";
import AnalyticsScript from "@/components/AnalyticsScript";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";
import SplashScreen from "@/components/SplashScreen";
import ScrollToTop from "@/components/ScrollToTop";

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-fraunces",
});

const body = Hanken_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-hanken",
});

const SITE_URL = "https://xcreativs.com";
const TITLE = "XCreativs Technologies — Intelligent Digital Systems";
const DESCRIPTION =
  "We build intelligent digital systems for governments and enterprises. National-scale platforms, AI integration, and strategic advisory.";

// Locale-aware so OpenGraph reports the right `locale`/`alternateLocale` and
// `metadataBase` resolves relative OG/canonical URLs. Per-route hreflang is
// emitted by next-intl's middleware as an HTTP `Link:` header (correct for
// every path) — we deliberately don't set `alternates.languages` here because
// a layout can't see the pathname and would point all sub-pages at the root.
export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  return {
    metadataBase: new URL(SITE_URL),
    title: TITLE,
    description: DESCRIPTION,
    openGraph: {
      type: "website",
      siteName: "XCreativs Technologies",
      title: TITLE,
      description: DESCRIPTION,
      url: locale === "fr" ? `${SITE_URL}/fr` : SITE_URL,
      locale: locale === "fr" ? "fr_FR" : "en_US",
      alternateLocale: locale === "fr" ? "en_US" : "fr_FR",
    },
    twitter: {
      card: "summary_large_image",
      title: TITLE,
      description: DESCRIPTION,
    },
  };
}

export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "XCreativs Technologies",
      url: "https://xcreativs.com",
      description:
        "Intelligent digital systems for governments and enterprises. National-scale platforms, AI integration, and strategic advisory.",
      logo: "https://xcreativs.com/icon-512x512.svg",
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "XCreativs Technologies",
      url: "https://xcreativs.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://xcreativs.com/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    },
  ];

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`} suppressHydrationWarning>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0066CC" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col" suppressHydrationWarning>
        <SplashScreen />
        <ThemeProvider defaultTheme="light">
          <CurrencyProvider>
            <NextIntlClientProvider messages={messages}>
              <OfflineIndicator />
              <Navigation />
              <div className="flex-1">{children}</div>
              <Footer />
              <ChatWidget />
              <ScrollToTop />
              <AnalyticsScript />
              <PWAUpdatePrompt />
            </NextIntlClientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
