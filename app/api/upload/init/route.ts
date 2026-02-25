import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/** Edge-compatible: uses Web Crypto getRandomValues. */
function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uploadId = randomHex(16);
  return NextResponse.json({ uploadId });
}
