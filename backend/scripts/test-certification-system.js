const http = require("http");

const BASE_URL = "http://localhost:5000";

// Helper for making HTTP requests
function request(path, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const reqOptions = {
      method: options.method || "GET",
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, text: data });
        }
      });
    });

    req.on("error", reject);
    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runTests() {
  console.log("===============================================================");
  console.log("🚀 STARTING MRL DIGITAL CERTIFICATION 12-POINT VERIFICATION SUITE");
  console.log("===============================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message}`);
      failed++;
    }
  }

  // 1. Authenticate Regulator
  const regLogin = await request("/api/v1/auth/login", { method: "POST" }, {
    email: "fssaigovt@gmail.com",
    password: "Fssai@123"
  });
  const regToken = regLogin.data.token;
  assert(regLogin.status === 200 && regToken, "Regulator logged in successfully");

  // Authenticate Farmer (Rajesh - FR10293)
  const farmerLogin = await request("/api/v1/auth/login", { method: "POST" }, {
    email: "farmer1@gmail.com",
    password: "Password@123"
  });
  const farmerToken = farmerLogin.data.token;
  assert(farmerLogin.status === 200 && farmerToken, "Farmer 1 logged in successfully");

  // Authenticate Vet (non-regulator)
  const vetLogin = await request("/api/v1/auth/login", { method: "POST" }, {
    email: "vet1@example.com",
    password: "Password@123"
  });
  const vetToken = vetLogin.data.token;
  assert(vetLogin.status === 200 && vetToken, "Veterinarian logged in successfully");

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 1: Create Certificate in PENDING status");
  console.log("---------------------------------------------------------------");
  const createRes = await request("/api/v1/certificates/initiate", {
    method: "POST",
    headers: { Authorization: `Bearer ${regToken}` }
  }, {
    farmerId: "FR10293",
    notes: "Weekly compliance test cycle"
  });
  assert(createRes.status === 201, `Status code is 201 (got ${createRes.status})`);
  assert(createRes.data.approvalStatus === "PENDING", `approvalStatus is PENDING (got ${createRes.data.approvalStatus})`);
  assert(createRes.data.mrlStatus === "NOT_SET", `mrlStatus is NOT_SET (got ${createRes.data.mrlStatus})`);
  const testCertId = createRes.data.id;
  const testVerifId = createRes.data.verificationId;

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 2: Attempt PENDING -> SAFE (Must FAIL with error)");
  console.log("---------------------------------------------------------------");
  const prematureStatusRes = await request(`/api/v1/certificates/${testCertId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regToken}` }
  }, {
    mrlStatus: "SAFE"
  });
  assert(prematureStatusRes.status === 400, `Premature status set returns HTTP 400 (got ${prematureStatusRes.status})`);
  assert(
    prematureStatusRes.data.error?.includes("Certificate must be approved before MRL status can be set"),
    `Error message correctly informs: "${prematureStatusRes.data.error}"`
  );

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 3: Approve PENDING -> APPROVED (Must SUCCEED)");
  console.log("---------------------------------------------------------------");
  const approveRes = await request(`/api/v1/certificates/${testCertId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regToken}` }
  }, {
    action: "APPROVE",
    reason: "Satisfactory initial AMU documentation"
  });
  assert(approveRes.status === 200, `Status code is 200 (got ${approveRes.status})`);
  assert(approveRes.data.approvalStatus === "APPROVED", `approvalStatus transitioned to APPROVED (got ${approveRes.data.approvalStatus})`);
  assert(approveRes.data.mrlStatus === "NOT_SET", `mrlStatus remains NOT_SET until explicitly determined (got ${approveRes.data.mrlStatus})`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 4: Set APPROVED -> SAFE (Must SUCCEED)");
  console.log("---------------------------------------------------------------");
  const setSafeRes = await request(`/api/v1/certificates/${testCertId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regToken}` }
  }, {
    mrlStatus: "SAFE",
    notes: "Lab assay confirmed below 0.05 mg/kg MRL benchmark"
  });
  assert(setSafeRes.status === 200, `Status code is 200 (got ${setSafeRes.status})`);
  assert(setSafeRes.data.mrlStatus === "SAFE", `mrlStatus is SAFE (got ${setSafeRes.data.mrlStatus})`);
  assert(setSafeRes.data.blockchainHash && setSafeRes.data.blockchainHash.startsWith("0x"), `Keccak-256 blockchain proof generated (${setSafeRes.data.blockchainHash?.substring(0, 16)}...)`);
  assert(setSafeRes.data.premiumEligible === true, `Farmer is premiumEligible = true`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 5: Set APPROVED -> UNSAFE (Must SUCCEED)");
  console.log("---------------------------------------------------------------");
  const setUnsafeRes = await request(`/api/v1/certificates/${testCertId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regToken}` }
  }, {
    mrlStatus: "UNSAFE",
    notes: "Follow-up screening detected antimicrobial residue spike"
  });
  assert(setUnsafeRes.status === 200, `Status code is 200 (got ${setUnsafeRes.status})`);
  assert(setUnsafeRes.data.mrlStatus === "UNSAFE", `mrlStatus is UNSAFE (got ${setUnsafeRes.data.mrlStatus})`);
  assert(setUnsafeRes.data.premiumEligible === false, `Farmer premiumEligible revoked to false`);

  // Switch back to SAFE for verification tests
  await request(`/api/v1/certificates/${testCertId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${regToken}` }
  }, { mrlStatus: "SAFE" });

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 6: Farmer tries to modify certificate status (Must return 403 Forbidden)");
  console.log("---------------------------------------------------------------");
  const farmerHackRes = await request(`/api/v1/certificates/${testCertId}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${farmerToken}` }
  }, {
    mrlStatus: "SAFE"
  });
  assert(farmerHackRes.status === 403, `Farmer unauthorized modification blocked with HTTP 403 (got ${farmerHackRes.status})`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 7: Non-Regulator (Vet) tries to approve certificate (Must return 403 Forbidden)");
  console.log("---------------------------------------------------------------");
  const vetHackRes = await request(`/api/v1/certificates/${testCertId}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${vetToken}` }
  }, {
    action: "APPROVE"
  });
  assert(vetHackRes.status === 403, `Veterinarian unauthorized approval blocked with HTTP 403 (got ${vetHackRes.status})`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 8: Public QR verification of active safe certificate (Must return 200)");
  console.log("---------------------------------------------------------------");
  const publicVerifyRes = await request(`/api/v1/certificates/verify/AGV-8F2K9L`);
  assert(publicVerifyRes.status === 200, `Public verification HTTP 200 without auth (got ${publicVerifyRes.status})`);
  assert(publicVerifyRes.data.valid === true, `Certificate verified valid: ${publicVerifyRes.data.valid}`);
  assert(publicVerifyRes.data.status === "SAFE", `Certificate MRL status is SAFE (got ${publicVerifyRes.data.status})`);
  assert(publicVerifyRes.data.premiumEligible === true, `Premium Market Eligibility confirmed in public badge`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 9: Dynamic Expiration Detection");
  console.log("---------------------------------------------------------------");
  const expiredQrRes = await request(`/api/v1/certificates/verify/AGV-PAST01`);
  assert(expiredQrRes.status === 200, `HTTP status 200 for expired QR lookup (got ${expiredQrRes.status})`);
  assert(expiredQrRes.data.valid === false, `Expired certificate is marked valid = false`);
  assert(expiredQrRes.data.status === "EXPIRED", `Dynamic evaluation designated status = EXPIRED (got ${expiredQrRes.data.status})`);

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 10: Old QR after expiry displays EXPIRED badge (never falsely SAFE)");
  console.log("---------------------------------------------------------------");
  assert(
    expiredQrRes.data.badgeText === "CERTIFICATE EXPIRED",
    `Badge text is 'CERTIFICATE EXPIRED' (got '${expiredQrRes.data.badgeText}')`
  );
  assert(
    expiredQrRes.data.mrlStatus === "NOT_SET",
    `Expired certificate mrlStatus reset to NOT_SET (got '${expiredQrRes.data.mrlStatus}')`
  );

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 11: Farmer tries to access another farmer's certificate history (Must return 403)");
  console.log("---------------------------------------------------------------");
  // Rajesh (FR10293) tries to access FR10294 or FR10295 history
  const otherFarmerHistoryRes = await request(`/api/v1/certificates/history/FR10294`, {
    method: "GET",
    headers: { Authorization: `Bearer ${farmerToken}` }
  });
  assert(
    otherFarmerHistoryRes.status === 403,
    `Farmer accessing another farmer's history blocked with HTTP 403 (got ${otherFarmerHistoryRes.status})`
  );

  console.log("\n---------------------------------------------------------------");
  console.log("TEST 12: QR verification with invalid verification ID (Must return 404)");
  console.log("---------------------------------------------------------------");
  const invalidQrRes = await request(`/api/v1/certificates/verify/AGV-NONEXISTENT999`);
  assert(
    invalidQrRes.status === 404,
    `Non-existent verification ID returns HTTP 404 (got ${invalidQrRes.status})`
  );
  assert(
    invalidQrRes.data.notFound === true,
    `Response indicates notFound = true`
  );

  console.log("\n===============================================================");
  console.log(`🏁 VERIFICATION SUITE COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log("===============================================================\n");

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch((err) => {
  console.error("Test execution fatal error:", err);
  process.exit(1);
});
