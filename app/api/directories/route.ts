import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const parentId = searchParams.get("parentId");
  const tree = searchParams.get("tree") === "true";
  if (tree) {
    const directories = await prisma.directory.findMany({
      where: { ownerId: session.user.id },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ directories });
  }
  const directories = await prisma.directory.findMany({
    where: {
      ownerId: session.user.id,
      parentId: parentId || null,
    },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ directories });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, parentId } = body as { name?: string; parentId?: string | null };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const directory = await prisma.directory.create({
    data: {
      name: name.trim(),
      parentId: parentId && String(parentId).trim() ? parentId : null,
      ownerId: session.user.id,
    },
  });
  return NextResponse.json({ directory });
}
