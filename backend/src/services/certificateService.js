const { PrismaClient } = require("@prisma/client");
const { ethers } = require("ethers");
const QRCode = require("qrcode");
const crypto = require("crypto");

const prisma = new PrismaClient();

/**
 * Generate unique random alphanumeric code
 */
function generateCode(prefix, length = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix}-${result}`;
}

/**
 * Compute Keccak-256 hash for certificate proof
 */
function computeCertificateHash(data) {
  const payload = [
    data.certificateId || "",
    data.farmerCode || "",
    data.mrlStatus || "",
    data.validFrom ? new Date(data.validFrom).toISOString() : "",
    data.validUntil ? new Date(data.validUntil).toISOString() : "",
    data.approvedBy || "",
    data.statusTimestamp ? new Date(data.statusTimestamp).toISOString() : ""
  ].join("::");

  return ethers.keccak256(ethers.toUtf8Bytes(payload));
}

/**
 * Evaluate dynamic expiry on a certificate record
 */
function evaluateCertificateExpiry(cert) {
  if (!cert) return null;
  const now = new Date();
  const validUntil = new Date(cert.validUntil);
  const isExpired = now > validUntil;

  if (isExpired && cert.approvalStatus === "APPROVED") {
    return {
      ...cert,
      approvalStatus: "EXPIRED",
      mrlStatus: "NOT_SET",
      isExpired: true,
      premiumEligible: false
    };
  }

  return {
    ...cert,
    isExpired,
    premiumEligible: cert.approvalStatus === "APPROVED" && cert.mrlStatus === "SAFE" && !isExpired
  };
}

/**
 * Create a new weekly certificate in PENDING state
 */
async function createCertificate({ farmerId, validFrom, validUntil, notes }) {
  // Find the farmer record
  const farmer = await prisma.farmer.findFirst({
    where: {
      OR: [
        { id: farmerId },
        { farmerId: farmerId }
      ]
    },
    include: { user: true }
  });

  if (!farmer) {
    throw new Error("Farmer not found with provided ID");
  }

  const fromDate = validFrom ? new Date(validFrom) : new Date();
  const untilDate = validUntil ? new Date(validUntil) : new Date(fromDate.getTime() + 7 * 24 * 60 * 60 * 1000);

  if (untilDate <= fromDate) {
    throw new Error("validUntil must be greater than validFrom");
  }

  const certificateId = generateCode("CERT", 6);
  const verificationId = generateCode("AGV", 6);
  const qrPayload = `/certify/verify/${verificationId}`;

  // Pre-generate QR data URL (SVG/PNG data URL)
  let qrDataUrl = null;
  try {
    qrDataUrl = await QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: "H",
      margin: 2,
      color: { dark: "#0f172a", light: "#ffffff" }
    });
  } catch (e) {
    console.error("QR generation warning:", e);
  }

  const newCert = await prisma.mRLCertificate.create({
    data: {
      certificateId,
      farmerId: farmer.id,
      farmerCode: farmer.farmerId,
      approvalStatus: "PENDING",
      mrlStatus: "NOT_SET",
      validFrom: fromDate,
      validUntil: untilDate,
      verificationId,
      qrPayload,
      notes: notes || null
    },
    include: {
      farmer: {
        include: { user: { select: { email: true } }, farms: true }
      }
    }
  });

  // Log creation audit
  await prisma.certificateAuditLog.create({
    data: {
      certificateId: newCert.id,
      regulatorId: "SYSTEM_INITIATED",
      regulatorName: "AgriGuard Workflow",
      action: "CREATED",
      previousStatus: null,
      newStatus: "PENDING",
      details: `Weekly certificate created for ${farmer.fullName} (${farmer.farmerId}). Status: PENDING`
    }
  });

  return evaluateCertificateExpiry({ ...newCert, qrDataUrl });
}

/**
 * Step 1: Approve or Reject Certificate (FSSAI Regulator only)
 */
async function approveCertificate({ id, regulatorUser, action, reason }) {
  const cert = await prisma.mRLCertificate.findUnique({
    where: { id },
    include: { farmer: { include: { user: true } } }
  });

  if (!cert) {
    throw new Error("Certificate not found");
  }

  if (action !== "APPROVE" && action !== "REJECT") {
    throw new Error("Invalid action. Must be 'APPROVE' or 'REJECT'");
  }

  const previousApprovalStatus = cert.approvalStatus;
  const newApprovalStatus = action === "APPROVE" ? "APPROVED" : "REJECTED";
  const newMrlStatus = action === "APPROVE" ? cert.mrlStatus : "NOT_SET";

  const updatedCert = await prisma.mRLCertificate.update({
    where: { id },
    data: {
      approvalStatus: newApprovalStatus,
      mrlStatus: newMrlStatus,
      approvedBy: regulatorUser.fullName || regulatorUser.email || "FSSAI Central Regulator",
      approvedById: regulatorUser.id,
      approvalTimestamp: new Date(),
      rejectionReason: action === "REJECT" ? reason || "Regulatory non-compliance" : null
    },
    include: {
      farmer: {
        include: { user: { select: { email: true } }, farms: true }
      }
    }
  });

  // Audit log
  await prisma.certificateAuditLog.create({
    data: {
      certificateId: id,
      regulatorId: regulatorUser.id,
      regulatorName: regulatorUser.fullName || regulatorUser.email,
      action: newApprovalStatus,
      previousStatus: previousApprovalStatus,
      newStatus: newApprovalStatus,
      details: `Certification ${action} by regulator ${regulatorUser.email}. ${reason ? "Reason: " + reason : ""}`
    }
  });

  // Create Farmer Notification / Alert
  try {
    await prisma.alert.create({
      data: {
        severity: action === "APPROVE" ? "LOW" : "HIGH",
        status: "OPEN",
        title: `MRL Certification ${newApprovalStatus}`,
        message: action === "APPROVE"
          ? `Your weekly MRL certification (${cert.certificateId}) has been APPROVED by FSSAI. Awaiting MRL status determination.`
          : `Your weekly MRL certification (${cert.certificateId}) was REJECTED. Reason: ${reason || "N/A"}`,
        recipientRole: "FARMER",
        recipientId: cert.farmer.userId
      }
    });
  } catch (e) {
    console.error("Alert creation warning:", e);
  }

  return evaluateCertificateExpiry(updatedCert);
}

/**
 * Step 2: Set MRL Status (SAFE / UNSAFE) - STRICTLY ENFORCED: Must be APPROVED first!
 */
async function setMrlStatus({ id, regulatorUser, mrlStatus, validFrom, validUntil, notes }) {
  const cert = await prisma.mRLCertificate.findUnique({
    where: { id },
    include: { farmer: { include: { user: true } } }
  });

  if (!cert) {
    throw new Error("Certificate not found");
  }

  // STRICT TWO-STEP BUSINESS RULE ENFORCEMENT:
  if (cert.approvalStatus !== "APPROVED") {
    throw new Error("Certificate must be approved before MRL status can be set.");
  }

  if (mrlStatus !== "SAFE" && mrlStatus !== "UNSAFE") {
    throw new Error("Invalid MRL status. Must be 'SAFE' or 'UNSAFE'");
  }

  const fromDate = validFrom ? new Date(validFrom) : cert.validFrom;
  const untilDate = validUntil ? new Date(validUntil) : cert.validUntil;

  if (untilDate <= fromDate) {
    throw new Error("validUntil must be greater than validFrom");
  }

  const statusTimestamp = new Date();
  const approvedBy = regulatorUser.fullName || regulatorUser.email || "FSSAI Central Regulator";

  // Compute Keccak-256 blockchain proof hash
  const blockchainHash = computeCertificateHash({
    certificateId: cert.certificateId,
    farmerCode: cert.farmerCode,
    mrlStatus,
    validFrom: fromDate,
    validUntil: untilDate,
    approvedBy,
    statusTimestamp
  });

  const previousMrlStatus = cert.mrlStatus;

  const updatedCert = await prisma.mRLCertificate.update({
    where: { id },
    data: {
      mrlStatus,
      validFrom: fromDate,
      validUntil: untilDate,
      statusTimestamp,
      blockchainHash,
      notes: notes || cert.notes
    },
    include: {
      farmer: {
        include: { user: { select: { email: true } }, farms: true }
      }
    }
  });

  // Audit log
  await prisma.certificateAuditLog.create({
    data: {
      certificateId: id,
      regulatorId: regulatorUser.id,
      regulatorName: approvedBy,
      action: mrlStatus === "SAFE" ? "SAFE_SET" : "UNSAFE_SET",
      previousStatus: previousMrlStatus,
      newStatus: mrlStatus,
      details: `MRL status set to ${mrlStatus}. Validity: ${fromDate.toLocaleDateString()} to ${untilDate.toLocaleDateString()}. Blockchain Proof: ${blockchainHash}`
    }
  });

  // Create notification for Farmer
  try {
    await prisma.alert.create({
      data: {
        severity: mrlStatus === "SAFE" ? "LOW" : "HIGH",
        status: "OPEN",
        title: `MRL Status Updated: ${mrlStatus}`,
        message: mrlStatus === "SAFE"
          ? `Congratulations! Your farm has been verified MRL SAFE (${cert.certificateId}). Premium Market Access is now ACTIVE.`
          : `Alert: Your farm was marked MRL NOT SAFE (${cert.certificateId}). Discard produce during withholding periods.`,
        recipientRole: "FARMER",
        recipientId: cert.farmer.userId
      }
    });
  } catch (e) {
    console.error("Alert creation warning:", e);
  }

  return evaluateCertificateExpiry(updatedCert);
}

/**
 * Public QR Verification (No authentication required)
 */
async function verifyCertificate(verificationId) {
  if (!verificationId) {
    throw new Error("Verification ID is required");
  }

  const cert = await prisma.mRLCertificate.findUnique({
    where: { verificationId },
    include: {
      farmer: {
        include: {
          farms: true,
          user: { select: { email: true } }
        }
      },
      auditLogs: {
        orderBy: { timestamp: "desc" },
        take: 5
      }
    }
  });

  if (!cert) {
    return {
      success: false,
      notFound: true,
      message: "Certificate not found. This QR code is invalid or unrecognized."
    };
  }

  const evaluated = evaluateCertificateExpiry(cert);

  // Check dynamic expiry
  if (evaluated.isExpired) {
    return {
      success: true,
      valid: false,
      status: "EXPIRED",
      badgeText: "CERTIFICATE EXPIRED",
      message: "This certificate has elapsed its weekly validity period. Please verify the farmer's latest certificate.",
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      farmerId: cert.farmerCode,
      farmerName: cert.farmer.fullName,
      farmName: cert.farmer.farms?.[0]?.name || "Primary Farm",
      validFrom: cert.validFrom,
      validUntil: cert.validUntil,
      approvedBy: cert.approvedBy,
      approvalStatus: "EXPIRED",
      mrlStatus: "NOT_SET",
      premiumEligible: false
    };
  }

  if (evaluated.approvalStatus !== "APPROVED") {
    return {
      success: true,
      valid: false,
      status: evaluated.approvalStatus,
      badgeText: `CERTIFICATE ${evaluated.approvalStatus}`,
      message: "This certificate is not currently approved by FSSAI regulators.",
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      farmerId: cert.farmerCode,
      farmerName: cert.farmer.fullName,
      approvalStatus: evaluated.approvalStatus,
      mrlStatus: "NOT_SET",
      premiumEligible: false
    };
  }

  if (evaluated.mrlStatus === "UNSAFE") {
    return {
      success: true,
      valid: false,
      status: "UNSAFE",
      badgeText: "MRL NOT SAFE",
      message: "WARNING: This farm has been designated as MRL NOT SAFE by FSSAI regulators. Produce does not meet safety benchmarks.",
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      farmerId: cert.farmerCode,
      farmerName: cert.farmer.fullName,
      farmName: cert.farmer.farms?.[0]?.name || "Primary Farm",
      validFrom: cert.validFrom,
      validUntil: cert.validUntil,
      approvedBy: cert.approvedBy,
      approvalStatus: "APPROVED",
      mrlStatus: "UNSAFE",
      blockchainHash: cert.blockchainHash,
      premiumEligible: false
    };
  }

  if (evaluated.mrlStatus === "SAFE") {
    return {
      success: true,
      valid: true,
      status: "SAFE",
      badgeText: "VALID CERTIFICATE — MRL SAFE",
      message: "VERIFIED: This producer has been inspected and certified MRL SAFE by FSSAI for the current weekly cycle.",
      certificateId: cert.certificateId,
      verificationId: cert.verificationId,
      farmerId: cert.farmerCode,
      farmerName: cert.farmer.fullName,
      farmName: cert.farmer.farms?.[0]?.name || "Primary Farm",
      farmLocation: cert.farmer.farmLocation,
      validFrom: cert.validFrom,
      validUntil: cert.validUntil,
      approvedBy: cert.approvedBy,
      approvalStatus: "APPROVED",
      mrlStatus: "SAFE",
      blockchainHash: cert.blockchainHash,
      premiumEligible: true,
      verifiedAt: new Date().toISOString()
    };
  }

  return {
    success: true,
    valid: false,
    status: "PENDING_STATUS",
    badgeText: "STATUS PENDING",
    message: "This certificate is approved, but MRL safety status has not yet been determined.",
    certificateId: cert.certificateId,
    verificationId: cert.verificationId,
    farmerId: cert.farmerCode,
    farmerName: cert.farmer.fullName,
    premiumEligible: false
  };
}

/**
 * Get active certificate and history for a farmer
 */
async function getFarmerCertificate(farmerIdentifier) {
  const farmer = await prisma.farmer.findFirst({
    where: {
      OR: [
        { id: farmerIdentifier },
        { farmerId: farmerIdentifier }
      ]
    },
    include: {
      farms: true,
      user: { select: { email: true } }
    }
  });

  if (!farmer) {
    throw new Error("Farmer not found");
  }

  // Get all certificates for this farmer, sorted by createdAt desc
  const allCerts = await prisma.mRLCertificate.findMany({
    where: { farmerId: farmer.id },
    orderBy: { createdAt: "desc" },
    include: {
      auditLogs: { orderBy: { timestamp: "desc" } }
    }
  });

  // Evaluate expiry on all
  const evaluatedCerts = allCerts.map(evaluateCertificateExpiry);

  // Find latest active certificate (first one that is approved/pending)
  let activeCert = evaluatedCerts[0] || null;

  // Pre-generate QR data URL for active certificate
  let qrDataUrl = null;
  if (activeCert) {
    try {
      qrDataUrl = await QRCode.toDataURL(activeCert.qrPayload, {
        errorCorrectionLevel: "H",
        margin: 2,
        color: { dark: "#0f172a", light: "#ffffff" }
      });
    } catch (e) {
      console.error("QR data url generation error:", e);
    }
  }

  return {
    farmer: {
      id: farmer.id,
      farmerId: farmer.farmerId,
      fullName: farmer.fullName,
      mobileNumber: farmer.mobileNumber,
      farmLocation: farmer.farmLocation,
      farmName: farmer.farms?.[0]?.name || "Primary Farm"
    },
    activeCertificate: activeCert ? { ...activeCert, qrDataUrl } : null,
    history: evaluatedCerts
  };
}

/**
 * List all certificates for Regulator dashboard
 */
async function listCertificatesForRegulator() {
  // Get all farmers to ensure every farmer has a status row
  const farmers = await prisma.farmer.findMany({
    include: {
      farms: true,
      user: { select: { email: true } },
      certificates: {
        orderBy: { createdAt: "desc" },
        take: 1,
        include: { auditLogs: { orderBy: { timestamp: "desc" }, take: 1 } }
      }
    },
    orderBy: { farmerId: "asc" }
  });

  const now = new Date();
  let totalFarmers = farmers.length;
  let pendingCount = 0;
  let safeCount = 0;
  let unsafeCount = 0;
  let expiredCount = 0;

  const rows = farmers.map(f => {
    const rawCert = f.certificates?.[0] || null;
    const cert = evaluateCertificateExpiry(rawCert);

    if (!cert) {
      pendingCount++;
      return {
        farmerId: f.farmerId,
        farmerProfileId: f.id,
        farmerName: f.fullName,
        farmName: f.farms?.[0]?.name || "Farm " + f.farmerId,
        location: f.farmLocation,
        certificateId: null,
        certificateDbId: null,
        approvalStatus: "PENDING",
        mrlStatus: "NOT_SET",
        validUntil: null,
        validFrom: null,
        verificationId: null,
        isExpired: false,
        premiumEligible: false,
        hasCertificate: false
      };
    }

    if (cert.approvalStatus === "PENDING") {
      pendingCount++;
    } else if (cert.isExpired || cert.approvalStatus === "EXPIRED") {
      expiredCount++;
    } else if (cert.approvalStatus === "APPROVED") {
      if (cert.mrlStatus === "SAFE") safeCount++;
      else if (cert.mrlStatus === "UNSAFE") unsafeCount++;
    }

    return {
      farmerId: f.farmerId,
      farmerProfileId: f.id,
      farmerName: f.fullName,
      farmName: f.farms?.[0]?.name || "Farm " + f.farmerId,
      location: f.farmLocation,
      certificateId: cert.certificateId,
      certificateDbId: cert.id,
      approvalStatus: cert.approvalStatus,
      mrlStatus: cert.mrlStatus,
      validUntil: cert.validUntil,
      validFrom: cert.validFrom,
      verificationId: cert.verificationId,
      isExpired: cert.isExpired || false,
      premiumEligible: cert.premiumEligible || false,
      hasCertificate: true,
      blockchainHash: cert.blockchainHash
    };
  });

  return {
    summary: {
      totalFarmers,
      pendingCertifications: pendingCount,
      mrlSafe: safeCount,
      mrlNotSafe: unsafeCount,
      expiredCertificates: expiredCount
    },
    certificates: rows
  };
}

/**
 * Get detailed evidence for a specific farmer (for Regulator Review Drawer)
 */
async function getFarmerEvidenceForReview(farmerIdentifier) {
  const farmer = await prisma.farmer.findFirst({
    where: {
      OR: [
        { id: farmerIdentifier },
        { farmerId: farmerIdentifier }
      ]
    },
    include: {
      user: { select: { email: true, createdAt: true } },
      farms: {
        include: {
          animals: {
            include: {
              tag: {
                include: {
                  treatments: {
                    include: { withdrawal: true, vet: true },
                    orderBy: { dateAdministered: "desc" },
                    take: 10
                  },
                  productTests: {
                    include: { tester: true },
                    orderBy: { testDate: "desc" },
                    take: 10
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
                    include: { withdrawal: true, vet: true },
                    orderBy: { dateAdministered: "desc" },
                    take: 10
                  },
                  productTests: {
                    include: { tester: true },
                    orderBy: { testDate: "desc" },
                    take: 10
                  }
                }
              }
            }
          }
        }
      },
      certificates: {
        orderBy: { createdAt: "desc" },
        include: { auditLogs: { orderBy: { timestamp: "desc" } } }
      }
    }
  });

  if (!farmer) {
    throw new Error("Farmer not found");
  }

  // Flatten treatments & tests
  const treatments = [];
  const tests = [];
  const activeWithdrawals = [];

  const processTag = (tag, entityName, type) => {
    if (!tag) return;
    if (tag.treatments) {
      tag.treatments.forEach(t => {
        treatments.push({
          ...t,
          entityName,
          entityType: type,
          tagCode: tag.tag
        });
        if (t.withdrawal && new Date(t.withdrawal.safeFromDate) > new Date()) {
          activeWithdrawals.push({
            ...t.withdrawal,
            medicineName: t.medicineName,
            entityName,
            tagCode: tag.tag
          });
        }
      });
    }
    if (tag.productTests) {
      tag.productTests.forEach(test => {
        tests.push({
          ...test,
          entityName,
          entityType: type,
          tagCode: tag.tag
        });
      });
    }
  };

  farmer.farms.forEach(farm => {
    farm.animals.forEach(a => processTag(a.tag, `${a.category} (${a.species})`, "Animal"));
    farm.batches.forEach(b => processTag(b.tag, `${b.category} (${b.count} head)`, "Batch"));
  });

  const latestCert = farmer.certificates?.[0] ? evaluateCertificateExpiry(farmer.certificates[0]) : null;

  return {
    farmer: {
      id: farmer.id,
      farmerId: farmer.farmerId,
      fullName: farmer.fullName,
      mobileNumber: farmer.mobileNumber,
      farmLocation: farmer.farmLocation,
      fullAddress: farmer.fullAddress,
      animalCategories: farmer.animalCategories,
      email: farmer.user?.email
    },
    latestCertificate: latestCert,
    certificateHistory: farmer.certificates.map(evaluateCertificateExpiry),
    evidence: {
      recentTreatments: treatments.sort((a, b) => new Date(b.dateAdministered) - new Date(a.dateAdministered)),
      activeWithdrawals,
      recentMrlTests: tests.sort((a, b) => new Date(b.testDate) - new Date(a.testDate))
    }
  };
}

module.exports = {
  createCertificate,
  approveCertificate,
  setMrlStatus,
  verifyCertificate,
  getFarmerCertificate,
  listCertificatesForRegulator,
  getFarmerEvidenceForReview,
  evaluateCertificateExpiry,
  computeCertificateHash,
  generateCode
};
