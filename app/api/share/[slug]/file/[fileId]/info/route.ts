import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getShareWithAccess, isFileAllowed } from "@/lib/share-access";

export async function GET(
  _req: Request,
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
  return NextResponse.json({ name: file.name, mimeType: file.mimeType });
}
