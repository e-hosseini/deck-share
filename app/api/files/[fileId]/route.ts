import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { fileId } = await params;
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedById: session.user.id },
    select: { id: true, name: true, mimeType: true, directoryId: true },
  });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  return NextResponse.json({
    file: {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      directoryId: file.directoryId,
    },
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { fileId } = await params;
  const file = await prisma.file.findFirst({
    where: { id: fileId, uploadedById: session.user.id },
  });
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
  const body = await req.json();
  const { name } = body as { name?: string };
  if (name === undefined || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const updated = await prisma.file.update({
    where: { id: fileId },
    data: { name: name.trim() },
  });
  return NextResponse.json({ file: updated });
}
