import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: shareId } = await params;
  const share = await prisma.share.findFirst({
    where: { id: shareId, createdById: session.user.id },
    select: { id: true },
  });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  const sinceParam = req.nextUrl.searchParams.get("since");
  const since = sinceParam ? new Date(sinceParam) : null;

  if (since && !Number.isNaN(since.getTime())) {
    const events = await prisma.visitorAction.findMany({
      where: { shareId, createdAt: { gt: since } },
      orderBy: { createdAt: "asc" },
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
    return NextResponse.json({ events });
  }

  const [visitors, events] = await Promise.all([
    prisma.visitor.findMany({
      where: { shareId },
      orderBy: { firstSeenAt: "desc" },
    }),
    prisma.visitorAction.findMany({
      where: { shareId },
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
    }),
  ]);

  return NextResponse.json({ visitors, events });
}
