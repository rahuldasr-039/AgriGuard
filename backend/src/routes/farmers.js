const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();
const prisma = new PrismaClient();

// Get all farmers (Regulator only)
router.get("/", authenticate, authorize("REGULATOR"), async (req, res) => {
  try {
    const farmers = await prisma.farmer.findMany({
      include: { user: { select: { email: true, isActive: true } }, assignedVet: true }
    });
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get farmers for logged in vet
router.get("/my-farmers", authenticate, authorize("VETERINARIAN"), async (req, res) => {
  try {
    const vetProfile = await prisma.veterinarian.findUnique({
      where: { userId: req.user.id }
    });
    if (!vetProfile) return res.status(404).json({ error: "Vet profile not found" });

    const farmers = await prisma.farmer.findMany({
      where: { 
        OR: [
          { assignedVetId: vetProfile.id },
          { assignedVetId: null, approvalStatus: "PENDING" }
        ]
      },
      include: {
        user: { select: { email: true } },
        farms: { include: { animals: true, batches: true } }
      }
    });
    res.json(farmers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logged in farmer's profile
router.get("/my-profile", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id },
      include: {
        farms: {
          include: {
            animals: {
              include: {
                tag: {
                  include: {
                    treatments: {
                      include: { withdrawal: true },
                      orderBy: { dateAdministered: "desc" }
                    }
                  }
                }
              }
            },
            batches: {
              include: {
                tag: {
                  include: {
                    treatments: {
                      include: { withdrawal: true },
                      orderBy: { dateAdministered: "desc" }
                    }
                  }
                }
              }
            }
          }
        },
        assignedVet: true
      }
    });
    if (!farmer) return res.status(404).json({ error: "Farmer profile not found" });

    const now = new Date();
    // Synchronize statuses in real-time according to treatment records
    if (farmer.farms) {
      for (const farm of farmer.farms) {
        if (farm.animals) {
          for (const a of farm.animals) {
            const hasActiveWithdrawal = a.tag?.treatments?.some(t =>
              t.withdrawal && new Date(t.withdrawal.safeFromDate) > now
            );
            const expectedStatus = hasActiveWithdrawal ? "WITHDRAWAL" : "SAFE";
            if (a.status !== expectedStatus) {
              a.status = expectedStatus;
              await prisma.animal.update({
                where: { id: a.id },
                data: { status: expectedStatus }
              });
            }
          }
        }
        if (farm.batches) {
          for (const b of farm.batches) {
            const hasActiveWithdrawal = b.tag?.treatments?.some(t =>
              t.withdrawal && new Date(t.withdrawal.safeFromDate) > now
            );
            const expectedStatus = hasActiveWithdrawal ? "WITHDRAWAL" : "SAFE";
            if (b.status !== expectedStatus) {
              b.status = expectedStatus;
              await prisma.animalBatch.update({
                where: { id: b.id },
                data: { status: expectedStatus }
              });
            }
          }
        }
      }
    }

    res.json(farmer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get logged in farmer's withdrawal waste & DBT subsidies
router.get("/my-subsidies", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id }
    });
    if (!farmer) return res.status(404).json({ error: "Farmer profile not found" });

    const claims = await prisma.withdrawalWasteClaim.findMany({
      where: {
        farmerId: farmer.farmerId,
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
      orderBy: { date: "desc" }
    });

    const totalEntitlement = claims.reduce((acc, c) => acc + (c.aiRecommendedAmount || 0), 0);
    const totalDisbursed = claims
      .filter(c => c.status === "DISBURSED (PAID)")
      .reduce((acc, c) => acc + (c.aiRecommendedAmount || 0), 0);
    const totalPending = claims
      .filter(c => c.status !== "DISBURSED (PAID)")
      .reduce((acc, c) => acc + (c.aiRecommendedAmount || 0), 0);

    res.json({
      farmerId: farmer.farmerId,
      fullName: farmer.fullName,
      bankAccountLinked: true,
      dbtScheme: "FSSAI Statutory Antimicrobial Withdrawal Compensation (DBT)",
      summary: {
        totalClaims: claims.length,
        totalEntitlement,
        totalDisbursed,
        totalPending
      },
      claims: claims.map(c => {
        const isPaid = c.status === "DISBURSED (PAID)";
        let txnMatch = c.notes?.match(/Reference:\s*([A-Za-z0-9\-]+)/);
        let gatewayMatch = c.notes?.match(/Gateway:\s*([^\.]+)/);
        return {
          id: c.id,
          claimId: c.claimId,
          farmerId: c.farmerId,
          animalType: c.animalType,
          animalId: c.animalId,
          productType: c.productType,
          wasteAmount: c.wasteAmount,
          unit: c.unit || "kg",
          date: c.date,
          aiRecommendedAmount: c.aiRecommendedAmount,
          status: c.status,
          amountReceived: isPaid ? c.aiRecommendedAmount : 0,
          transactionId: txnMatch ? txnMatch[1] : (isPaid ? "DBT-COMPLETED" : null),
          gateway: gatewayMatch ? gatewayMatch[1].trim() : (isPaid ? "PFMS / Aadhaar DBT Gateway" : null),
          disbursedDate: isPaid ? c.updatedAt : null,
          notes: c.notes,
          tester: c.tester
        };
      })
    });
  } catch (error) {
    console.error("Error fetching farmer subsidies:", error);
    res.status(500).json({ error: error.message });
  }
});

// Get farmer details
router.get("/:id", authenticate, async (req, res) => {
  try {
    const farmer = await prisma.farmer.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true } },
        farms: { include: { animals: { include: { tag: true } }, batches: { include: { tag: true } } } },
        assignedVet: true
      }
    });
    if (!farmer) return res.status(404).json({ error: "Farmer not found" });
    res.json(farmer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Approve/Reject Farmer (Regulator or Vet)
router.patch("/:id/approval", authenticate, authorize("REGULATOR", "VETERINARIAN"), async (req, res) => {
  try {
    const { status, reason } = req.body; // APPROVED or REJECTED
    
    let vetProfile = null;
    if (req.user.role === "VETERINARIAN") {
      vetProfile = await prisma.veterinarian.findUnique({ where: { userId: req.user.id } });
    }

    const dataToUpdate = { approvalStatus: status };
    if (vetProfile) {
      dataToUpdate.assignedVetId = vetProfile.id;
    }

    const farmer = await prisma.farmer.update({
      where: { id: req.params.id },
      data: dataToUpdate
    });
    
    await prisma.approval.create({
      data: {
        type: "FARMER_REGISTRATION",
        status: status,
        reason: reason,
        farmerId: farmer.id,
        regulatorId: req.user.role === "REGULATOR" ? req.user.id : null,
        vetId: vetProfile ? vetProfile.id : null,
      }
    });

    res.json(farmer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Farmer adds a new animal or batch to their farm with full registration details
router.post("/my-animals", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const { category, tag, species, weight, count, isBatch, breed, gender, healthStatus, notes } = req.body;

    if (!category) {
      return res.status(400).json({ error: "Animal category is required" });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id },
      include: { farms: true }
    });
    if (!farmer) return res.status(404).json({ error: "Farmer profile not found" });

    let farm = farmer.farms[0];
    if (!farm) {
      farm = await prisma.farm.create({
        data: {
          farmId: `FM-${Date.now().toString().slice(-6)}`,
          name: `${farmer.fullName}'s Farm`,
          location: farmer.farmLocation || "District 1",
          farmerId: farmer.id
        }
      });
    }

    const tagStr = (tag || `RJ-${category.substring(0, 2).toUpperCase()}-${Date.now().toString().slice(-4)}`).toUpperCase();

    // Check if tag exists
    const existingTag = await prisma.animalTag.findUnique({ where: { tag: tagStr } });
    if (existingTag) {
      return res.status(400).json({ error: `Tag ${tagStr} already registered. Please provide or generate a unique tag.` });
    }

    if (isBatch || ["Chicken", "Fish", "Prawns", "Poultry"].includes(category)) {
      const batchCount = parseInt(count) || 100;
      const batch = await prisma.animalBatch.create({
        data: {
          farmId: farm.id,
          category,
          species: species || category,
          count: batchCount,
          status: healthStatus === "WITHDRAWAL" ? "WITHDRAWAL" : "SAFE",
          tag: {
            create: {
              tag: tagStr,
              type: "BATCH"
            }
          }
        },
        include: { tag: true }
      });

      // Audit Alert Log
      await prisma.alert.create({
        data: {
          severity: "INFO",
          status: "RESOLVED",
          title: `New Livestock Batch Registered: ${category}`,
          message: `Farmer ${farmer.fullName} (${farmer.farmerId}) registered batch ${tagStr} (${batchCount} head of ${category}). Breed/Notes: ${breed || notes || 'N/A'}`
        }
      }).catch(() => {});

      return res.json({ success: true, item: batch, type: "BATCH", message: `Successfully registered batch ${tagStr} (${batchCount} head)` });
    } else {
      const animalWeight = parseFloat(weight) || 350;
      const animal = await prisma.animal.create({
        data: {
          farmId: farm.id,
          category,
          species: species || category,
          weight: animalWeight,
          status: healthStatus === "WITHDRAWAL" ? "WITHDRAWAL" : "SAFE",
          tag: {
            create: {
              tag: tagStr,
              type: "INDIVIDUAL"
            }
          }
        },
        include: { tag: true }
      });

      // Audit Alert Log
      await prisma.alert.create({
        data: {
          severity: "INFO",
          status: "RESOLVED",
          title: `New Individual Animal Registered: ${category} (${tagStr})`,
          message: `Farmer ${farmer.fullName} (${farmer.farmerId}) registered individual ${category} (Tag: ${tagStr}, Weight: ${animalWeight} kg). Breed/Notes: ${breed || notes || 'N/A'}`
        }
      }).catch(() => {});

      return res.json({ success: true, item: animal, type: "INDIVIDUAL", message: `Successfully registered ${category} (${tagStr})` });
    }
  } catch (error) {
    console.error("Error adding animal:", error);
    res.status(500).json({ error: error.message });
  }
});

// Farmer reduces animal count or deregisters animal/batch providing mandatory reason
router.post("/my-animals/reduce", authenticate, authorize("FARMER"), async (req, res) => {
  try {
    const { animalId, isBatch, reductionCount, reason, notes } = req.body;

    if (!reason || reason.trim() === "") {
      return res.status(400).json({ error: "Reason for reducing/deregistering livestock is mandatory." });
    }

    const farmer = await prisma.farmer.findUnique({
      where: { userId: req.user.id },
      include: { farms: true }
    });
    if (!farmer) return res.status(404).json({ error: "Farmer profile not found" });

    const farmIds = farmer.farms.map(f => f.id);

    if (isBatch) {
      const batch = await prisma.animalBatch.findFirst({
        where: { id: animalId, farmId: { in: farmIds } },
        include: { tag: true }
      });
      if (!batch) return res.status(404).json({ error: "Animal batch holding not found" });

      const countToDeduct = parseInt(reductionCount);
      if (isNaN(countToDeduct) || countToDeduct <= 0) {
        return res.status(400).json({ error: "Please specify a valid reduction count greater than zero." });
      }

      if (countToDeduct >= batch.count) {
        // Complete batch removal
        if (batch.tag?.id) {
          const bTagId = batch.tag.id;
          await prisma.withdrawalRecord.deleteMany({ where: { treatment: { tagId: bTagId } } }).catch(() => {});
          await prisma.aMURecord.deleteMany({ where: { tagId: bTagId } }).catch(() => {});
          await prisma.blockchainRecord.deleteMany({
            where: {
              OR: [
                { treatment: { tagId: bTagId } },
                { vaccination: { tagId: bTagId } },
                { testResult: { tagId: bTagId } }
              ]
            }
          }).catch(() => {});
          await prisma.testResult.deleteMany({ where: { tagId: bTagId } }).catch(() => {});
          await prisma.treatment.deleteMany({ where: { tagId: bTagId } }).catch(() => {});
          await prisma.vaccination.deleteMany({ where: { tagId: bTagId } }).catch(() => {});
          await prisma.animalTag.deleteMany({ where: { id: bTagId } }).catch(() => {});
        }
        await prisma.animalBatch.delete({ where: { id: batch.id } });

        // Audit Alert
        await prisma.alert.create({
          data: {
            severity: "INFO",
            status: "RESOLVED",
            title: `Batch Deregistered: ${batch.category} (${batch.tag?.tag || "N/A"})`,
            message: `Farmer ${farmer.fullName} (${farmer.farmerId}) removed full batch of ${batch.count} ${batch.category}. Reason: ${reason}. ${notes ? "Notes: " + notes : ""}`
          }
        }).catch(() => {});

        return res.json({ 
          success: true, 
          message: `Batch (${batch.count} head) completely removed for reason: ${reason}` 
        });
      } else {
        // Partial count reduction
        const newCount = batch.count - countToDeduct;
        await prisma.animalBatch.update({
          where: { id: batch.id },
          data: { count: newCount }
        });

        // Audit Alert
        await prisma.alert.create({
          data: {
            severity: "INFO",
            status: "RESOLVED",
            title: `Batch Inventory Reduced: ${batch.category} (${batch.tag?.tag || "N/A"})`,
            message: `Farmer ${farmer.fullName} (${farmer.farmerId}) reduced ${countToDeduct} head of ${batch.category} (Remaining: ${newCount}). Reason: ${reason}. ${notes ? "Notes: " + notes : ""}`
          }
        }).catch(() => {});

        return res.json({ 
          success: true, 
          newCount,
          message: `Successfully reduced ${countToDeduct} head. Remaining: ${newCount} (Reason: ${reason})` 
        });
      }
    } else {
      // Individual Animal Deregistration
      const animal = await prisma.animal.findFirst({
        where: { id: animalId, farmId: { in: farmIds } },
        include: { tag: true }
      });
      if (!animal) return res.status(404).json({ error: "Animal record not found" });

      const tagId = animal.tag?.id;
      const tagStr = animal.tag?.tag || "N/A";

      if (tagId) {
        await prisma.withdrawalRecord.deleteMany({ where: { treatment: { tagId } } }).catch(() => {});
        await prisma.aMURecord.deleteMany({ where: { tagId } }).catch(() => {});
        await prisma.blockchainRecord.deleteMany({
          where: {
            OR: [
              { treatment: { tagId } },
              { vaccination: { tagId } },
              { testResult: { tagId } }
            ]
          }
        }).catch(() => {});
        await prisma.testResult.deleteMany({ where: { tagId } }).catch(() => {});
        await prisma.treatment.deleteMany({ where: { tagId } }).catch(() => {});
        await prisma.vaccination.deleteMany({ where: { tagId } }).catch(() => {});
        await prisma.animalTag.deleteMany({ where: { id: tagId } }).catch(() => {});
      }
      await prisma.animal.delete({ where: { id: animal.id } });

      // Audit Alert
      await prisma.alert.create({
        data: {
          severity: "INFO",
          status: "RESOLVED",
          title: `Livestock Deregistered: ${animal.category} (${tagStr})`,
          message: `Farmer ${farmer.fullName} (${farmer.farmerId}) deregistered ${animal.category} (${tagStr}). Reason: ${reason}. ${notes ? "Notes: " + notes : ""}`
        }
      }).catch(() => {});

      return res.json({ 
        success: true, 
        message: `Successfully deregistered ${animal.category} (${tagStr}) for reason: ${reason}` 
      });
    }
  } catch (error) {
    console.error("Error reducing animal count:", error);
    res.status(500).json({ error: error.message });
  }
});

// Delete farmer record (Veterinarian or Regulator)
router.delete("/:id", authenticate, authorize("VETERINARIAN", "REGULATOR"), async (req, res) => {
  try {
    const targetId = req.params.id;
    const farmer = await prisma.farmer.findFirst({
      where: {
        OR: [
          { id: targetId },
          { farmerId: targetId }
        ]
      },
      include: {
        farms: {
          include: {
            animals: { include: { tag: true } },
            batches: { include: { tag: true } }
          }
        }
      }
    });

    if (!farmer) {
      return res.status(404).json({ error: "Farmer record not found" });
    }

    // Collect all tag IDs for this farmer's farms
    const tagIds = [];
    farmer.farms.forEach(farm => {
      farm.animals?.forEach(a => { if (a.tag?.id) tagIds.push(a.tag.id); });
      farm.batches?.forEach(b => { if (b.tag?.id) tagIds.push(b.tag.id); });
    });

    // 1. Delete associated child records
    if (tagIds.length > 0) {
      await prisma.withdrawalRecord.deleteMany({
        where: { treatment: { tagId: { in: tagIds } } }
      }).catch(() => {});
      await prisma.aIReport.deleteMany({
        where: { testResult: { tagId: { in: tagIds } } }
      });
      await prisma.blockchainRecord.deleteMany({
        where: {
          OR: [
            { treatment: { tagId: { in: tagIds } } },
            { vaccination: { tagId: { in: tagIds } } },
            { testResult: { tagId: { in: tagIds } } }
          ]
        }
      });
      await prisma.testResult.deleteMany({ where: { tagId: { in: tagIds } } });
      await prisma.treatment.deleteMany({ where: { tagId: { in: tagIds } } });
      await prisma.vaccination.deleteMany({ where: { tagId: { in: tagIds } } });
      await prisma.aMURecord.deleteMany({ where: { tagId: { in: tagIds } } });
      await prisma.animalTag.deleteMany({ where: { id: { in: tagIds } } });
    }

    // 2. Delete animals and batches
    for (const farm of farmer.farms) {
      await prisma.animal.deleteMany({ where: { farmId: farm.id } });
      await prisma.animalBatch.deleteMany({ where: { farmId: farm.id } });
    }

    // 3. Delete farms
    await prisma.farm.deleteMany({ where: { farmerId: farmer.id } });

    // 4. Delete approvals and alerts
    await prisma.approval.deleteMany({ where: { farmerId: farmer.id } });
    await prisma.alert.deleteMany({ where: { recipientId: farmer.id } }).catch(() => {});

    // 5. Delete farmer record
    await prisma.farmer.delete({ where: { id: farmer.id } });

    // 6. Delete linked user account if exists
    if (farmer.userId) {
      await prisma.user.delete({ where: { id: farmer.userId } }).catch(() => {});
    }

    res.json({ success: true, message: `Farmer ${farmer.fullName} (${farmer.farmerId}) deleted successfully` });
  } catch (error) {
    console.error("Error deleting farmer:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
