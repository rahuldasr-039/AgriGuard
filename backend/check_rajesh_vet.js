const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkRajeshVet() {
  const rajesh = await prisma.farmer.findFirst({
    where: { fullName: 'RAJESH' },
    include: { assignedVet: true }
  });

  console.log("Rajesh's profile:", {
    fullName: rajesh.fullName,
    assignedVetId: rajesh.assignedVetId,
    assignedVetName: rajesh.assignedVet?.fullName
  });

  const vet1 = await prisma.veterinarian.findFirst({
    where: { fullName: 'Dr. Suresh Kumar' }
  });

  if (rajesh && vet1 && rajesh.assignedVetId !== vet1.id) {
    await prisma.farmer.update({
      where: { id: rajesh.id },
      data: { assignedVetId: vet1.id }
    });
    console.log("Assigned Dr. Suresh Kumar as Rajesh's assigned vet!");
  }
}

checkRajeshVet().catch(console.error).finally(() => prisma.$disconnect());
