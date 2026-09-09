const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding treatments for Rajesh with correct tags...");

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

  // Get Vet
  const vet = await prisma.veterinarian.findFirst();
  if (!vet) {
    console.error("No vet found!");
    return;
  }

  // Find Animal Tags
  const cowTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-CW1' } });
  const chickenTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-CH-B1' } });
  const goatTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-GT1' } });

  console.log("Tags found:", { cowTag: cowTag?.id, chickenTag: chickenTag?.id, goatTag: goatTag?.id });

  // Clean old treatments on these tags if any
  if (cowTag) {
    await prisma.withdrawalRecord.deleteMany({ where: { treatment: { tagId: cowTag.id } } });
    await prisma.aMURecord.deleteMany({ where: { tagId: cowTag.id } });
    await prisma.treatment.deleteMany({ where: { tagId: cowTag.id } });

    // 1. Amoxicillin on Cow (RJ-CW1)
    const t1 = await prisma.treatment.create({
      data: {
        tagId: cowTag.id,
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

  // 2. Newcastle Disease Vaccine on Chicken Batch (RJ-CH-B1)
  if (chickenTag) {
    await prisma.vaccination.deleteMany({ where: { tagId: chickenTag.id } });
    await prisma.vaccination.create({
      data: {
        tagId: chickenTag.id,
        vetId: vet.id,
        vaccineName: "Newcastle Disease Vaccine",
        amountInjected: 0.5,
        unit: "ml",
        route: "Subcutaneous",
        dateOfInjection: new Date("2026-08-15")
      }
    });
  }

  // 3. Ivermectin on Goat (RJ-GT1)
  if (goatTag) {
    await prisma.withdrawalRecord.deleteMany({ where: { treatment: { tagId: goatTag.id } } });
    await prisma.aMURecord.deleteMany({ where: { tagId: goatTag.id } });
    await prisma.treatment.deleteMany({ where: { tagId: goatTag.id } });

    const t2 = await prisma.treatment.create({
      data: {
        tagId: goatTag.id,
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
        treatmentId: t2.id,
        foodProduct: "Meat",
        withdrawalPeriod: 28,
        unit: "days",
        safeFromDate: new Date("2026-08-12"),
        status: "SAFE TO USE"
      }
    });
  }

  console.log("Successfully seeded treatments & withdrawals with correct tags for Rajesh!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
