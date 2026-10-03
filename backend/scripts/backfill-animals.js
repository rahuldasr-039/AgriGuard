const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function backfill() {
  console.log("Backfilling animals with DOB, weight timestamps, and weight history...");

  const animals = await prisma.animal.findMany({
    include: { tag: true, farm: { include: { farmer: true } } }
  });

  const now = new Date();

  for (const animal of animals) {
    const tag = animal.tag?.tag || "";
    let dob = null;
    let weight = animal.weight || 400;

    if (tag === "RJ-CW1") {
      // 15 April 2024 (exactly matches user example: 2 years 5 months)
      dob = new Date("2024-04-15T00:00:00Z");
      weight = 400;
    } else if (tag === "RJ-CW2") {
      dob = new Date("2023-11-20T00:00:00Z");
      weight = 420;
    } else if (tag === "RJ-CW3") {
      dob = new Date("2024-02-10T00:00:00Z");
      weight = 390;
    } else if (tag.includes("GT")) {
      dob = new Date("2025-03-01T00:00:00Z");
      weight = animal.weight || 40;
    } else if (tag.includes("PG")) {
      dob = new Date("2025-06-15T00:00:00Z");
      weight = animal.weight || 80;
    } else if (tag.includes("BF")) {
      dob = new Date("2023-08-12T00:00:00Z");
      weight = animal.weight || 600;
    } else {
      // Default: ~2 years old
      dob = new Date("2024-05-01T00:00:00Z");
    }

    // Set last updated ~35 days ago so update is available by default
    const lastUpdated = new Date(now.getTime() - 35 * 86400000);
    const nextUpdate = new Date(lastUpdated.getTime() + 30 * 86400000);

    await prisma.animal.update({
      where: { id: animal.id },
      data: {
        dateOfBirth: dob,
        weight: weight,
        weightUnit: "kg",
        weightLastUpdatedAt: lastUpdated,
        nextWeightUpdateAt: nextUpdate
      }
    });

    // Check existing weight history
    const existingHist = await prisma.animalWeightHistory.findMany({
      where: { animalId: animal.id }
    });

    if (existingHist.length === 0) {
      // Create initial historical weights (e.g. 2 months ago, 1 month ago)
      const twoMonthsAgo = new Date(now.getTime() - 65 * 86400000);
      const oneMonthAgo = lastUpdated;

      await prisma.animalWeightHistory.createMany({
        data: [
          {
            animalId: animal.id,
            weight: Math.round((weight - 10) * 10) / 10,
            unit: "kg",
            recordedBy: animal.farm?.farmer?.fullName || "Farmer",
            recorderRole: "FARMER",
            recordedAt: twoMonthsAgo,
            source: "FARMER_PORTAL",
            notes: "Routine monthly weighing"
          },
          {
            animalId: animal.id,
            weight: weight,
            unit: "kg",
            recordedBy: animal.farm?.farmer?.fullName || "Farmer",
            recorderRole: "FARMER",
            recordedAt: oneMonthAgo,
            source: "FARMER_PORTAL",
            notes: "Monthly weight record"
          }
        ]
      });
    }
  }

  console.log(`Backfill complete for ${animals.length} animals.`);
  await prisma.$disconnect();
}

backfill().catch(err => {
  console.error(err);
  process.exit(1);
});
