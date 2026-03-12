import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import fs from "fs";
import { prisma } from "@/lib/prisma";
import { createReadStream, resolvePath } from "@/lib/storage";
import { getShareWithAccess, isFileAllowed } from "@/lib/share-access";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string; fileId: string }> }
) {
  const { slug, fileId } = await params;
  const access = await getShareWithAccess(slug);
  if (!access) {
    return NextResponse.json({ error: "Not found or expired" }, { status: 404 });
  }
  const file = await prisma.file.findUnique({ where: { id: fileId } });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  if (!isFileAllowed(access, file)) {
    return NextResponse.json({ error: "File not in this share" }, { status: 403 });
  }

  const totalSize = file.size;
  const rangeHeader = req.headers.get("range");

  if (rangeHeader?.startsWith("bytes=")) {
    const match = rangeHeader.match(/bytes=(\d*)-(\d*)/);
    if (match) {
      const start = match[1] === "" ? 0 : parseInt(match[1], 10);
      const endRaw = match[2] === "" ? totalSize - 1 : parseInt(match[2], 10);
      const end = Math.min(endRaw, totalSize - 1);
      if (Number.isFinite(start) && Number.isFinite(end) && start <= end && start < totalSize) {
        const absPath = resolvePath(file.storageKey);
        const stream = fs.createReadStream(absPath, { start, end });
        const webStream = Readable.toWeb(stream as Readable);
        const contentLength = end - start + 1;
        const headers = new Headers();
        headers.set("Content-Type", file.mimeType);
        headers.set("Content-Length", String(contentLength));
        headers.set("Content-Range", `bytes ${start}-${end}/${totalSize}`);
        headers.set("Accept-Ranges", "bytes");
        return new Response(webStream as ReadableStream, {
          status: 206,
          headers,
        });
      }
    }
  }

  const { stream } = createReadStream(file.storageKey);
  const webStream = Readable.toWeb(stream as Readable);
  const headers = new Headers();
  headers.set("Content-Type", file.mimeType);
  headers.set("Content-Length", String(totalSize));
  headers.set("Accept-Ranges", "bytes");
  return new Response(webStream as ReadableStream, {
    headers,
  });
}
