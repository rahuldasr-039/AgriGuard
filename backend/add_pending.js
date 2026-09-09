const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addPendingFarmer() {
  const existing = await prisma.user.findUnique({ where: { email: 'pending_farmer@example.com' } });
  if (!existing) {
    const user = await prisma.user.create({
      data: {
        email: 'pending_farmer@example.com',
        passwordHash: 'dummy',
        role: 'FARMER',
        isActive: true
      }
    });

    await prisma.farmer.create({
      data: {
        farmerId: 'FR-PENDING',
        userId: user.id,
        fullName: 'New Pending Farmer',
        mobileNumber: '9999999999',
        fullAddress: 'Test Address',
        farmLocation: 'Test Location',
        animalCategories: 'Cattle',
        approvalStatus: 'PENDING'
      }
    });
    console.log("Created pending farmer!");
  } else {
    console.log("Pending farmer already exists.");
  }
}

addPendingFarmer().catch(console.error).finally(() => prisma.$disconnect());
