import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const deckId = searchParams.get("deckId") ?? undefined;
  const shares = await prisma.share.findMany({
    where: {
      createdById: session.user.id,
      isActive: true,
      ...(deckId ? { deckId } : {}),
    },
    orderBy: { createdAt: "desc" },
    include: {
      deck: { select: { id: true, name: true } },
      _count: { select: { visitors: true } },
    },
  });
  const withAgg = await Promise.all(
    shares.map(async (s) => {
      const agg = await prisma.visitor.aggregate({
        where: { shareId: s.id },
        _min: { firstSeenAt: true },
        _max: { lastSeenAt: true },
      });
      return {
        ...s,
        firstOpenedAt: agg._min.firstSeenAt,
        lastOpenedAt: agg._max.lastSeenAt,
      };
    })
  );
  return NextResponse.json({ shares: withAgg });
}
