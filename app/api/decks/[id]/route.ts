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
  let body: { name?: string; description?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { name, description } = body;
  if (name !== undefined && typeof name !== "string") {
    return NextResponse.json({ error: "name must be a string" }, { status: 400 });
  }
  if (description !== undefined && description !== null && typeof description !== "string") {
    return NextResponse.json({ error: "description must be a string or null" }, { status: 400 });
  }
  const trimmedName = name !== undefined ? name.trim() : undefined;
  if (trimmedName !== undefined && trimmedName.length === 0) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }
  const updated = await prisma.deck.update({
    where: { id },
    data: {
      ...(trimmedName !== undefined && { name: trimmedName }),
      ...(description !== undefined && { description: description?.trim() ?? null }),
    },
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
