const express = require("express");
const { authenticate, authorize } = require("../middleware/auth");
const { PrismaClient } = require("@prisma/client");
const certificateService = require("../services/certificateService");

const router = express.Router();
const prisma = new PrismaClient();

// -------------------------------------------------------------
// PUBLIC ENDPOINTS (No authentication required)
// -------------------------------------------------------------

/**
 * GET /api/v1/certificates/verify/:verificationId
 * Public QR Code Verification endpoint
 */
router.get("/verify/:verificationId", async (req, res) => {
  try {
    const { verificationId } = req.params;
    const result = await certificateService.verifyCertificate(verificationId);

    if (result.notFound) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// FARMER ENDPOINTS (Requires FARMER role)
// -------------------------------------------------------------

/**
 * GET /api/v1/certificates/my
 * Get current logged-in farmer's active certificate, QR code, and history
 */
router.get("/my", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id }
    });

    if (!farmer) {
      return res.status(404).json({ error: "Farmer profile not found" });
    }

    const data = await certificateService.getFarmerCertificate(farmer.id);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// -------------------------------------------------------------
// REGULATOR CERTIFY ENDPOINTS (Requires REGULATOR role)
// -------------------------------------------------------------

/**
 * GET /api/v1/certificates
 * List all certificates and summary KPI metrics for Regulator dashboard
 */
router.get("/", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const result = await certificateService.listCertificatesForRegulator();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/certificates/evidence/:farmerId
 * Get evidence (treatments, active withdrawals, lab tests) for regulator review
 */
router.get("/evidence/:farmerId", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { farmerId } = req.params;
    const result = await certificateService.getFarmerEvidenceForReview(farmerId);
    res.json(result);
  } catch (error) {
    res.status(error.message === "Farmer not found" ? 404 : 500).json({ error: error.message });
  }
});

/**
 * POST /api/v1/certificates/initiate
 * Initiate or request a weekly certificate in PENDING state
 */
router.post("/initiate", authenticate, authorize("REGULATOR", "FARMER"), async (req, res) => {
  try {
    let { farmerId, validFrom, validUntil, notes } = req.body;

    // If farmer is calling this, ensure they can only initiate for themselves
    if (req.user.role === "FARMER") {
      const myFarmer = await prisma.farmer.findUnique({ where: { userId: req.user.id } });
      if (!myFarmer) return res.status(404).json({ error: "Farmer profile not found" });
      farmerId = myFarmer.id;
    }

    if (!farmerId) {
      return res.status(400).json({ error: "farmerId is required" });
    }

    const cert = await certificateService.createCertificate({
      farmerId,
      validFrom,
      validUntil,
      notes
    });

    res.status(201).json(cert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/certificates/:id/approve
 * Step 1: Approve or Reject a certification (FSSAI Regulator only)
 */
router.patch("/:id/approve", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!action || (action !== "APPROVE" && action !== "REJECT")) {
      return res.status(400).json({ error: "Action must be 'APPROVE' or 'REJECT'" });
    }

    // Lookup regulator details
    const regulator = await prisma.regulator.findUnique({
      where: { userId: req.user.id }
    });

    const regulatorUser = {
      id: req.user.id,
      email: req.user.email,
      fullName: regulator?.fullName || "FSSAI Regulatory Authority"
    };

    const cert = await certificateService.approveCertificate({
      id,
      regulatorUser,
      action,
      reason
    });

    res.json(cert);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * PATCH /api/v1/certificates/:id/status
 * Step 2: Set MRL status (SAFE or UNSAFE) - STRICTLY ENFORCED: Must be APPROVED!
 */
router.patch("/:id/status", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { id } = req.params;
    const { mrlStatus, validFrom, validUntil, notes } = req.body;

    if (!mrlStatus || (mrlStatus !== "SAFE" && mrlStatus !== "UNSAFE")) {
      return res.status(400).json({ error: "mrlStatus must be 'SAFE' or 'UNSAFE'" });
    }

    // Lookup regulator details
    const regulator = await prisma.regulator.findUnique({
      where: { userId: req.user.id }
    });

    const regulatorUser = {
      id: req.user.id,
      email: req.user.email,
      fullName: regulator?.fullName || "FSSAI Regulatory Authority"
    };

    const cert = await certificateService.setMrlStatus({
      id,
      regulatorUser,
      mrlStatus,
      validFrom,
      validUntil,
      notes
    });

    res.json(cert);
  } catch (error) {
    // 400 Bad Request for business rule violations (such as not being APPROVED)
    res.status(400).json({ error: error.message });
  }
});

/**
 * GET /api/v1/certificates/:id
 * Get details of a specific certificate record
 */
router.get("/:id", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const { id } = req.params;
    const cert = await prisma.mRLCertificate.findUnique({
      where: { id },
      include: {
        farmer: { include: { farms: true, user: { select: { email: true } } } },
        auditLogs: { orderBy: { timestamp: "desc" } }
      }
    });

    if (!cert) {
      return res.status(404).json({ error: "Certificate not found" });
    }

    res.json(certificateService.evaluateCertificateExpiry(cert));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/v1/certificates/history/:farmerId
 * Get history of certificates for a given farmer (REGULATOR or owner FARMER only)
 */
router.get("/history/:farmerId", authenticate, async (req, res) => {
  try {
    const { farmerId } = req.params;

    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [
          { id: farmerId },
          { farmerId: farmerId }
        ]
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: "Farmer not found" });
    }

    // RBAC check: if role is FARMER, they can ONLY access their own history
    if (req.user.role === "FARMER") {
      const myFarmer = await prisma.farmer.findUnique({ where: { userId: req.user.id } });
      if (!myFarmer || myFarmer.id !== farmer.id) {
        return res.status(403).json({ error: "Forbidden: You can only view your own certificate history" });
      }
    } else if (req.user.role !== "REGULATOR" && req.user.role !== "ADMIN") {
      return res.status(403).json({ error: "Forbidden: Insufficient privileges" });
    }

    const certs = await prisma.mRLCertificate.findMany({
      where: { farmerId: farmer.id },
      orderBy: { createdAt: "desc" },
      include: {
        auditLogs: { orderBy: { timestamp: "desc" } }
      }
    });

    res.json(certs.map(certificateService.evaluateCertificateExpiry));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
