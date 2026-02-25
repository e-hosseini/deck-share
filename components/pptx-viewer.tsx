"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

type PptxViewerProps = {
  url: string;
  title?: string;
  withCredentials?: boolean;
};

export function PptxViewer({ url, title, withCredentials = false }: PptxViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<InstanceType<typeof import("pptxviewjs").PPTXViewer> | null>(null);
  const [slideCount, setSlideCount] = useState(0);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const init = async () => {
      try {
        const res = await fetch(url, {
          credentials: withCredentials ? "include" : "same-origin",
        });
        if (!res.ok) throw new Error("Failed to load presentation");
        const arrayBuffer = await res.arrayBuffer();
        if (cancelled) return;

        const { PPTXViewer } = await import("pptxviewjs");
        const viewer = new PPTXViewer();
        viewerRef.current = viewer;

        await viewer.loadFile(arrayBuffer);
        if (cancelled) return;

        const count = viewer.getSlideCount();
        setSlideCount(count);
        setCurrentSlide(0);

        const canvas = canvasRef.current;
        if (canvas) {
          viewer.setCanvas(canvas);
          await viewer.render(canvas, { slideIndex: 0 });
        }
        if (cancelled) return;
        setLoading(false);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load presentation");
          setLoading(false);
        }
      }
    };

    init();
    return () => {
      cancelled = true;
      viewerRef.current?.destroy();
      viewerRef.current = null;
    };
  }, [url, withCredentials]);

  const goToSlide = async (index: number) => {
    const viewer = viewerRef.current;
    const canvas = canvasRef.current;
    if (!viewer || !canvas || index < 0 || index >= slideCount) return;
    setCurrentSlide(index);
    await viewer.goToSlide(index, canvas);
  };

  if (error) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center p-4">
        <p className="text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-muted/30">
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b bg-background/80 px-2 py-1.5">
        <button
          type="button"
          disabled={loading || currentSlide <= 0}
          onClick={() => goToSlide(currentSlide - 1)}
          className="rounded border px-2 py-1 disabled:opacity-50 hover:bg-muted"
          aria-label="Previous slide"
        >
          <ChevronLeft className="size-5" />
        </button>
        <span className="text-sm text-muted-foreground">
          {loading
            ? "Loading…"
            : `Slide ${currentSlide + 1} of ${slideCount}`}
        </span>
        <button
          type="button"
          disabled={loading || currentSlide >= slideCount - 1}
          onClick={() => goToSlide(currentSlide + 1)}
          className="rounded border px-2 py-1 disabled:opacity-50 hover:bg-muted"
          aria-label="Next slide"
        >
          <ChevronRight className="size-5" />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4 flex items-center justify-center">
        {title && <span className="sr-only">{title}</span>}
        <canvas
          ref={canvasRef}
          className="max-w-full border border-border bg-white shadow-sm"
          style={{ maxHeight: "100%" }}
        />
        {loading && (
          <p className="absolute text-muted-foreground">Loading presentation…</p>
        )}
      </div>
    </div>
  );
}
