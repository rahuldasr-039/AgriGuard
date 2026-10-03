const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { calculateWithdrawal } = require("../services/withdrawalEngine");
const { sendTreatmentCreatedEmail, sendTreatmentUpdatedEmail } = require("../services/emailService");
const { calculateAntibioticDosage, findDosageRule, APPROVED_DOSAGE_RULES } = require("../services/dosageMaster");

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

// GET /api/v1/treatments/dosage-rules - Get approved veterinary dosage rules
router.get("/dosage-rules", (req, res) => {
  const { species, medicineName } = req.query;
  let rules = APPROVED_DOSAGE_RULES;
  if (species) {
    const sLower = species.toLowerCase();
    rules = rules.filter(r => r.species.some(sp => sLower.includes(sp.toLowerCase()) || sp.toLowerCase().includes(sLower)));
  }
  if (medicineName) {
    const mLower = medicineName.toLowerCase();
    rules = rules.filter(r => r.medicineName.toLowerCase().includes(mLower) || r.activeIngredient.toLowerCase().includes(mLower));
  }
  res.json({ total: rules.length, rules });
});

// POST /api/v1/treatments/calculate-dose - Calculate required antibiotic quantity strictly from approved dosage rules
router.post("/calculate-dose", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { tagId, medicineName, route, indication } = req.body;

    if (!tagId || !medicineName) {
      return res.status(400).json({ error: "tagId and medicineName are required for dosage calculation." });
    }

    // Look up animal or batch tag in database to retrieve CURRENT weight and DOB
    const tag = await prisma.animalTag.findFirst({
      where: { OR: [{ tag: tagId.toUpperCase() }, { tag: tagId }, { id: tagId }] },
      include: {
        animal: { include: { farm: true } },
        batch: { include: { farm: true } }
      }
    });

    if (!tag) {
      return res.status(404).json({ error: `Livestock with tag '${tagId}' not found.` });
    }

    const animal = tag.animal || tag.batch;
    const isBatch = Boolean(tag.batch);
    const currentWeight = isBatch ? (animal.avgWeight || 1) : (animal.weight || 0);
    const species = animal.category || animal.species || "Bovine";
    const dob = isBatch ? null : animal.dateOfBirth;

    if (!currentWeight || currentWeight <= 0) {
      return res.status(400).json({ error: "Animal has no valid recorded weight in the database. Please update weight before calculating dosage." });
    }

    const calculationResult = calculateAntibioticDosage({
      animalWeight: currentWeight,
      animalDob: dob,
      species,
      medicineName,
      route,
      indication
    });

    res.json({
      tagId: tag.tag,
      animalType: species,
      isBatch,
      ...calculationResult
    });
  } catch (error) {
    console.error("Error calculating antibiotic dosage:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vet administers medicine / treatment
router.post("/", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { 
      tagId, medicineName, activeIngredient, dose, doseUnit, 
      route, dateAdministered, foodProduct, animalType,
      calculatedDose, calculatedVolume, concentration,
      dosageRuleUsed, isDoseOverridden, overrideReason
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

    // Require reason if veterinarian overrides calculated dose
    const doseOverridden = Boolean(isDoseOverridden);
    if (doseOverridden && (!overrideReason || overrideReason.trim() === "")) {
      return res.status(400).json({
        error: "Reason for dose adjustment is mandatory when overriding calculated dose."
      });
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
        calculatedDose: calculatedDose ? parseFloat(calculatedDose) : null,
        calculatedVolume: calculatedVolume ? parseFloat(calculatedVolume) : null,
        concentration: concentration ? parseFloat(concentration) : null,
        dosageRuleUsed: dosageRuleUsed || null,
        isDoseOverridden: doseOverridden,
        overrideReason: overrideReason ? overrideReason.trim() : null,
        route: route || "Intramuscular (IM)",
        dateAdministered: new Date(dateAdministered || Date.now()),
        foodProduct: foodProduct || "Milk",
        status: "WITHDRAWAL ACTIVE"
      }
    });

    // Audit Log for prescription & override
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: doseOverridden ? "TREATMENT_DOSE_OVERRIDDEN" : "TREATMENT_PRESCRIBED",
        entity: "Treatment",
        entityId: treatment.id,
        previousData: JSON.stringify({
          systemCalculatedDose: calculatedDose || null,
          calculatedVolume: calculatedVolume || null,
          dosageRuleUsed: dosageRuleUsed || null
        }),
        newData: JSON.stringify({
          prescribedDose: parsedDose,
          isDoseOverridden: doseOverridden,
          overrideReason: overrideReason || null,
          animalWeightAtTreatment: weight,
          vetId: vet.id,
          timestamp: new Date()
        })
      }
    }).catch(err => console.error("AuditLog error:", err.message));

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

    // 7. Trigger Email notification for linked farmer (non-blocking, non-destructive)
    let emailResult = null;
    try {
      emailResult = await sendTreatmentCreatedEmail({
        treatmentId: treatment.id,
        tagId: tag.id,
        medicineName: medName,
        activeIngredient: actIng,
        dateAdministered: treatment.dateAdministered,
        withdrawal,
        dose: parsedDose,
        doseUnit: doseUnit || "mg/kg",
        weight: weight
      });
    } catch (mailErr) {
      console.error("[WARN] Email notification trigger failed:", mailErr.message);
      emailResult = { success: false, status: "FAILED", error: mailErr.message };
    }

    res.json({ 
      treatment, 
      amuRecord, 
      withdrawal, 
      blockchainRecord,
      emailNotification: emailResult?.notification,
      emailStatus: emailResult?.status || (emailResult?.success ? "SENT" : "FAILED")
    });
  } catch (error) {
    console.error("Error creating treatment:", error);
    res.status(500).json({ error: error.message });
  }
});

// Vet updates/corrects an existing antibiotic treatment record
router.put("/:id", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      medicineName, activeIngredient, dose, doseUnit, 
      route, dateAdministered, foodProduct, tagId, animalType 
    } = req.body;

    const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
    if (!vet) return res.status(403).json({ error: "Veterinarian profile not found" });

    // 1. Fetch existing treatment
    const existingTreatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        tag: {
          include: {
            animal: { include: { farm: { include: { farmer: true } } } },
            batch: { include: { farm: { include: { farmer: true } } } }
          }
        },
        withdrawal: true,
        amuRecord: true
      }
    });

    if (!existingTreatment) {
      return res.status(404).json({ error: "Treatment record not found" });
    }

    // 2. Check if tag changed or resolve current tag
    let currentTag = existingTreatment.tag;
    if (tagId && tagId !== existingTreatment.tag.id && tagId !== existingTreatment.tag.tag) {
      const newTag = await prisma.animalTag.findFirst({
        where: { OR: [{ tag: tagId }, { id: tagId }] },
        include: {
          animal: { include: { farm: { include: { farmer: true } } } },
          batch: { include: { farm: { include: { farmer: true } } } }
        }
      });
      if (!newTag) return res.status(404).json({ error: `Tag '${tagId}' not found` });
      currentTag = newTag;
    }

    const targetAnimalCategory = animalType || (currentTag.animal ? currentTag.animal.category : (currentTag.batch ? currentTag.batch.category : null));
    const medName = medicineName || existingTreatment.medicineName;
    const actIng = activeIngredient || existingTreatment.activeIngredient || medName;
    const parsedDose = dose !== undefined ? (parseFloat(dose) || 1) : existingTreatment.dose;
    const currentRoute = route || existingTreatment.route;
    const currentFoodProduct = foodProduct || existingTreatment.foodProduct || "Milk";
    const currentDateAdministered = dateAdministered ? new Date(dateAdministered) : existingTreatment.dateAdministered;

    // Strict validation for updated animal + medicine combination
    if (targetAnimalCategory) {
      const approvedMeds = getApprovedMedicinesForAnimal(targetAnimalCategory);
      const isApproved = approvedMeds.some(m => m.toLowerCase() === medName.toLowerCase());
      if (!isApproved && approvedMeds.length > 0) {
        return res.status(400).json({ 
          error: `Invalid animal-medicine combination: '${medName}' is not approved for '${targetAnimalCategory}'. Approved medicines: ${approvedMeds.join(', ')}` 
        });
      }
    }

    // 3. Update Treatment Record
    const updatedTreatment = await prisma.treatment.update({
      where: { id },
      data: {
        tagId: currentTag.id,
        medicineName: medName,
        activeIngredient: actIng,
        dose: parsedDose,
        doseUnit: doseUnit || existingTreatment.doseUnit,
        route: currentRoute,
        foodProduct: currentFoodProduct,
        dateAdministered: currentDateAdministered,
        status: "WITHDRAWAL ACTIVE"
      }
    });

    // 4. Recalculate Withdrawal deterministically using existing engine
    await prisma.withdrawalRecord.deleteMany({ where: { treatmentId: id } });
    const withdrawal = await calculateWithdrawal(
      id, medName, actIng, currentRoute, currentFoodProduct, parsedDose
    );

    // 5. Update AMU record if present
    if (existingTreatment.amuRecord) {
      const weight = currentTag.animal ? currentTag.animal.weight : currentTag.batch?.avgWeight;
      const totalAmount = parsedDose * (weight || 1);
      await prisma.aMURecord.update({
        where: { id: existingTreatment.amuRecord.id },
        data: {
          tagId: currentTag.id,
          medicine: medName,
          activeIngredient: actIng,
          dose: parsedDose,
          totalAmount: totalAmount || parsedDose,
          date: currentDateAdministered,
          route: currentRoute
        }
      });
    }

    // 6. Send corrected Email notification (supersedes previous pending notifications)
    let emailResult = null;
    try {
      emailResult = await sendTreatmentUpdatedEmail({
        treatmentId: id,
        tagId: currentTag.id,
        medicineName: medName,
        dateAdministered: currentDateAdministered,
        withdrawal
      });
    } catch (mailErr) {
      console.error("[WARN] Email update notification failed:", mailErr.message);
      emailResult = { success: false, status: "FAILED", error: mailErr.message };
    }

    res.json({
      success: true,
      treatment: updatedTreatment,
      withdrawal,
      emailNotification: emailResult?.notification,
      emailStatus: emailResult?.status || (emailResult?.success ? "SENT" : "FAILED")
    });
  } catch (error) {
    console.error("Error updating treatment:", error);
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  // Delegate patch to same logic
  try {
    const { id } = req.params;
    const { 
      medicineName, activeIngredient, dose, doseUnit, 
      route, dateAdministered, foodProduct, tagId, animalType 
    } = req.body;

    const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
    if (!vet) return res.status(403).json({ error: "Veterinarian profile not found" });

    const existingTreatment = await prisma.treatment.findUnique({
      where: { id },
      include: {
        tag: {
          include: {
            animal: { include: { farm: { include: { farmer: true } } } },
            batch: { include: { farm: { include: { farmer: true } } } }
          }
        },
        withdrawal: true,
        amuRecord: true
      }
    });

    if (!existingTreatment) {
      return res.status(404).json({ error: "Treatment record not found" });
    }

    let currentTag = existingTreatment.tag;
    if (tagId && tagId !== existingTreatment.tag.id && tagId !== existingTreatment.tag.tag) {
      const newTag = await prisma.animalTag.findFirst({
        where: { OR: [{ tag: tagId }, { id: tagId }] },
        include: {
          animal: { include: { farm: { include: { farmer: true } } } },
          batch: { include: { farm: { include: { farmer: true } } } }
        }
      });
      if (!newTag) return res.status(404).json({ error: `Tag '${tagId}' not found` });
      currentTag = newTag;
    }

    const targetAnimalCategory = animalType || (currentTag.animal ? currentTag.animal.category : (currentTag.batch ? currentTag.batch.category : null));
    const medName = medicineName || existingTreatment.medicineName;
    const actIng = activeIngredient || existingTreatment.activeIngredient || medName;
    const parsedDose = dose !== undefined ? (parseFloat(dose) || 1) : existingTreatment.dose;
    const currentRoute = route || existingTreatment.route;
    const currentFoodProduct = foodProduct || existingTreatment.foodProduct || "Milk";
    const currentDateAdministered = dateAdministered ? new Date(dateAdministered) : existingTreatment.dateAdministered;

    if (targetAnimalCategory) {
      const approvedMeds = getApprovedMedicinesForAnimal(targetAnimalCategory);
      const isApproved = approvedMeds.some(m => m.toLowerCase() === medName.toLowerCase());
      if (!isApproved && approvedMeds.length > 0) {
        return res.status(400).json({ 
          error: `Invalid animal-medicine combination: '${medName}' is not approved for '${targetAnimalCategory}'. Approved medicines: ${approvedMeds.join(', ')}` 
        });
      }
    }

    const updatedTreatment = await prisma.treatment.update({
      where: { id },
      data: {
        tagId: currentTag.id,
        medicineName: medName,
        activeIngredient: actIng,
        dose: parsedDose,
        doseUnit: doseUnit || existingTreatment.doseUnit,
        route: currentRoute,
        foodProduct: currentFoodProduct,
        dateAdministered: currentDateAdministered,
        status: "WITHDRAWAL ACTIVE"
      }
    });

    await prisma.withdrawalRecord.deleteMany({ where: { treatmentId: id } });
    const withdrawal = await calculateWithdrawal(
      id, medName, actIng, currentRoute, currentFoodProduct, parsedDose
    );

    if (existingTreatment.amuRecord) {
      const weight = currentTag.animal ? currentTag.animal.weight : currentTag.batch?.avgWeight;
      const totalAmount = parsedDose * (weight || 1);
      await prisma.aMURecord.update({
        where: { id: existingTreatment.amuRecord.id },
        data: {
          tagId: currentTag.id,
          medicine: medName,
          activeIngredient: actIng,
          dose: parsedDose,
          totalAmount: totalAmount || parsedDose,
          date: currentDateAdministered,
          route: currentRoute
        }
      });
    }

    let emailResult = null;
    try {
      emailResult = await sendTreatmentUpdatedEmail({
        treatmentId: id,
        tagId: currentTag.id,
        medicineName: medName,
        dateAdministered: currentDateAdministered,
        withdrawal
      });
    } catch (mailErr) {
      console.error("[WARN] Email update notification failed:", mailErr.message);
      emailResult = { success: false, status: "FAILED", error: mailErr.message };
    }

    res.json({
      success: true,
      treatment: updatedTreatment,
      withdrawal,
      emailNotification: emailResult?.notification,
      emailStatus: emailResult?.status || (emailResult?.success ? "SENT" : "FAILED")
    });
  } catch (error) {
    console.error("Error updating treatment:", error);
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

// Get treatments for logged in farmer or vet (returns all historical records)
router.get("/my-treatments", authenticate, async (req, res) => {
  try {
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
          tagId: { in: tagIds }
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
          tagId: { in: tagIds }
        },
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true
        },
        orderBy: { dateOfInjection: "desc" }
      });

      // Fallback: If this farmer has no custom treatments yet, load the verified farm treatments
      if (treatments.length === 0 && vaccinations.length === 0) {
        treatments = await prisma.treatment.findMany({
          include: {
            tag: { include: { animal: true, batch: true } },
            vet: true,
            withdrawal: true
          },
          orderBy: { dateAdministered: "desc" },
          take: 50
        });

        vaccinations = await prisma.vaccination.findMany({
          include: {
            tag: { include: { animal: true, batch: true } },
            vet: true
          },
          orderBy: { dateOfInjection: "desc" },
          take: 20
        });
      }
    } else if (req.user.role === "VETERINARIAN") {
      const vet = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
      if (!vet) return res.status(404).json({ error: "Vet not found" });

      treatments = await prisma.treatment.findMany({
        where: {
          vetId: vet.id
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
          vetId: vet.id
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
        status: t.status.includes("ACTIVE") ? "Active" : "Completed",
        dose: t.dose,
        doseUnit: t.doseUnit,
        calculatedDose: t.calculatedDose,
        calculatedVolume: t.calculatedVolume,
        concentration: t.concentration,
        dosageRuleUsed: t.dosageRuleUsed,
        isDoseOverridden: t.isDoseOverridden,
        overrideReason: t.overrideReason,
        duration: t.duration,
        frequency: t.frequency,
        route: t.route,
        animalWeight: t.tag?.animal?.currentWeight || t.tag?.animal?.weight || t.tag?.batch?.avgWeight,
        withdrawalDays: t.withdrawal?.withdrawalPeriod,
        safeFromDate: t.withdrawal?.safeFromDate
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

// Get withdrawal calendar records for logged in farmer (returns all historical records)
router.get("/my-withdrawals", authenticate, authorize("FARMER"), async (req, res) => {
  try {
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

    let records = await prisma.withdrawalRecord.findMany({
      where: {
        treatment: {
          tagId: { in: tagIds }
        }
      },
      include: {
        treatment: {
          include: {
            tag: { include: { animal: true, batch: true } },
            vet: true,
            emailNotifications: {
              orderBy: { createdAt: "desc" }
            }
          }
        }
      }
    });

    let vaccinations = await prisma.vaccination.findMany({
      where: {
        tagId: { in: tagIds }
      },
      include: {
        tag: { include: { animal: true, batch: true } },
        vet: true
      }
    });

    if (records.length === 0 && vaccinations.length === 0) {
      records = await prisma.withdrawalRecord.findMany({
        include: {
          treatment: {
            include: {
              tag: { include: { animal: true, batch: true } },
              vet: true,
              emailNotifications: {
                orderBy: { createdAt: "desc" }
              }
            }
          }
        },
        orderBy: { createdAt: "desc" },
        take: 50
      });

      vaccinations = await prisma.vaccination.findMany({
        include: {
          tag: { include: { animal: true, batch: true } },
          vet: true
        },
        orderBy: { dateOfInjection: "desc" },
        take: 20
      });
    }

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
        status: new Date(w.safeFromDate) <= new Date() ? "SAFE" : "WAIT",
        emailStatus: w.treatment.emailNotifications?.[0]?.status || "SENT",
        emailNotification: w.treatment.emailNotifications?.[0] || null,
        emailNotifications: w.treatment.emailNotifications || []
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
