const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Fetching all clients from DB...");
  const clients = await prisma.client.findMany({
    include: {
      invoices: true,
      documents: true,
    }
  });

  console.log(`Found ${clients.length} client(s):`);
  for (const c of clients) {
    console.log(`- ID: ${c.id}, Name: ${c.name}, Email: ${c.email}, AppID: ${c.appId}`);
  }

  if (clients.length > 0) {
    console.log("Deleting all client records and related child records...");
    for (const c of clients) {
      await prisma.invoice.deleteMany({ where: { clientId: c.id } });
      await prisma.clientDocument.deleteMany({ where: { clientId: c.id } });
      await prisma.client.delete({ where: { id: c.id } });
      console.log(`Deleted client ${c.id} (${c.email})`);
    }
  }

  console.log("✅ Client table cleanup completed successfully!");
}

main()
  .catch((e) => {
    console.error("Error deleting clients:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
