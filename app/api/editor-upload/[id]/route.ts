import { NextRequest } from "next/server";
import { Readable } from "stream";
import {
  editorUploadMetaKey,
  editorUploadStorageKey,
  type EditorUploadMeta,
} from "@/lib/editor-upload";
import { createReadStream, exists, readFile } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!/^[a-f0-9]{32}$/.test(id)) {
    return new Response("Not found", { status: 404 });
  }

  const storageKey = editorUploadStorageKey(id);
  const metaKey = editorUploadMetaKey(id);
  if (!(await exists(storageKey)) || !(await exists(metaKey))) {
    return new Response("Not found", { status: 404 });
  }

  const metaRaw = await readFile(metaKey);
  const meta = JSON.parse(metaRaw.toString()) as EditorUploadMeta;
  const { stream } = createReadStream(storageKey);
  const webStream = Readable.toWeb(stream as Readable);

  const headers = new Headers();
  headers.set("Content-Type", meta.mimeType);
  headers.set("Content-Length", String(meta.size));
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set(
    "Content-Disposition",
    `inline; filename="${meta.name.replace(/"/g, "")}"`
  );

  return new Response(webStream as ReadableStream, { headers });
}
