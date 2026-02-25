import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { cookies } from "next/headers";

const SHARE_COOKIE_PREFIX = "deck_share_";
const SHARE_VISITED_PREFIX = "deck_share_visited_";

function getShareAuthCookieName(slug: string) {
  return `${SHARE_COOKIE_PREFIX}${slug}`;
}

function getShareVisitedCookieName(slug: string) {
  return `${SHARE_VISITED_PREFIX}${slug}`;
}

export async function getShareAuth(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getShareAuthCookieName(slug));
  return cookie?.value === "1";
}

export async function getShareVisited(slug: string): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(getShareVisitedCookieName(slug));
  return cookie?.value === "1";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const share = await prisma.share.findUnique({
    where: { slug, isActive: true },
    include: {
      deck: {
        include: {
          items: {
            orderBy: { order: "asc" },
            include: { file: true, directory: true },
          },
        },
      },
    },
  });
  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }
  if (new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Share has expired" }, { status: 410 });
  }
  const hasAuth = await getShareAuth(slug);
  if (share.passwordHash && !hasAuth) {
    return NextResponse.json({
      needsPassword: true,
      title: share.title,
    });
  }

  const globalCta = await prisma.globalCta.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const siteSettings = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  const footerLinks = (siteSettings?.footerLinks as { label: string; url: string }[] | null) ?? [];

  const response = NextResponse.json({
    share: {
      id: share.id,
      title: share.title,
      descriptionRichText: share.descriptionRichText,
      audienceName: share.audienceName,
      targetLink: share.targetLink,
      contactEmail: share.contactEmail,
    },
    deck: {
      id: share.deck.id,
      name: share.deck.name,
      items: share.deck.items,
    },
    cta:
      globalCta &&
      (globalCta.title || globalCta.link)
        ? {
            title: globalCta.title,
            description: globalCta.description,
            link: globalCta.link,
            linkLabel: globalCta.linkLabel,
          }
        : null,
    siteSettings: {
      footerCopyright: siteSettings?.footerCopyright ?? null,
      footerLinks: Array.isArray(footerLinks) ? footerLinks : [],
      posthogProjectKey: siteSettings?.posthogProjectKey ?? null,
      posthogHost: siteSettings?.posthogHost ?? null,
      logoUrl:
        siteSettings?.logoStorageKey && siteSettings?.logoMimeType
          ? "/api/settings/logo"
          : null,
    },
  });

  response.cookies.set(getShareVisitedCookieName(slug), "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour – must have opened share page to access files
    path: "/",
  });

  return response;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const share = await prisma.share.findUnique({
    where: { slug, isActive: true },
  });
  if (!share || !share.passwordHash) {
    return NextResponse.json({ error: "Not found or no password" }, { status: 404 });
  }
  const body = await req.json();
  const { password } = body as { password?: string };
  if (!password) {
    return NextResponse.json({ error: "Password required" }, { status: 400 });
  }
  const valid = await compare(password, share.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const cookieStore = await cookies();
  cookieStore.set(getShareAuthCookieName(slug), "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: "/",
  });
  cookieStore.set(getShareVisitedCookieName(slug), "1", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60, // 1 hour
    path: "/",
  });
  return NextResponse.json({ ok: true });
}
