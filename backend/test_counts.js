const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testCounts() {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: 'farmer1@gmail.com' }, { email: 'farmer1@example.com' }] },
    include: { farmerProfile: true }
  });

  const farmer = await prisma.farmer.findUnique({
    where: { id: user.farmerProfile.id },
    include: {
      farms: {
        include: {
          animals: { include: { tag: true } },
          batches: { include: { tag: true } }
        }
      }
    }
  });

  const tagIds = [];
  farmer.farms.forEach(f => {
    f.animals.forEach(a => { if (a.tag) tagIds.push(a.tag.id); });
    f.batches.forEach(b => { if (b.tag) tagIds.push(b.tag.id); });
  });

  const treatments = await prisma.treatment.findMany({ where: { tagId: { in: tagIds } } });
  const vaccinations = await prisma.vaccination.findMany({ where: { tagId: { in: tagIds } } });
  const withdrawals = await prisma.withdrawalRecord.findMany({ where: { treatment: { tagId: { in: tagIds } } } });

  console.log(`Treatments Count: ${treatments.length}`);
  console.log(`Vaccinations Count: ${vaccinations.length}`);
  console.log(`Total Treatment History Items: ${treatments.length + vaccinations.length}`);
  console.log(`Total Withdrawal Calendar Items (with Vaccines 0-day): ${withdrawals.length + vaccinations.length}`);
}

testCounts().catch(console.error).finally(() => prisma.$disconnect());
