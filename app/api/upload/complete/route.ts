import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueStorageKey, exists } from "@/lib/storage";
import fs from "fs/promises";
import path from "path";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? "./uploads";

function getUploadRoot(): string {
  return path.isAbsolute(UPLOAD_ROOT) ? UPLOAD_ROOT : path.join(process.cwd(), UPLOAD_ROOT);
}

const ALLOWED_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // docx
  "application/msword", // doc
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-powerpoint",
];

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { uploadId, directoryId, name, mimeType } = body as {
    uploadId?: string;
    directoryId?: string | null;
    name?: string;
    mimeType?: string;
  };
  if (!uploadId || !name || !mimeType) {
    return NextResponse.json(
      { error: "Missing uploadId, name, or mimeType" },
      { status: 400 }
    );
  }
  if (!ALLOWED_MIMES.includes(mimeType)) {
    return NextResponse.json({ error: "File type not allowed" }, { status: 400 });
  }
  const root = getUploadRoot();
  const tempKey = path.join("temp", uploadId);
  const tempPath = path.resolve(root, tempKey);
  if (!tempPath.startsWith(path.resolve(root)) || !(await exists(tempKey))) {
    return NextResponse.json({ error: "Upload not found or expired" }, { status: 400 });
  }
  const stat = await fs.stat(tempPath);
  const size = stat.size;
  const dirId = directoryId && String(directoryId).trim() ? String(directoryId) : null;
  const storageKey = uniqueStorageKey(dirId, name);
  const finalPath = path.resolve(root, storageKey);
  await fs.mkdir(path.dirname(finalPath), { recursive: true });
  await fs.rename(tempPath, finalPath);
  const file = await prisma.file.create({
    data: {
      name,
      mimeType,
      size,
      storageKey,
      directoryId: dirId,
      uploadedById: session.user.id,
    },
  });
  return NextResponse.json({ file: { id: file.id, name: file.name, mimeType: file.mimeType, size: file.size } });
}
