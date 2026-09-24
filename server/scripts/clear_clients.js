const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up database...');
  await prisma.$transaction([
    prisma.payment.deleteMany(),
    prisma.invoice.deleteMany(),
    prisma.clientDocument.deleteMany(),
    prisma.request.deleteMany(),
    prisma.agreement.deleteMany(),
    prisma.clientScheme.deleteMany(),
    prisma.client.deleteMany(),
  ]);

  const clientsCount = await prisma.client.count();
  const invoicesCount = await prisma.invoice.count();
  console.log(`Database cleaned! Remaining clients: ${clientsCount}, invoices: ${invoicesCount}`);
}

main()
  .catch((err) => {
    console.error('Error cleaning database:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
