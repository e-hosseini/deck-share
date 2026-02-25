import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; visitorId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id: shareId, visitorId } = await params;
  const share = await prisma.share.findFirst({
    where: { id: shareId, createdById: session.user.id },
    select: { id: true, slug: true, title: true, deck: { select: { name: true } } },
  });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  const visitor = await prisma.visitor.findFirst({
    where: { id: visitorId, shareId },
  });
  if (!visitor) {
    return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
  }
  const actions = await prisma.visitorAction.findMany({
    where: { visitorId, shareId },
    orderBy: { createdAt: "asc" },
  });

  const fileIds = [...new Set(actions.filter((a) => a.resourceType === "file" && a.resourceId).map((a) => a.resourceId!))];
  const directoryIds = [...new Set(actions.filter((a) => a.resourceType === "directory" && a.resourceId).map((a) => a.resourceId!))];

  const [files, directories] = await Promise.all([
    fileIds.length > 0
      ? prisma.file.findMany({
          where: { id: { in: fileIds }, uploadedById: session.user.id },
          select: { id: true, name: true },
        })
      : [],
    directoryIds.length > 0
      ? prisma.directory.findMany({
          where: { id: { in: directoryIds }, ownerId: session.user.id },
          select: { id: true, name: true },
        })
      : [],
  ]);

  const fileNames = new Map(files.map((f) => [f.id, f.name]));
  const directoryNames = new Map(directories.map((d) => [d.id, d.name]));

  const actionsWithNames = actions.map((a) => ({
    ...a,
    resourceName:
      a.resourceType === "file" && a.resourceId
        ? fileNames.get(a.resourceId) ?? null
        : a.resourceType === "directory" && a.resourceId
          ? directoryNames.get(a.resourceId) ?? null
          : null,
  }));

  return NextResponse.json({
    share: {
      id: share.id,
      slug: share.slug,
      title: share.title,
      deck: share.deck,
    },
    visitor: {
      id: visitor.id,
      fingerprintHash: visitor.fingerprintHash,
      firstSeenAt: visitor.firstSeenAt,
      lastSeenAt: visitor.lastSeenAt,
      ip: visitor.ip,
      userAgent: visitor.userAgent,
      country: visitor.country,
      region: visitor.region,
      referrer: visitor.referrer,
    },
    actions: actionsWithNames,
  });
}
