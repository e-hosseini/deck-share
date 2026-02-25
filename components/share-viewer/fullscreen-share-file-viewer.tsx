"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { FileViewer } from "@/components/share-viewer/file-viewer";
import { Button } from "@/components/ui/button";
import { XIcon } from "lucide-react";

type FullscreenShareFileViewerProps = {
  slug: string;
  fileId: string;
  name: string;
  mimeType: string;
  onClose: () => void;
  onTrackOpen: () => void;
};

export function FullscreenShareFileViewer({
  slug,
  fileId,
  name,
  mimeType,
  onClose,
  onTrackOpen,
}: FullscreenShareFileViewerProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  const content = (
    <div style={{ position: "fixed", inset: 0, zIndex: 100 }}>
      <div
        className="bg-black/60"
        style={{ position: "absolute", inset: 0, width: "100vw", height: "100vh" }}
        aria-hidden
        onClick={onClose}
      />
      <div
        className="flex flex-col bg-background"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: "100vw",
          height: "100vh",
        }}
        role="dialog"
        aria-modal="true"
        aria-label={`Viewing ${name}`}
      >
        <div className="flex shrink-0 items-center justify-end border-b px-4 py-2">
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
            <XIcon className="size-5" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-auto">
          <FileViewer
            slug={slug}
            fileId={fileId}
            name={name}
            mimeType={mimeType}
            onTrackOpen={onTrackOpen}
          />
        </div>
      </div>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(content, document.body);
}
