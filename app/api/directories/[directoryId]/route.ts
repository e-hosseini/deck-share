import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ directoryId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { directoryId } = await params;
  const directory = await prisma.directory.findFirst({
    where: { id: directoryId, ownerId: session.user.id },
  });
  if (!directory) {
    return NextResponse.json({ error: "Directory not found" }, { status: 404 });
  }
  const body = await req.json();
  const { name } = body as { name?: string };
  if (name === undefined || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const updated = await prisma.directory.update({
    where: { id: directoryId },
    data: { name: name.trim() },
  });
  return NextResponse.json({ directory: updated });
}
