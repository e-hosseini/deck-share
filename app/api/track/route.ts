import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashFingerprint } from "@/lib/fingerprint";

export const runtime = "nodejs";

function getClientInfo(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? null;
  const userAgent = req.headers.get("user-agent") ?? null;
  const referrer = req.headers.get("referer") ?? null;
  const country = req.headers.get("cf-ipcountry") ?? null;
  const region = req.headers.get("cf-region") ?? null;
  return { ip, userAgent, referrer, country, region };
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    slug,
    fingerprint,
    action,
    resourceType,
    resourceId,
    metadata,
  } = body as {
    slug?: string;
    fingerprint?: string;
    action?: string;
    resourceType?: string;
    resourceId?: string;
    metadata?: unknown;
  };
  if (!slug || !fingerprint || !action) {
    return NextResponse.json(
      { error: "slug, fingerprint, and action required" },
      { status: 400 }
    );
  }
  const share = await prisma.share.findUnique({
    where: { slug, isActive: true },
    include: { _count: { select: { visitors: true } } },
  });
  if (!share || new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Share not found or expired" }, { status: 404 });
  }
  const fingerprintHash = await hashFingerprint(fingerprint);
  const existingVisitor = await prisma.visitor.findFirst({
    where: {
      shareId: share.id,
      fingerprintHash,
    },
  });
  if (share.singleUse && share._count.visitors >= 1 && !existingVisitor) {
    return NextResponse.json({ singleUseExhausted: true }, { status: 403 });
  }
  const client = getClientInfo(req);
  let visitor = existingVisitor;
  if (!visitor) {
    visitor = await prisma.visitor.create({
      data: {
        shareId: share.id,
        fingerprintHash,
        ip: client.ip,
        userAgent: client.userAgent,
        referrer: client.referrer,
        country: client.country ?? undefined,
        region: client.region ?? undefined,
      },
    });
  } else {
    await prisma.visitor.update({
      where: { id: visitor.id },
      data: { lastSeenAt: new Date() },
    });
  }
  await prisma.visitorAction.create({
    data: {
      visitorId: visitor.id,
      shareId: share.id,
      action,
      resourceType: resourceType ?? null,
      resourceId: resourceId ?? null,
      metadata: metadata ?? undefined,
    },
  });
  return NextResponse.json({ ok: true });
}
