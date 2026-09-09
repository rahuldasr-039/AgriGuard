const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. Update Farmer 1 to Rajesh
  let rajeshUser = await prisma.user.findFirst({ where: { email: 'farmer1@example.com' } });
  
  if (rajeshUser) {
    let rajeshFarmer = await prisma.farmer.findFirst({ where: { userId: rajeshUser.id } });
    if (rajeshFarmer) {
      await prisma.farmer.update({
        where: { id: rajeshFarmer.id },
        data: { fullName: 'RAJESH', animalCategories: 'Cow, Goat, Pig, Fish, Chicken, Buffalo' }
      });
      
      let rajeshFarm = await prisma.farm.findFirst({ where: { farmerId: rajeshFarmer.id } });
      if (rajeshFarm) {
        const animals = await prisma.animal.findMany({ where: { farmId: rajeshFarm.id }, include: { tag: true } });
        const batches = await prisma.animalBatch.findMany({ where: { farmId: rajeshFarm.id }, include: { tag: true } });
        
        await prisma.animal.deleteMany({ where: { farmId: rajeshFarm.id } });
        await prisma.animalBatch.deleteMany({ where: { farmId: rajeshFarm.id } });
        
        const tagIds = [...animals.map(a => a.tag?.id).filter(Boolean), ...batches.map(b => b.tag?.id).filter(Boolean)];
        if (tagIds.length > 0) {
          await prisma.animalTag.deleteMany({ where: { id: { in: tagIds } } });
        }
        
        // Add 3 cows, 2 goats, 2 pigs, 2 buffalo (Individual)
        for (let i=1; i<=3; i++) {
           await prisma.animal.create({ data: { farmId: rajeshFarm.id, category: 'Cow', species: 'Bovine', weight: 400, tag: { create: { tag: `RJ-CW${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: rajeshFarm.id, category: 'Goat', species: 'Caprine', weight: 40, tag: { create: { tag: `RJ-GT${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: rajeshFarm.id, category: 'Pig', species: 'Porcine', weight: 80, tag: { create: { tag: `RJ-PG${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: rajeshFarm.id, category: 'Buffalo', species: 'Bovine', weight: 600, tag: { create: { tag: `RJ-BF${i}`, type: 'INDIVIDUAL' } } }});
        }
        
        // Add 300 fishes, 200 chicken (Batch)
        await prisma.animalBatch.create({ data: { farmId: rajeshFarm.id, category: 'Fish', species: 'Aquaculture', count: 300, avgWeight: 1, tag: { create: { tag: 'RJ-FS-B1', type: 'BATCH' } } }});
        await prisma.animalBatch.create({ data: { farmId: rajeshFarm.id, category: 'Chicken', species: 'Poultry', count: 200, avgWeight: 2, tag: { create: { tag: 'RJ-CH-B1', type: 'BATCH' } } }});
      }
    }
  }

  // 2. Create or Update RAKUL
  let rakulUser = await prisma.user.findFirst({ where: { email: 'rakul@example.com' } });
  if (!rakulUser) {
    rakulUser = await prisma.user.create({
      data: {
        email: 'rakul@example.com',
        passwordHash: await bcrypt.hash('Password@123', 10),
        role: 'FARMER'
      }
    });
  }
  
  let rakulFarmer = await prisma.farmer.findFirst({ where: { userId: rakulUser.id } });
  if (!rakulFarmer) {
    rakulFarmer = await prisma.farmer.create({
      data: {
        farmerId: 'FR-RAKUL',
        userId: rakulUser.id,
        fullName: 'RAKUL',
        mobileNumber: '9999999998',
        fullAddress: 'Rakul Address',
        farmLocation: 'Rakul Location',
        animalCategories: 'Cow, Pig, Prawns',
        approvalStatus: 'PENDING',
        assignedVetId: null
      }
    });
  } else {
    rakulFarmer = await prisma.farmer.update({
      where: { id: rakulFarmer.id },
      data: {
        fullName: 'RAKUL',
        approvalStatus: 'PENDING',
        assignedVetId: null
      }
    });
  }
  
  let rakulFarm = await prisma.farm.findFirst({ where: { farmerId: rakulFarmer.id } });
  if (!rakulFarm) {
    rakulFarm = await prisma.farm.create({
      data: {
        farmId: 'FARM-RAKUL',
        name: 'Rakul Farm',
        location: 'Rakul Location',
        farmerId: rakulFarmer.id
      }
    });
  }
  
  const rakulAnimals = await prisma.animal.findMany({ where: { farmId: rakulFarm.id }, include: { tag: true } });
  const rakulBatches = await prisma.animalBatch.findMany({ where: { farmId: rakulFarm.id }, include: { tag: true } });
  
  await prisma.animal.deleteMany({ where: { farmId: rakulFarm.id } });
  await prisma.animalBatch.deleteMany({ where: { farmId: rakulFarm.id } });
  
  const rakulTagIds = [...rakulAnimals.map(a => a.tag?.id).filter(Boolean), ...rakulBatches.map(b => b.tag?.id).filter(Boolean)];
  if (rakulTagIds.length > 0) {
    await prisma.animalTag.deleteMany({ where: { id: { in: rakulTagIds } } });
  }

  // Rakul: 10 cows, 15 pigs (Individual), 40 prawns (Batch)
  for (let i=1; i<=10; i++) {
     await prisma.animal.create({ data: { farmId: rakulFarm.id, category: 'Cow', species: 'Bovine', weight: 400, tag: { create: { tag: `RK-CW${i}`, type: 'INDIVIDUAL' } } }});
  }
  for (let i=1; i<=15; i++) {
     await prisma.animal.create({ data: { farmId: rakulFarm.id, category: 'Pig', species: 'Porcine', weight: 80, tag: { create: { tag: `RK-PG${i}`, type: 'INDIVIDUAL' } } }});
  }
  await prisma.animalBatch.create({ data: { farmId: rakulFarm.id, category: 'Prawn', species: 'Aquaculture', count: 40, avgWeight: 0.1, tag: { create: { tag: 'RK-PR-B1', type: 'BATCH' } } }});

  console.log("Data successfully applied for Rajesh and Rakul!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
