"use client";

import {
  FileIcon,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  Presentation,
  type LucideIcon,
} from "lucide-react";
import { isDocx, isXlsx, isPptx } from "@/lib/file-mime";

type FileTypeIconProps = {
  mimeType: string;
  /** Optional file name for extension-based fallback when mimeType is generic */
  name?: string;
  className?: string;
};

function getIconForMime(mimeType: string, name?: string): LucideIcon {
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.startsWith("image/")) return FileImage;
  if (mimeType.startsWith("video/")) return FileVideo;
  if (mimeType.startsWith("audio/")) return FileVideo;
  if (isDocx(mimeType)) return FileText;
  if (isXlsx(mimeType)) return FileSpreadsheet;
  if (isPptx(mimeType)) return Presentation;
  // Extension fallback for generic mime
  if (name) {
    const ext = name.split(".").pop()?.toLowerCase();
    if (["doc", "docx"].includes(ext ?? "")) return FileText;
    if (["xls", "xlsx", "csv"].includes(ext ?? "")) return FileSpreadsheet;
    if (["ppt", "pptx"].includes(ext ?? "")) return Presentation;
    if (["pdf"].includes(ext ?? "")) return FileText;
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext ?? "")) return FileImage;
    if (["mp4", "webm", "mov", "avi"].includes(ext ?? "")) return FileVideo;
  }
  return FileIcon;
}

export function FileTypeIcon({ mimeType, name, className }: FileTypeIconProps) {
  const Icon = getIconForMime(mimeType, name);
  return <Icon className={className} aria-hidden />;
}
