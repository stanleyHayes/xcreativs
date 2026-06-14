"use client";

import { useParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { api } from "@xc/api";
import Link from "next/link";
import { ArrowLeft, Play, Pause, Clock, User, Download } from "lucide-react";

interface AudioBrief {
  Title: string;
  Summary: string;
  SpeakerName: string;
  SpeakerTitle?: string;
  DurationSeconds: number;
  AudioURL: string;
  Transcript?: string;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function AudioBriefDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [brief, setBrief] = useState<AudioBrief | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!slug) return;
    api.getAudioBrief(slug)
      .then((d) => { setBrief(d as unknown as AudioBrief); setLoading(false); })
      .catch(() => setLoading(false));
  }, [slug]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!brief) return <div className="p-12 text-center">Audio brief not found.</div>;

  return (
    <main className="shell-x py-20">
      <Link href="/audio-briefs" className="inline-flex items-center gap-2 text-sm text-gravity/60 hover:text-signal transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Back to Audio Briefs
      </Link>

      <article className="panel-x max-w-4xl p-6 lg:p-10">
        <h1 className="font-display text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">{brief.Title}</h1>
        <p className="mt-2 text-lg text-gravity/60">{brief.Summary}</p>
        <div className="mt-4 flex items-center gap-4 text-sm text-gravity/40">
          <span className="flex items-center gap-1">
            <User className="w-4 h-4" /> {brief.SpeakerName}
            {brief.SpeakerTitle && `, ${brief.SpeakerTitle}`}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" /> {formatDuration(brief.DurationSeconds)}
          </span>
        </div>

        {/* Audio Player */}
        <div className="portal-card-x mt-8 rounded-2xl p-6 text-foundation">
          <audio
            ref={audioRef}
            src={brief.AudioURL}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-signal flex items-center justify-center hover:bg-signal/90 transition-colors"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={brief.DurationSeconds}
                value={currentTime}
                onChange={seek}
                className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-signal"
              />
              <div className="flex justify-between mt-1 text-xs text-white/50">
                <span>{formatDuration(Math.floor(currentTime))}</span>
                <span>{formatDuration(brief.DurationSeconds)}</span>
              </div>
            </div>
          </div>
          {brief.AudioURL && (
            <a
              href={brief.AudioURL}
              download
              className="mt-4 inline-flex items-center gap-2 text-xs text-white/50 hover:text-signal transition-colors"
            >
              <Download className="w-3 h-3" /> Download audio
            </a>
          )}
        </div>

        {/* Transcript */}
        {brief.Transcript && (
          <div className="mt-12">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-gravity/40 mb-4">Transcript</h2>
            <div className="prose-x max-w-none whitespace-pre-line">
              {brief.Transcript}
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
