"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { LayoutList, FileText } from "lucide-react";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

if (typeof window !== "undefined") {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

type PdfViewerProps = {
  url: string;
  title?: string;
  withCredentials?: boolean;
};

type ViewMode = "single" | "all";

export function PdfViewer({ url, title, withCredentials = false }: PdfViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("single");
  const [containerWidth, setContainerWidth] = useState<number>(400);
  const containerRef = useRef<HTMLDivElement>(null);

  const documentOptions = useMemo(
    () => (withCredentials ? { withCredentials: true as const } : undefined),
    [withCredentials]
  );

  const pageWidth = Math.min(containerWidth, 800);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (typeof w === "number" && w > 0) setContainerWidth(w);
    });
    ro.observe(el);
    setContainerWidth(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="flex h-full min-h-0 w-full flex-col bg-muted/30" ref={containerRef}>
      <div className="flex shrink-0 flex-wrap items-center justify-center gap-2 border-b bg-background/80 px-2 py-1.5">
        {viewMode === "single" ? (
          <>
            <button
              type="button"
              disabled={numPages === null || pageNumber <= 1}
              onClick={() => setPageNumber((p) => Math.max(1, p - 1))}
              className="rounded border px-2 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Previous
            </button>
            <span className="text-sm text-muted-foreground">
              {numPages !== null ? `Page ${pageNumber} of ${numPages}` : "Loading…"}
            </span>
            <button
              type="button"
              disabled={numPages === null || pageNumber >= numPages}
              onClick={() => setPageNumber((p) => Math.min(numPages ?? 1, p + 1))}
              className="rounded border px-2 py-1 text-sm disabled:opacity-50 hover:bg-muted"
            >
              Next
            </button>
          </>
        ) : (
          <span className="text-sm text-muted-foreground">
            {numPages !== null ? `All ${numPages} pages` : "Loading…"}
          </span>
        )}
        <div className="ml-2 flex rounded border border-border">
          <button
            type="button"
            onClick={() => setViewMode("single")}
            title="Single page"
            className={`flex items-center gap-1 px-2 py-1 text-sm ${viewMode === "single" ? "bg-muted font-medium" : "hover:bg-muted"}`}
          >
            <FileText className="size-4" />
            Single
          </button>
          <button
            type="button"
            onClick={() => setViewMode("all")}
            title="All pages"
            className={`flex items-center gap-1 border-l border-border px-2 py-1 text-sm ${viewMode === "all" ? "bg-muted font-medium" : "hover:bg-muted"}`}
          >
            <LayoutList className="size-4" />
            All
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-auto p-4">
        <Document
          file={url}
          options={documentOptions}
          loading={<p className="text-muted-foreground">Loading PDF…</p>}
          error={<p className="text-destructive">Failed to load PDF.</p>}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          className={viewMode === "all" ? "flex flex-col items-center" : "flex justify-center"}
        >
          {viewMode === "single" ? (
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              loading={<p className="text-muted-foreground">Loading page…</p>}
            />
          ) : (
            numPages !== null &&
            Array.from({ length: numPages }, (_, i) => i + 1).map((n) => (
              <div key={n} className="mb-4 last:mb-0">
                <Page
                  pageNumber={n}
                  width={pageWidth}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                  loading={<p className="text-muted-foreground">Loading page…</p>}
                />
              </div>
            ))
          )}
        </Document>
      </div>
    </div>
  );
}
