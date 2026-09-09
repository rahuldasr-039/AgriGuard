const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMrlReferences() {
  console.log("Seeding MRL References...");
  const mrlList = [
    { referenceId: "MRL_AMOX_MILK", substance: "Amoxicillin", species: "Cow", foodProduct: "Milk", mrlValue: 0.004, unit: "mg/kg", source: "FSSAI Food Safety Standards (Contaminants, Toxins and Residues)", version: "2024.1" },
    { referenceId: "MRL_AMOX_MEAT", substance: "Amoxicillin", species: "Cow", foodProduct: "Meat", mrlValue: 0.05, unit: "mg/kg", source: "FSSAI Schedule 1", version: "2024.1" },
    { referenceId: "MRL_OXY_MILK", substance: "Oxytetracycline", species: "Cow", foodProduct: "Milk", mrlValue: 0.1, unit: "mg/kg", source: "FSSAI Regulation 2.3.2", version: "2024.1" },
    { referenceId: "MRL_OXY_FISH", substance: "Oxytetracycline", species: "Fish", foodProduct: "Fish", mrlValue: 0.1, unit: "mg/kg", source: "FSSAI Standards for Marine Products", version: "2024.1" },
    { referenceId: "MRL_ENRO_MEAT", substance: "Enrofloxacin", species: "Chicken", foodProduct: "Meat", mrlValue: 0.1, unit: "mg/kg", source: "FSSAI Veterinary Drug Residue limits", version: "2024.1" },
    { referenceId: "MRL_IVER_MEAT", substance: "Ivermectin", species: "Goat", foodProduct: "Meat", mrlValue: 0.01, unit: "mg/kg", source: "FSSAI / Codex Alimentarius MRL 42", version: "2024.1" },
    { referenceId: "MRL_FLOR_PORK", substance: "Florfenicol", species: "Pig", foodProduct: "Pork", mrlValue: 0.2, unit: "mg/kg", source: "FSSAI Regulation 2.3.2", version: "2024.1" },
    { referenceId: "MRL_CIPRO_EGGS", substance: "Ciprofloxacin", species: "Chicken", foodProduct: "Eggs", mrlValue: 0.05, unit: "mg/kg", source: "FSSAI Schedule 1", version: "2024.1" }
  ];

  for (const item of mrlList) {
    await prisma.mRLReference.upsert({
      where: { referenceId: item.referenceId },
      update: { ...item, effectiveDate: new Date("2024-01-01"), lastVerifiedDate: new Date() },
      create: { ...item, effectiveDate: new Date("2024-01-01"), lastVerifiedDate: new Date() }
    });
  }

  const count = await prisma.mRLReference.count();
  console.log(`Successfully seeded ${count} MRL references.`);
}

seedMrlReferences().catch(console.error).finally(() => prisma.$disconnect());
