import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getShareWithAccess,
  isDirectoryAllowed,
} from "@/lib/share-access";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; directoryId: string }> }
) {
  const { slug, directoryId } = await params;
  const access = await getShareWithAccess(slug);
  if (!access) {
    return NextResponse.json({ error: "Share not found or expired" }, { status: 404 });
  }
  if (!isDirectoryAllowed(access, directoryId)) {
    return NextResponse.json(
      { error: "Directory not in this share" },
      { status: 403 }
    );
  }
  const [directory, childDirs, childFiles] = await Promise.all([
    prisma.directory.findUnique({
      where: { id: directoryId },
      select: { id: true, name: true },
    }),
    prisma.directory.findMany({
      where: { parentId: directoryId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.file.findMany({
      where: { directoryId },
      select: { id: true, name: true, mimeType: true },
      orderBy: { name: "asc" },
    }),
  ]);
  if (!directory) {
    return NextResponse.json({ error: "Directory not found" }, { status: 404 });
  }
  return NextResponse.json({
    directory: { id: directory.id, name: directory.name },
    directories: childDirs,
    files: childFiles,
  });
}
