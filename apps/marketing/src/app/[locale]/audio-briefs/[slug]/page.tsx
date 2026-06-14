"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api } from "@xc/api";
import {
  ArrowLeft,
  ArrowUpRight,
  AudioWaveform,
  Clock,
  Download,
  Headphones,
  Mic2,
  Pause,
  Play,
  Radio,
  ScrollText,
  Share2,
  User,
} from "lucide-react";

interface AudioBrief {
  Title: string;
  Summary: string;
  SpeakerName: string;
  SpeakerTitle?: string;
  DurationSeconds: number;
  AudioURL: string;
  Transcript?: string;
}

function formatDuration(seconds?: number): string {
  const total = Number.isFinite(seconds) ? Math.max(0, Math.floor(seconds || 0)) : 0;
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioBriefDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [brief, setBrief] = useState<AudioBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!slug) return;
    let active = true;

    api.getAudioBrief(slug)
      .then((d) => {
        if (!active) return;
        setBrief(d as unknown as AudioBrief);
      })
      .catch(() => {
        if (active) setBrief(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [slug]);

  const togglePlay = async () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      return;
    }

    try {
      await audioRef.current.play();
    } catch {
      setIsPlaying(false);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (loading) {
    return (
      <main className="shell-x py-20">
        <div className="panel-x animate-pulse p-8 lg:p-12">
          <div className="h-4 w-32 rounded bg-gravity/10" />
          <div className="mt-8 h-14 w-full max-w-3xl rounded bg-gravity/10" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-gravity/10" />
          <div className="mt-10 h-40 rounded-lg bg-gravity/8" />
        </div>
      </main>
    );
  }

  if (!brief) {
    return (
      <main className="shell-x py-20">
        <div className="panel-x mx-auto max-w-2xl p-8 text-center lg:p-10">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-lg border border-signal/20 bg-signal/8 text-signal">
            <Headphones className="h-5 w-5" />
          </span>
          <h1 className="font-display mt-5 text-3xl font-semibold tracking-tight">Audio brief not found</h1>
          <p className="mt-3 text-gravity/60">The episode may have moved or is no longer published.</p>
          <Link href="/audio-briefs" className="btn-x mt-6">
            <ArrowLeft className="h-4 w-4" />
            Back to audio briefs
          </Link>
        </div>
      </main>
    );
  }

  const totalDuration = duration || brief.DurationSeconds || 0;
  const progress = totalDuration ? Math.min((currentTime / totalDuration) * 100, 100) : 0;

  return (
    <main className="shell-x py-16 lg:py-20">
      <Link
        href="/audio-briefs"
        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-gravity/60 transition-colors hover:text-signal"
      >
        <ArrowLeft className="h-4 w-4" />
        Audio briefs
      </Link>

      <article className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_21rem]">
        <section className="panel-x overflow-hidden">
          <div className="relative overflow-hidden bg-[#08090d] px-6 py-10 text-white lg:px-10 lg:py-14">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_88%_12%,rgba(91,147,255,0.26),transparent_28rem)]"
            />
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-white/10" />
            <div className="relative">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                <Radio className="h-3.5 w-3.5 text-[#78a6ff]" />
                Audio brief
              </span>

              <h1 className="font-display mt-6 max-w-4xl text-4xl font-semibold leading-tight tracking-tight text-white lg:text-6xl">
                {brief.Title}
              </h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-white/62 lg:text-lg">
                {brief.Summary}
              </p>

              <div className="mt-8 flex flex-wrap gap-3 text-sm text-white/58">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  <User className="h-4 w-4 text-[#78a6ff]" />
                  {brief.SpeakerName}
                </span>
                {brief.SpeakerTitle && (
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                    <Mic2 className="h-4 w-4 text-[#78a6ff]" />
                    {brief.SpeakerTitle}
                  </span>
                )}
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5">
                  <Clock className="h-4 w-4 text-[#78a6ff]" />
                  {formatDuration(totalDuration)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-8 p-6 lg:p-10">
            <section className="rounded-lg border border-hairline bg-soft/70 p-5 lg:p-6">
              <audio
                ref={audioRef}
                src={brief.AudioURL}
                preload="metadata"
                onLoadedMetadata={() => setDuration(audioRef.current?.duration || brief.DurationSeconds || 0)}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
                onEnded={() => {
                  setIsPlaying(false);
                  setCurrentTime(0);
                }}
              />

              <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={togglePlay}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-signal text-white shadow-[var(--shadow-signal)] transition-transform hover:-translate-y-0.5 hover:bg-signal-ink"
                  aria-label={isPlaying ? "Pause audio" : "Play audio"}
                >
                  {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="ml-1 h-6 w-6" />}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="mb-3 flex items-center justify-between gap-4 text-xs font-semibold uppercase tracking-[0.16em] text-gravity/42">
                    <span className="inline-flex items-center gap-2">
                      <AudioWaveform className="h-4 w-4 text-signal" />
                      Listening progress
                    </span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={totalDuration || 1}
                    value={Math.min(currentTime, totalDuration || 1)}
                    onChange={seek}
                    className="w-full accent-signal"
                    aria-label="Audio progress"
                  />
                  <div className="mt-2 flex justify-between text-xs font-medium text-gravity/45">
                    <span>{formatDuration(currentTime)}</span>
                    <span>{formatDuration(totalDuration)}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap gap-2">
                {brief.AudioURL && (
                  <a
                    href={brief.AudioURL}
                    download
                    className="inline-flex items-center gap-2 rounded-full border border-hairline bg-foundation px-3 py-2 text-xs font-semibold text-gravity/65 transition-colors hover:border-signal hover:text-signal"
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download audio
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(window.location.href)}
                  className="inline-flex items-center gap-2 rounded-full border border-hairline bg-foundation px-3 py-2 text-xs font-semibold text-gravity/65 transition-colors hover:border-signal hover:text-signal"
                >
                  <Share2 className="h-3.5 w-3.5" />
                  Copy link
                </button>
              </div>
            </section>

            {brief.Transcript && (
              <section>
                <div className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-gravity/40">
                  <ScrollText className="h-4 w-4 text-signal" />
                  Transcript
                </div>
                <div className="prose-x max-w-none whitespace-pre-line rounded-lg border border-hairline bg-foundation p-5 leading-relaxed lg:p-6">
                  {brief.Transcript}
                </div>
              </section>
            )}
          </div>
        </section>

        <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
          <div className="card-x p-5">
            <p className="kicker-x text-signal">Episode notes</p>
            <dl className="mt-4 space-y-3">
              {[
                { label: "Speaker", value: brief.SpeakerName },
                { label: "Role", value: brief.SpeakerTitle || "XCreativs" },
                { label: "Duration", value: formatDuration(totalDuration) },
                { label: "Transcript", value: brief.Transcript ? "Available" : "Not published" },
              ].map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4 border-b border-hairline pb-3 last:border-0 last:pb-0">
                  <dt className="text-sm text-gravity/45">{item.label}</dt>
                  <dd className="text-right text-sm font-semibold text-gravity">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <Link href="/audio-briefs" className="card-x group flex items-center justify-between gap-4 p-5">
            <span>
              <span className="block text-sm font-semibold text-gravity">More audio briefs</span>
              <span className="mt-1 block text-xs text-gravity/52">Return to the short-form audio library.</span>
            </span>
            <ArrowUpRight className="h-4 w-4 text-signal transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </Link>

          <div className="rounded-lg border border-hairline bg-soft/70 p-5">
            <p className="text-sm font-semibold text-gravity">Designed for briefings</p>
            <p className="mt-2 text-sm leading-relaxed text-gravity/58">
              Short audio for operators who need the signal without turning every idea into a meeting.
            </p>
          </div>
        </aside>
      </article>
    </main>
  );
}
