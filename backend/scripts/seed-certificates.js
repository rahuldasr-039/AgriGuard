const { PrismaClient } = require("@prisma/client");
const { ethers } = require("ethers");
const QRCode = require("qrcode");

const prisma = new PrismaClient();

function computeHash(data) {
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

async function seedCertificates() {
  console.log("=== Seeding Demo MRL Certificates ===");

  const rajesh = await prisma.farmer.findFirst({ where: { farmerId: "FR10293" } });
  const farmer4 = await prisma.farmer.findFirst({ where: { farmerId: "FR10294" } });
  const farmer5 = await prisma.farmer.findFirst({ where: { farmerId: "FR10295" } });
  const regulator = await prisma.user.findFirst({ where: { role: "REGULATOR" } });

  if (!rajesh) {
    console.error("Farmer FR10293 not found! Skipping.");
    return;
  }

  // Clear existing certificates to have a clean slate
  await prisma.certificateAuditLog.deleteMany({});
  await prisma.mRLCertificate.deleteMany({});

  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  // 1. Rajesh (FR10293) - ACTIVE WEEK: APPROVED + SAFE
  const rajeshCertId = "CERT-102931";
  const rajeshVerifId = "AGV-8F2K9L";
  const rajeshPayload = `/certify/verify/${rajeshVerifId}`;
  const rajeshHash = computeHash({
    certificateId: rajeshCertId,
    farmerCode: rajesh.farmerId,
    mrlStatus: "SAFE",
    validFrom: weekStart,
    validUntil: weekEnd,
    approvedBy: "FSSAI Regulatory Officer",
    statusTimestamp: now
  });

  const c1 = await prisma.mRLCertificate.create({
    data: {
      certificateId: rajeshCertId,
      farmerId: rajesh.id,
      farmerCode: rajesh.farmerId,
      approvedBy: "FSSAI Central Regulator",
      approvedById: regulator ? regulator.id : null,
      approvalStatus: "APPROVED",
      mrlStatus: "SAFE",
      validFrom: weekStart,
      validUntil: weekEnd,
      verificationId: rajeshVerifId,
      qrPayload: rajeshPayload,
      blockchainHash: rajeshHash,
      notes: "Routine mass spectrometry MRL screening verified below Codex Alimentarius threshold.",
      approvalTimestamp: now,
      statusTimestamp: now,
      auditLogs: {
        create: [
          {
            regulatorId: regulator ? regulator.id : "FSSAI_REG",
            regulatorName: "FSSAI Central Regulator",
            action: "APPROVED",
            previousStatus: "PENDING",
            newStatus: "APPROVED",
            details: "Farmer documents and AMU withdrawal logs inspected and verified."
          },
          {
            regulatorId: regulator ? regulator.id : "FSSAI_REG",
            regulatorName: "FSSAI Central Regulator",
            action: "SAFE_SET",
            previousStatus: "NOT_SET",
            newStatus: "SAFE",
            details: `MRL status evaluated as SAFE. Blockchain Proof: ${rajeshHash}`
          }
        ]
      }
    }
  });
  console.log(`✓ Seeded Rajesh (FR10293): APPROVED + SAFE (${rajeshCertId} / ${rajeshVerifId})`);

  // 2. Rajesh (FR10293) - HISTORICAL EXPIRED CERTIFICATE (Last Week)
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const histCertId = "CERT-102928";
  const histVerifId = "AGV-PAST01";
  const histPayload = `/certify/verify/${histVerifId}`;
  const histHash = computeHash({
    certificateId: histCertId,
    farmerCode: rajesh.farmerId,
    mrlStatus: "SAFE",
    validFrom: lastWeekStart,
    validUntil: lastWeekEnd,
    approvedBy: "FSSAI Central Regulator",
    statusTimestamp: lastWeekStart
  });

  await prisma.mRLCertificate.create({
    data: {
      certificateId: histCertId,
      farmerId: rajesh.id,
      farmerCode: rajesh.farmerId,
      approvedBy: "FSSAI Central Regulator",
      approvedById: regulator ? regulator.id : null,
      approvalStatus: "APPROVED", // note: dynamic expiry will treat as EXPIRED
      mrlStatus: "SAFE",
      validFrom: lastWeekStart,
      validUntil: lastWeekEnd,
      verificationId: histVerifId,
      qrPayload: histPayload,
      blockchainHash: histHash,
      notes: "Previous week certificate (historical record).",
      approvalTimestamp: lastWeekStart,
      statusTimestamp: lastWeekStart,
      createdAt: lastWeekStart,
      auditLogs: {
        create: [
          {
            regulatorId: regulator ? regulator.id : "FSSAI_REG",
            regulatorName: "FSSAI Central Regulator",
            action: "APPROVED",
            previousStatus: "PENDING",
            newStatus: "APPROVED",
            details: "Historical cycle approved."
          }
        ]
      }
    }
  });
  console.log(`✓ Seeded Rajesh (FR10293) Historical: EXPIRED (${histCertId} / ${histVerifId})`);

  // 3. Farmer 4 (FR10294) - PENDING CERTIFICATE
  if (farmer4) {
    const f4CertId = "CERT-102940";
    const f4VerifId = "AGV-PEND40";
    await prisma.mRLCertificate.create({
      data: {
        certificateId: f4CertId,
        farmerId: farmer4.id,
        farmerCode: farmer4.farmerId,
        approvalStatus: "PENDING",
        mrlStatus: "NOT_SET",
        validFrom: weekStart,
        validUntil: weekEnd,
        verificationId: f4VerifId,
        qrPayload: `/certify/verify/${f4VerifId}`,
        notes: "Awaiting regulator review of recent treatment logs.",
        auditLogs: {
          create: [
            {
              regulatorId: "SYSTEM_INITIATED",
              regulatorName: "AgriGuard Workflow",
              action: "CREATED",
              previousStatus: null,
              newStatus: "PENDING",
              details: "Weekly review requested by Farmer 4."
            }
          ]
        }
      }
    });
    console.log(`✓ Seeded Farmer 4 (FR10294): PENDING (${f4CertId})`);
  }

  // 4. Farmer 5 (FR10295) - APPROVED + UNSAFE
  if (farmer5) {
    const f5CertId = "CERT-102950";
    const f5VerifId = "AGV-WARN50";
    const f5Hash = computeHash({
      certificateId: f5CertId,
      farmerCode: farmer5.farmerId,
      mrlStatus: "UNSAFE",
      validFrom: weekStart,
      validUntil: weekEnd,
      approvedBy: "FSSAI Central Regulator",
      statusTimestamp: now
    });

    await prisma.mRLCertificate.create({
      data: {
        certificateId: f5CertId,
        farmerId: farmer5.id,
        farmerCode: farmer5.farmerId,
        approvedBy: "FSSAI Central Regulator",
        approvedById: regulator ? regulator.id : null,
        approvalStatus: "APPROVED",
        mrlStatus: "UNSAFE",
        validFrom: weekStart,
        validUntil: weekEnd,
        verificationId: f5VerifId,
        qrPayload: `/certify/verify/${f5VerifId}`,
        blockchainHash: f5Hash,
        notes: "Enrofloxacin residues detected above Codex Alimentarius MRL threshold. Active withholding period mandatory.",
        approvalTimestamp: now,
        statusTimestamp: now,
        auditLogs: {
          create: [
            {
              regulatorId: regulator ? regulator.id : "FSSAI_REG",
              regulatorName: "FSSAI Central Regulator",
              action: "APPROVED",
              previousStatus: "PENDING",
              newStatus: "APPROVED",
              details: "Lab test flagged residue exceedance."
            },
            {
              regulatorId: regulator ? regulator.id : "FSSAI_REG",
              regulatorName: "FSSAI Central Regulator",
              action: "UNSAFE_SET",
              previousStatus: "NOT_SET",
              newStatus: "UNSAFE",
              details: `MRL status evaluated as UNSAFE. Produce quarantine active. Hash: ${f5Hash}`
            }
          ]
        }
      }
    });
    console.log(`✓ Seeded Farmer 5 (FR10295): APPROVED + UNSAFE (${f5CertId} / ${f5VerifId})`);
  }

  console.log("=== Seeding Certificates Complete ===");
}

seedCertificates()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
