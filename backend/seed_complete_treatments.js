const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding complete synchronized treatments and withdrawals for Rajesh...");

  // Find Rajesh
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'farmer1@gmail.com' },
        { email: 'farmer1@example.com' }
      ]
    },
    include: { farmerProfile: { include: { assignedVet: true } } }
  });

  if (!user || !user.farmerProfile) {
    console.error("Rajesh not found!");
    return;
  }

  const vet = await prisma.veterinarian.findFirst();
  if (!vet) {
    console.error("No vet found!");
    return;
  }

  const tags = await prisma.animalTag.findMany({
    where: {
      tag: { in: ['RJ-CW1', 'RJ-CW2', 'RJ-CW3', 'RJ-GT1', 'RJ-GT2', 'RJ-PG1', 'RJ-PG2', 'RJ-BF1', 'RJ-BF2', 'RJ-FS-B1', 'RJ-CH-B1'] }
    },
    include: { animal: true, batch: true }
  });

  const tagMap = {};
  tags.forEach(t => {
    tagMap[t.tag] = t;
  });

  console.log("Available tags for Rajesh:", Object.keys(tagMap));

  // Clean all existing treatments/vaccinations/withdrawals for Rajesh's tags
  const tagDbIds = tags.map(t => t.id);
  await prisma.withdrawalRecord.deleteMany({ where: { treatment: { tagId: { in: tagDbIds } } } });
  await prisma.aMURecord.deleteMany({ where: { tagId: { in: tagDbIds } } });
  await prisma.treatment.deleteMany({ where: { tagId: { in: tagDbIds } } });
  await prisma.vaccination.deleteMany({ where: { tagId: { in: tagDbIds } } });

  // 1. Cow (RJ-CW1) - Amoxicillin (Active / DO NOT USE)
  if (tagMap['RJ-CW1']) {
    const t1 = await prisma.treatment.create({
      data: {
        tagId: tagMap['RJ-CW1'].id,
        vetId: vet.id,
        medicineName: "Amoxicillin",
        activeIngredient: "Amoxicillin",
        dose: 10,
        doseUnit: "mg/kg",
        route: "IM",
        dateAdministered: new Date("2026-09-01"),
        foodProduct: "Milk",
        status: "WITHDRAWAL ACTIVE"
      }
    });
    await prisma.withdrawalRecord.create({
      data: {
        treatmentId: t1.id,
        foodProduct: "Milk",
        withdrawalPeriod: 7,
        unit: "days",
        safeFromDate: new Date("2026-09-08"),
        status: "WAIT UNTIL 2026-09-08"
      }
    });
  }

  // 2. Pig (RJ-PG1) - Florfenicol (Active / DO NOT USE)
  if (tagMap['RJ-PG1']) {
    const t2 = await prisma.treatment.create({
      data: {
        tagId: tagMap['RJ-PG1'].id,
        vetId: vet.id,
        medicineName: "Florfenicol",
        activeIngredient: "Florfenicol",
        dose: 20,
        doseUnit: "mg/kg",
        route: "IM",
        dateAdministered: new Date("2026-08-25"),
        foodProduct: "Pork",
        status: "WITHDRAWAL ACTIVE"
      }
    });
    await prisma.withdrawalRecord.create({
      data: {
        treatmentId: t2.id,
        foodProduct: "Pork",
        withdrawalPeriod: 14,
        unit: "days",
        safeFromDate: new Date("2026-09-08"),
        status: "WAIT UNTIL 2026-09-08"
      }
    });
  }

  // 3. Chicken (RJ-CH-B1) - Newcastle Disease Vaccine (Completed)
  if (tagMap['RJ-CH-B1']) {
    await prisma.vaccination.create({
      data: {
        tagId: tagMap['RJ-CH-B1'].id,
        vetId: vet.id,
        vaccineName: "Newcastle Disease Vaccine",
        amountInjected: 0.5,
        unit: "ml",
        route: "Subcutaneous",
        dateOfInjection: new Date("2026-08-15")
      }
    });
  }

  // 4. Fish (RJ-FS-B1) - Oxytetracycline (Completed / SAFE TO USE)
  if (tagMap['RJ-FS-B1']) {
    const t3 = await prisma.treatment.create({
      data: {
        tagId: tagMap['RJ-FS-B1'].id,
        vetId: vet.id,
        medicineName: "Oxytetracycline",
        activeIngredient: "Oxytetracycline",
        dose: 50,
        doseUnit: "mg/kg",
        route: "Oral",
        dateAdministered: new Date("2026-08-01"),
        foodProduct: "Fish",
        status: "COMPLETED"
      }
    });
    await prisma.withdrawalRecord.create({
      data: {
        treatmentId: t3.id,
        foodProduct: "Fish",
        withdrawalPeriod: 21,
        unit: "days",
        safeFromDate: new Date("2026-08-22"),
        status: "SAFE TO USE"
      }
    });
  }

  // 5. Goat (RJ-GT1) - Ivermectin (Completed / SAFE TO USE)
  if (tagMap['RJ-GT1']) {
    const t4 = await prisma.treatment.create({
      data: {
        tagId: tagMap['RJ-GT1'].id,
        vetId: vet.id,
        medicineName: "Ivermectin",
        activeIngredient: "Ivermectin",
        dose: 0.2,
        doseUnit: "mg/kg",
        route: "SC",
        dateAdministered: new Date("2026-07-15"),
        foodProduct: "Meat",
        status: "COMPLETED"
      }
    });
    await prisma.withdrawalRecord.create({
      data: {
        treatmentId: t4.id,
        foodProduct: "Meat",
        withdrawalPeriod: 28,
        unit: "days",
        safeFromDate: new Date("2026-08-12"),
        status: "SAFE TO USE"
      }
    });
  }

  // 6. Buffalo (RJ-BF1) - FMD Vaccine (Completed)
  if (tagMap['RJ-BF1']) {
    await prisma.vaccination.create({
      data: {
        tagId: tagMap['RJ-BF1'].id,
        vetId: vet.id,
        vaccineName: "Foot & Mouth Disease (FMD) Vaccine",
        amountInjected: 2.0,
        unit: "ml",
        route: "IM",
        dateOfInjection: new Date("2026-07-01")
      }
    });
  }

  console.log("Successfully seeded full treatment & withdrawal ecosystem for Rajesh!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
