async function testTreatmentSubmission() {
  // 1. Log in as Vet 1
  const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "vet1@example.com", password: "Password@123" })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;

  // 2. Submit treatment
  const treatRes = await fetch("http://localhost:5000/api/v1/treatments", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      tagId: "RJ-CW2",
      medicineName: "Amoxicillin",
      activeIngredient: "Amoxicillin Trihydrate",
      dose: 15,
      doseUnit: "mg/kg",
      route: "Intramuscular (IM)",
      foodProduct: "Milk",
      dateAdministered: new Date().toISOString()
    })
  });

  console.log("Treatment status:", treatRes.status);
  const treatData = await treatRes.json();
  console.log("Treatment response:", treatData);
}

testTreatmentSubmission().catch(console.error);
