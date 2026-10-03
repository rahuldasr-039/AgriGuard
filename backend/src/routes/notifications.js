const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { 
  processScheduledEmailNotifications, 
  retryEmailNotification,
  sendTestEmail 
} = require("../services/emailService");

const router = express.Router();
const prisma = new PrismaClient();

// -----------------------------------------------------------------------------
// Test Endpoint for Real Delivery & Verification
// -----------------------------------------------------------------------------

// POST /api/v1/notifications/email/test - Direct Email Test Dispatch
router.post("/email/test", async (req, res) => {
  try {
    const { customEmail, testMessage } = req.body || {};
    const result = await sendTestEmail({ customEmail, testMessage });

    if (!result.success) {
      return res.status(400).json({
        success: false,
        recipient: result.recipient,
        status: result.status,
        errorMessage: result.error,
        notificationId: result.notification?.id
      });
    }

    res.json({
      success: true,
      recipient: result.recipient,
      status: result.status,
      messageId: result.messageId,
      notificationId: result.notification?.id
    });
  } catch (error) {
    console.error("[ERROR] Email test dispatch failed:", error.message);
    res.status(500).json({
      success: false,
      errorMessage: error.message
    });
  }
});

// GET /api/v1/notifications - List all email notifications with optional filters (Regulator or Vet)
router.get("/", authenticate, authorize("REGULATOR", "VETERINARIAN", "ADMIN"), async (req, res) => {
  try {
    const { status, type, farmerId, treatmentId } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.notificationType = type;
    if (farmerId) where.farmerId = farmerId;
    if (treatmentId) where.treatmentId = treatmentId;

    const notifications = await prisma.emailNotification.findMany({
      where,
      include: {
        farmer: { select: { fullName: true, farmerId: true, mobileNumber: true, user: { select: { email: true } } } },
        treatment: {
          select: {
            medicineName: true,
            dateAdministered: true,
            status: true,
            tag: { select: { tag: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({ count: notifications.length, notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/notifications/my-notifications - Logged in farmer's Email notifications
router.get("/my-notifications", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id },
      include: { user: { select: { email: true } } }
    });

    if (!farmer) return res.status(404).json({ error: "Farmer profile not found" });

    const notifications = await prisma.emailNotification.findMany({
      where: { farmerId: farmer.id },
      include: {
        treatment: {
          select: {
            medicineName: true,
            dateAdministered: true,
            tag: { select: { tag: true } }
          }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      farmerName: farmer.fullName,
      farmerId: farmer.farmerId,
      email: farmer.user?.email,
      count: notifications.length,
      notifications
    });
  } catch (error) {
    console.error("Error fetching farmer notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/v1/notifications/treatment/:treatmentId - Treatment email notification history
router.get("/treatment/:treatmentId", authenticate, async (req, res) => {
  try {
    const { treatmentId } = req.params;

    const notifications = await prisma.emailNotification.findMany({
      where: { treatmentId },
      orderBy: { createdAt: "desc" }
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching treatment notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/notifications/:id/retry - Retry a failed email notification
router.post("/:id/retry", authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await retryEmailNotification(id);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error) {
    console.error("Error retrying email notification:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/v1/notifications/process-schedules - Manually trigger reminder and completion checks
router.post("/process-schedules", async (req, res) => {
  try {
    const results = await processScheduledEmailNotifications();
    res.json({ success: true, ...results });
  } catch (error) {
    console.error("Error processing scheduled email notifications:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
