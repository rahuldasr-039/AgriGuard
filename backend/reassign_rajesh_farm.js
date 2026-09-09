const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Reassigning all animals to Rajesh's actual farm (FARM102)...");

  // Find Rajesh
  const farmer = await prisma.farmer.findUnique({
    where: { id: 'cmtjpwytc000g6zqh1z4fp3a3' },
    include: { farms: true }
  });

  if (!farmer || farmer.farms.length === 0) {
    console.error("Rajesh or farm not found!");
    return;
  }

  const rajeshFarmId = farmer.farms[0].id;
  console.log("Rajesh Farm ID:", rajeshFarmId);

  // Clean all animals and tags across any other farm
  await prisma.withdrawalRecord.deleteMany();
  await prisma.aMURecord.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.animalBatch.deleteMany();
  await prisma.animalTag.deleteMany();

  // Create animals directly under Rajesh's Farm (FARM102)
  // 3 Cows, 2 Goats, 2 Pigs, 2 Buffalo (Individual)
  for (let i = 1; i <= 3; i++) {
    await prisma.animal.create({
      data: {
        farmId: rajeshFarmId,
        category: 'Cow',
        species: 'Bovine',
        weight: 400,
        tag: { create: { tag: `RJ-CW${i}`, type: 'INDIVIDUAL' } }
      }
    });
  }

  for (let i = 1; i <= 2; i++) {
    await prisma.animal.create({
      data: {
        farmId: rajeshFarmId,
        category: 'Goat',
        species: 'Caprine',
        weight: 40,
        tag: { create: { tag: `RJ-GT${i}`, type: 'INDIVIDUAL' } }
      }
    });
  }

  for (let i = 1; i <= 2; i++) {
    await prisma.animal.create({
      data: {
        farmId: rajeshFarmId,
        category: 'Pig',
        species: 'Porcine',
        weight: 80,
        tag: { create: { tag: `RJ-PG${i}`, type: 'INDIVIDUAL' } }
      }
    });
  }

  for (let i = 1; i <= 2; i++) {
    await prisma.animal.create({
      data: {
        farmId: rajeshFarmId,
        category: 'Buffalo',
        species: 'Bovine',
        weight: 600,
        tag: { create: { tag: `RJ-BF${i}`, type: 'INDIVIDUAL' } }
      }
    });
  }

  // 300 Fishes, 200 Chickens (Batch)
  await prisma.animalBatch.create({
    data: {
      farmId: rajeshFarmId,
      category: 'Fish',
      species: 'Aquaculture',
      count: 300,
      avgWeight: 1,
      tag: { create: { tag: 'RJ-FS-B1', type: 'BATCH' } }
    }
  });

  await prisma.animalBatch.create({
    data: {
      farmId: rajeshFarmId,
      category: 'Chicken',
      species: 'Poultry',
      count: 200,
      avgWeight: 2,
      tag: { create: { tag: 'RJ-CH-B1', type: 'BATCH' } }
    }
  });

  // Re-seed Rakul's animals on Rakul's farm
  const rakul = await prisma.farmer.findFirst({
    where: { farmerId: 'FR-RAKUL' },
    include: { farms: true }
  });

  if (rakul && rakul.farms.length > 0) {
    const rFarmId = rakul.farms[0].id;
    for (let i = 1; i <= 10; i++) {
      await prisma.animal.create({
        data: { farmId: rFarmId, category: 'Cow', species: 'Bovine', weight: 400, tag: { create: { tag: `RK-CW${i}`, type: 'INDIVIDUAL' } } }
      });
    }
    for (let i = 1; i <= 15; i++) {
      await prisma.animal.create({
        data: { farmId: rFarmId, category: 'Pig', species: 'Porcine', weight: 80, tag: { create: { tag: `RK-PG${i}`, type: 'INDIVIDUAL' } } }
      });
    }
    await prisma.animalBatch.create({
      data: { farmId: rFarmId, category: 'Prawn', species: 'Aquaculture', count: 40, avgWeight: 0.1, tag: { create: { tag: 'RK-PR-B1', type: 'BATCH' } } }
    });
  }

  console.log("Re-seeded all animals cleanly!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
