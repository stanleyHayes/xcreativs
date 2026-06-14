"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@xc/api";
import { Clock, User, Play, Rss, Headphones } from "lucide-react";
import PageBanner from "@xc/ui/PageBanner";

interface AudioBrief {
  Slug: string;
  Title: string;
  Summary: string;
  SpeakerName: string;
  DurationSeconds: number;
}

interface AudioBriefsResult {
  audio_briefs?: AudioBrief[];
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioBriefsPage() {
  const [briefs, setBriefs] = useState<AudioBrief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.listAudioBriefs()
      .then((d) => {
        const result = d as AudioBriefsResult;
        setBriefs(result.audio_briefs || []);
        setLoading(false);
      })
      .catch(() => setError("Failed to load audio briefs"));
  }, []);

  if (error) return <div className="p-12 text-center text-gravity/60">{error}</div>;
  if (loading) return <div className="p-12 text-center">Loading...</div>;

  return (
    <>
      <PageBanner
        icon={Headphones}
        eyebrow="Listen"
        title="Audio Briefs"
        description="Short-form audio from the XCreativs team. Twelve minutes or less on architecture, policy, and platform economics."
        crumbs={[{ label: "Home", href: "/" }, { label: "Audio Briefs" }]}
      />
      <main className="shell-x py-16">
      <div className="flex justify-end">
        <a
          href={`/api/v1/feed/audio`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-x-secondary shrink-0"
        >
          <Rss className="w-4 h-4" /> Subscribe (RSS)
        </a>
      </div>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {briefs.map((brief) => (
          <Link
            key={brief.Slug}
            href={`/audio-briefs/${brief.Slug}`}
            className="group block card-x overflow-hidden"
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
    </>
  );
}
