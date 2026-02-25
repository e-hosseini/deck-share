// MIME types for Google Docs–style office files (docs, sheets, slides) and equivalents

export const MIME_DOCX =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export const MIME_XLSX =
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
export const MIME_XLS = "application/vnd.ms-excel";
export const MIME_PPTX =
  "application/vnd.openxmlformats-officedocument.presentationml.presentation";
export const MIME_PPT = "application/vnd.ms-powerpoint";

export const MIME_GOOGLE_DOC = "application/vnd.google-apps.document";
export const MIME_GOOGLE_SHEET = "application/vnd.google-apps.spreadsheet";
export const MIME_GOOGLE_SLIDES = "application/vnd.google-apps.presentation";

export function isDocx(mimeType: string): boolean {
  return (
    mimeType === MIME_DOCX || mimeType === "application/msword"
  );
}

export function isXlsx(mimeType: string): boolean {
  return mimeType === MIME_XLSX || mimeType === MIME_XLS;
}

export function isPptx(mimeType: string): boolean {
  return mimeType === MIME_PPTX || mimeType === MIME_PPT;
}

export function isGoogleDoc(mimeType: string): boolean {
  return mimeType === MIME_GOOGLE_DOC;
}

export function isGoogleSheet(mimeType: string): boolean {
  return mimeType === MIME_GOOGLE_SHEET;
}

export function isGoogleSlides(mimeType: string): boolean {
  return mimeType === MIME_GOOGLE_SLIDES;
}

/** Build Google Docs/Sheets/Slides embed URL from a file ID (for native Google files). */
export function googleEmbedUrl(
  type: "document" | "spreadsheet" | "presentation",
  fileId: string
): string {
  const base =
    type === "document"
      ? "https://docs.google.com/document"
      : type === "spreadsheet"
        ? "https://docs.google.com/spreadsheets"
        : "https://docs.google.com/presentation";
  return `${base}/d/${fileId}/preview`;
}
