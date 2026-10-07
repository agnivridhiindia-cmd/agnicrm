import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function migrate() {
  console.log("🚀 Starting Client ID Migration to CRM-YYYY-XXX format...");

  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "asc" },
  });

  console.log(`Found ${clients.length} clients to migrate.`);

  // Group by year or process sequentially by year
  const yearCounters: Record<number, number> = {};

  for (const client of clients) {
    const year = client.createdAt ? new Date(client.createdAt).getFullYear() : 2026;
    if (!yearCounters[year]) {
      yearCounters[year] = 0;
    }
    yearCounters[year] += 1;
    const seq = yearCounters[year];
    const newAppId = `CRM-${year}-${String(seq).padStart(3, "0")}`;

    await prisma.client.update({
      where: { id: client.id },
      data: { appId: newAppId },
    });

    console.log(`✅ [${seq}/${clients.length}] Migrated "${client.name}" (${client.id}): ${client.appId} -> ${newAppId}`);
  }

  console.log("🎉 Client ID migration successfully completed!");
}

migrate()
  .catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
