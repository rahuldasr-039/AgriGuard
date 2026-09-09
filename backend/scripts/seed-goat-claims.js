const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const animals = await prisma.animal.findMany({
    where: { category: 'Goat' }
  });
  console.log("Goat animals:", animals.map(a => ({ tagId: a.tagId, category: a.category, type: a.type })));

  const tester = await prisma.farmTester.findFirst({
    where: { testerId: 'FT72B91K1' }
  });

  // Check if Goat Milk claim exists
  const existingMilkClaim = await prisma.withdrawalWasteClaim.findFirst({
    where: { productType: 'Goat Milk' }
  });

  if (!existingMilkClaim) {
    const claimId = `WST-${Math.floor(100000 + Math.random() * 900000)}`;
    const newClaim = await prisma.withdrawalWasteClaim.create({
      data: {
        claimId,
        testerId: 'FT72B91K1',
        testerProfileId: tester.id,
        farmerId: 'FR10293',
        animalType: 'Goat',
        animalId: 'RJ-GT2',
        date: new Date(),
        productType: 'Goat Milk',
        wasteAmount: 20,
        unit: 'L',
        aiRecommendedAmount: 1700,
        status: 'PENDING FSSAI APPROVAL',
        notes: 'Statutory withdrawal discarded goat milk following antibiotic therapy'
      }
    });
    console.log("Created Goat Milk claim:", newClaim.claimId);
  } else {
    console.log("Existing Goat Milk claim:", existingMilkClaim.claimId);
  }
}

main().finally(() => prisma.$disconnect());
