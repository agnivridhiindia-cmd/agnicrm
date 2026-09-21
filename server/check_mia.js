const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: {
      salesPerson: true,
      invoices: true
    }
  });

  const miaClients = clients.filter(c => {
    const sp = c.salesPerson?.fullName || c.owner || '';
    return sp.toLowerCase().includes('mia');
  });

  console.log("Mia Clients:", JSON.stringify(miaClients, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
