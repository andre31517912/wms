import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? "admin@wms.local";
  const password = process.env.SEED_ADMIN_PASSWORD ?? "ChangeMe123!";

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash,
      name: "Warehouse Admin",
      role: "ADMIN",
      accountStatus: "APPROVED",
    },
  });

  console.log(`Seeded admin user: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log(`Default password: ${password} — change this in production!`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
