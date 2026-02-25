import { NextRequest } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream } from "@/lib/storage";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }
  const { fileId } = await params;
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedById: session.user.id },
  });
  if (!file) {
    return new Response("File not found", { status: 404 });
  }
  const { stream } = createReadStream(file.storageKey);
  const webStream = Readable.toWeb(stream as Readable);
  const headers = new Headers();
  headers.set("Content-Type", file.mimeType);
  headers.set("Content-Length", String(file.size));
  return new Response(webStream as ReadableStream, { headers });
}
