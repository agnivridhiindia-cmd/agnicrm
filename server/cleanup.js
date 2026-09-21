const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up test client records for 'community' and 'microsoft'...");

  // Find target client IDs
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { companyName: { contains: 'community', mode: 'insensitive' } },
        { companyName: { contains: 'microsoft', mode: 'insensitive' } },
        { name: { contains: 'community', mode: 'insensitive' } },
        { name: { contains: 'microsoft', mode: 'insensitive' } },
        { email: { contains: 'community', mode: 'insensitive' } },
        { email: { contains: 'microsoft', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Found ${clients.length} matching client(s) in DB.`);

  for (const client of clients) {
    console.log(`Deleting client ID: ${client.id}, Company: ${client.companyName}, Email: ${client.email}`);
    
    // Delete dependent invoices
    await prisma.invoice.deleteMany({
      where: { clientId: client.id },
    });

    // Delete dependent requests
    await prisma.request.deleteMany({
      where: { clientId: client.id },
    });

    // Delete dependent agreements
    await prisma.agreement.deleteMany({
      where: { clientId: client.id },
    });

    // Delete client
    await prisma.client.delete({
      where: { id: client.id },
    });
  }

  console.log("✅ Database cleanup finished cleanly!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
