import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function seed() {
  const username = process.env.ADMIN_USERNAME ?? "admin";
  const password = process.env.ADMIN_PASSWORD ?? "admin123";

  const existing = await prisma.user.findUnique({ where: { username } });
  if (!existing) {
    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        username,
        passwordHash,
        name: "Admin",
        role: "admin",
      },
    });
    console.log(`User "${username}" seeded successfully.`);
  } else {
    console.log(`User "${username}" already exists, skipping admin seed.`);
  }

  // Seed User Teknisi Bawaan
  const techUsername = "teknisi";
  const techPassword = "teknisi123";
  const techExisting = await prisma.user.findUnique({ where: { username: techUsername } });
  if (!techExisting) {
    const techPasswordHash = await bcrypt.hash(techPassword, 12);
    await prisma.user.create({
      data: {
        username: techUsername,
        passwordHash: techPasswordHash,
        name: "Teknisi Utama",
        role: "teknisi",
      },
    });
    console.log(`User "${techUsername}" seeded successfully.`);
  }

  await prisma.$disconnect();
}

seed().catch((e) => {
  console.error("Seed failed:", e);
  process.exit(1);
});
