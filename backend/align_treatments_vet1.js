const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function alignTreatmentsWithVet1() {
  const vet1 = await prisma.veterinarian.findFirst({
    where: { fullName: 'Dr. Suresh Kumar' }
  });

  if (!vet1) {
    console.error("Dr. Suresh Kumar not found!");
    return;
  }

  // Update all treatments and vaccinations
  const updateTreatments = await prisma.treatment.updateMany({
    data: { vetId: vet1.id }
  });
  console.log("Updated treatments to Dr. Suresh Kumar:", updateTreatments.count);

  const updateVaccines = await prisma.vaccination.updateMany({
    data: { vetId: vet1.id }
  });
  console.log("Updated vaccinations to Dr. Suresh Kumar:", updateVaccines.count);
}

alignTreatmentsWithVet1().catch(console.error).finally(() => prisma.$disconnect());
