const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const calculateWithdrawal = async (treatmentId, medicineName, activeIngredient, route, foodProduct, dose) => {
  console.log(`Calculating withdrawal for ${medicineName} (${activeIngredient}) via ${route} for ${foodProduct}...`);
  
  // 1. Find matching reference
  const reference = await prisma.withdrawalReference.findFirst({
    where: {
      medicine: { medicineName: medicineName },
      foodProduct: foodProduct,
      route: route
    }
  });

  let status = "WAIT UNTIL [DATE]";
  let safeFromDate = new Date();
  let withdrawalPeriod = 7;
  let unit = "days";

  if (reference) {
    withdrawalPeriod = reference.value;
    unit = reference.unit || "days";
  } else {
    // Statutory fallback reference rules
    const med = (medicineName || "").toLowerCase();
    const prod = (foodProduct || "").toLowerCase();

    if (med.includes("amoxicillin")) {
      withdrawalPeriod = prod.includes("milk") ? 7 : 14;
    } else if (med.includes("oxytetracycline")) {
      withdrawalPeriod = (prod.includes("fish") || prod.includes("prawn")) ? 21 : (prod.includes("milk") ? 7 : 14);
    } else if (med.includes("florfenicol")) {
      withdrawalPeriod = (prod.includes("fish") || prod.includes("prawn")) ? 15 : 14;
    } else if (med.includes("enrofloxacin")) {
      withdrawalPeriod = prod.includes("egg") ? 10 : 7;
    } else if (med.includes("ceftiofur")) {
      withdrawalPeriod = 4;
    } else if (med.includes("tulathromycin")) {
      withdrawalPeriod = 18;
    } else if (med.includes("tilmicosin")) {
      withdrawalPeriod = 28;
    } else if (med.includes("procaine penicillin") || (med.includes("penicillin") && !med.includes("streptomycin"))) {
      withdrawalPeriod = prod.includes("milk") ? 5 : 10;
    } else if (med.includes("penicillin") && med.includes("streptomycin")) {
      withdrawalPeriod = prod.includes("milk") ? 5 : 14;
    } else if (med.includes("tylosin")) {
      withdrawalPeriod = 14;
    } else if (med.includes("tiamulin")) {
      withdrawalPeriod = 7;
    } else if (med.includes("apramycin")) {
      withdrawalPeriod = 14;
    } else if (med.includes("neomycin")) {
      withdrawalPeriod = 14;
    } else if (med.includes("erythromycin")) {
      withdrawalPeriod = 14;
    } else if (med.includes("sulfadiazine") || med.includes("trimethoprim")) {
      withdrawalPeriod = 10;
    } else if (med.includes("chlortetracycline")) {
      withdrawalPeriod = 7;
    } else if (med.includes("doxycycline")) {
      withdrawalPeriod = 7;
    } else if (med.includes("ampicillin")) {
      withdrawalPeriod = 7;
    } else if (med.includes("ivermectin")) {
      withdrawalPeriod = 28;
    } else {
      withdrawalPeriod = 7;
    }
  }

  safeFromDate.setDate(safeFromDate.getDate() + withdrawalPeriod);

  // 2. Create the Withdrawal Record
  const record = await prisma.withdrawalRecord.create({
    data: {
      treatmentId,
      foodProduct: foodProduct || "Milk",
      withdrawalPeriod: withdrawalPeriod,
      unit: unit,
      safeFromDate: safeFromDate,
      status: "WAIT UNTIL [DATE]"
    }
  });

  return record;
};

module.exports = { calculateWithdrawal };
