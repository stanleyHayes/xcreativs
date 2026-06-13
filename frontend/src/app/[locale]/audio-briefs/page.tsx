"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Clock, User, Play, Rss } from "lucide-react";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioBriefsPage() {
  const [briefs, setBriefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listAudioBriefs()
      .then((d) => { setBriefs(d.audio_briefs || []); setLoading(false); })
      .catch(() => setError("Failed to load audio briefs"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <main className="mx-auto max-w-[1440px] px-6 lg:px-12 py-20">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl lg:text-5xl font-bold">Audio Briefs</h1>
          <p className="mt-4 text-lg text-gravity/60 max-w-2xl">
            Short-form audio from the XCreativs team. Twelve minutes or less on architecture, policy, and platform economics.
          </p>
        </div>
        <a
          href={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081"}/api/v1/feed/audio`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 shrink-0 border border-hairline rounded px-4 py-2 text-sm font-medium text-gravity/70 hover:border-signal hover:text-signal transition-colors"
        >
          <Rss className="w-4 h-4" /> Subscribe (RSS)
        </a>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {briefs.map((brief) => (
          <Link
            key={brief.Slug}
            href={`/audio-briefs/${brief.Slug}`}
            className="group block border border-hairline rounded-lg overflow-hidden hover:border-signal transition-colors"
          >
            <div className="aspect-video bg-gravity flex items-center justify-center relative">
              <div className="w-16 h-16 rounded-full bg-signal/20 flex items-center justify-center group-hover:bg-signal/30 transition-colors">
                <Play className="w-8 h-8 text-signal fill-signal" />
              </div>
              <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded">
                {formatDuration(brief.DurationSeconds)}
              </span>
            </div>
            <div className="p-5">
              <h2 className="text-lg font-semibold group-hover:text-signal transition-colors line-clamp-2">
                {brief.Title}
              </h2>
              <p className="mt-2 text-sm text-gravity/60 line-clamp-2">{brief.Summary}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-gravity/40">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> {brief.SpeakerName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {formatDuration(brief.DurationSeconds)}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {briefs.length === 0 && (
        <p className="text-center text-gravity/40 py-12">No audio briefs available.</p>
      )}
    </main>
  );
}
