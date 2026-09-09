const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listUsers() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  console.log("All Database Users:", users);
}

listUsers().catch(console.error).finally(() => prisma.$disconnect());
