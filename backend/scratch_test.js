const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  const user = await prisma.user.findFirst({ where: { email: 'vet1@example.com' }});
  console.log("User:", user);
  
  if (user) {
    const vetProfile = await prisma.veterinarian.findUnique({ where: { userId: user.id }});
    console.log("Vet Profile:", vetProfile);
    
    if (vetProfile) {
      const farmers = await prisma.farmer.findMany({
        where: { 
          OR: [
            { assignedVetId: vetProfile.id },
            { assignedVetId: null, approvalStatus: "PENDING" }
          ]
        },
        include: { user: { select: { email: true } }, farms: true }
      });
      console.log("Farmers found:", farmers.length);
      console.log(farmers.map(f => ({ id: f.id, assignedVet: f.assignedVetId })));
    }
  }
}
test().catch(console.error).finally(() => prisma.$disconnect());
