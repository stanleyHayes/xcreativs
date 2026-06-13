import type { Metadata } from "next";
import { Fraunces, Hanken_Grotesk } from "next/font/google";
import "../globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import ThemeProvider from "@xc/ui/ThemeProvider";
import CurrencyProvider from "@xc/ui/CurrencyProvider";

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

export const metadata: Metadata = {
  title: "XCreativs Portal",
  description: "Client and admin workspace for XCreativs Technologies.",
  robots: { index: false, follow: false },
};

export default async function LocaleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <head>
        <meta name="theme-color" content="#0066CC" />
      </head>
      <body className="antialiased min-h-screen">
        <ThemeProvider defaultTheme="light">
          <CurrencyProvider>
            <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
