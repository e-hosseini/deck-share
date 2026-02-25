import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/providers";
import { prisma } from "@/lib/prisma";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  let title = "Deck Share";
  let icons: Metadata["icons"] = undefined;
  try {
    if (prisma.siteSettings) {
      const site = await prisma.siteSettings.findFirst({
        orderBy: { updatedAt: "desc" },
      });
      title = site?.websiteTitle?.trim() || title;
      if (site?.logoStorageKey && site?.logoMimeType) {
        icons = { icon: "/api/settings/logo" };
      }
    }
  } catch {
    // use default
  }
  return {
    title,
    description: "Share decks with tracking",
    icons,
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
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
