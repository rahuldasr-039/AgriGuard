const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const animals = await prisma.animal.findMany({
    include: { tag: true, farm: { include: { farmer: true } } }
  });
  console.log(`Found ${animals.length} animals:`);
  animals.forEach(a => {
    console.log(`- ID: ${a.id}, Tag: ${a.tag?.tag}, Cat: ${a.category}, Weight: ${a.weight}, DOB: ${a.dateOfBirth}, Farmer: ${a.farm?.farmer?.farmerId}`);
  });
  const users = await prisma.user.findMany({
    select: { email: true, role: true, farmerProfile: { select: { farmerId: true } }, veterinarianProfile: { select: { vetId: true } } }
  });
  console.log("Users:", users);
  await prisma.$disconnect();
}

check();
