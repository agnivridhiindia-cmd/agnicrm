const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: {
      salesPerson: true,
      invoices: true
    }
  });

  const dummyPatterns = [
    "workshala",
    "yash ear clinic",
    "yadav dairy farm",
    "yadav",
    "water purify",
    "vanshikayadavji",
    "kshitiz007singh",
    "heena garments",
    "heena",
    "lappu",
    "lappusachin"
  ];

  const dummyClients = clients.filter(c => {
    const str = (c.companyName + " " + c.contactPerson + " " + c.email).toLowerCase();
    return dummyPatterns.some(p => str.includes(p));
  });

  console.log(JSON.stringify(dummyClients.map(c => ({
    id: c.id,
    name: c.companyName,
    email: c.email,
    createdAt: c.createdAt,
    invoicesCount: c.invoices.length,
    revenue: c.invoices.reduce((acc, inv) => acc + inv.paymentReceived, 0)
  })), null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
