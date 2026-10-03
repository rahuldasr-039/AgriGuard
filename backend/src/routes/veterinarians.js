const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all vets (Regulator only)
router.get("/", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const vets = await prisma.veterinarian.findMany({
      include: { user: { select: { email: true, isActive: true } } }
    });
    res.json(vets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject Veterinarian (Regulator only)
router.patch("/:id/approval", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const vet = await prisma.veterinarian.update({
      where: { id: req.params.id },
      data: { approvalStatus: status }
    });
    
    const regulator = await prisma.regulator.findUnique({ where: { userId: req.user.id } });
    
    await prisma.approval.create({
      data: {
        type: "VET_REGISTRATION",
        status: status,
        reason: reason,
        vetId: vet.id,
        regulatorId: regulator ? regulator.id : null,
      }
    });

    res.json(vet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/veterinarians/animals/:tagOrId - Fetch animal profile for treatment and clinical examination
router.get("/animals/:tagOrId", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const { tagOrId } = req.params;
    const { calculateDynamicAge } = require("../services/dosageMaster");

    // Try finding via AnimalTag first
    const tagRecord = await prisma.animalTag.findFirst({
      where: {
        OR: [
          { tag: tagOrId.toUpperCase() },
          { tag: tagOrId },
          { id: tagOrId },
          { animalId: tagOrId },
          { batchId: tagOrId }
        ]
      },
      include: {
        animal: {
          include: {
            farm: { include: { farmer: true } },
            weightHistory: { orderBy: { recordedAt: "desc" } }
          }
        },
        batch: {
          include: {
            farm: { include: { farmer: true } }
          }
        }
      }
    });

    let animal = null;
    let isBatch = false;

    if (tagRecord?.animal) {
      animal = tagRecord.animal;
      isBatch = false;
    } else if (tagRecord?.batch) {
      animal = tagRecord.batch;
      isBatch = true;
    } else {
      // Direct search in Animal
      animal = await prisma.animal.findFirst({
        where: { id: tagOrId },
        include: {
          tag: true,
          farm: { include: { farmer: true } },
          weightHistory: { orderBy: { recordedAt: "desc" } }
        }
      });
    }

    if (!animal) {
      return res.status(404).json({ error: `Animal or batch '${tagOrId}' not found.` });
    }

    const now = new Date();
    const tag = tagRecord?.tag || animal.tag?.tag || tagOrId;
    const dob = animal.dateOfBirth || null;
    const ageInfo = calculateDynamicAge(dob);

    const isUpdateAvailable = !animal.nextWeightUpdateAt || now >= new Date(animal.nextWeightUpdateAt);
    let daysUntilNextUpdate = 0;
    if (!isUpdateAvailable && animal.nextWeightUpdateAt) {
      daysUntilNextUpdate = Math.max(1, Math.ceil((new Date(animal.nextWeightUpdateAt) - now) / (1000 * 60 * 60 * 24)));
    }

    const formattedDob = dob ? new Date(dob).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }) : "Not Recorded";

    const formattedLastWeight = animal.weightLastUpdatedAt ? new Date(animal.weightLastUpdatedAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }) : "Initial";

    const formattedNextUpdate = animal.nextWeightUpdateAt ? new Date(animal.nextWeightUpdateAt).toLocaleDateString("en-GB", {
      day: "2-digit", month: "2-digit", year: "numeric"
    }) : "Available Now";

    res.json({
      success: true,
      id: animal.id,
      tag,
      isBatch,
      animalCategory: animal.category,
      species: animal.species || animal.category,
      dateOfBirth: dob,
      formattedDob,
      currentAge: ageInfo?.formattedAge || "Unknown",
      ageInfo,
      currentWeight: isBatch ? (animal.avgWeight || 0) : (animal.weight || 0),
      weightUnit: animal.weightUnit || "kg",
      weightLastUpdatedAt: animal.weightLastUpdatedAt,
      formattedWeightLastUpdated: formattedLastWeight,
      nextWeightUpdateAt: animal.nextWeightUpdateAt,
      formattedNextWeightUpdate: formattedNextUpdate,
      isWeightUpdateAvailable: isUpdateAvailable,
      daysUntilNextUpdate,
      farmer: {
        id: animal.farm?.farmer?.id,
        farmerId: animal.farm?.farmer?.farmerId,
        fullName: animal.farm?.farmer?.fullName,
        farmLocation: animal.farm?.farmer?.farmLocation
      },
      weightHistory: animal.weightHistory || []
    });
  } catch (error) {
    console.error("Error fetching animal for vet:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

