const hre = require("hardhat");
const fs = require("fs");

async function main() {
  console.log("Compiling contracts...");
  await hre.run('compile');

  console.log("Deploying TreatmentLedger...");
  const TreatmentLedger = await hre.ethers.getContractFactory("TreatmentLedger");
  const ledger = await TreatmentLedger.deploy();

  await ledger.waitForDeployment();
  const address = await ledger.getAddress();

  console.log(`TreatmentLedger deployed to: ${address}`);

  // Save the address and ABI so the backend can easily use it
  const data = {
    address: address,
    abi: JSON.parse(ledger.interface.formatJson())
  };

  fs.writeFileSync(
    "../backend/contractData.json",
    JSON.stringify(data, null, 2)
  );

  console.log("Contract deployed and ABI saved to backend/contractData.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
