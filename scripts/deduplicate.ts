import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

import { PrismaClient } from "../lib/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: process.env.DATABASE_URL ?? "file:./dev.db",
});
const prisma = new PrismaClient({ adapter });

async function deduplicateNoHp() {
  const duplicates = await prisma.customer.groupBy({
    by: ["noHp"],
    _count: { noHp: true },
    having: { noHp: { _count: { gte: 2 } } },
  });

  if (duplicates.length === 0) {
    console.log("No duplicate noHp found.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Found ${duplicates.length} duplicate noHp values.`);

  for (const dup of duplicates) {
    const customers = await prisma.customer.findMany({
      where: { noHp: dup.noHp },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });

    // Keep the first one (oldest), deduplicate the rest
    for (let i = 1; i < customers.length; i++) {
      await prisma.customer.update({
        where: { id: customers[i].id },
        data: { noHp: `${dup.noHp}-${i}` },
      });
    }
  }

  console.log("Done deduplicating noHp values.");
  await prisma.$disconnect();
}

deduplicateNoHp().catch((e) => {
  console.error("Deduplication failed:", e);
  process.exit(1);
});
