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
    select: { id: true },
  });
  const itemIds = items.map((i) => i.id);
  const history = await prisma.deckItemHistory.findMany({
    where: { deckItemId: { in: itemIds } },
    orderBy: { createdAt: "desc" },
    include: {
      byUser: { select: { email: true, name: true } },
      deckItem: {
        include: { file: true, directory: true },
      },
    },
  });
  return NextResponse.json({ history });
}
