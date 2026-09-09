const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function renameVet1() {
  console.log("Renaming Vet 1 to Dr. Suresh Kumar...");

  const vetUser = await prisma.user.findFirst({
    where: { email: 'vet1@example.com' },
    include: { veterinarianProfile: true }
  });

  if (!vetUser || !vetUser.veterinarianProfile) {
    console.error("Vet 1 not found!");
    return;
  }

  const newName = "Dr. Suresh Kumar";
  await prisma.veterinarian.update({
    where: { id: vetUser.veterinarianProfile.id },
    data: {
      fullName: newName,
      qualification: "BVSc & AH, MVSc (Pharmacology)",
      licenseInfo: "VCI-2024-8901",
      address: "Central Veterinary Hospital, District HQ"
    }
  });

  console.log(`Successfully updated Vet 1 profile to ${newName}!`);

  // Ensure Alerts exist in DB for Regulator
  const existingAlerts = await prisma.alert.findMany();
  if (existingAlerts.length === 0) {
    await prisma.alert.createMany({
      data: [
        {
          severity: "CRITICAL",
          title: "MRL Violation Risk Detected",
          message: "Cow (RJ-CW1) is under active withdrawal for Amoxicillin until 08/09/2026. Milk harvest restricted.",
          recipientRole: "REGULATOR"
        },
        {
          severity: "MEDIUM",
          title: "AMU Usage Threshold Warning",
          message: "Farm 3 (Rajesh) has 2 active antibiotic withdrawal periods (Amoxicillin, Florfenicol).",
          recipientRole: "REGULATOR"
        },
        {
          severity: "INFO",
          title: "Withdrawal Clearance Verified",
          message: "Goat (RJ-GT1) Ivermectin withdrawal period (28 days) cleared successfully.",
          recipientRole: "REGULATOR"
        }
      ]
    });
    console.log("Created real regulator alerts!");
  }

  // Ensure test results exist in DB for MRL Reports
  const existingTests = await prisma.testResult.findMany();
  if (existingTests.length === 0) {
    const tester = await prisma.farmTester.findFirst();
    const cowTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-CW1' } });
    const fishTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-FS-B1' } });
    const pigTag = await prisma.animalTag.findFirst({ where: { tag: 'RJ-PG1' } });

    if (tester && cowTag) {
      await prisma.testResult.create({
        data: {
          testerId: tester.id,
          farmerId: cowTag.id,
          tagId: cowTag.id,
          productType: "Milk",
          sampleId: "SMP-891023",
          sampleCollectionDate: new Date("2026-09-02"),
          testDate: new Date("2026-09-02"),
          testingLocation: "National Food Safety Lab",
          substanceDetected: "Amoxicillin",
          amountDetected: 0.002,
          unit: "mg/kg",
          testMethod: "LC-MS/MS",
          applicableMrl: 0.004,
          difference: -0.002,
          percentageOfMrl: 50.0,
          status: "SAFE"
        }
      });
    }

    if (tester && fishTag) {
      await prisma.testResult.create({
        data: {
          testerId: tester.id,
          farmerId: fishTag.id,
          tagId: fishTag.id,
          productType: "Fish",
          sampleId: "SMP-891024",
          sampleCollectionDate: new Date("2026-09-01"),
          testDate: new Date("2026-09-01"),
          testingLocation: "Marine Products Lab",
          substanceDetected: "Oxytetracycline",
          amountDetected: 0.08,
          unit: "mg/kg",
          testMethod: "HPLC",
          applicableMrl: 0.1,
          difference: -0.02,
          percentageOfMrl: 80.0,
          status: "SAFE"
        }
      });
    }

    if (tester && pigTag) {
      await prisma.testResult.create({
        data: {
          testerId: tester.id,
          farmerId: pigTag.id,
          tagId: pigTag.id,
          productType: "Pork",
          sampleId: "SMP-891025",
          sampleCollectionDate: new Date("2026-08-28"),
          testDate: new Date("2026-08-28"),
          testingLocation: "Regional Testing Center",
          substanceDetected: "Florfenicol",
          amountDetected: 0.12,
          unit: "mg/kg",
          testMethod: "LC-MS/MS",
          applicableMrl: 0.2,
          difference: -0.08,
          percentageOfMrl: 60.0,
          status: "SAFE"
        }
      });
    }

    console.log("Created real product tests!");
  }
}

renameVet1().catch(console.error).finally(() => prisma.$disconnect());
