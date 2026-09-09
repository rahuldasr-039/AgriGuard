const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Find Farmer 3 user
  let farmer3User = await prisma.user.findFirst({ where: { email: 'farmer3@example.com' } });
  
  if (farmer3User) {
    // Update Farmer 3 to have the email farmer1@gmail.com
    await prisma.user.update({
      where: { id: farmer3User.id },
      data: { email: 'farmer1@gmail.com' }
    });
    
    // Find the farmer profile
    let farmer3Profile = await prisma.farmer.findFirst({ where: { userId: farmer3User.id } });
    
    if (farmer3Profile) {
      await prisma.farmer.update({
        where: { id: farmer3Profile.id },
        data: { fullName: 'RAJESH', animalCategories: 'Cow, Goat, Pig, Fish, Chicken, Buffalo' }
      });
      
      let farmer3Farm = await prisma.farm.findFirst({ where: { farmerId: farmer3Profile.id } });
      if (farmer3Farm) {
        // Delete all his animals
        const animals = await prisma.animal.findMany({ where: { farmId: farmer3Farm.id }, include: { tag: true } });
        const batches = await prisma.animalBatch.findMany({ where: { farmId: farmer3Farm.id }, include: { tag: true } });
        
        await prisma.animal.deleteMany({ where: { farmId: farmer3Farm.id } });
        await prisma.animalBatch.deleteMany({ where: { farmId: farmer3Farm.id } });
        
        const tagIds = [...animals.map(a => a.tag?.id).filter(Boolean), ...batches.map(b => b.tag?.id).filter(Boolean)];
        if (tagIds.length > 0) {
          await prisma.animalTag.deleteMany({ where: { id: { in: tagIds } } });
        }
        
        // Add 3 cows, 2 goats, 2 pigs, 2 buffalo (Individual)
        for (let i=1; i<=3; i++) {
           await prisma.animal.create({ data: { farmId: farmer3Farm.id, category: 'Cow', species: 'Bovine', weight: 400, tag: { create: { tag: `R3-CW${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: farmer3Farm.id, category: 'Goat', species: 'Caprine', weight: 40, tag: { create: { tag: `R3-GT${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: farmer3Farm.id, category: 'Pig', species: 'Porcine', weight: 80, tag: { create: { tag: `R3-PG${i}`, type: 'INDIVIDUAL' } } }});
        }
        for (let i=1; i<=2; i++) {
           await prisma.animal.create({ data: { farmId: farmer3Farm.id, category: 'Buffalo', species: 'Bovine', weight: 600, tag: { create: { tag: `R3-BF${i}`, type: 'INDIVIDUAL' } } }});
        }
        
        // Add 300 fishes, 200 chicken (Batch)
        await prisma.animalBatch.create({ data: { farmId: farmer3Farm.id, category: 'Fish', species: 'Aquaculture', count: 300, avgWeight: 1, tag: { create: { tag: 'R3-FS-B1', type: 'BATCH' } } }});
        await prisma.animalBatch.create({ data: { farmId: farmer3Farm.id, category: 'Chicken', species: 'Poultry', count: 200, avgWeight: 2, tag: { create: { tag: 'R3-CH-B1', type: 'BATCH' } } }});
      }
    }
    console.log("Successfully updated Farmer 3 to be RAJESH with email farmer1@gmail.com!");
  } else {
    // If we already ran it and changed it to farmer1@gmail.com
    let existing = await prisma.user.findFirst({ where: { email: 'farmer1@gmail.com' } });
    if (existing) {
       console.log("Already updated to farmer1@gmail.com");
    } else {
       console.log("Could not find farmer3@example.com");
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
