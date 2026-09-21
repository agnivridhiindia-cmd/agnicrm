const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Checking all clients and users in database...");

  const clients = await prisma.client.findMany();
  console.log(`Found ${clients.length} total clients in DB:`);
  clients.forEach((c) => {
    console.log(`  - Client ID: ${c.id}, Company: ${c.companyName}, Email: ${c.email}`);
  });

  const users = await prisma.user.findMany();
  console.log(`Found ${users.length} total users in DB:`);
  users.forEach((u) => {
    console.log(`  - User ID: ${u.id}, Email: ${u.email}, Role: ${u.role}`);
  });

  // Delete any client or user matching kshitiz007singh@gmail.com or Yadav
  const targetClients = clients.filter(
    (c) =>
      c.email.toLowerCase().includes("kshitiz007") ||
      c.companyName.toLowerCase().includes("yadav") ||
      c.name.toLowerCase().includes("yadav")
  );

  for (const c of targetClients) {
    console.log(`Deleting test client ID: ${c.id}, Company: ${c.companyName}`);
    await prisma.invoice.deleteMany({ where: { clientId: c.id } });
    await prisma.request.deleteMany({ where: { clientId: c.id } });
    await prisma.agreement.deleteMany({ where: { clientId: c.id } });
    await prisma.client.delete({ where: { id: c.id } });
  }

  const targetUsers = users.filter((u) => u.email.toLowerCase().includes("kshitiz007") || u.email.toLowerCase().includes("yadav") || u.email.toLowerCase().includes("vanshika"));
  for (const u of targetUsers) {
    console.log(`Deleting test user ID: ${u.id}, Email: ${u.email}`);
    await prisma.user.delete({ where: { id: u.id } });
  }

  console.log("✅ Database inspection and cleanup finished!");
}

main()
  .catch((e) => console.error("Cleanup error:", e))
  .finally(async () => await prisma.$disconnect());
