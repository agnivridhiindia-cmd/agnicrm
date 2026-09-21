const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking User table for kshitiz007singh@gmail.com / kshitiz007sing@gmail.com...");

  const users = await prisma.user.findMany({
    where: {
      email: { contains: 'kshitiz007', mode: 'insensitive' },
    },
  });

  console.log(`Found ${users.length} matching user(s) in User table.`);

  for (const u of users) {
    console.log(`Deleting user ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
    await prisma.user.delete({
      where: { id: u.id },
    });
  }

  console.log("✅ User table cleanup finished cleanly!");
}

main()
  .catch((e) => {
    console.error("Cleanup error:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
