const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.client.updateMany({
    data: { totalPayment: 118000, paymentReceived: 118000 }
  });
  console.log('Updated clients');
}
main().finally(() => prisma.$disconnect());
