import type { Metadata } from "next";
import { Inter_Tight } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import ChatWidget from "@/components/concierge/ChatWidget";
import ThemeProvider from "@/components/ThemeProvider";
import CurrencyProvider from "@/components/CurrencyProvider";
import AnalyticsScript from "@/components/AnalyticsScript";
import OfflineIndicator from "@/components/OfflineIndicator";
import PWAUpdatePrompt from "@/components/PWAUpdatePrompt";

const interTight = Inter_Tight({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter-tight",
});

export const metadata: Metadata = {
  title: "XCreativs Technologies — Intelligent Digital Systems",
  description:
    "We build intelligent digital systems for governments and enterprises. National-scale platforms, AI integration, and strategic advisory.",
};

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
    <html lang={locale} className={interTight.variable}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#0066CC" />
        <link rel="apple-touch-icon" href="/icon-192x192.svg" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased min-h-screen flex flex-col">
        <ThemeProvider defaultTheme="light">
          <CurrencyProvider>
            <NextIntlClientProvider messages={messages}>
              <OfflineIndicator />
              <Navigation />
              <div className="flex-1">{children}</div>
              <Footer />
              <ChatWidget />
              <AnalyticsScript />
              <PWAUpdatePrompt />
            </NextIntlClientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
