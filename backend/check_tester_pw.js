const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function checkTesterPassword() {
  const user = await prisma.user.findUnique({
    where: { email: 'tester1@example.com' }
  });

  console.log("Tester user found:", !!user);
  if (user) {
    const isPass123 = await bcrypt.compare("Password@123", user.passwordHash);
    const isFssai123 = await bcrypt.compare("Fssai@123", user.passwordHash);
    const isTester123 = await bcrypt.compare("Tester@123", user.passwordHash);
    console.log("Password@123 match:", isPass123);
    console.log("Fssai@123 match:", isFssai123);
    console.log("Tester@123 match:", isTester123);

    // If needed, reset password to Password@123
    const newHash = await bcrypt.hash("Password@123", 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newHash }
    });
    console.log("Password explicitly set to Password@123 for tester1@example.com");
  }
}

checkTesterPassword().catch(console.error).finally(() => prisma.$disconnect());
