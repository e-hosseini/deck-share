import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const cta = await prisma.globalCta.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({
    cta: cta
      ? {
          title: cta.title,
          description: cta.description,
          link: cta.link,
          linkLabel: cta.linkLabel,
        }
      : { title: null, description: null, link: null, linkLabel: null },
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const { title, description, link, linkLabel } = body as {
    title?: string | null;
    description?: string | null;
    link?: string | null;
    linkLabel?: string | null;
  };

  const data = {
    title: title != null && title !== "" ? String(title).trim() : null,
    description:
      description != null && description !== "" ? String(description).trim() : null,
    link: link != null && link !== "" ? String(link).trim() : null,
    linkLabel:
      linkLabel != null && linkLabel !== "" ? String(linkLabel).trim() : null,
  };

  let cta = await prisma.globalCta.findFirst();
  if (!cta) {
    cta = await prisma.globalCta.create({
      data: { ...data, updatedAt: new Date() },
    });
  } else {
    cta = await prisma.globalCta.update({
      where: { id: cta.id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  return NextResponse.json({
    cta: {
      title: cta.title,
      description: cta.description,
      link: cta.link,
      linkLabel: cta.linkLabel,
    },
  });
}
