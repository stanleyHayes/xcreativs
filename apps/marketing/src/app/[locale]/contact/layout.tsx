import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact — XCreativs Technologies",
  description:
    "Get in touch with XCreativs. Strategic advisory, platform engineering, AI integration, and national-scale digital systems.",
};

export default function ContactLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
