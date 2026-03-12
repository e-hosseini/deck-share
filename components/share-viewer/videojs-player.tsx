"use client";

import { useRef, useEffect } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

type VideoJsPlayerProps = {
  url: string;
  mimeType?: string;
  onTrack?: (action: string, metadata?: Record<string, unknown>) => void;
};

export function VideoJsPlayer({ url, mimeType, onTrack }: VideoJsPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<ReturnType<typeof videojs> | null>(null);
  const progressTrackedRef = useRef<Set<number>>(new Set());
  const onTrackRef = useRef(onTrack);
  onTrackRef.current = onTrack;

  useEffect(() => {
    if (!videoRef.current || typeof window === "undefined") return;

    const absoluteUrl = new URL(url, window.location.origin).href;
    const source: { src: string; type?: string } = { src: absoluteUrl };
    if (mimeType) source.type = mimeType;

    const videoElement = document.createElement("video-js");
    videoElement.classList.add("vjs-big-play-centered");
    videoRef.current.appendChild(videoElement);

    const player = (playerRef.current = videojs(videoElement, {
      controls: true,
      responsive: true,
      fluid: true,
      sources: [source],
      playsInline: true,
    }));

    player.ready(() => {
      const track = onTrackRef.current;
      if (!track) return;

      player.on("play", () => {
        progressTrackedRef.current.clear();
        track("video_play");
      });

      player.on("pause", () => {
        const v = player.currentTime();
        const d = player.duration();
        track("video_pause", Number.isFinite(v) && Number.isFinite(d) ? { currentTime: v, duration: d } : undefined);
      });

      player.on("ended", () => {
        const d = player.duration();
        track("video_ended", Number.isFinite(d) ? { duration: d } : undefined);
      });

      player.on("timeupdate", () => {
        const v = player.currentTime();
        const d = player.duration();
        if (v == null || d == null || !Number.isFinite(d) || d <= 0 || !Number.isFinite(v) || !track) return;
        const percent = Math.floor((v / d) * 100);
        const milestones = [25, 50, 75, 100];
        const hit = milestones.find((m) => percent >= m && !progressTrackedRef.current.has(m));
        if (hit !== undefined) {
          progressTrackedRef.current.add(hit);
          track("video_progress", { percent: hit, currentTime: v, duration: d });
        }
      });
    });

    return () => {
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, [url, mimeType]);

  return (
    <div data-vjs-player className="h-full w-full rounded-md overflow-hidden">
      <div ref={videoRef} className="h-full w-full" />
    </div>
  );
}
