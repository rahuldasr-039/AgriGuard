const { PrismaClient } = require("@prisma/client");
const {
  formatEmailDate,
  isValidEmail,
  sendEmail,
  sendTreatmentCreatedEmail,
  sendTreatmentUpdatedEmail,
  sendWithdrawalReminderEmail,
  sendWithdrawalCompletedEmail,
  sendMRLResultEmail,
  sendCertificationUpdateEmail,
  sendTestEmail,
  processScheduledEmailNotifications,
  retryEmailNotification
} = require("../src/services/emailService");
const { calculateWithdrawal } = require("../src/services/withdrawalEngine");

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  [PASS] ${message}`);
    passed++;
  } else {
    console.error(`  [FAIL] ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("===============================================================");
  console.log("AGRIGUARD - FINAL EMAIL NOTIFICATION VERIFICATION SUITE");
  console.log("===============================================================\n");

  // Lookup Farmer 1 and Attending Vet
  const farmer1 = await prisma.farmer.findFirst({
    where: { farmerId: "FR10293" },
    include: { user: true }
  });
  assert(farmer1 !== null, "Farmer 1 (FR10293 / RAJESH) exists in database");

  const vet = await prisma.veterinarian.findFirst();
  assert(vet !== null, "Attending veterinarian profile found in database");

  const cowTag = await prisma.animalTag.findFirst({
    where: { tag: "RJ-CW1" },
    include: { animal: { include: { farm: { include: { farmer: { include: { user: true } } } } } } }
  });
  assert(cowTag !== null, "Cow Tag 'RJ-CW1' found for Farmer 1");

  // Clean old test email notifications for this tag
  await prisma.emailNotification.deleteMany({
    where: { treatment: { tagId: cowTag.id } }
  });

  // -----------------------------------------------------------------
  // STEP 1-7: Farmer configures Notification Email independently from login email
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 1: Dedicated Notification Email vs Login Email Independence");
  const testEmail1 = "notification-test@example.com";
  
  // Set notification email on farmer profile
  const updatedFarmer1 = await prisma.farmer.update({
    where: { id: farmer1.id },
    data: {
      notificationEmail: testEmail1,
      emailNotificationsEnabled: true
    },
    include: { user: true }
  });

  assert(updatedFarmer1.notificationEmail === testEmail1, `Farmer notificationEmail set to ${testEmail1}`);
  assert(updatedFarmer1.user.email === "farmer1@gmail.com", `Farmer user.email remains unchanged as ${updatedFarmer1.user.email}`);
  assert(updatedFarmer1.notificationEmail !== updatedFarmer1.user.email, "Notification email is independent from login email");

  // -----------------------------------------------------------------
  // STEP 8-12: Create treatment -> notification sent to notificationEmail (NOT user.email)
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 2: Treatment Notification Routes to notificationEmail");
  const testTreatmentDate = new Date("2026-09-17T10:00:00.000Z");

  const treatment1 = await prisma.treatment.create({
    data: {
      tagId: cowTag.id,
      vetId: vet.id,
      medicineName: "Oxytetracycline",
      activeIngredient: "Oxytetracycline",
      dose: 10,
      doseUnit: "mg/kg",
      route: "Intramuscular (IM)",
      dateAdministered: testTreatmentDate,
      foodProduct: "Milk",
      status: "WITHDRAWAL ACTIVE"
    }
  });

  const withdrawal1 = await calculateWithdrawal(
    treatment1.id, "Oxytetracycline", "Oxytetracycline", "Intramuscular (IM)", "Milk", 10
  );

  const notifyResult = await sendTreatmentCreatedEmail({
    treatmentId: treatment1.id,
    tagId: cowTag.id,
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline",
    dateAdministered: testTreatmentDate,
    withdrawal: withdrawal1
  });

  assert(notifyResult.success === true, "sendTreatmentCreatedEmail succeeded");

  const savedNotif1 = await prisma.emailNotification.findFirst({
    where: { treatmentId: treatment1.id, notificationType: "TREATMENT_CREATED" }
  });
  assert(savedNotif1 !== null, "EmailNotification record created in database");
  assert(savedNotif1?.recipientEmail === testEmail1, `Recipient is notificationEmail (${testEmail1}), NOT login email (${savedNotif1?.recipientEmail})`);
  assert(savedNotif1?.recipientEmail !== farmer1.user.email, `Confirmed recipient is strictly NOT user.email`);
  assert(savedNotif1?.subject === "AgriGuard – Treatment Alert", "Subject matches specification: 'AgriGuard – Treatment Alert'");
  assert(savedNotif1?.message.includes("Animal ID: RJ-CW1"), "Animal ID RJ-CW1 included in email body");
  assert(savedNotif1?.message.includes("Medicine: Oxytetracycline"), "Medicine Oxytetracycline included in email body");

  // -----------------------------------------------------------------
  // STEP 13-15: Change Notification Email -> future notifications use new email
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 3: Dynamic Email Update Routes to New Email");
  const testEmail2 = "new-notification@example.com";
  await prisma.farmer.update({
    where: { id: farmer1.id },
    data: { notificationEmail: testEmail2 }
  });

  const updateNotify = await sendTreatmentUpdatedEmail({
    treatmentId: treatment1.id,
    tagId: cowTag.id,
    medicineName: "Ceftiofur",
    dateAdministered: testTreatmentDate,
    withdrawal: { withdrawalPeriod: 4, safeFromDate: new Date(Date.now() + 4 * 86400000) }
  });

  assert(updateNotify.success === true, "sendTreatmentUpdatedEmail succeeded after email change");
  const savedNotif2 = await prisma.emailNotification.findFirst({
    where: { treatmentId: treatment1.id, notificationType: "TREATMENT_UPDATED" }
  });
  assert(savedNotif2?.recipientEmail === testEmail2, `Updated notification sent to new email: ${testEmail2} (got: ${savedNotif2?.recipientEmail})`);
  assert(savedNotif2?.subject === "AgriGuard – Treatment Update Alert", "Subject matches 'AgriGuard – Treatment Update Alert'");

  // -----------------------------------------------------------------
  // STEP 16-17: Withdrawal Reminder to current notificationEmail
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 4: Withdrawal Reminder Email");
  const reminderResult = await sendWithdrawalReminderEmail({
    treatmentId: treatment1.id,
    farmerName: farmer1.fullName,
    farmerEmail: null, // intentionally null to verify dynamic resolution from farmerId
    animalId: "RJ-CW1",
    medicineName: "Ceftiofur",
    withdrawalEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    farmerId: farmer1.id
  });

  assert(reminderResult.success === true, "sendWithdrawalReminderEmail succeeded");
  const savedReminder = await prisma.emailNotification.findFirst({
    where: { treatmentId: treatment1.id, notificationType: "WITHDRAWAL_REMINDER" }
  });
  assert(savedReminder?.recipientEmail === testEmail2, `Withdrawal reminder sent to CURRENT notificationEmail (${testEmail2})`);
  assert(savedReminder?.subject === "AgriGuard – Withdrawal Period Reminder", "Subject matches 'AgriGuard – Withdrawal Period Reminder'");

  // -----------------------------------------------------------------
  // STEP 18-19: Withdrawal Completed Email
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 5: Withdrawal Completed Email");
  const completionResult = await sendWithdrawalCompletedEmail({
    treatmentId: treatment1.id,
    farmerName: farmer1.fullName,
    farmerEmail: null,
    animalId: "RJ-CW1",
    medicineName: "Ceftiofur",
    withdrawalEndDate: new Date(),
    farmerId: farmer1.id
  });

  assert(completionResult.success === true, "sendWithdrawalCompletedEmail succeeded");
  const savedCompletion = await prisma.emailNotification.findFirst({
    where: { treatmentId: treatment1.id, notificationType: "WITHDRAWAL_COMPLETED" }
  });
  assert(savedCompletion?.recipientEmail === testEmail2, `Withdrawal completed sent to CURRENT notificationEmail (${testEmail2})`);
  assert(savedCompletion?.subject === "AgriGuard – Withdrawal Completed", "Subject matches 'AgriGuard – Withdrawal Completed'");
  assert(savedCompletion?.message.includes("The product can proceed to the next applicable safety/compliance step."), "Compliance notice present in completion email");

  // -----------------------------------------------------------------
  // STEP 20-22: MRL Test Result Email
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 6: MRL Test Result Email");
  const mrlResult = await sendMRLResultEmail({
    farmerName: farmer1.fullName,
    farmerEmail: null,
    animalOrBatchId: "RJ-CW1",
    result: "0.02 mg/kg (Ceftiofur)",
    mrlStatus: "SAFE",
    testDate: new Date(),
    farmerId: farmer1.id
  });

  assert(mrlResult.success === true, "sendMRLResultEmail succeeded");
  const savedMrl = await prisma.emailNotification.findFirst({
    where: { farmerId: farmer1.id, notificationType: "MRL_RESULT" },
    orderBy: { createdAt: "desc" }
  });
  assert(savedMrl?.recipientEmail === testEmail2, `MRL test email sent to CURRENT notificationEmail (${testEmail2})`);
  assert(savedMrl?.subject === "AgriGuard – MRL Test Result", "Subject matches 'AgriGuard – MRL Test Result'");

  // -----------------------------------------------------------------
  // STEP 23-25: Certification Update Email
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 7: Certification Update Email");
  const certResult = await sendCertificationUpdateEmail({
    farmerName: farmer1.fullName,
    farmerEmail: null,
    mrlStatus: "SAFE",
    validFrom: new Date(),
    validUntil: new Date(Date.now() + 7 * 86400000),
    certificateId: "CERT-E2E-TEST-001",
    farmerId: farmer1.id
  });

  assert(certResult.success === true, "sendCertificationUpdateEmail succeeded");
  const savedCert = await prisma.emailNotification.findFirst({
    where: { farmerId: farmer1.id, notificationType: "CERTIFICATION_UPDATE" },
    orderBy: { createdAt: "desc" }
  });
  assert(savedCert?.recipientEmail === testEmail2, `Certification update sent to CURRENT notificationEmail (${testEmail2})`);
  assert(savedCert?.subject === "AgriGuard – Certification Update", "Subject matches 'AgriGuard – Certification Update'");

  // -----------------------------------------------------------------
  // STEP 26-30: Enable / Disable Notifications Toggle
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 8: Notification Enable/Disable Toggle");
  // Turn notifications OFF
  await prisma.farmer.update({
    where: { id: farmer1.id },
    data: { emailNotificationsEnabled: false }
  });

  const disabledResult = await sendWithdrawalReminderEmail({
    treatmentId: treatment1.id,
    farmerName: farmer1.fullName,
    animalId: "RJ-CW1",
    medicineName: "Ceftiofur",
    withdrawalEndDate: new Date(),
    farmerId: farmer1.id
  });

  assert(disabledResult.skipped === true, "Email dispatch correctly skipped when emailNotificationsEnabled is false");

  // Turn notifications back ON
  await prisma.farmer.update({
    where: { id: farmer1.id },
    data: { emailNotificationsEnabled: true }
  });

  const reEnabledResult = await sendTestEmail({
    customEmail: testEmail2,
    testMessage: "AgriGuard Notification Resume Test"
  });

  assert(reEnabledResult.success === true, "Notifications resume successfully when re-enabled");

  // -----------------------------------------------------------------
  // STEP 31-33: Missing Notification Email Fallback Rule (Do not crash, do not use user.email)
  // -----------------------------------------------------------------
  console.log("\nTEST SCENARIO 9: Fallback Rule when notificationEmail is missing");
  await prisma.farmer.update({
    where: { id: farmer1.id },
    data: { notificationEmail: null }
  });

  const missingEmailTreatment = await prisma.treatment.create({
    data: {
      tagId: cowTag.id,
      vetId: vet.id,
      medicineName: "Florfenicol",
      activeIngredient: "Florfenicol",
      dose: 20,
      doseUnit: "mg/kg",
      route: "Intramuscular (IM)",
      dateAdministered: new Date(),
      foodProduct: "Meat",
      status: "WITHDRAWAL ACTIVE"
    }
  });

  const missingEmailResult = await sendTreatmentCreatedEmail({
    treatmentId: missingEmailTreatment.id,
    tagId: cowTag.id,
    medicineName: "Florfenicol",
    activeIngredient: "Florfenicol",
    dateAdministered: new Date(),
    withdrawal: { withdrawalPeriod: 28, safeFromDate: new Date(Date.now() + 28 * 86400000) }
  });

  assert(missingEmailResult.skipped === true, "Missing notificationEmail safely skipped without crashing");
  assert(missingEmailResult.error === "Farmer notification email is not configured", "Error states 'Farmer notification email is not configured'");

  // Verify business operation (treatment record) was NOT rolled back
  const treatmentPreserved = await prisma.treatment.findUnique({
    where: { id: missingEmailTreatment.id }
  });
  assert(treatmentPreserved !== null, "Business transaction (treatment) remains safely preserved despite missing notification email");

  // Verify user.email was NOT silently targeted
  const unconfiguredNotif = await prisma.emailNotification.findFirst({
    where: { treatmentId: missingEmailTreatment.id }
  });
  assert(unconfiguredNotif === null, "Zero email notifications sent to user.email when notificationEmail is missing");

  // Clean up test records
  await prisma.treatment.delete({ where: { id: missingEmailTreatment.id } });
  await prisma.emailNotification.deleteMany({ where: { treatmentId: treatment1.id } });
  await prisma.emailNotification.deleteMany({ where: { farmerId: farmer1.id } });
  await prisma.withdrawalRecord.deleteMany({ where: { treatmentId: treatment1.id } });
  await prisma.treatment.delete({ where: { id: treatment1.id } });

  // Restore farmer1 config
  await prisma.farmer.update({
    where: { id: farmer1.id },
    data: {
      notificationEmail: "farmer1@gmail.com",
      emailNotificationsEnabled: true
    }
  });

  console.log("\n===============================================================");
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runTests()
  .catch(err => {
    console.error("Test suite encountered unexpected error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
