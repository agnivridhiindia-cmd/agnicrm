const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { id: '33a33eb1-b62d-4e1c-bb61-d179c2bf99ef' } });
  console.log(user);
}
main().finally(() => prisma.$disconnect());
