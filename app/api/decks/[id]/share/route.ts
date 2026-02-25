import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { generateUniqueSlug } from "@/lib/slug";

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
  const {
    title,
    descriptionRichText,
    audienceName,
    expiresAt,
    targetLink,
    contactEmail,
    password,
    singleUse,
  } = body as {
    title?: string;
    descriptionRichText?: string;
    audienceName?: string;
    expiresAt?: string;
    targetLink?: string;
    contactEmail?: string;
    password?: string;
    singleUse?: boolean;
  };
  if (!title?.trim() || !audienceName?.trim() || !expiresAt) {
    return NextResponse.json(
      { error: "Title, audience name, and expiry date are required" },
      { status: 400 }
    );
  }
  const slug = await generateUniqueSlug(async (s) => {
    const existing = await prisma.share.findUnique({ where: { slug: s } });
    return !!existing;
  });
  const passwordHash = password?.trim()
    ? await hash(password.trim(), 10)
    : null;
  const share = await prisma.share.create({
    data: {
      deckId,
      slug,
      title: title.trim(),
      descriptionRichText: descriptionRichText?.trim() || null,
      audienceName: audienceName.trim(),
      expiresAt: new Date(expiresAt),
      targetLink: targetLink?.trim() || null,
      contactEmail: contactEmail?.trim() || null,
      passwordHash,
      singleUse: !!singleUse,
      createdById: session.user.id,
    },
  });
  return NextResponse.json({
    share: {
      id: share.id,
      slug: share.slug,
      title: share.title,
      expiresAt: share.expiresAt,
    },
  });
}
