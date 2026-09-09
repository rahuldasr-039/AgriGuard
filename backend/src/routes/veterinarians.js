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

module.exports = router;
