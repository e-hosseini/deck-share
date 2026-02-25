import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { appendFile } from "@/lib/storage";
import path from "path";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? "./uploads";

function getUploadRoot(): string {
  return path.isAbsolute(UPLOAD_ROOT) ? UPLOAD_ROOT : path.join(process.cwd(), UPLOAD_ROOT);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const formData = await req.formData();
  const uploadId = formData.get("uploadId") as string | null;
  const chunk = formData.get("chunk") as Blob | null;
  if (!uploadId || !chunk) {
    return NextResponse.json({ error: "Missing uploadId or chunk" }, { status: 400 });
  }
  const root = getUploadRoot();
  const tempKey = path.join("temp", uploadId);
  const absPath = path.resolve(root, tempKey);
  if (!absPath.startsWith(path.resolve(root))) {
    return NextResponse.json({ error: "Invalid uploadId" }, { status: 400 });
  }
  const buffer = Buffer.from(await chunk.arrayBuffer());
  await appendFile(tempKey, buffer);
  return NextResponse.json({ ok: true });
}
