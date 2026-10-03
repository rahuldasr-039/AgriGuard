const assert = require("assert");

const BASE_URL = "http://localhost:5000/api/v1";

async function runTests() {
  console.log("=== STARTING AGRIGUARD DOB, WEIGHT & DOSAGE TEST SUITE ===\n");
  let passed = 0;
  let total = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  async function asyncTest(name, fn) {
    total++;
    try {
      await fn();
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${name}:`, err.message);
    }
  }

  // 1. Login Helper
  async function login(email, password) {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    assert(data.token, `Login failed for ${email}: ${JSON.stringify(data)}`);
    return { token: data.token, user: data.user };
  }

  console.log("Step 1: Authenticating test users...");
  const farmerSession = await login("farmer1@gmail.com", "Password@123");
  const farmer2Session = await login("farmer2@example.com", "Password@123");
  const vetSession = await login("vet1@example.com", "Password@123");
  console.log("Authentication successful.\n");

  // 2. Unit Tests on Dosage Master arithmetic & dynamic age
  console.log("Step 2: Testing dosageMaster arithmetic & age calculation...");
  const { calculateDynamicAge, calculateAntibioticDosage, findDosageRule } = require("../src/services/dosageMaster");

  test("TEST 1: Dynamic Age calculation from DOB 15/04/2024 to 18/09/2026", () => {
    const age = calculateDynamicAge("2024-04-15", new Date("2026-09-18T10:00:00Z"));
    assert.strictEqual(age.isValid, true);
    assert.strictEqual(age.years, 2);
    assert.strictEqual(age.months, 5);
    assert.strictEqual(age.formattedAge, "2 years 5 months");
  });

  test("TEST 2: Dynamic Age rejects future dates", () => {
    const futureDate = new Date(Date.now() + 10 * 86400000);
    const age = calculateDynamicAge(futureDate);
    assert.strictEqual(age.isValid, false);
    assert.strictEqual(age.error, "Date of birth cannot be in the future");
  });

  test("TEST 3: Dosage Arithmetic (Cow 400 kg, Procaine Penicillin G 15 mg/kg, 300 mg/mL)", () => {
    const res = calculateAntibioticDosage({
      animalWeight: 400,
      animalDob: "2024-04-15",
      species: "Cow",
      medicineName: "Procaine Penicillin G"
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.ruleFound, true);
    assert.strictEqual(res.calculation.approvedDoseMgPerKg, 15);
    assert.strictEqual(res.calculation.activeIngredientMg, 6000); // 15 * 400 = 6000 mg
    assert.strictEqual(res.calculation.concentrationMgPerMl, 300);
    assert.strictEqual(res.calculation.calculatedVolumeMl, 20); // 6000 / 300 = 20 mL
  });

  test("TEST 4: Dosage calculation with NO approved rule returns ruleFound: false (ZERO AI GUESSING)", () => {
    const res = calculateAntibioticDosage({
      animalWeight: 400,
      animalDob: "2024-04-15",
      species: "Cow",
      medicineName: "NonExistentDrugXYZ"
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.ruleFound, false);
    assert(res.message.includes("No approved dosage rule is configured"));
  });

  // 3. API Integration Tests
  console.log("\nStep 3: Running API Integration Tests...");

  let testAnimalId = null;
  const testTag = `TEST-CW-${Date.now().toString().slice(-4)}`;

  await asyncTest("TEST 5: Farmer registers new individual animal with DOB", async () => {
    const res = await fetch(`${BASE_URL}/farmers/my-animals`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}`
      },
      body: JSON.stringify({
        category: "Cow",
        species: "Bovine",
        tag: testTag,
        weight: 380,
        dateOfBirth: "2024-04-15",
        notes: "Automated test heifer"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Failed: ${JSON.stringify(data)}`);
    assert(data.item, "Expected item in response");
    testAnimalId = data.item.id;
    assert.strictEqual(data.item.weight, 380);
    assert(data.item.age, "Expected dynamic age in response");
    assert(data.item.dateOfBirth, "Expected dateOfBirth in response");
  });

  await asyncTest("TEST 6: Farmer updates DOB with validation (reject future date)", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const res = await fetch(`${BASE_URL}/farmers/animals/${testAnimalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}`
      },
      body: JSON.stringify({ dateOfBirth: futureDate })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, "Future DOB should be rejected with 400");
    assert(data.error.includes("future") || data.error.includes("current date"));
  });

  await asyncTest("TEST 7: Farmer updates DOB to valid date and verifies age changes", async () => {
    // 3 years ago
    const threeYearsAgo = new Date(Date.now() - 3 * 365 * 86400000).toISOString();
    const res = await fetch(`${BASE_URL}/farmers/animals/${testAnimalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}`
      },
      body: JSON.stringify({ dateOfBirth: threeYearsAgo })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Failed: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert(data.animal.age.includes("year"), `Expected years in age: ${data.animal.age}`);
  });

  await asyncTest("TEST 8: Monthly Weight Update Rule - Immediate second update is REJECTED by backend", async () => {
    // Attempt to update weight immediately (registration already set weightLastUpdatedAt to now)
    const res = await fetch(`${BASE_URL}/farmers/animals/${testAnimalId}/weight`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}`
      },
      body: JSON.stringify({ weight: 410, notes: "Too soon update" })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, "Second update in same month must be rejected with 400");
    assert(data.error.includes("Weight can be updated once per month"), `Unexpected message: ${data.error}`);
    assert(data.nextUpdateAvailableAt, "Must include nextUpdateAvailableAt");
  });

  await asyncTest("TEST 9: Monthly Weight Update Rule - Allowed when last updated > 30 days ago", async () => {
    // Update animal's nextWeightUpdateAt to past in DB to simulate 1 month elapsed
    const { PrismaClient } = require("@prisma/client");
    const p = new PrismaClient();
    await p.animal.update({
      where: { id: testAnimalId },
      data: {
        weightLastUpdatedAt: new Date(Date.now() - 35 * 86400000),
        nextWeightUpdateAt: new Date(Date.now() - 5 * 86400000)
      }
    });
    await p.$disconnect();

    const res = await fetch(`${BASE_URL}/farmers/animals/${testAnimalId}/weight`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}`
      },
      body: JSON.stringify({ weight: 405, notes: "Monthly checkup after 30 days" })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Allowed update failed: ${JSON.stringify(data)}`);
    assert.strictEqual(data.currentWeight, 405);
    assert(data.weightHistory.length >= 2, "Weight history should contain records");
  });

  await asyncTest("TEST 10: Veterinarian retrieves Animal Profile (DOB, Age, Weight, Weight History)", async () => {
    const res = await fetch(`${BASE_URL}/veterinarians/animals/${testTag}`, {
      headers: { "Authorization": `Bearer ${vetSession.token}` }
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Vet lookup failed: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.currentWeight, 405);
    assert(data.currentAge, "Expected age");
    assert(data.formattedDob, "Expected formattedDob");
    assert(data.weightHistory && data.weightHistory.length >= 2, "Expected weightHistory");
  });

  await asyncTest("TEST 11: Dose Calculation API uses actual database weight (not frontend input)", async () => {
    const res = await fetch(`${BASE_URL}/treatments/calculate-dose`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vetSession.token}`
      },
      body: JSON.stringify({
        tagId: testTag,
        medicineName: "Procaine Penicillin G",
        route: "Intramuscular (IM)"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Calculation API failed: ${JSON.stringify(data)}`);
    assert.strictEqual(data.success, true);
    assert.strictEqual(data.ruleFound, true);
    // Weight in DB is 405 kg, Procaine Penicillin G dose = 15 mg/kg -> active = 15 * 405 = 6075 mg
    assert.strictEqual(data.calculation.currentWeight, 405);
    assert.strictEqual(data.calculation.activeIngredientMg, 6075);
    assert.strictEqual(data.calculation.calculatedVolumeMl, 20.25); // 6075 / 300 = 20.25 mL
  });

  await asyncTest("TEST 12: Veterinarian Override - Dose override without reason is REJECTED", async () => {
    const res = await fetch(`${BASE_URL}/treatments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vetSession.token}`
      },
      body: JSON.stringify({
        tagId: testTag,
        medicineName: "Procaine Penicillin G",
        activeIngredient: "Procaine Benzylpenicillin",
        dose: 18, // Overridden from 15
        isDoseOverridden: true,
        overrideReason: "", // Missing mandatory reason
        calculatedDose: 15,
        calculatedVolume: 20.25,
        route: "Intramuscular (IM)",
        foodProduct: "Milk"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 400, "Override without reason must be rejected with 400");
    assert(data.error.includes("Reason for dose adjustment is mandatory"));
  });

  await asyncTest("TEST 13: Veterinarian Override with valid reason succeeds and logs audit", async () => {
    const res = await fetch(`${BASE_URL}/treatments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${vetSession.token}`
      },
      body: JSON.stringify({
        tagId: testTag,
        medicineName: "Procaine Penicillin G",
        activeIngredient: "Procaine Benzylpenicillin",
        dose: 18, // Overridden from 15
        isDoseOverridden: true,
        overrideReason: "Severe systemic bacteremia requiring higher initial therapeutic peak.",
        calculatedDose: 15,
        calculatedVolume: 20.25,
        route: "Intramuscular (IM)",
        foodProduct: "Milk"
      })
    });
    const data = await res.json();
    assert.strictEqual(res.status, 200, `Treatment creation failed: ${JSON.stringify(data)}`);
    assert(data.treatment, "Expected treatment in response");
    assert.strictEqual(data.treatment.dose, 18);
    assert.strictEqual(data.treatment.isDoseOverridden, true);
    assert.strictEqual(data.treatment.calculatedDose, 15);
    assert(data.treatment.overrideReason.includes("Severe systemic bacteremia"));
    assert(data.amuRecord, "Expected AMU record");
    assert(data.withdrawal, "Expected withdrawal record");
  });

  await asyncTest("TEST 14: Security RBAC - Farmer cannot modify another farmer's animal", async () => {
    // farmer2 attempts to edit farmer1's animal
    const res = await fetch(`${BASE_URL}/farmers/animals/${testAnimalId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmer2Session.token}`
      },
      body: JSON.stringify({ dateOfBirth: "2024-01-01" })
    });
    assert.strictEqual(res.status, 404, "Farmer should not find or modify another farmer's animal");
  });

  await asyncTest("TEST 15: Security RBAC - Farmer cannot create treatment prescriptions", async () => {
    const res = await fetch(`${BASE_URL}/treatments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${farmerSession.token}` // Farmer role
      },
      body: JSON.stringify({
        tagId: testTag,
        medicineName: "Procaine Penicillin G",
        dose: 15
      })
    });
    assert.strictEqual(res.status, 403, "Farmer must be forbidden from creating treatments");
  });

  console.log(`\n=== TEST RESULTS: ${passed}/${total} PASSED ===`);
  if (passed === total) {
    console.log("🎉 ALL TESTS PASSED SUCCESSFULLY!");
  } else {
    console.error(`⚠️ ${total - passed} TESTS FAILED!`);
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
