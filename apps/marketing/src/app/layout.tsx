import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL("https://xcreativs.com"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
