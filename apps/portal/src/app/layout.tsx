import type { Metadata } from "next";
import { Outfit, Geist_Mono } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeProvider from "@xc/ui/ThemeProvider";
import CurrencyProvider from "@xc/ui/CurrencyProvider";
import PortalSplashScreen from "@/components/PortalSplashScreen";
import AlertBridge from "@xc/ui/AlertBridge";
import "./globals.css";

const display = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const mono = Geist_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "XCreativs Portal",
  description: "Client and admin workspace for XCreativs Technologies.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${mono.variable}`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0066CC" />
      </head>
      <body className="min-h-screen antialiased" suppressHydrationWarning>
        <ThemeProvider defaultTheme="light">
          <CurrencyProvider>
            <NextIntlClientProvider messages={messages}>
              <PortalSplashScreen />
              <AlertBridge />
              {children}
            </NextIntlClientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
