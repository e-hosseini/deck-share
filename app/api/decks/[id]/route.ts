import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, createdById: session.user.id },
    include: {
      items: {
        orderBy: { order: "asc" },
        include: {
          file: true,
          directory: true,
        },
      },
    },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  return NextResponse.json({ deck });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  const body = await req.json();
  const { name, description } = body as { name?: string; description?: string };
  const updated = await prisma.deck.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
    },
  });
  return NextResponse.json({ deck: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  await prisma.deck.update({
    where: { id },
    data: { isActive: false },
  });
  return NextResponse.json({ ok: true });
}
