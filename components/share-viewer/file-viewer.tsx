"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { isDocx, isXlsx, isPptx } from "@/lib/file-mime";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false }
);

const PptxViewer = dynamic(
  () => import("@/components/pptx-viewer").then((m) => m.PptxViewer),
  { ssr: false }
);

export type TrackPayload = {
  action: string;
  resourceType?: string;
  resourceId?: string;
  metadata?: Record<string, unknown>;
};

type FileViewerProps = {
  slug: string;
  fileId: string;
  name: string;
  mimeType: string;
  onTrackOpen: () => void;
  onTrack?: (action: string, resourceType?: string, resourceId?: string, metadata?: Record<string, unknown>) => void;
};

export function FileViewer({ slug, fileId, name, mimeType, onTrackOpen, onTrack }: FileViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/share/${slug}/file/${fileId}`;
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressTrackedRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    onTrackOpen();
  }, [slug, fileId, onTrackOpen]);

  const track = useCallback(
    (action: string, metadata?: Record<string, unknown>) => {
      onTrack?.(action, "file", fileId, metadata);
    },
    [onTrack, fileId]
  );

  const isPdf = mimeType === "application/pdf";
  const isImage = mimeType.startsWith("image/");
  const isVideo = mimeType.startsWith("video/");
  const isDocxFile = isDocx(mimeType);
  const isXlsxFile = isXlsx(mimeType);
  const isPptxFile = isPptx(mimeType);

  useEffect(() => {
    if (!isDocxFile) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then(async (buffer) => {
        if (cancelled) return;
        const mammoth = (await import("mammoth")).default;
        const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
        setHtml(result.value);
      })
      .catch(() => setError("Failed to load document"));
    return () => {
      cancelled = true;
    };
  }, [url, isDocxFile]);

  useEffect(() => {
    if (!isXlsxFile) return;
    let cancelled = false;
    fetch(url)
      .then((r) => r.arrayBuffer())
      .then(async (buffer) => {
        if (cancelled) return;
        const XLSX = await import("xlsx");
        const wb = XLSX.read(buffer, { type: "array" });
        const firstSheetName = wb.SheetNames[0];
        if (!firstSheetName) {
          setError("No sheets in workbook");
          return;
        }
        const ws = wb.Sheets[firstSheetName];
        const htmlOutput = XLSX.utils.sheet_to_html(ws, { id: "xlsx-table" });
        setHtml(htmlOutput);
      })
      .catch(() => setError("Failed to load spreadsheet"));
    return () => {
      cancelled = true;
    };
  }, [url, isXlsxFile]);

  if (isImage) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center bg-muted/30 p-4">
        <img src={url} alt={name} className="max-h-full w-full max-w-full object-contain" />
      </div>
    );
  }

  if (isVideo) {
    return (
      <div className="flex h-full min-h-0 bg-muted/30 p-4">
        <video
          ref={videoRef}
          controls
          className="h-full w-full"
          src={url}
          onPlay={() => {
            progressTrackedRef.current.clear();
            track("video_play");
          }}
          onPause={() => {
            const v = videoRef.current;
            track("video_pause", v ? { currentTime: v.currentTime, duration: v.duration } : undefined);
          }}
          onEnded={() => {
            const v = videoRef.current;
            track("video_ended", v ? { duration: v.duration } : undefined);
          }}
          onTimeUpdate={() => {
            const v = videoRef.current;
            if (!v || v.duration <= 0 || !onTrack) return;
            const percent = Math.floor((v.currentTime / v.duration) * 100);
            const milestones = [25, 50, 75, 100];
            const hit = milestones.find((m) => percent >= m && !progressTrackedRef.current.has(m));
            if (hit !== undefined) {
              progressTrackedRef.current.add(hit);
              track("video_progress", {
                percent: hit,
                currentTime: v.currentTime,
                duration: v.duration,
              });
            }
          }}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="h-full min-h-0 w-full">
        <PdfViewer
          url={url}
          title={name}
          withCredentials
          onPageChange={(pageNumber, numPages) =>
            track("pdf_page_view", { pageNumber, numPages })
          }
        />
      </div>
    );
  }

  if (isDocxFile) {
    if (error) return <p className="p-4 text-destructive">{error}</p>;
    if (html === null) return <p className="p-4 text-muted-foreground">Loading…</p>;
    return (
      <div
        className="p-6 prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (isXlsxFile) {
    if (error) return <p className="p-4 text-destructive">{error}</p>;
    if (html === null) return <p className="p-4 text-muted-foreground">Loading…</p>;
    return (
      <div className="overflow-auto p-6">
        <div
          className="prose prose-sm dark:prose-invert max-w-none [&_table]:border [&_table]:border-border [&_th]:border [&_th]:border-border [&_td]:border [&_td]:border-border"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    );
  }

  if (isPptxFile) {
    return (
      <div className="h-full min-h-0 w-full">
        <PptxViewer
          url={url}
          title={name}
          withCredentials
          onSlideChange={(slideIndex, slideCount) =>
            track("pptx_slide_view", { slideIndex, slideCount })
          }
        />
      </div>
    );
  }

  return (
    <p className="p-4 text-muted-foreground">
      Preview not available. Use Download to get the file.
    </p>
  );
}
