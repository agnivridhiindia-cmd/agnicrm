const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("🔍 Clean wipe check for 'avi@gmail.com' and any related 'avi' records...");

  // 1. Delete Clients matching avi
  const clients = await prisma.client.findMany({
    where: {
      OR: [
        { email: { contains: 'avi', mode: 'insensitive' } },
        { companyName: { contains: 'avi', mode: 'insensitive' } },
        { contactPerson: { contains: 'avi', mode: 'insensitive' } },
        { name: { contains: 'avi', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Found ${clients.length} client(s) in database matching 'avi'.`);
  for (const c of clients) {
    console.log(`🗑️ Deleting Client ID: ${c.id}, Name: ${c.companyName || c.name}, Email: ${c.email}`);
    await prisma.client.delete({ where: { id: c.id } });
  }

  // 2. Delete Agreements matching avi
  const agreements = await prisma.agreement.findMany({
    where: {
      sentToEmail: { contains: 'avi', mode: 'insensitive' },
    },
  });
  console.log(`Found ${agreements.length} agreement(s) matching 'avi'.`);
  for (const a of agreements) {
    console.log(`🗑️ Deleting Agreement ID: ${a.id}`);
    await prisma.agreement.delete({ where: { id: a.id } });
  }

  // 3. Delete Users matching avi
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { email: { contains: 'avi', mode: 'insensitive' } },
        { fullName: { contains: 'avi', mode: 'insensitive' } },
      ],
    },
  });

  console.log(`Found ${users.length} user(s) in database matching 'avi'.`);
  for (const u of users) {
    console.log(`🗑️ Deleting User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
    await prisma.client.updateMany({
      where: { salesPersonId: u.id },
      data: { salesPersonId: null },
    });
    await prisma.user.delete({ where: { id: u.id } });
  }

  console.log("✨ All 'avi@gmail.com' and 'avi' test data successfully removed from database!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
