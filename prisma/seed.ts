// Load .env if available (e.g. local dev); in Docker DATABASE_URL is already in the environment
if (typeof require !== "undefined") {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- optional in container
    require("dotenv/config");
  } catch {
    // dotenv not installed or failed; use process.env
  }
}
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_EMAIL ?? "admin@example.com";
  const password = process.env.SEED_PASSWORD ?? "admin123";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log("Admin user already exists:", email);
    return;
  }
  const passwordHash = await hash(password, 10);
  await prisma.user.create({
    data: {
      email,
      name: "Admin",
      passwordHash,
    },
  });
  console.log("Created admin user:", email);
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
