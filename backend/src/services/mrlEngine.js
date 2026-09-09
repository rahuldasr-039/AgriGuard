const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const analyzeMRL = async (substance, species, foodProduct, detectedAmount) => {
  console.log(`Analyzing MRL for ${substance} in ${species} ${foodProduct}...`);

  const sLower = (substance || "").toLowerCase();
  const fLower = (foodProduct || "").toLowerCase();

  // 1. Search database references
  const references = await prisma.mRLReference.findMany();
  let reference = references.find(r => 
    r.substance.toLowerCase() === sLower && 
    (fLower.includes(r.foodProduct.toLowerCase()) || r.foodProduct.toLowerCase().includes(fLower))
  );

  if (!reference) {
    reference = references.find(r => r.substance.toLowerCase() === sLower);
  }

  let mrlValue = reference?.mrlValue;

  // Fallback defaults according to statutory FSSAI guidelines
  if (!mrlValue) {
    if (sLower.includes("amoxicillin")) {
      mrlValue = fLower.includes("milk") ? 0.004 : 0.05;
    } else if (sLower.includes("oxytetracycline")) {
      mrlValue = 0.1;
    } else if (sLower.includes("enrofloxacin")) {
      mrlValue = 0.1;
    } else if (sLower.includes("ivermectin")) {
      mrlValue = 0.01;
    } else if (sLower.includes("florfenicol")) {
      mrlValue = 0.2;
    } else if (sLower.includes("ciprofloxacin")) {
      mrlValue = 0.05;
    } else {
      mrlValue = 0.05;
    }
  }

  const parsedAmount = parseFloat(detectedAmount) || 0;
  const difference = parsedAmount - mrlValue;
  const percentageOfMrl = (parsedAmount / mrlValue) * 100;

  let status = "SAFE";
  if (parsedAmount > mrlValue) {
    status = "MRL EXCEEDED";
  } else if (percentageOfMrl >= 80) {
    status = "WARNING";
  }

  return {
    applicableMrl: mrlValue,
    difference: parseFloat(difference.toFixed(4)),
    percentageOfMrl: parseFloat(percentageOfMrl.toFixed(2)),
    status
  };
};

module.exports = { analyzeMRL };
