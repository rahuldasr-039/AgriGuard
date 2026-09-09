const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all farm testers (Regulator only)
router.get("/", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const testers = await prisma.farmTester.findMany({
      include: { user: { select: { email: true, isActive: true } } }
    });
    res.json(testers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject Farm Tester (Regulator only)
router.patch("/:id/approval", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { status, reason } = req.body;
    const tester = await prisma.farmTester.update({
      where: { id: req.params.id },
      data: { approvalStatus: status }
    });
    
    const regulator = await prisma.regulator.findUnique({ where: { userId: req.user.id } });
    
    await prisma.approval.create({
      data: {
        type: "TESTER_REGISTRATION",
        status: status,
        reason: reason,
        regulatorId: regulator ? regulator.id : null,
      }
    });

    res.json(tester);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logged-in Farm Tester profile
router.get("/me", authenticate, authorize("FARM_TESTER"), async (req, res) => {
  try {
    const tester = await prisma.farmTester.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { email: true, isActive: true } } }
    });
    if (!tester) return res.status(404).json({ error: "Farm Tester profile not found" });
    res.json(tester);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get registered farmers with their farms, animals, and batches for dynamic selection
router.get("/farmers-livestock", authenticate, authorize("FARM_TESTER", "REGULATOR"), async (req, res) => {
  try {
    const farmers = await prisma.farmer.findMany({
      include: {
        farms: {
          include: {
            animals: {
              include: { tag: true }
            },
            batches: {
              include: { tag: true }
            }
          }
        }
      },
      orderBy: { farmerId: "asc" }
    });

    // Structure each farmer with animal types and individual animal/batch records
    const structured = farmers.map(farmer => {
      const allAnimals = [];
      const animalTypesSet = new Set();

      farmer.farms?.forEach(farm => {
        farm.animals?.forEach(animal => {
          const category = animal.category || "Cow";
          animalTypesSet.add(category);
          allAnimals.push({
            id: animal.id,
            tagId: animal.tag?.tag || `AN-${animal.id.slice(-6)}`,
            category: category,
            species: animal.species || category,
            type: "INDIVIDUAL",
            weight: animal.weight,
            farmName: farm.name
          });
        });

        farm.batches?.forEach(batch => {
          const category = batch.category || "Poultry";
          animalTypesSet.add(category);
          allAnimals.push({
            id: batch.id,
            tagId: batch.tag?.tag || `BT-${batch.id.slice(-6)}`,
            category: category,
            species: batch.species || category,
            type: "BATCH",
            count: batch.count,
            farmName: farm.name
          });
        });
      });

      return {
        id: farmer.id,
        farmerId: farmer.farmerId,
        fullName: farmer.fullName,
        mobileNumber: farmer.mobileNumber,
        farmLocation: farmer.farmLocation,
        animalTypes: Array.from(animalTypesSet),
        animals: allAnimals
      };
    });

    res.json(structured);
  } catch (error) {
    console.error("Error fetching farmers livestock:", error);
    res.status(500).json({ error: error.message });
  }
});

// Submit a new withdrawal waste & compensation claim
router.post("/waste-claims", authenticate, authorize("FARM_TESTER"), async (req, res) => {
  try {
    const { 
      farmerId, animalType, animalId, date, 
      productType, wasteAmount, unit, aiRecommendedAmount, notes 
    } = req.body;

    // 1. Automatically get logged-in tester
    const tester = await prisma.farmTester.findUnique({
      where: { userId: req.user.id }
    });
    if (!tester) {
      return res.status(403).json({ error: "Farm Tester profile not found" });
    }

    // 2. Validate required fields
    if (!farmerId) {
      return res.status(400).json({ error: "Farmer ID is required" });
    }
    if (!animalType) {
      return res.status(400).json({ error: "Animal Type is required" });
    }
    if (!animalId) {
      return res.status(400).json({ error: "Animal ID is required" });
    }
    if (!date) {
      return res.status(400).json({ error: "Claim date is required" });
    }
    if (!productType) {
      return res.status(400).json({ error: "Product Type is required" });
    }
    if (
      productType.toLowerCase().includes("fish") || 
      (animalType && animalType.toLowerCase().includes("fish"))
    ) {
      return res.status(400).json({ 
        error: "Fish is not included for subsidy under statutory withdrawal compensation rules." 
      });
    }
    const parsedAmount = parseFloat(wasteAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount of waste must be greater than zero" });
    }
    const parsedAiAmount = parseFloat(aiRecommendedAmount);
    if (isNaN(parsedAiAmount) || parsedAiAmount < 0) {
      return res.status(400).json({ error: "AI Recommended Compensation Amount must be provided" });
    }

    // 3. Generate unique claim citation ID
    const claimId = `WST-${Math.floor(100000 + Math.random() * 900000)}`;

    // 4. Save to database with status PENDING FSSAI APPROVAL
    const claim = await prisma.withdrawalWasteClaim.create({
      data: {
        claimId,
        testerId: tester.testerId,
        testerProfileId: tester.id,
        farmerId,
        animalType,
        animalId,
        date: new Date(date),
        productType,
        wasteAmount: parsedAmount,
        unit: unit || "kg",
        aiRecommendedAmount: parsedAiAmount,
        status: "PENDING FSSAI APPROVAL",
        notes: notes || null
      }
    });

    res.status(201).json({
      success: true,
      message: "Withdrawal waste claim submitted successfully with status PENDING FSSAI APPROVAL.",
      claim
    });
  } catch (error) {
    console.error("Error creating waste claim:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get all waste claims for tester and regulator dashboards (excluding non-eligible products like Fish)
router.get("/waste-claims", async (req, res) => {
  try {
    const claims = await prisma.withdrawalWasteClaim.findMany({
      where: {
        AND: [
          { NOT: { productType: { contains: "Fish" } } },
          { NOT: { animalType: { contains: "Fish" } } }
        ]
      },
      include: {
        tester: {
          select: { fullName: true, testerId: true, labDetails: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(claims);
  } catch (error) {
    console.error("Error fetching waste claims:", error);
    res.status(500).json({ error: error.message });
  }
});

// Disburse subsidy payment to farmer via Direct Benefit Transfer (DBT)
router.patch("/waste-claims/:id/disburse", async (req, res) => {
  try {
    const { id } = req.params;
    const { transactionId, paymentMethod } = req.body;
    const txnId = transactionId || `DBT-${Math.floor(10000000 + Math.random() * 90000000)}`;

    const updated = await prisma.withdrawalWasteClaim.update({
      where: { id },
      data: {
        status: "DISBURSED (PAID)",
        notes: `Direct Benefit Transfer (DBT) payment of ₹${req.body.amount || 'compensation'} completed on ${new Date().toLocaleDateString('en-IN')}. Reference: ${txnId}. Gateway: ${paymentMethod || 'PFMS / NPCI-Aadhaar DBT'}.`
      }
    });

    res.json({
      success: true,
      message: `Subsidy payment disbursed successfully.`,
      transactionId: txnId,
      claim: updated
    });
  } catch (err) {
    console.error("Error disbursing payment:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

