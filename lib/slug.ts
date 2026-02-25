const CHARS = "abcdefghijklmnopqrstuvwxyz0123456789";

export function generateSlug(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    result += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return result;
}

export async function generateUniqueSlug(
  exists: (slug: string) => Promise<boolean>,
  length = 6,
  maxAttempts = 100
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const slug = generateSlug(length);
    if (!(await exists(slug))) return slug;
  }
  throw new Error("Could not generate unique slug");
}
