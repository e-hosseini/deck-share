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
      title: share.title,
      audienceName: share.audienceName,
      expiresAt: share.expiresAt,
      deck: share.deck,
      firstOpenedAt: agg._min.firstSeenAt,
      lastOpenedAt: agg._max.lastSeenAt,
      uniqueVisitors: agg._count,
    },
    visitors: share.visitors,
    actions,
  });
}
