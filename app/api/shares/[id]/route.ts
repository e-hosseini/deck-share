import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
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
  const share = await prisma.share.findFirst({
    where: { id, createdById: session.user.id },
    include: {
      deck: { select: { name: true } },
      visitors: {
        orderBy: { firstSeenAt: "desc" },
      },
    },
  });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  const agg = await prisma.visitor.aggregate({
    where: { shareId: id },
    _min: { firstSeenAt: true },
    _max: { lastSeenAt: true },
    _count: true,
  });
  const actions = await prisma.visitorAction.findMany({
    where: { shareId: id },
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      visitor: {
        select: {
          id: true,
          fingerprintHash: true,
          firstSeenAt: true,
          lastSeenAt: true,
          ip: true,
          userAgent: true,
          country: true,
          region: true,
          referrer: true,
        },
      },
    },
  });
  return NextResponse.json({
    share: {
      id: share.id,
      slug: share.slug,
      title: share.deck.name,
      audienceName: share.audienceName,
      expiresAt: share.expiresAt,
      targetLink: share.targetLink,
      contactEmail: share.contactEmail,
      hasPassword: Boolean(share.passwordHash),
      singleUse: share.singleUse,
      isActive: share.isActive,
      createdAt: share.createdAt,
      deck: share.deck,
      metaTitle: share.metaTitle,
      metaDescription: share.metaDescription,
      firstOpenedAt: agg._min.firstSeenAt,
      lastOpenedAt: agg._max.lastSeenAt,
      uniqueVisitors: agg._count,
    },
    visitors: share.visitors,
    actions,
  });
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
  const share = await prisma.share.findFirst({
    where: { id, createdById: session.user.id },
  });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  const body = await req.json().catch(() => ({}));
  const data: {
    audienceName?: string;
    expiresAt?: Date;
    targetLink?: string | null;
    contactEmail?: string | null;
    passwordHash?: string | null;
    singleUse?: boolean;
    isActive?: boolean;
    metaTitle?: string | null;
    metaDescription?: string | null;
  } = {};

  if (body.audienceName !== undefined) {
    const v = typeof body.audienceName === "string" ? body.audienceName.trim() : "";
    if (!v) {
      return NextResponse.json({ error: "audienceName is required" }, { status: 400 });
    }
    data.audienceName = v;
  }
  if (body.expiresAt !== undefined) {
    const d = typeof body.expiresAt === "string" ? new Date(body.expiresAt) : null;
    if (!d || Number.isNaN(d.getTime())) {
      return NextResponse.json({ error: "Invalid expiresAt" }, { status: 400 });
    }
    data.expiresAt = d;
  }
  if (body.targetLink !== undefined) {
    data.targetLink = typeof body.targetLink === "string" ? body.targetLink.trim() || null : null;
  }
  if (body.contactEmail !== undefined) {
    data.contactEmail = typeof body.contactEmail === "string" ? body.contactEmail.trim() || null : null;
  }
  if (body.password !== undefined) {
    const p = typeof body.password === "string" ? body.password : "";
    data.passwordHash = p.trim() ? await hash(p.trim(), 10) : null;
  }
  if (body.singleUse !== undefined) {
    data.singleUse = Boolean(body.singleUse);
  }
  if (body.isActive !== undefined) {
    data.isActive = Boolean(body.isActive);
  }
  if (body.metaTitle !== undefined) {
    data.metaTitle = typeof body.metaTitle === "string" ? body.metaTitle.trim() || null : null;
  }
  if (body.metaDescription !== undefined) {
    data.metaDescription = typeof body.metaDescription === "string" ? body.metaDescription.trim() || null : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const updated = await prisma.share.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    share: {
      id: updated.id,
      slug: updated.slug,
      audienceName: updated.audienceName,
      expiresAt: updated.expiresAt,
      targetLink: updated.targetLink,
      contactEmail: updated.contactEmail,
      hasPassword: Boolean(updated.passwordHash),
      singleUse: updated.singleUse,
      isActive: updated.isActive,
      metaTitle: updated.metaTitle,
      metaDescription: updated.metaDescription,
    },
  });
}
