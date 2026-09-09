const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/v1/drugs
router.get("/", authenticate, async (req, res) => {
  try {
    const drugs = await prisma.drug.findMany({ orderBy: { name: "asc" } });
    res.json({ drugs, total: drugs.length });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch drugs" });
  }
});

// GET /api/v1/drugs/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const drug = await prisma.drug.findUnique({ where: { id: req.params.id } });
    if (!drug) return res.status(404).json({ error: "Drug not found" });
    res.json(drug);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch drug" });
  }
});

// POST /api/v1/drugs
router.post("/", authenticate, async (req, res) => {
  try {
    const { name, activeIngredient, drugClass, withdrawalPeriodMeat, withdrawalPeriodMilk, mrlMeat, mrlMilk } = req.body;
    if (!name || !activeIngredient || withdrawalPeriodMeat === undefined || withdrawalPeriodMilk === undefined) {
      return res.status(400).json({ error: "name, activeIngredient, withdrawalPeriodMeat, withdrawalPeriodMilk are required" });
    }

    const drug = await prisma.drug.create({
      data: {
        name,
        activeIngredient,
        drugClass: drugClass || "ANTIBIOTIC",
        withdrawalPeriodMeat: parseInt(withdrawalPeriodMeat),
        withdrawalPeriodMilk: parseInt(withdrawalPeriodMilk),
        mrlMeat: mrlMeat ? parseFloat(mrlMeat) : null,
        mrlMilk: mrlMilk ? parseFloat(mrlMilk) : null,
      },
    });

    res.status(201).json(drug);
  } catch (error) {
    res.status(500).json({ error: "Failed to create drug" });
  }
});

module.exports = router;
