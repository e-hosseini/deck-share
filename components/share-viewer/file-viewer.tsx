"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { isDocx, isXlsx, isPptx } from "@/lib/file-mime";
import { VideoJsPlayer } from "@/components/share-viewer/videojs-player";

const PdfViewer = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PdfViewer),
  { ssr: false, loading: () => <FileViewerLoading message="Loading PDF…" /> }
);

const PptxViewer = dynamic(
  () => import("@/components/pptx-viewer").then((m) => m.PptxViewer),
  { ssr: false, loading: () => <FileViewerLoading message="Loading presentation…" /> }
);

function FileViewerLoading({ message = "Loading…" }: { message?: string }) {
  return (
    <div className="flex h-full min-h-[200px] w-full items-center justify-center gap-2 bg-muted/30 p-4">
      <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
      <span className="text-sm text-muted-foreground">{message}</span>
    </div>
  );
}

function ImageWithLoading({ url, name }: { url: string; name: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative flex h-full w-full items-center justify-center">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-muted/30">
          <span className="size-6 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <span className="text-sm text-muted-foreground">Loading image…</span>
        </div>
      )}
      <img
        src={url}
        alt={name}
        className="max-h-full w-full max-w-full object-contain"
        onLoad={() => setLoaded(true)}
      />
    </div>
  );
}

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
      <div className="flex h-full min-h-0 items-center justify-center bg-muted/30 py-4">
        <ImageWithLoading url={url} name={name} />
      </div>
    );
  }

if (isVideo) {
      return (
        <div className="flex h-full min-h-0 flex-col items-center justify-center gap-2 bg-muted/30 pt-0.5">
          <div className="min-h-0 w-full max-w-4xl flex-1">
            <VideoJsPlayer url={url} mimeType={mimeType} onTrack={track} />
          </div>
          <p className="w-full max-w-4xl truncate px-1 text-xs text-muted-foreground" title={name}>
            {name}
          </p>
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
    if (html === null) return <FileViewerLoading message="Loading document…" />;
    return (
      <div
        className="p-6 prose prose-sm dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  if (isXlsxFile) {
    if (error) return <p className="p-4 text-destructive">{error}</p>;
    if (html === null) return <FileViewerLoading message="Loading spreadsheet…" />;
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
