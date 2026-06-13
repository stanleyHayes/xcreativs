import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Partners — XCreativs Technologies",
  description:
    "Collaborate with XCreativs. Distribution, technology, consulting, and content partnerships for national-scale impact.",
};

export default function PartnersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
