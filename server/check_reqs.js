const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const reqs = await prisma.request.findMany();
  console.log("Total requests in DB:", reqs.length);
  reqs.forEach(r => {
    if (JSON.stringify(r).toLowerCase().includes("abhishek") || JSON.stringify(r).toLowerCase().includes("sengar")) {
      console.log("Found matching request:", r);
    }
  });
}
main().catch(console.error).finally(() => prisma.$disconnect());
