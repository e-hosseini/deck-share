import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Protection is done in (dashboard)/layout.tsx via auth() and redirect.
// We avoid running auth() in Edge here so Node-only deps (crypto, Prisma, bcrypt) are not loaded in Edge.
export function middleware(_req: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/files", "/files/:path*", "/decks", "/decks/:path*", "/shares", "/shares/:path*"],
};
