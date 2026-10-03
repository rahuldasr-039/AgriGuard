const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");
const { analyzeMRL } = require("../services/mrlEngine");
const { sendMRLResultEmail } = require("../services/emailService");

const router = express.Router();
const prisma = new PrismaClient();

// Get all product tests (Regulator and Tester)
router.get("/", async (req, res) => {
  try {
    const tests = await prisma.testResult.findMany({
      include: {
        tag: { include: { animal: { include: { farm: true } }, batch: { include: { farm: true } } } },
        tester: true,
        blockchainRecord: true,
      },
      orderBy: { testDate: "desc" }
    });
    res.json(tests);
  } catch (error) {
    console.error("Error fetching product tests:", error);
    res.status(500).json({ error: error.message });
  }
});

// Tester submits product test
router.post("/", authenticate, authorize("FARM_TESTER"), async (req, res) => {
  try {
    const { 
      tagId, productType, sampleId, sampleCollectionDate, 
      testingLocation, substanceDetected, amountDetected, unit, testMethod
    } = req.body;

    const tester = await prisma.farmTester.findUnique({ where: { userId: req.user.id } });
    if (!tester) return res.status(403).json({ error: "Farm Tester profile not found" });

    const tag = await prisma.animalTag.findUnique({ 
      where: { tag: tagId },
      include: { 
        animal: { include: { farm: { include: { farmer: { include: { user: true } } } } } }, 
        batch: { include: { farm: { include: { farmer: { include: { user: true } } } } } } 
      }
    });
    if (!tag) return res.status(404).json({ error: "Animal tag not found" });

    const farmerId = tag.animal ? tag.animal.farm.farmerId : tag.batch.farm.farmerId;
    const species = tag.animal ? tag.animal.species : tag.batch.species;

    // 1. Analyze MRL deterministically
    const analysis = await analyzeMRL(substanceDetected, species, productType, amountDetected);

    // 2. Save Test Result
    const testResult = await prisma.testResult.create({
      data: {
        testerId: tester.id,
        farmerId: farmerId,
        tagId: tag.id,
        productType,
        sampleId,
        sampleCollectionDate: new Date(sampleCollectionDate || Date.now()),
        testDate: new Date(),
        testingLocation,
        substanceDetected,
        amountDetected,
        unit,
        testMethod,
        applicableMrl: analysis.applicableMrl,
        difference: analysis.difference,
        percentageOfMrl: analysis.percentageOfMrl,
        status: analysis.status
      }
    });

    // 3. Generate AI Report (Mock)
    const aiReport = await prisma.aIReport.create({
      data: {
        testResultId: testResult.id,
        result: analysis.status,
        dataConsidered: JSON.stringify({ amountDetected, applicableMrl: analysis.applicableMrl }),
        referenceUsed: "Database MRL Reference",
        explanation: `The detected amount of ${amountDetected} is ${analysis.percentageOfMrl?.toFixed(2)}% of the allowed limit.`,
        confidence: "HIGH",
        expertReviewReq: analysis.status === "REVIEW REQUIRED"
      }
    });

    // 4. Generate Alert if exceeded
    if (analysis.status === "MRL EXCEEDED" || analysis.status === "WARNING") {
      await prisma.alert.create({
        data: {
          severity: analysis.status === "MRL EXCEEDED" ? "CRITICAL" : "MEDIUM",
          title: `MRL Alert: ${analysis.status} for ${substanceDetected}`,
          message: `Detected ${amountDetected} ${unit} in ${productType} from Tag ${tagId}. MRL is ${analysis.applicableMrl}.`,
          recipientRole: "REGULATOR"
        }
      });
    }

    // 5. Create Blockchain Record
    const hashData = `${testResult.id}-${substanceDetected}-${amountDetected}-${Date.now()}`;
    const blockchainRecord = await prisma.blockchainRecord.create({
      data: {
        recordType: "TEST_RESULT",
        recordId: testResult.id,
        testResultId: testResult.id,
        hash: require("crypto").createHash("sha256").update(hashData).digest("hex"),
        status: "PENDING"
      }
    });

    // 6. Trigger Email notification to Farmer (non-blocking, non-destructive)
    let emailResult = null;
    try {
      const farmerObj = tag.animal?.farm?.farmer || tag.batch?.farm?.farmer;
      if (farmerObj) {
        emailResult = await sendMRLResultEmail({
          farmerName: farmerObj.fullName,
          farmerEmail: farmerObj.notificationEmail,
          animalOrBatchId: tagId,
          result: `${amountDetected} ${unit} (${substanceDetected})`,
          mrlStatus: analysis.status,
          testDate: testResult.testDate,
          farmerId: farmerObj.id
        });
      }
    } catch (mailErr) {
      console.error("[WARN] Failed to trigger MRL result email:", mailErr.message);
    }

    res.json({ testResult, aiReport, blockchainRecord, emailNotification: emailResult?.notification });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
