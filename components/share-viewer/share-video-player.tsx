"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type ShareVideoPlayerProps = {
  src: string;
  onTrack: (action: string, metadata?: Record<string, unknown>) => void;
  className?: string;
};

export function ShareVideoPlayer({ src, onTrack, className }: ShareVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressTrackedRef = useRef<Set<number>>(new Set());

  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [videoAspect, setVideoAspect] = useState<number | null>(null); // 16/9 initially, then actual
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [hovering, setHovering] = useState(false);
  const hideControlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      progressTrackedRef.current.clear();
      onTrack("video_play");
    } else {
      v.pause();
      onTrack("video_pause", { currentTime: v.currentTime, duration: v.duration });
    }
  }, [onTrack]);

  const toggleFullscreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    if (!document.fullscreenElement) {
      container.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const onFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const v = videoRef.current;
      if (!v || duration <= 0) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      v.currentTime = x * duration;
      setCurrentTime(v.currentTime);
    },
    [duration]
  );

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) videoRef.current.volume = val;
    if (val === 0) setMuted(true);
    else setMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (muted) {
      v.volume = volume || 1;
      setMuted(false);
    } else {
      v.volume = 0;
      setMuted(true);
    }
  }, [muted, volume]);

  const showControlsTemporarily = useCallback(() => {
    setShowControls(true);
    setHovering(true);
    if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    hideControlsTimerRef.current = setTimeout(() => {
      if (playing) {
        setShowControls(false);
        setHovering(false);
      }
      hideControlsTimerRef.current = null;
    }, 3000);
  }, [playing]);

  useEffect(() => {
    if (!playing) setShowControls(true);
    return () => {
      if (hideControlsTimerRef.current) clearTimeout(hideControlsTimerRef.current);
    };
  }, [playing]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "group relative flex h-full min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-black shadow-2xl ring-1 ring-white/10",
        className
      )}
      onMouseEnter={() => {
        setHovering(true);
        showControlsTemporarily();
      }}
      onMouseLeave={() => {
        setHovering(false);
        if (playing && hideControlsTimerRef.current) {
          clearTimeout(hideControlsTimerRef.current);
          hideControlsTimerRef.current = setTimeout(() => setShowControls(false), 500);
        }
      }}
      onMouseMove={showControlsTemporarily}
    >
      <div
        className="relative flex flex-1 min-h-0 w-full items-center justify-center"
        style={{
          aspectRatio: videoAspect !== null ? String(videoAspect) : "16/9",
        }}
      >
        <video
          ref={videoRef}
          className={cn("max-h-full w-full object-contain", loading && "opacity-0")}
          src={src}
          playsInline
          onClick={togglePlay}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onLoadedData={() => setLoading(false)}
          onCanPlay={() => setLoading(false)}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (v) {
              if (v.videoWidth && v.videoHeight) setVideoAspect(v.videoWidth / v.videoHeight);
              setDuration(v.duration);
            }
          }}
          onEnded={() => {
            setPlaying(false);
            setCurrentTime(0);
            const v = videoRef.current;
            onTrack("video_ended", v ? { duration: v.duration } : undefined);
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (v) {
              setCurrentTime(v.currentTime);
              if (v.duration > 0 && onTrack) {
                const percent = Math.floor((v.currentTime / v.duration) * 100);
                const milestones = [25, 50, 75, 100];
                const hit = milestones.find((m) => percent >= m && !progressTrackedRef.current.has(m));
                if (hit !== undefined) {
                  progressTrackedRef.current.add(hit);
                  onTrack("video_progress", {
                    percent: hit,
                    currentTime: v.currentTime,
                    duration: v.duration,
                  });
                }
              }
            }
          }}
          onDurationChange={() => {
            const v = videoRef.current;
            if (v) setDuration(v.duration);
          }}
        >
          Your browser does not support the video tag.
        </video>

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/60">
            <Loader2 className="size-12 animate-spin text-white" aria-hidden />
            <span className="text-sm text-white/90">Loading video…</span>
          </div>
        )}

        {/* Center play button when paused */}
        {!playing && !loading && (
          <button
            type="button"
            onClick={togglePlay}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
            aria-label="Play"
          >
            <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-black shadow-xl transition-transform hover:scale-105 active:scale-95">
              <Play className="size-10 translate-x-1" fill="currentColor" />
            </span>
          </button>
        )}

        {/* Bottom controls bar */}
        <div
          className={cn(
            "absolute bottom-0 left-0 right-0 z-20 flex flex-col gap-1 bg-linear-to-t from-black/90 via-black/70 to-transparent px-3 pb-2 pt-8 transition-opacity duration-200",
            showControls || hovering ? "opacity-100" : "opacity-0"
          )}
        >
          {/* Progress bar */}
          <div
            className="h-1.5 w-full cursor-pointer rounded-full bg-white/30 transition-colors hover:bg-white/40"
            onClick={handleProgressClick}
            role="progressbar"
            aria-valuenow={duration > 0 ? (currentTime / duration) * 100 : 0}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%" }}
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={togglePlay}
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="size-5" /> : <Play className="size-5" fill="currentColor" />}
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
                aria-label={muted ? "Unmute" : "Mute"}
              >
                {muted || volume === 0 ? (
                  <VolumeX className="size-5" />
                ) : (
                  <Volume2 className="size-5" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1.5 w-20 cursor-pointer accent-primary"
              />
            </div>

            <span className="min-w-18 text-right text-xs text-white/90 tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="ml-auto flex size-9 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/20"
              aria-label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="size-5" /> : <Maximize className="size-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
