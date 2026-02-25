import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type FooterLink = { label: string; url: string };

export async function GET() {
  const row = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  const footerLinks = (row?.footerLinks as FooterLink[] | null) ?? [];
  const hasLogo = !!(row?.logoStorageKey && row?.logoMimeType);
  return NextResponse.json({
    websiteTitle: row?.websiteTitle ?? null,
    footerCopyright: row?.footerCopyright ?? null,
    footerLinks: Array.isArray(footerLinks) ? footerLinks : [],
    posthogProjectKey: row?.posthogProjectKey ?? null,
    posthogHost: row?.posthogHost ?? null,
    logoUrl: hasLogo ? "/api/settings/logo" : null,
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = await req.json();
  const {
    websiteTitle,
    footerCopyright,
    footerLinks,
    posthogProjectKey,
    posthogHost,
  } = body as {
    websiteTitle?: string | null;
    footerCopyright?: string | null;
    footerLinks?: FooterLink[] | null;
    posthogProjectKey?: string | null;
    posthogHost?: string | null;
  };

  const data = {
    websiteTitle:
      websiteTitle != null && websiteTitle !== ""
        ? String(websiteTitle).trim()
        : null,
    footerCopyright:
      footerCopyright != null && footerCopyright !== ""
        ? String(footerCopyright).trim()
        : null,
    footerLinks:
      Array.isArray(footerLinks) &&
      footerLinks.every(
        (x) => x && typeof x.label === "string" && typeof x.url === "string"
      )
        ? footerLinks.map((x) => ({
            label: String(x.label).trim(),
            url: String(x.url).trim(),
          }))
        : [],
    posthogProjectKey:
      posthogProjectKey != null && posthogProjectKey !== ""
        ? String(posthogProjectKey).trim()
        : null,
    posthogHost:
      posthogHost != null && posthogHost !== ""
        ? String(posthogHost).trim()
        : null,
  };

  let row = await prisma.siteSettings.findFirst();
  if (!row) {
    row = await prisma.siteSettings.create({
      data: { ...data, updatedAt: new Date() },
    });
  } else {
    row = await prisma.siteSettings.update({
      where: { id: row.id },
      data: { ...data, updatedAt: new Date() },
    });
  }

  const links = (row.footerLinks as FooterLink[]) ?? [];
  return NextResponse.json({
    websiteTitle: row.websiteTitle,
    footerCopyright: row.footerCopyright,
    footerLinks: Array.isArray(links) ? links : [],
    posthogProjectKey: row.posthogProjectKey,
    posthogHost: row.posthogHost,
  });
}
