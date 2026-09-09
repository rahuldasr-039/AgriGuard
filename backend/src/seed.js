const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function hashPassword(password) {
  return await bcrypt.hash(password, 10);
}

async function main() {
  console.log("Seeding database for SIH25007...");

  // Clear existing records
  console.log("Clearing existing data...");
  await prisma.blockchainRecord.deleteMany();
  await prisma.testResult.deleteMany();
  await prisma.withdrawalRecord.deleteMany();
  await prisma.aMURecord.deleteMany();
  await prisma.vaccination.deleteMany();
  await prisma.treatment.deleteMany();
  await prisma.animalTag.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.animalBatch.deleteMany();
  await prisma.farm.deleteMany();
  await prisma.approval.deleteMany();
  await prisma.regulator.deleteMany();
  await prisma.farmTester.deleteMany();
  await prisma.veterinarian.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();
  await prisma.medicineReference.deleteMany();
  await prisma.withdrawalReference.deleteMany();
  await prisma.mRLReference.deleteMany();

  const fssaiPasswordHash = await hashPassword("Fssai@123");
  const defaultPasswordHash = await hashPassword("Password@123");

  // 1. Create Regulator (FSSAI)
  console.log("Creating Regulator...");
  const fssaiUser = await prisma.user.create({
    data: {
      email: "fssaigovt@gmail.com",
      passwordHash: fssaiPasswordHash,
      role: "REGULATOR",
      regulatorProfile: {
        create: {
          fullName: "FSSAI Administrator",
          department: "Food Safety and Standards Authority of India",
        }
      }
    },
    include: { regulatorProfile: true }
  });

  // 2. Create Veterinarians (3+)
  console.log("Creating Veterinarians...");
  const vets = [];
  for (let i = 1; i <= 3; i++) {
    vets.push(await prisma.user.create({
      data: {
        email: `vet${i}@example.com`,
        passwordHash: defaultPasswordHash,
        role: "VETERINARIAN",
        veterinarianProfile: {
          create: {
            vetId: `VT92A7K${i}`,
            fullName: `Dr. Vet ${i}`,
            governmentId: `GV12345${i}`,
            mobileNumber: `987654321${i}`,
            address: `Vet Clinic ${i}, City`,
            qualification: "BVSc & AH",
            licenseInfo: `VCI-2026-${i}`,
            approvalStatus: "APPROVED"
          }
        }
      },
      include: { veterinarianProfile: true }
    }));
  }

  // 3. Create Farmers (5+)
  console.log("Creating Farmers...");
  const farmers = [];
  for (let i = 1; i <= 5; i++) {
    farmers.push(await prisma.user.create({
      data: {
        email: `farmer${i}@example.com`,
        passwordHash: defaultPasswordHash,
        role: "FARMER",
        farmerProfile: {
          create: {
            farmerId: `FR1029${i}`,
            fullName: `Farmer ${i}`,
            mobileNumber: `876543210${i}`,
            farmLocation: `Location ${i}, District`,
            fullAddress: `Address ${i}, State`,
            animalCategories: "Cow, Buffalo",
            approvalStatus: "APPROVED",
            assignedVetId: vets[i % 3].veterinarianProfile.id
          }
        }
      },
      include: { farmerProfile: true }
    }));
  }

  // 4. Create Farm Testers (3+)
  console.log("Creating Farm Testers...");
  for (let i = 1; i <= 3; i++) {
    await prisma.user.create({
      data: {
        email: `tester${i}@example.com`,
        passwordHash: defaultPasswordHash,
        role: "FARM_TESTER",
        farmTesterProfile: {
          create: {
            testerId: `FT72B91K${i}`,
            fullName: `Tester ${i}`,
            governmentId: `FT12345${i}`,
            mobileNumber: `765432109${i}`,
            address: `Testing Lab ${i}`,
            qualification: "MSc Dairy Technology",
            labDetails: `Govt Lab ${i}`,
            approvalStatus: "APPROVED"
          }
        }
      }
    });
  }

  // 5. Create Farms & Animals
  console.log("Creating Farms and Animals...");
  for (let i = 0; i < farmers.length; i++) {
    const farmer = farmers[i].farmerProfile;
    const farm = await prisma.farm.create({
      data: {
        farmId: `FARM${100 + i}`,
        name: `Farm ${i + 1}`,
        location: farmer.farmLocation,
        farmerId: farmer.id
      }
    });

    // Individual animals (Cows/Goats)
    for (let j = 1; j <= 5; j++) {
      await prisma.animal.create({
        data: {
          farmId: farm.id,
          category: j % 2 === 0 ? "Goat" : "Cow",
          species: j % 2 === 0 ? "Caprine" : "Bovine",
          weight: j % 2 === 0 ? 40 : 400,
          tag: {
            create: {
              tag: `CW7A29K${i}${j}`, // 8 chars unique logic
              type: "INDIVIDUAL"
            }
          }
        }
      });
    }

    // Batch animals (Chicken)
    await prisma.animalBatch.create({
      data: {
        farmId: farm.id,
        category: "Chicken",
        species: "Poultry",
        count: 500,
        avgWeight: 2,
        tag: {
          create: {
            tag: `CH4K82P${i}`,
            type: "BATCH"
          }
        }
      }
    });
  }

  // 6. Create Medicines (20+ from PDF)
  console.log("Creating Medicine References...");
  const medicinesList = [
    "Amoxicillin", "Ampicillin", "Penicillin G", "Oxytetracycline", 
    "Chlortetracycline", "Doxycycline", "Tetracycline", "Enrofloxacin", 
    "Ciprofloxacin", "Sulfamethoxazole", "Trimethoprim", "Gentamicin", 
    "Streptomycin", "Dihydrostreptomycin", "Erythromycin", "Florfenicol", 
    "Ceftiofur", "Ivermectin", "Albendazole", "Levamisole"
  ];
  
  for (const name of medicinesList) {
    const isAntiparasitic = ["Ivermectin", "Albendazole", "Levamisole"].includes(name);
    await prisma.medicineReference.create({
      data: {
        medicineName: name,
        activeIngredient: name,
        category: isAntiparasitic ? "Antiparasitics / Anthelmintics" : "Antibiotics / Antimicrobials",
        speciesApplicability: "Bovine, Caprine, Poultry",
        route: "IM",
        referenceDose: "10 mg/kg",
        withdrawalRefs: {
          create: {
            referenceId: `REF_${name.toUpperCase()}`,
            species: "Bovine",
            foodProduct: "Milk",
            route: "IM",
            value: 10,
            unit: "days",
            source: "Codex Alimentarius",
            sourceTitle: "Global AMU Standards",
            version: "v1.0",
            effectiveDate: new Date("2024-01-01"),
            lastVerifiedDate: new Date()
          }
        }
      }
    });
  }

  console.log("Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
