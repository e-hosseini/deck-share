"use client";

import { useState, useEffect } from "react";
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

type AdminFileViewerProps = {
  fileId: string;
  name: string;
  mimeType: string;
};

export function AdminFileViewer({ fileId, name, mimeType }: AdminFileViewerProps) {
  const [html, setHtml] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const url = `/api/files/${fileId}/view`;

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
        <video controls className="h-full w-full" src={url}>
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  if (isPdf) {
    return (
      <div className="h-full min-h-0 w-full">
        <PdfViewer url={url} title={name} />
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
        <PptxViewer url={url} title={name} />
      </div>
    );
  }

  return (
    <p className="p-4 text-muted-foreground">
      Preview not available. Use the download link if needed.
    </p>
  );
}
