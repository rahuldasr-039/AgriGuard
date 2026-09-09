const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkFarmer() {
  const f = await prisma.farmer.findUnique({
    where: { id: 'cmtjpwytc000g6zqh1z4fp3a3' },
    include: {
      user: true,
      farms: {
        include: {
          animals: true,
          batches: true
        }
      }
    }
  });

  console.log('Farmer details:', JSON.stringify(f, null, 2));
}

checkFarmer().catch(console.error).finally(() => prisma.$disconnect());
