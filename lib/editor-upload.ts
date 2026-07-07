import path from "path";

export const EDITOR_UPLOAD_META_SUFFIX = ".json";

export const EDITOR_ALLOWED_MIMES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "audio/mpeg",
  "audio/wav",
  "audio/ogg",
  "audio/webm",
  "audio/mp4",
  "audio/aac",
  "application/pdf",
  "text/plain",
] as const;

const MAX_BYTES_BY_PREFIX: [prefix: string, maxBytes: number][] = [
  ["video/", 50 * 1024 * 1024],
  ["audio/", 16 * 1024 * 1024],
  ["image/", 10 * 1024 * 1024],
];

const DEFAULT_MAX_BYTES = 16 * 1024 * 1024;

export type EditorUploadMeta = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  userId: string;
  createdAt: string;
};

export function editorUploadStorageKey(id: string): string {
  return path.join("editor", id);
}

export function editorUploadMetaKey(id: string): string {
  return `${editorUploadStorageKey(id)}${EDITOR_UPLOAD_META_SUFFIX}`;
}

export function isAllowedEditorMime(mimeType: string): boolean {
  return (EDITOR_ALLOWED_MIMES as readonly string[]).includes(mimeType);
}

export function maxEditorUploadBytes(mimeType: string): number {
  for (const [prefix, maxBytes] of MAX_BYTES_BY_PREFIX) {
    if (mimeType.startsWith(prefix)) return maxBytes;
  }
  return DEFAULT_MAX_BYTES;
}

export function sanitizeEditorFilename(name: string): string {
  const base = path.basename(name).replace(/[^\w.\-()+\s]/g, "_").trim();
  return base || "file";
}
