import { NextRequest, NextResponse } from "next/server";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createReadStream, writeFile, deleteFile, exists } from "@/lib/storage";

const LOGO_STORAGE_KEY = "site/logo";
const ALLOWED_LOGO_MIMES = ["image/png", "image/jpeg", "image/gif", "image/webp", "image/x-icon", "image/vnd.microsoft.icon"];

export async function GET() {
  const row = await prisma.siteSettings.findFirst({
    orderBy: { updatedAt: "desc" },
  });
  if (!row?.logoStorageKey || !row.logoMimeType) {
    return new NextResponse(null, { status: 404 });
  }
  const keyExists = await exists(row.logoStorageKey);
  if (!keyExists) {
    return new NextResponse(null, { status: 404 });
  }
  const { stream } = createReadStream(row.logoStorageKey);
  const webStream = Readable.toWeb(stream as Readable);
  const headers = new Headers();
  headers.set("Content-Type", row.logoMimeType);
  headers.set("Cache-Control", "public, max-age=86400");
  return new Response(webStream as ReadableStream, { headers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await req.formData();
  const file = formData.get("logo");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json(
      { error: "Missing file. Use form field 'logo'." },
      { status: 400 }
    );
  }
  const mimeType = file.type || "application/octet-stream";
  if (!ALLOWED_LOGO_MIMES.includes(mimeType)) {
    return NextResponse.json(
      { error: "Logo must be an image (PNG, JPEG, GIF, WebP, or ICO)." },
      { status: 400 }
    );
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(LOGO_STORAGE_KEY, buffer);

  let row = await prisma.siteSettings.findFirst();
  if (!row) {
    row = await prisma.siteSettings.create({
      data: {
        logoStorageKey: LOGO_STORAGE_KEY,
        logoMimeType: mimeType,
      },
    });
  } else {
    row = await prisma.siteSettings.update({
      where: { id: row.id },
      data: {
        logoStorageKey: LOGO_STORAGE_KEY,
        logoMimeType: mimeType,
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const row = await prisma.siteSettings.findFirst();
  if (!row?.logoStorageKey) {
    return NextResponse.json({ ok: true });
  }
  await deleteFile(row.logoStorageKey);
  await prisma.siteSettings.update({
    where: { id: row.id },
    data: {
      logoStorageKey: null,
      logoMimeType: null,
    },
  });
  return NextResponse.json({ ok: true });
}
