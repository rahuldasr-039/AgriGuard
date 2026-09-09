const jwt = require('jsonwebtoken');

async function testVetValidation() {
  console.log("=== Testing Veterinarian AMU Validation ===");

  // 1. Authenticate Vet
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vet1@example.com", password: "Password@123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error("Vet login failed: " + JSON.stringify(loginData));
  console.log("Vet authenticated successfully!");

  // Test 1: Valid Combination: Cow (RJ-CW1) + Procaine Penicillin G
  console.log("\n1. Testing VALID: Cow (RJ-CW1) + Procaine Penicillin G");
  const resValidCow = await fetch("http://localhost:5000/api/v1/treatments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-CW1",
      animalType: "Cow",
      medicineName: "Procaine Penicillin G",
      dose: 15,
      route: "Intramuscular (IM)",
      foodProduct: "Milk"
    })
  });
  const dataValidCow = await resValidCow.json();
  console.log("Status:", resValidCow.status);
  console.log("Treatment ID:", dataValidCow.treatment?.id, "Blockchain Hash:", dataValidCow.blockchainRecord?.hash);

  // Test 2: Invalid Combination: Fish (RJ-FS-B1) + Procaine Penicillin G
  console.log("\n2. Testing INVALID: Fish (RJ-FS-B1) + Procaine Penicillin G");
  const resInvalidFish = await fetch("http://localhost:5000/api/v1/treatments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-FS-B1",
      animalType: "Fish",
      medicineName: "Procaine Penicillin G",
      dose: 5,
      route: "Oral (Feed)",
      foodProduct: "Fish"
    })
  });
  const dataInvalidFish = await resInvalidFish.json();
  console.log("Status:", resInvalidFish.status);
  console.log("Error response:", dataInvalidFish.error);

  // Test 3: Invalid Combination: Cow (RJ-CW1) + Tylosin
  console.log("\n3. Testing INVALID: Cow (RJ-CW1) + Tylosin");
  const resInvalidCow = await fetch("http://localhost:5000/api/v1/treatments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-CW1",
      animalType: "Cow",
      medicineName: "Tylosin",
      dose: 10,
      route: "Intramuscular (IM)",
      foodProduct: "Milk"
    })
  });
  const dataInvalidCow = await resInvalidCow.json();
  console.log("Status:", resInvalidCow.status);
  console.log("Error response:", dataInvalidCow.error);

  // Test 4: Valid Combination: Chicken (RJ-CH-B1) + Enrofloxacin
  console.log("\n4. Testing VALID: Chicken (RJ-CH-B1) + Enrofloxacin");
  const resValidChicken = await fetch("http://localhost:5000/api/v1/treatments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-CH-B1",
      animalType: "Chicken",
      medicineName: "Enrofloxacin",
      dose: 10,
      route: "Oral",
      foodProduct: "Meat"
    })
  });
  const dataValidChicken = await resValidChicken.json();
  console.log("Status:", resValidChicken.status);
  console.log("Treatment ID:", dataValidChicken.treatment?.id, "Withdrawal Days:", dataValidChicken.withdrawal?.withdrawalPeriod);
}

testVetValidation().catch(console.error);
