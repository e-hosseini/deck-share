import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { prisma } from "@/lib/prisma";
import { createReadStream } from "@/lib/storage";
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
  const { stream } = createReadStream(file.storageKey);
  const webStream = Readable.toWeb(stream as Readable);
  const headers = new Headers();
  headers.set("Content-Type", file.mimeType);
  headers.set("Content-Length", String(file.size));
  return new Response(webStream as ReadableStream, {
    headers,
  });
}
