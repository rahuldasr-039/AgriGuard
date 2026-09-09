const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TreatmentLedger", function () {
  let treatmentLedger;
  let owner;
  let vet;

  beforeEach(async function () {
    [owner, vet] = await ethers.getSigners();
    const TreatmentLedger = await ethers.getContractFactory("TreatmentLedger");
    treatmentLedger = await TreatmentLedger.deploy();
    await treatmentLedger.waitForDeployment();
  });

  it("should log a treatment and emit an event", async function () {
    const tagId = "TAG_001";
    const prescriptionId = 101;
    const date = Math.floor(Date.now() / 1000);

    const tx = await treatmentLedger.connect(vet).logTreatment(tagId, prescriptionId, date);
    await tx.wait();

    expect(await treatmentLedger.totalTreatments()).to.equal(1);
    expect(await treatmentLedger.getTreatmentCount(tagId)).to.equal(1);

    const treatments = await treatmentLedger.getTreatments(tagId);
    expect(treatments.length).to.equal(1);
    expect(treatments[0].prescriptionId).to.equal(prescriptionId);
    expect(treatments[0].recordedBy).to.equal(vet.address);
  });

  it("should verify treatment record integrity", async function () {
    const tagId = "TAG_002";
    const prescriptionId = 202;
    const date = Math.floor(Date.now() / 1000);

    await treatmentLedger.connect(vet).logTreatment(tagId, prescriptionId, date);

    const isValid = await treatmentLedger.verifyTreatment(tagId, 0, prescriptionId, date);
    expect(isValid).to.be.true;

    // Tampered verification should fail
    const isTamperedValid = await treatmentLedger.verifyTreatment(tagId, 0, 999, date);
    expect(isTamperedValid).to.be.false;
  });
});
