import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uniqueStorageKey, writeFile } from "@/lib/storage";

const ALLOWED_MIMES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // xlsx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation", // pptx
  "application/vnd.ms-powerpoint",
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const directoryId = searchParams.get("directoryId");
  const files = await prisma.file.findMany({
    where: {
      uploadedById: session.user.id,
      directoryId: directoryId && directoryId.trim() ? directoryId : null,
    },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ files });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await req.formData();
  const directoryIdParam = formData.get("directoryId");
  const directoryId =
    directoryIdParam && String(directoryIdParam).trim() ? String(directoryIdParam) : null;

  const fileEntries = formData.getAll("files");
  if (!fileEntries.length) {
    return NextResponse.json(
      { error: "At least one file is required. Use form field 'files' with multiple files." },
      { status: 400 }
    );
  }

  const created: Array<{ id: string; name: string; mimeType: string; size: number }> = [];
  for (const entry of fileEntries) {
    if (!(entry instanceof Blob)) continue;
    const name = entry instanceof File ? entry.name : `file-${Date.now()}`;
    const mimeType =
      (entry instanceof File ? entry.type : null) || "application/octet-stream";
    if (!ALLOWED_MIMES.includes(mimeType)) {
      return NextResponse.json(
        { error: `File type not allowed: ${name} (${mimeType})` },
        { status: 400 }
      );
    }
    const buffer = Buffer.from(await entry.arrayBuffer());
    const size = buffer.length;
    const storageKey = uniqueStorageKey(directoryId, name);
    await writeFile(storageKey, buffer);
    const file = await prisma.file.create({
      data: {
        name,
        mimeType,
        size,
        storageKey,
        directoryId,
        uploadedById: session.user.id,
      },
    });
    created.push({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size,
    });
  }
  return NextResponse.json({ files: created });
}
