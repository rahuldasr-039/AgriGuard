async function testVaccinationSubmission() {
  // 1. Log in as Vet 1
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vet1@example.com", password: "Password@123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // 2. Submit vaccination
  const vacRes = await fetch("http://localhost:5000/api/v1/treatments/vaccinations", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-CW1",
      vaccineName: "Foot-and-Mouth Disease (FMD) Booster",
      amount: 5,
      amountUnit: "mL",
      animalCount: 1,
      route: "Subcutaneous (SC)",
      dateOfInjection: new Date().toISOString()
    })
  });

  console.log("Vaccination status:", vacRes.status);
  const vacData = await vacRes.json();
  console.log("Vaccination response:", vacData);
}

testVaccinationSubmission().catch(console.error);
