import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const decks = await prisma.deck.findMany({
    where: { createdById: session.user.id, isActive: true },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { items: true, shares: true } },
    },
  });
  return NextResponse.json({ decks });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { name, description } = body as { name?: string; description?: string };
  if (!name || typeof name !== "string" || !name.trim()) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }
  const deck = await prisma.deck.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      createdById: session.user.id,
    },
  });
  return NextResponse.json({ deck });
}
