const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: {
      branch: true,
      salesPerson: true,
      invoices: true
    }
  });
  console.log("DB Clients:", JSON.stringify(clients, null, 2));
}

main().finally(() => prisma.$disconnect());
