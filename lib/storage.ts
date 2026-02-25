import fs from "fs/promises";
import fsSync from "fs";
import path from "path";

const UPLOAD_ROOT = process.env.UPLOAD_DIR ?? "./uploads";

export function getUploadRoot(): string {
  return path.isAbsolute(UPLOAD_ROOT) ? UPLOAD_ROOT : path.join(process.cwd(), UPLOAD_ROOT);
}

/** Resolve a storage key (relative path) to an absolute path. */
export function resolvePath(storageKey: string): string {
  const root = getUploadRoot();
  const resolved = path.resolve(root, storageKey);
  if (!resolved.startsWith(path.resolve(root))) {
    throw new Error("Invalid storage key");
  }
  return resolved;
}

/** Ensure the directory for the given path exists. */
export async function ensureDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/** Write a buffer to a file at the given storage key. */
export async function writeFile(storageKey: string, data: Buffer): Promise<void> {
  const abs = resolvePath(storageKey);
  await ensureDir(abs);
  await fs.writeFile(abs, data);
}

/** Append data to a file (for chunked uploads). */
export async function appendFile(storageKey: string, data: Buffer): Promise<void> {
  const abs = resolvePath(storageKey);
  await ensureDir(abs);
  await fs.appendFile(abs, data);
}

/** Create a write stream for the given storage key. Caller must close the stream. */
export function createWriteStream(storageKey: string): { path: string; stream: NodeJS.WritableStream } {
  const abs = resolvePath(storageKey);
  const dir = path.dirname(abs);
  if (!fsSync.existsSync(dir)) {
    fsSync.mkdirSync(dir, { recursive: true });
  }
  const stream = fsSync.createWriteStream(abs, { flags: "a" });
  return { path: abs, stream };
}

/** Read a file as a buffer. */
export async function readFile(storageKey: string): Promise<Buffer> {
  const abs = resolvePath(storageKey);
  return fs.readFile(abs);
}

/** Create a read stream for the given storage key. */
export function createReadStream(storageKey: string): { stream: NodeJS.ReadableStream } {
  const abs = resolvePath(storageKey);
  const stream = fsSync.createReadStream(abs);
  return { stream };
}

/** Delete a file at the given storage key. */
export async function deleteFile(storageKey: string): Promise<void> {
  const abs = resolvePath(storageKey);
  await fs.unlink(abs).catch(() => {});
}

/** Check if a file exists. */
export async function exists(storageKey: string): Promise<boolean> {
  const abs = resolvePath(storageKey);
  try {
    await fs.access(abs);
    return true;
  } catch {
    return false;
  }
}

/** Generate a unique storage key for a new file (directoryId optional). */
export function uniqueStorageKey(directoryId: string | null, filename: string): string {
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}-${path.basename(filename)}`;
  return directoryId ? path.join("dir", directoryId, safe) : path.join("root", safe);
}
