const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.payment.deleteMany({});
  await prisma.invoice.deleteMany({});
  console.log('Deleted all payments and invoices');
}
main().finally(() => prisma.$disconnect());
