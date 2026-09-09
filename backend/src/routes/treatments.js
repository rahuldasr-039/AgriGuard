const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { calculateWithdrawal } = require("../services/withdrawalEngine");

const router = express.Router();
const prisma = new PrismaClient();

// Animal-wise Statutory Medicine Mapping
const ANIMAL_MEDICINE_MAP = {
  "Chicken": [
    "Oxytetracycline",
    "Chlortetracycline",
    "Doxycycline",
    "Amoxicillin",
    "Ampicillin",
    "Enrofloxacin"
  ],
  "Poultry": [
    "Oxytetracycline",
    "Chlortetracycline",
    "Doxycycline",
    "Amoxicillin",
    "Ampicillin",
    "Enrofloxacin"
  ],
  "Pig": [
    "Tylosin",
    "Tiamulin",
    "Oxytetracycline",
    "Amoxicillin",
    "Apramycin",
    "Neomycin"
  ],
  "Swine": [
    "Tylosin",
    "Tiamulin",
    "Oxytetracycline",
    "Amoxicillin",
    "Apramycin",
    "Neomycin"
  ],
  "Prawn": [
    "Oxytetracycline",
    "Erythromycin",
    "Florfenicol"
  ],
  "Shrimp": [
    "Oxytetracycline",
    "Erythromycin",
    "Florfenicol"
  ],
  "Fish": [
    "Oxytetracycline",
    "Florfenicol",
    "Sulfadiazine + Trimethoprim"
  ],
  "Cow": [
    "Procaine Penicillin G",
    "Ceftiofur",
    "Tulathromycin",
    "Tilmicosin",
    "Oxytetracycline"
  ],
  "Cattle": [
    "Procaine Penicillin G",
    "Ceftiofur",
    "Tulathromycin",
    "Tilmicosin",
    "Oxytetracycline"
  ],
  "Buffalo": [
    "Procaine Penicillin G",
    "Ceftiofur",
    "Tulathromycin",
    "Tilmicosin",
    "Oxytetracycline"
  ],
  "Goat": [
    "Penicillin G + Streptomycin",
    "Oxytetracycline",
    "Enrofloxacin"
  ],
  "Sheep": [
    "Penicillin G + Streptomycin",
    "Oxytetracycline",
    "Enrofloxacin"
  ]
};

function getApprovedMedicinesForAnimal(animalCategory) {
  if (!animalCategory) return [];
  const lower = animalCategory.toLowerCase();
  if (lower.includes("chicken") || lower.includes("poultry")) return ANIMAL_MEDICINE_MAP["Chicken"];
  if (lower.includes("pig") || lower.includes("swine") || lower.includes("porcine")) return ANIMAL_MEDICINE_MAP["Pig"];
  if (lower.includes("prawn") || lower.includes("shrimp")) return ANIMAL_MEDICINE_MAP["Prawn"];
  if (lower.includes("fish")) return ANIMAL_MEDICINE_MAP["Fish"];
  if (lower.includes("cow") || lower.includes("cattle") || lower.includes("bovine") || lower.includes("buffalo")) return ANIMAL_MEDICINE_MAP["Cow"];
  if (lower.includes("goat") || lower.includes("caprine")) return ANIMAL_MEDICINE_MAP["Goat"];
  if (lower.includes("sheep") || lower.includes("ovine")) return ANIMAL_MEDICINE_MAP["Sheep"];
  return [];
}

// GET /api/v1/treatments/medicines - Get approved medicines optionally filtered by animalType
router.get("/medicines", (req, res) => {
  const { animalType } = req.query;
  if (animalType) {
    const meds = getApprovedMedicinesForAnimal(animalType);
    return res.json({ animalType, medicines: meds });
  }
  return res.json({
    categories: {
      "Chicken / Poultry": ANIMAL_MEDICINE_MAP["Chicken"],
      "Pig / Swine": ANIMAL_MEDICINE_MAP["Pig"],
      "Prawn / Shrimp": ANIMAL_MEDICINE_MAP["Prawn"],
      "Fish": ANIMAL_MEDICINE_MAP["Fish"],
      "Cow / Cattle": ANIMAL_MEDICINE_MAP["Cow"],
      "Goat": ANIMAL_MEDICINE_MAP["Goat"],
      "Sheep": ANIMAL_MEDICINE_MAP["Sheep"]
    }
  });
});

// Vet administers medicine / treatment
router.post("/", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { 
      tagId, medicineName, activeIngredient, dose, doseUnit, 
      route, dateAdministered, foodProduct, animalType 
    } = req.body;

    const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
    if (!vet) return res.status(403).json({ error: "Veterinarian profile not found" });

    // Look up tag
    let tag = await prisma.animalTag.findFirst({ 
      where: { OR: [{ tag: tagId }, { id: tagId }] },
      include: { animal: { include: { farm: true } }, batch: { include: { farm: true } } }
    });
    
    if (!tag) {
      return res.status(404).json({ error: `Animal / Batch tag '${tagId}' not found. Please check registered tag ID.` });
    }

    const targetAnimalCategory = animalType || (tag.animal ? tag.animal.category : (tag.batch ? tag.batch.category : null));
    const medName = medicineName || "Amoxicillin";

    // Strict backend validation: animal-to-medicine approval
    if (targetAnimalCategory) {
      const approvedMeds = getApprovedMedicinesForAnimal(targetAnimalCategory);
      const isApproved = approvedMeds.some(m => m.toLowerCase() === medName.toLowerCase());
      if (!isApproved && approvedMeds.length > 0) {
        return res.status(400).json({ 
          error: `Invalid animal-medicine combination: '${medName}' is not approved for '${targetAnimalCategory}'. Approved medicines: ${approvedMeds.join(', ')}` 
        });
      }
    }

    const farmerId = tag.animal ? tag.animal.farm?.farmerId : tag.batch?.farm?.farmerId;
    const weight = tag.animal ? tag.animal.weight : tag.batch?.avgWeight;
    const parsedDose = parseFloat(dose) || 1;
    const totalAmount = parsedDose * (weight || 1);
    const actIng = activeIngredient || medName;

    // 1. Create Treatment
    const treatment = await prisma.treatment.create({
      data: {
        tagId: tag.id,
        vetId: vet.id,
        medicineName: medName,
        activeIngredient: actIng,
        dose: parsedDose,
        doseUnit: doseUnit || "mg/kg",
        route: route || "Intramuscular (IM)",
        dateAdministered: new Date(dateAdministered || Date.now()),
        foodProduct: foodProduct || "Milk",
        status: "WITHDRAWAL ACTIVE"
      }
    });

    // 2. Create AMU Record
    const amuRecord = await prisma.aMURecord.create({
      data: {
        treatmentId: treatment.id,
        tagId: tag.id,
        farmerId: farmerId || tag.id,
        medicine: medName,
        activeIngredient: actIng,
        dose: parsedDose,
        doseUnit: doseUnit || "mg/kg",
        weight: weight || 100,
        route: route || "Intramuscular (IM)",
        totalAmount: totalAmount || parsedDose,
        date: treatment.dateAdministered,
        vetId: vet.id
      }
    });

    // 3. Calculate Withdrawal deterministically
    const withdrawal = await calculateWithdrawal(
      treatment.id, medName, actIng, route || "Intramuscular (IM)", foodProduct || "Milk", parsedDose
    );

    // 4. Update animal or batch status to WITHDRAWAL
    if (tag.animalId) {
      await prisma.animal.update({
        where: { id: tag.animalId },
        data: { status: "WITHDRAWAL" }
      });
    } else if (tag.batchId) {
      await prisma.animalBatch.update({
        where: { id: tag.batchId },
        data: { status: "WITHDRAWAL" }
      });
    }

    // 5. Create Alert for Regulator
    await prisma.alert.create({
      data: {
        severity: "CRITICAL",
        title: `AMU Withdrawal Notice: ${medName}`,
        message: `Tag ${tag.tag} (${tag.animal?.category || "Animal"}) administered ${medName}. Under statutory withdrawal until ${new Date(withdrawal.safeFromDate).toLocaleDateString()}.`,
        recipientRole: "REGULATOR"
      }
    });

    // 6. Create Blockchain Record
    const hashData = `${treatment.id}-${medName}-${totalAmount}-${Date.now()}`;
    const blockchainRecord = await prisma.blockchainRecord.create({
      data: {
        recordType: "TREATMENT",
        recordId: treatment.id,
        treatmentId: treatment.id,
        hash: `0x${require("crypto").createHash("sha256").update(hashData).digest("hex")}`,
        status: "CONFIRMED"
      }
    });

    res.json({ treatment, amuRecord, withdrawal, blockchainRecord });
  } catch (error) {
    console.error("Error creating treatment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vet administers vaccination
router.post("/vaccinations", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { 
      tagId, vaccineName, amount, amountUnit, animalCount, 
      route, dateOfInjection 
    } = req.body;

    const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
    if (!vet) return res.status(403).json({ error: "Veterinarian profile not found" });

    // Look up tag
    let tag = await prisma.animalTag.findFirst({ 
      where: { OR: [{ tag: tagId }, { id: tagId }] },
      include: { animal: { include: { farm: true } }, batch: { include: { farm: true } } }
    });
    
    if (!tag) {
      return res.status(404).json({ error: `Animal / Batch tag '${tagId}' not found. Please check registered tag ID.` });
    }

    const vacName = vaccineName || "Standard Preventative Vaccine";

    // 1. Create Vaccination
    const vaccination = await prisma.vaccination.create({
      data: {
        tagId: tag.id,
        vetId: vet.id,
        vaccineName: vacName,
        amountInjected: parseFloat(amount || req.body.amountInjected) || 1,
        unit: amountUnit || req.body.unit || "mL",
        route: route || "Subcutaneous (SC)",
        dateOfInjection: new Date(dateOfInjection || Date.now())
      }
    });

    // 2. Create Blockchain Record
    const hashData = `${vaccination.id}-${vacName}-${Date.now()}`;
    const blockchainRecord = await prisma.blockchainRecord.create({
      data: {
        recordType: "VACCINATION",
        recordId: vaccination.id,
        hash: `0x${require("crypto").createHash("sha256").update(hashData).digest("hex")}`,
        status: "CONFIRMED"
      }
    });

    res.json({ vaccination, blockchainRecord });
  } catch (error) {
    console.error("Error creating vaccination:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get treatments for logged in farmer or vet (strictly from 1/9/2026 onwards)
router.get("/my-treatments", authenticate, async (req, res) => {
  try {
    const cutoffDate = new Date("2026-09-01T00:00:00.000Z");
    let treatments = [];
    let vaccinations = [];

    if (req.user.role === "FARMER") {
      const farmer = await prisma.farmer.findUnique({
        where: { userId: req.user.id },
        include: {
          farms: {
            include: {
              animals: { include: { tag: true } },
              batches: { include: { tag: true } }
            }
          }
        }
      });

      if (!farmer) return res.status(404).json({ error: "Farmer not found" });

      const tagIds = [];
      farmer.farms.forEach(f => {
        f.animals.forEach(a => { if (a.tag) tagIds.push(a.tag.id); });
        f.batches.forEach(b => { if (b.tag) tagIds.push(b.tag.id); });
      });

      treatments = await prisma.treatment.findMany({
        where: {
          tagId: { in: tagIds },
          dateAdministered: { gte: cutoffDate }
        },
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true,
          withdrawal: true
        },
        orderBy: { dateAdministered: "desc" }
      });

      vaccinations = await prisma.vaccination.findMany({
        where: {
          tagId: { in: tagIds },
          dateOfInjection: { gte: cutoffDate }
        },
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true
        },
        orderBy: { dateOfInjection: "desc" }
      });
    } else if (req.user.role === "VETERINARIAN") {
      const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
      if (!vet) return res.status(404).json({ error: "Vet not found" });

      treatments = await prisma.treatment.findMany({
        where: {
          vetId: vet.id,
          dateAdministered: { gte: cutoffDate }
        },
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true,
          withdrawal: true
        },
        orderBy: { dateAdministered: "desc" }
      });

      vaccinations = await prisma.vaccination.findMany({
        where: {
          vetId: vet.id,
          dateOfInjection: { gte: cutoffDate }
        },
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true
        },
        orderBy: { dateOfInjection: "desc" }
      });
    }

    // Format unified response
    const combined = [
      ...treatments.map(t => ({
        id: t.id,
        type: "Medicine",
        tag: t.tag?.tag || "Unknown",
        animal: t.tag?.animal ? t.tag.animal.category : (t.tag?.batch ? `${t.tag.batch.category} (Batch)` : "Unknown"),
        medicine: t.medicineName,
        date: t.dateAdministered,
        vet: `${t.vet?.fullName || "Dr. Suresh Kumar"} (${t.vet?.vetId || "VT92A7K1"})`,
        status: t.status.includes("ACTIVE") ? "Active" : "Completed"
      })),
      ...vaccinations.map(v => ({
        id: v.id,
        type: "Vaccine",
        tag: v.tag?.tag || "Unknown",
        animal: v.tag?.animal ? v.tag.animal.category : (v.tag?.batch ? `${v.tag.batch.category} (Batch)` : "Unknown"),
        medicine: v.vaccineName,
        date: v.dateOfInjection,
        vet: `${v.vet?.fullName || "Dr. Suresh Kumar"} (${v.vet?.vetId || "VT92A7K1"})`,
        status: "Completed"
      }))
    ];

    combined.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(combined);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Get withdrawal calendar records for logged in farmer (strictly from 1/9/2026 onwards)
router.get("/my-withdrawals", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const cutoffDate = new Date("2026-09-01T00:00:00.000Z");
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id },
      include: {
        farms: {
          include: {
            animals: { include: { tag: true } },
            batches: { include: { tag: true } }
          }
        }
      }
    });

    if (!farmer) return res.status(404).json({ error: "Farmer not found" });

    const tagIds = [];
    farmer.farms.forEach(f => {
      f.animals.forEach(a => { if (a.tag) tagIds.push(a.tag.id); });
      f.batches.forEach(b => { if (b.tag) tagIds.push(b.tag.id); });
    });

    const records = await prisma.withdrawalRecord.findMany({
      where: {
        treatment: {
          tagId: { in: tagIds },
          dateAdministered: { gte: cutoffDate }
        }
      },
      include: {
        treatment: {
          include: {
            tag: { include: { animal: true, batch: true } },
            vet: true
          }
        }
      }
    });

    const vaccinations = await prisma.vaccination.findMany({
      where: {
        tagId: { in: tagIds },
        dateOfInjection: { gte: cutoffDate }
      },
      include: {
        tag: { include: { animal: true, batch: true } },
        vet: true
      }
    });

    const mapped = [
      ...records.map(w => ({
        id: w.id,
        tag: w.treatment.tag?.tag || "Unknown",
        animal: w.treatment.tag?.animal ? w.treatment.tag.animal.category : (w.treatment.tag?.batch ? `${w.treatment.tag.batch.category} (Batch)` : "Unknown"),
        medicine: w.treatment.medicineName,
        lastDose: w.treatment.dateAdministered,
        period: `${w.withdrawalPeriod} ${w.unit}`,
        safeFrom: w.safeFromDate,
        product: w.foodProduct,
        status: new Date(w.safeFromDate) <= new Date() ? "SAFE" : "WAIT"
      })),
      ...vaccinations.map(v => {
        const cat = v.tag?.animal ? v.tag.animal.category : (v.tag?.batch ? v.tag.batch.category : "");
        let prod = "Meat / Milk";
        if (cat === "Chicken") prod = "Eggs / Meat";
        else if (cat === "Buffalo" || cat === "Cow") prod = "Milk";
        else if (cat === "Fish") prod = "Fish Meat";
        else if (cat === "Pig") prod = "Pork";

        return {
          id: v.id,
          tag: v.tag?.tag || "Unknown",
          animal: v.tag?.animal ? v.tag.animal.category : (v.tag?.batch ? `${v.tag.batch.category} (Batch)` : "Unknown"),
          medicine: v.vaccineName,
          lastDose: v.dateOfInjection,
          period: "0 days",
          safeFrom: v.dateOfInjection,
          product: prod,
          status: "SAFE"
        };
      })
    ];

    mapped.sort((a, b) => new Date(b.lastDose) - new Date(a.lastDose));

    res.json(mapped);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
