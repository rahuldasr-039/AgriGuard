const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("=== STEP 1: CLEANING UP RECORDS BEFORE 1/9/2026 ===");
  const cutoffDate = new Date("2026-09-01T00:00:00.000Z");

  // 1. Treatments before 1/9/2026
  const oldTreatments = await prisma.treatment.findMany({
    where: { dateAdministered: { lt: cutoffDate } },
    select: { id: true, medicineName: true, dateAdministered: true, tag: { select: { tag: true } } }
  });
  console.log(`Found ${oldTreatments.length} treatments before 1/9/2026:`, oldTreatments.map(t => `${t.medicineName} (${t.tag?.tag}) on ${t.dateAdministered.toISOString().split('T')[0]}`));

  const oldTreatmentIds = oldTreatments.map(t => t.id);
  if (oldTreatmentIds.length > 0) {
    await prisma.withdrawalRecord.deleteMany({ where: { treatmentId: { in: oldTreatmentIds } } });
    await prisma.aMURecord.deleteMany({ where: { treatmentId: { in: oldTreatmentIds } } });
    await prisma.blockchainRecord.deleteMany({ where: { treatmentId: { in: oldTreatmentIds } } });
    await prisma.treatment.deleteMany({ where: { id: { in: oldTreatmentIds } } });
    console.log("Deleted old treatments and related records.");
  }

  // 2. Vaccinations before 1/9/2026
  const oldVaccinations = await prisma.vaccination.findMany({
    where: { dateOfInjection: { lt: cutoffDate } },
    select: { id: true, vaccineName: true, dateOfInjection: true, tag: { select: { tag: true } } }
  });
  console.log(`Found ${oldVaccinations.length} vaccinations before 1/9/2026:`, oldVaccinations.map(v => `${v.vaccineName} (${v.tag?.tag}) on ${v.dateOfInjection.toISOString().split('T')[0]}`));

  const oldVaccinationIds = oldVaccinations.map(v => v.id);
  if (oldVaccinationIds.length > 0) {
    await prisma.blockchainRecord.deleteMany({ where: { vaccinationId: { in: oldVaccinationIds } } });
    await prisma.vaccination.deleteMany({ where: { id: { in: oldVaccinationIds } } });
    console.log("Deleted old vaccinations and related records.");
  }

  // 3. TestResults before 1/9/2026
  const oldTests = await prisma.testResult.findMany({
    where: { testDate: { lt: cutoffDate } },
    select: { id: true, sampleId: true, testDate: true }
  });
  console.log(`Found ${oldTests.length} tests before 1/9/2026:`, oldTests.map(t => `${t.sampleId} on ${t.testDate.toISOString().split('T')[0]}`));
  const oldTestIds = oldTests.map(t => t.id);
  if (oldTestIds.length > 0) {
    await prisma.aIReport.deleteMany({ where: { testResultId: { in: oldTestIds } } });
    await prisma.blockchainRecord.deleteMany({ where: { testResultId: { in: oldTestIds } } });
    await prisma.testResult.deleteMany({ where: { id: { in: oldTestIds } } });
    console.log("Deleted old test results.");
  }

  // 4. Alerts referencing deleted treatments (e.g. Florfenicol, Ivermectin)
  const oldAlerts = await prisma.alert.findMany({
    where: {
      OR: [
        { message: { contains: "Florfenicol" } },
        { message: { contains: "Ivermectin" } }
      ]
    }
  });
  if (oldAlerts.length > 0) {
    await prisma.alert.deleteMany({
      where: { id: { in: oldAlerts.map(a => a.id) } }
    });
    console.log(`Deleted ${oldAlerts.length} outdated alerts referencing pre-1/9/2026 treatments.`);
  }

  console.log("\n=== STEP 2: SYNCHRONIZING ANIMAL STATUSES ACCORDING TO RECORDED TREATMENTS ===");
  const now = new Date();

  // Find all animal tags with active withdrawal treatments
  const tags = await prisma.animalTag.findMany({
    include: {
      animal: true,
      batch: true,
      treatments: {
        include: { withdrawal: true }
      }
    }
  });

  for (const t of tags) {
    const activeWithdrawals = t.treatments.filter(tr => {
      if (!tr.withdrawal) return false;
      return new Date(tr.withdrawal.safeFromDate) > now;
    });

    const isWithdrawal = activeWithdrawals.length > 0;
    const targetStatus = isWithdrawal ? "WITHDRAWAL" : "SAFE";

    if (t.animal) {
      await prisma.animal.update({
        where: { id: t.animal.id },
        data: { status: targetStatus }
      });
      console.log(`Animal ${t.animal.category} (${t.tag}): status -> ${targetStatus} (active withdrawals: ${activeWithdrawals.length})`);
    } else if (t.batch) {
      await prisma.animalBatch.update({
        where: { id: t.batch.id },
        data: { status: targetStatus }
      });
      console.log(`Batch ${t.batch.category} (${t.tag}): status -> ${targetStatus} (active withdrawals: ${activeWithdrawals.length})`);
    }
  }

  console.log("\n=== STEP 3: CURRENT ACTIVE TREATMENTS FROM 1/9/2026 ===");
  const currentTreatments = await prisma.treatment.findMany({
    include: { tag: true, withdrawal: true },
    orderBy: { dateAdministered: 'desc' }
  });
  currentTreatments.forEach(t => {
    console.log(`Treatment: ${t.medicineName} | Tag: ${t.tag?.tag} | Date: ${t.dateAdministered.toISOString().split('T')[0]} | SafeFrom: ${t.withdrawal?.safeFromDate?.toISOString().split('T')[0]} | Status: ${t.status}`);
  });

  console.log("\n=== STEP 4: CURRENT VACCINATIONS FROM 1/9/2026 ===");
  const currentVaccinations = await prisma.vaccination.findMany({
    include: { tag: true },
    orderBy: { dateOfInjection: 'desc' }
  });
  currentVaccinations.forEach(v => {
    console.log(`Vaccination: ${v.vaccineName} | Tag: ${v.tag?.tag} | Date: ${v.dateOfInjection.toISOString().split('T')[0]}`);
  });

  console.log("\n=== STEP 5: CURRENT ANIMALS & THEIR STATUS ===");
  const allAnimals = await prisma.animal.findMany({
    include: { tag: true }
  });
  allAnimals.forEach(a => {
    console.log(`Animal: ${a.category} | Tag: ${a.tag?.tag} | Status: ${a.status}`);
  });

  const allBatches = await prisma.animalBatch.findMany({
    include: { tag: true }
  });
  allBatches.forEach(b => {
    console.log(`Batch: ${b.category} | Tag: ${b.tag?.tag} | Status: ${b.status}`);
  });

  console.log("\nDone!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
