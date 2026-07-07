import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  editorUploadMetaKey,
  editorUploadStorageKey,
  isAllowedEditorMime,
  maxEditorUploadBytes,
  sanitizeEditorFilename,
  type EditorUploadMeta,
} from "@/lib/editor-upload";
import { writeFile } from "@/lib/storage";

function randomId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  const mimeType = file.type || "application/octet-stream";
  if (!isAllowedEditorMime(mimeType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }

  const maxBytes = maxEditorUploadBytes(mimeType);
  if (file.size > maxBytes) {
    return NextResponse.json(
      { error: `File too large (max ${Math.floor(maxBytes / (1024 * 1024))}MB)` },
      { status: 400 }
    );
  }

  const id = randomId();
  const name = sanitizeEditorFilename(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  const meta: EditorUploadMeta = {
    id,
    name,
    mimeType,
    size: file.size,
    userId: session.user.id,
    createdAt: new Date().toISOString(),
  };

  await writeFile(editorUploadStorageKey(id), buffer);
  await writeFile(editorUploadMetaKey(id), Buffer.from(JSON.stringify(meta)));

  const url = `/api/editor-upload/${id}`;
  return NextResponse.json({
    key: id,
    name,
    size: file.size,
    type: mimeType,
    url,
    appUrl: url,
  });
}
