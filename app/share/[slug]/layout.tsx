import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";

function getBaseUrl(): string {
  if (typeof process.env.NEXT_PUBLIC_APP_URL === "string" && process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  }
  if (typeof process.env.VERCEL_URL === "string" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  const port = process.env.PORT || "3000";
  return `http://localhost:${port}`;
}

type Props = {
  params: Promise<{ slug: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}/share/${slug}`;

  const share = await prisma.share.findUnique({
    where: { slug, isActive: true },
    include: { deck: true },
  });

  const siteSettings = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });

  const hasLogo =
    siteSettings?.logoStorageKey && siteSettings?.logoMimeType;
  const imageUrl = hasLogo ? `${baseUrl}/api/settings/logo` : undefined;

  const icons = hasLogo ? { icon: imageUrl } : undefined;

  const siteName = siteSettings?.websiteTitle?.trim() || "Deck Share";
  const validShare = share && new Date() <= share.expiresAt;
  const title = validShare
    ? (share.metaTitle?.trim() || share.deck.name)
    : siteName;
  const rawDescription = validShare
    ? (share.metaDescription?.trim() || share.deck.description?.trim() || siteSettings?.siteDescription?.trim() || "Share decks with tracking")
    : (siteSettings?.siteDescription?.trim() || "Share decks with tracking");
  const description = rawDescription.length > 100 ? `${rawDescription.slice(0, 100)}…` : rawDescription;

  return {
    title,
    description,
    icons,
    openGraph: {
      title,
      description,
      url,
      siteName,
      type: "website",
      ...(imageUrl && {
        images: [
          {
            url: imageUrl,
            width: 1200,
            height: 630,
            alt: title,
          },
        ],
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(imageUrl && { images: [imageUrl] }),
    },
  };
}

export default function ShareSlugLayout({ children }: Props) {
  return children;
}
