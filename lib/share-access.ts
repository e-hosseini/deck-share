import { prisma } from "@/lib/prisma";
import { getShareAuth, getShareVisited } from "@/app/api/share/[slug]/access/route";

async function getDescendantDirectoryIds(dirId: string): Promise<Set<string>> {
  const children = await prisma.directory.findMany({
    where: { parentId: dirId },
    select: { id: true },
  });
  const set = new Set<string>([dirId]);
  for (const c of children) {
    const sub = await getDescendantDirectoryIds(c.id);
    sub.forEach((id) => set.add(id));
  }
  return set;
}

export type ShareAccessResult = {
  share: {
    id: string;
    deckId: string;
    slug: string;
    expiresAt: Date;
    passwordHash: string | null;
  };
  deck: {
    id: string;
    items: { fileId: string | null; directoryId: string | null }[];
  };
  allowedDirectoryIds: Set<string>;
  allowedFileIds: Set<string>;
};

export async function getShareWithAccess(
  slug: string
): Promise<ShareAccessResult | null> {
  const share = await prisma.share.findUnique({
    where: { slug, isActive: true },
    include: { deck: { include: { items: true } } },
  });
  if (!share || new Date() > share.expiresAt) return null;
  if (share.passwordHash && !(await getShareAuth(slug))) return null;
  if (!(await getShareVisited(slug))) return null;

  const allowedFileIds = new Set(
    share.deck.items.filter((i) => i.fileId).map((i) => i.fileId!)
  );
  const allowedDirectoryIds = new Set<string>();
  for (const item of share.deck.items) {
    if (item.directoryId) {
      const ids = await getDescendantDirectoryIds(item.directoryId);
      ids.forEach((id) => allowedDirectoryIds.add(id));
    }
  }

  return {
    share: {
      id: share.id,
      deckId: share.deckId,
      slug: share.slug,
      expiresAt: share.expiresAt,
      passwordHash: share.passwordHash,
    },
    deck: {
      id: share.deck.id,
      items: share.deck.items.map((i) => ({
        fileId: i.fileId,
        directoryId: i.directoryId,
      })),
    },
    allowedDirectoryIds,
    allowedFileIds,
  };
}

export function isFileAllowed(
  access: ShareAccessResult,
  file: { id: string; directoryId: string | null }
): boolean {
  if (access.allowedFileIds.has(file.id)) return true;
  if (file.directoryId && access.allowedDirectoryIds.has(file.directoryId))
    return true;
  return false;
}

export function isDirectoryAllowed(
  access: ShareAccessResult,
  directoryId: string
): boolean {
  return access.allowedDirectoryIds.has(directoryId);
}
