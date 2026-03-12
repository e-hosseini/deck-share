import type { Metadata } from "next";
import { Google_Sans_Flex, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const googleSansFlex = Google_Sans_Flex({
  variable: "--font-google-sans-flex",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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

export async function generateMetadata(): Promise<Metadata> {
  let title = "Deck Share";
  let icons: Metadata["icons"] = undefined;
  let openGraph: Metadata["openGraph"] = undefined;
  let twitter: Metadata["twitter"] = undefined;
  try {
    if (prisma.siteSettings) {
      const site = await prisma.siteSettings.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      title = site?.websiteTitle?.trim() || title;
      if (site?.logoStorageKey && site?.logoMimeType) {
        const baseUrl = getBaseUrl();
        const imageUrl = `${baseUrl}/api/settings/logo`;
        icons = { icon: "/api/settings/logo" };
        openGraph = {
          title,
          description: "Share decks with tracking",
          siteName: title,
          type: "website",
          images: [{ url: imageUrl, width: 1200, height: 630, alt: title }],
        };
        twitter = {
          card: "summary_large_image",
          title,
          description: "Share decks with tracking",
          images: [imageUrl],
        };
      }
    }
  } catch {
    // use default
  }
  return {
    title,
    description: "Share decks with tracking",
    icons,
    openGraph,
    twitter,
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${googleSansFlex.variable} ${geistMono.variable} antialiased`}
      >
        <TooltipProvider>
          <Providers>
            {children}
            <Toaster />
          </Providers>
        </TooltipProvider>
      </body>
    </html>
  );
}
