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
  const { id: deckId } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, createdById: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  const items = await prisma.deckItem.findMany({
    where: { deckId },
    orderBy: { order: "asc" },
    include: { file: true, directory: true },
  });
  return NextResponse.json({ items });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: deckId } = await params;
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, createdById: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  const body = await req.json();
  const { fileId, directoryId } = body as { fileId?: string; directoryId?: string };
  if (!fileId && !directoryId) {
    return NextResponse.json(
      { error: "Provide fileId or directoryId" },
      { status: 400 }
    );
  }
  const maxOrder = await prisma.deckItem
    .aggregate({
      where: { deckId },
      _max: { order: true },
    })
    .then((r) => r._max.order ?? -1);
  const item = await prisma.deckItem.create({
    data: {
      deckId,
      fileId: fileId || null,
      directoryId: directoryId || null,
      order: maxOrder + 1,
      addedById: session.user.id,
    },
    include: { file: true, directory: true },
  });
  await prisma.deckItemHistory.create({
    data: {
      deckItemId: item.id,
      action: "added",
      payload: { fileId: fileId ?? null, directoryId: directoryId ?? null },
      byUserId: session.user.id,
    },
  });
  return NextResponse.json({ item });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: deckId } = await params;
  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get("itemId");
  if (!itemId) {
    return NextResponse.json({ error: "itemId required" }, { status: 400 });
  }
  const deck = await prisma.deck.findFirst({
    where: { id: deckId, createdById: session.user.id },
  });
  if (!deck) {
    return NextResponse.json({ error: "Deck not found" }, { status: 404 });
  }
  const item = await prisma.deckItem.findFirst({
    where: { id: itemId, deckId },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  await prisma.deckItemHistory.create({
    data: {
      deckItemId: item.id,
      action: "removed",
      payload: { fileId: item.fileId, directoryId: item.directoryId },
      byUserId: session.user.id,
    },
  });
  await prisma.deckItem.delete({ where: { id: itemId } });
  return NextResponse.json({ ok: true });
}
