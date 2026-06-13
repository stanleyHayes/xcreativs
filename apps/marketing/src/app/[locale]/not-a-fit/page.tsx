"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { Heart, ArrowRight, BookOpen, Wrench, Handshake, Mail, CheckCircle } from "lucide-react";

const alternatives = [
  {
    title: "Self-Assessment Tools",
    desc: "Try our interactive diagnostics to understand your digital posture before engaging any firm.",
    href: "/tools",
    icon: Wrench,
  },
  {
    title: "Reading List",
    desc: "Curated essays on digital transformation, governance, and African technology strategy.",
    href: "/reading-list",
    icon: BookOpen,
  },
  {
    title: "Partner Network",
    desc: "Explore our distribution and co-development partners who may serve your specific needs.",
    href: "/partners",
    icon: Handshake,
  },
];

export default function NotAFitPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "en";
  const [subscribed, setSubscribed] = useState(false);

  async function handleSubscribe(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    await api.subscribeNewsletter({
      email: fd.get("email"),
      first_name: fd.get("first_name"),
      segments: ["general"],
    });
    setSubscribed(true);
  }

  return (
    <main>
      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20 lg:py-28">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2 mb-6">
              <Heart className="w-5 h-5 text-signal" />
              <p className="text-xs font-medium uppercase tracking-wider text-gravity/40">Thank you for considering us</p>
            </div>
            <h1 className="text-3xl lg:text-5xl font-bold leading-tight tracking-tight">
              We may not be the right fit — and that is okay
            </h1>
            <p className="mt-6 text-lg text-gravity/70 leading-relaxed">
              XCreativs works exclusively with governments, large enterprises, and institutions 
              building national-scale digital systems. If your scope or stage does not align with 
              this focus, we want to be honest about it upfront rather than waste your time.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
          <h2 className="text-xl font-semibold mb-8">Alternative paths forward</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {alternatives.map((alt) => (
              <Link
                key={alt.title}
                href={`/${locale}${alt.href}`}
                className="group bg-foundation border border-hairline rounded-lg p-6 hover:border-signal transition-colors"
              >
                <alt.icon className="w-5 h-5 text-signal mb-4" />
                <h3 className="font-semibold group-hover:text-signal transition-colors">{alt.title}</h3>
                <p className="text-sm text-gravity/60 mt-2">{alt.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs text-signal mt-4 font-medium">
                  Explore <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b border-hairline">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h2 className="text-xl font-semibold mb-4">When to re-engage</h2>
              <ul className="space-y-3 text-gravity/70">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                  <span>Your organisation has secured budget for a national or enterprise-scale platform.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                  <span>You need sovereign data residency, multi-agency integration, or AI at scale.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                  <span>You are a ministry, regulator, or state-owned enterprise in Ghana or West Africa.</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-signal shrink-0 mt-0.5" />
                  <span>You have a multi-year digital transformation mandate with board-level sponsorship.</span>
                </li>
              </ul>
            </div>

            <div className="border border-hairline rounded-lg p-6 bg-foundation">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-4 h-4 text-signal" />
                <h2 className="font-semibold">Stay in the loop</h2>
              </div>
              <p className="text-sm text-gravity/60 mb-4">
                Even if now is not the right time, our field notes and public tools may be useful. 
                No spam — quarterly at most.
              </p>
              {subscribed ? (
                <div className="flex items-center gap-2 text-green-400 text-sm">
                  <CheckCircle className="w-4 h-4" />
                  <span>You are subscribed. Thank you.</span>
                </div>
              ) : (
                <form onSubmit={handleSubscribe} className="space-y-3">
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="you@organisation.com"
                    className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
                  />
                  <input
                    name="first_name"
                    placeholder="First name (optional)"
                    className="w-full border border-hairline rounded px-4 py-2 text-sm focus:outline-none focus:border-signal"
                  />
                  <button
                    type="submit"
                    className="bg-signal text-white px-5 py-2.5 rounded text-sm font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    Subscribe <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-hairline bg-soft">
        <div className="mx-auto max-w-[1440px] px-6 lg:px-12 py-12 text-center">
          <p className="text-gravity/50 text-sm">
            Still unsure?{" "}
            <Link href={`/${locale}/contact`} className="text-signal hover:underline">
              Contact us anyway
            </Link>
            {" "}— we read every message and route appropriately.
          </p>
        </div>
      </section>
    </main>
  );
}
