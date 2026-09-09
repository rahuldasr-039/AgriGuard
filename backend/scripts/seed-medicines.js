const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MEDICINE_CATALOG = [
  {
    name: "Oxytetracycline",
    ingredient: "Oxytetracycline HCl",
    category: "Antibiotics / Tetracyclines",
    species: "Chicken, Pig, Prawn, Fish, Cow, Goat, Sheep",
    route: "IM / Feed",
    dose: "10-20 mg/kg",
    defaultProduct: "Milk / Meat",
    withdrawalDays: 7
  },
  {
    name: "Chlortetracycline",
    ingredient: "Chlortetracycline HCl",
    category: "Antibiotics / Tetracyclines",
    species: "Chicken",
    route: "Oral (Feed / Water)",
    dose: "20 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 7
  },
  {
    name: "Doxycycline",
    ingredient: "Doxycycline Hyclate",
    category: "Antibiotics / Tetracyclines",
    species: "Chicken",
    route: "Oral (Water)",
    dose: "10-15 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 7
  },
  {
    name: "Amoxicillin",
    ingredient: "Amoxicillin Trihydrate",
    category: "Antibiotics / Beta-Lactams",
    species: "Chicken, Pig",
    route: "Oral / IM",
    dose: "15 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 7
  },
  {
    name: "Ampicillin",
    ingredient: "Ampicillin Sodium",
    category: "Antibiotics / Beta-Lactams",
    species: "Chicken",
    route: "Oral / IM",
    dose: "10-20 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 7
  },
  {
    name: "Enrofloxacin",
    ingredient: "Enrofloxacin",
    category: "Antibiotics / Fluoroquinolones",
    species: "Chicken, Goat, Sheep",
    route: "Oral / SC",
    dose: "5-10 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 10
  },
  {
    name: "Tylosin",
    ingredient: "Tylosin Tartrate",
    category: "Antibiotics / Macrolides",
    species: "Pig",
    route: "IM / Oral",
    dose: "10 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 14
  },
  {
    name: "Tiamulin",
    ingredient: "Tiamulin Hydrogen Fumarate",
    category: "Antibiotics / Pleuromutilins",
    species: "Pig",
    route: "Oral (Feed / Water)",
    dose: "8-10 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 7
  },
  {
    name: "Apramycin",
    ingredient: "Apramycin Sulfate",
    category: "Antibiotics / Aminoglycosides",
    species: "Pig",
    route: "Oral (Water)",
    dose: "20-40 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 14
  },
  {
    name: "Neomycin",
    ingredient: "Neomycin Sulfate",
    category: "Antibiotics / Aminoglycosides",
    species: "Pig",
    route: "Oral",
    dose: "10 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 14
  },
  {
    name: "Erythromycin",
    ingredient: "Erythromycin",
    category: "Antibiotics / Macrolides",
    species: "Prawn",
    route: "Immersion / Feed",
    dose: "50-100 mg/kg biomass",
    defaultProduct: "Meat",
    withdrawalDays: 14
  },
  {
    name: "Florfenicol",
    ingredient: "Florfenicol",
    category: "Antibiotics / Amphenicols",
    species: "Prawn, Fish",
    route: "Oral (Feed)",
    dose: "10 mg/kg biomass",
    defaultProduct: "Fish / Prawn Meat",
    withdrawalDays: 15
  },
  {
    name: "Sulfadiazine + Trimethoprim",
    ingredient: "Sulfadiazine + Trimethoprim (5:1)",
    category: "Antibiotics / Potentiated Sulfonamides",
    species: "Fish",
    route: "Oral (Feed)",
    dose: "30 mg/kg biomass",
    defaultProduct: "Fish Meat",
    withdrawalDays: 10
  },
  {
    name: "Procaine Penicillin G",
    ingredient: "Procaine Benzylpenicillin",
    category: "Antibiotics / Beta-Lactams",
    species: "Cow",
    route: "Intramuscular (IM)",
    dose: "20,000 IU/kg",
    defaultProduct: "Milk",
    withdrawalDays: 5
  },
  {
    name: "Ceftiofur",
    ingredient: "Ceftiofur Hydrochloride",
    category: "Antibiotics / Cephalosporins (3rd Gen)",
    species: "Cow",
    route: "Subcutaneous (SC) / IM",
    dose: "1-2 mg/kg",
    defaultProduct: "Milk",
    withdrawalDays: 4
  },
  {
    name: "Tulathromycin",
    ingredient: "Tulathromycin",
    category: "Antibiotics / Macrolides (Triamilide)",
    species: "Cow",
    route: "Subcutaneous (SC)",
    dose: "2.5 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 18
  },
  {
    name: "Tilmicosin",
    ingredient: "Tilmicosin Phosphate",
    category: "Antibiotics / Macrolides",
    species: "Cow",
    route: "Subcutaneous (SC)",
    dose: "10 mg/kg",
    defaultProduct: "Meat",
    withdrawalDays: 28
  },
  {
    name: "Penicillin G + Streptomycin",
    ingredient: "Procaine Penicillin G + Dihydrostreptomycin",
    category: "Antibiotics / Beta-Lactam + Aminoglycoside",
    species: "Goat, Sheep",
    route: "Intramuscular (IM)",
    dose: "10 mg/kg",
    defaultProduct: "Milk / Meat",
    withdrawalDays: 5
  }
];

async function seedMedicines() {
  console.log("Upserting 18 statutory medicines into database...");
  for (const med of MEDICINE_CATALOG) {
    const existing = await prisma.medicineReference.findFirst({
      where: { medicineName: med.name }
    });

    if (!existing) {
      await prisma.medicineReference.create({
        data: {
          medicineName: med.name,
          activeIngredient: med.ingredient,
          category: med.category,
          speciesApplicability: med.species,
          route: med.route,
          referenceDose: med.dose,
          withdrawalRefs: {
            create: {
              referenceId: `REF_${med.name.replace(/[^a-zA-Z0-9]/g, "_").toUpperCase()}`,
              species: med.species.split(",")[0].trim(),
              foodProduct: med.defaultProduct.includes("Milk") ? "Milk" : "Meat",
              route: med.route.split("/")[0].trim(),
              value: med.withdrawalDays,
              unit: "days",
              source: "FSSAI / Codex Alimentarius",
              sourceTitle: "Statutory MRL & Withdrawal Standards",
              version: "v2.0",
              effectiveDate: new Date("2024-01-01"),
              lastVerifiedDate: new Date()
            }
          }
        }
      });
      console.log(`Created: ${med.name}`);
    } else {
      await prisma.medicineReference.update({
        where: { id: existing.id },
        data: {
          speciesApplicability: med.species,
          activeIngredient: med.ingredient,
          category: med.category,
          referenceDose: med.dose
        }
      });
      console.log(`Updated: ${med.name}`);
    }
  }
  console.log("Completed seeding statutory medicines!");
}

seedMedicines()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
