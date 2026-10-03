/**
 * Approved Veterinary Dosage Rules Master & Arithmetic Engine
 * 
 * IMPORTANT SAFETY REQUIREMENT:
 * Dosage calculation is strictly deterministic and rule-based from veterinary-approved
 * formulations. ZERO AI guessing or arbitrary invention of antibiotic dosages.
 */

// 1. Approved Dosage Rules Master Catalog
const APPROVED_DOSAGE_RULES = [
  // Bovine / Cattle / Cow / Buffalo
  {
    ruleId: "RULE-PEN-BOV-01",
    medicineName: "Procaine Penicillin G",
    activeIngredient: "Procaine Benzylpenicillin",
    species: ["Cow", "Cattle", "Buffalo", "Bovine"],
    indication: "Bovine Respiratory Disease / Systemic Streptococcal & Staphylococcal infections",
    approvedDoseMgPerKg: 15,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 300,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 5,
    withdrawalDays: 5,
    foodProduct: "Milk",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: "Use with caution in neonates under 1 month; renal clearance may be reduced."
  },
  {
    ruleId: "RULE-CEFT-BOV-01",
    medicineName: "Ceftiofur",
    activeIngredient: "Ceftiofur Hydrochloride",
    species: ["Cow", "Cattle", "Buffalo", "Bovine"],
    indication: "Acute Bovine Interdigital Necrobacillosis (Foot Rot) / BRD / Acute Metritis",
    approvedDoseMgPerKg: 2.2,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 50,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 4,
    withdrawalDays: 4,
    foodProduct: "Milk",
    minAgeMonths: 0.5,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-TULA-BOV-01",
    medicineName: "Tulathromycin",
    activeIngredient: "Tulathromycin",
    species: ["Cow", "Cattle", "Buffalo", "Bovine"],
    indication: "Bovine Respiratory Disease (Mannheimia haemolytica, Pasteurella multocida)",
    approvedDoseMgPerKg: 2.5,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Subcutaneous (SC)",
    frequency: "Single administration",
    durationDays: 1,
    withdrawalDays: 18,
    foodProduct: "Meat",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: "Contraindicated in female dairy cattle 20 months of age or older producing milk for human consumption."
  },
  {
    ruleId: "RULE-TILM-BOV-01",
    medicineName: "Tilmicosin",
    activeIngredient: "Tilmicosin Phosphate",
    species: ["Cow", "Cattle", "Buffalo", "Bovine"],
    indication: "Bovine Respiratory Disease associated with Mannheimia haemolytica",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 300,
    route: "Subcutaneous (SC)",
    frequency: "Single administration",
    durationDays: 1,
    withdrawalDays: 28,
    foodProduct: "Meat",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: "Strictly subcutaneous. Do NOT administer intravenously. Not recommended for pre-ruminant calves under 1 month."
  },
  {
    ruleId: "RULE-OXY-BOV-01",
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline HCl",
    species: ["Cow", "Cattle", "Buffalo", "Bovine"],
    indication: "Pneumonia, Foot Rot, Anaplasmosis, Bacterial enteritis",
    approvedDoseMgPerKg: 20,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 200,
    route: "Intramuscular (IM)",
    frequency: "Every 48-72 hours",
    durationDays: 3,
    withdrawalDays: 7,
    foodProduct: "Milk",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: "Avoid prolonged high doses in calves under 1 month to prevent teeth staining and osteogenesis disruption."
  },

  // Caprine & Ovine (Goat & Sheep)
  {
    ruleId: "RULE-PENSTREP-CAP-01",
    medicineName: "Penicillin G + Streptomycin",
    activeIngredient: "Procaine Penicillin G + Dihydrostreptomycin",
    species: ["Goat", "Sheep", "Caprine", "Ovine"],
    indication: "Caprine/Ovine respiratory infections, enteritis, and mastitis",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 200,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 4,
    withdrawalDays: 5,
    foodProduct: "Milk",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: "Ototoxicity risk if given to very young kids/lambs under 1 month."
  },
  {
    ruleId: "RULE-OXY-CAP-01",
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline HCl",
    species: ["Goat", "Sheep", "Caprine", "Ovine"],
    indication: "Pneumonic pasteurellosis and contagious agalactia",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 4,
    withdrawalDays: 7,
    foodProduct: "Milk",
    minAgeMonths: 1,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-ENRO-CAP-01",
    medicineName: "Enrofloxacin",
    activeIngredient: "Enrofloxacin",
    species: ["Goat", "Sheep", "Caprine", "Ovine"],
    indication: "Severe respiratory and enteric infections",
    approvedDoseMgPerKg: 5,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Subcutaneous (SC)",
    frequency: "Once daily (q24h)",
    durationDays: 3,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 2,
    maxAgeMonths: null,
    ageWarningNotes: "Contraindicated in growing kids and lambs under 2 months due to arthropathy risk."
  },

  // Porcine (Pig / Swine)
  {
    ruleId: "RULE-TYL-SWI-01",
    medicineName: "Tylosin",
    activeIngredient: "Tylosin Tartrate",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Swine dysentery, mycoplasmal pneumonia",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 200,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 4,
    withdrawalDays: 14,
    foodProduct: "Meat",
    minAgeMonths: 0.75,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-TIAM-SWI-01",
    medicineName: "Tiamulin",
    activeIngredient: "Tiamulin Hydrogen Fumarate",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Swine dysentery and enzootic pneumonia",
    approvedDoseMgPerKg: 15,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 3,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.75,
    maxAgeMonths: null,
    ageWarningNotes: "Do not administer concurrently with monensin, narasin, or salinomycin."
  },
  {
    ruleId: "RULE-AMOX-SWI-01",
    medicineName: "Amoxicillin",
    activeIngredient: "Amoxicillin Trihydrate",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Streptococcal meningitis and respiratory tract infections",
    approvedDoseMgPerKg: 15,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 150,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 3,
    withdrawalDays: 14,
    foodProduct: "Meat",
    minAgeMonths: 0.5,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-APRA-SWI-01",
    medicineName: "Apramycin",
    activeIngredient: "Apramycin Sulfate",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Colibacillosis (E. coli enteritis) in weaned pigs",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 3,
    withdrawalDays: 14,
    foodProduct: "Meat",
    minAgeMonths: 0.75,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-NEOM-SWI-01",
    medicineName: "Neomycin",
    activeIngredient: "Neomycin Sulfate",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Bacterial enteritis (scours)",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Once daily (q24h)",
    durationDays: 3,
    withdrawalDays: 14,
    foodProduct: "Meat",
    minAgeMonths: 0.5,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-OXY-SWI-01",
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline HCl",
    species: ["Pig", "Swine", "Porcine"],
    indication: "Atrophic rhinitis, bacterial pneumonia",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Intramuscular (IM)",
    frequency: "Once daily (q24h)",
    durationDays: 4,
    withdrawalDays: 14,
    foodProduct: "Meat",
    minAgeMonths: 0.5,
    maxAgeMonths: null,
    ageWarningNotes: null
  },

  // Poultry / Chicken
  {
    ruleId: "RULE-AMOX-POU-01",
    medicineName: "Amoxicillin",
    activeIngredient: "Amoxicillin Trihydrate",
    species: ["Chicken", "Poultry"],
    indication: "Infectious coryza, fowl cholera, clostridial enteritis",
    approvedDoseMgPerKg: 15,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 4,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-ENRO-POU-01",
    medicineName: "Enrofloxacin",
    activeIngredient: "Enrofloxacin",
    species: ["Chicken", "Poultry"],
    indication: "Mycoplasmosis (CRD) and colisepticemia",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 3,
    withdrawalDays: 10,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: "Do not use in layer birds producing eggs for human consumption."
  },
  {
    ruleId: "RULE-DOXY-POU-01",
    medicineName: "Doxycycline",
    activeIngredient: "Doxycycline Hyclate",
    species: ["Chicken", "Poultry"],
    indication: "Chronic respiratory disease (CRD)",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 4,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-OXY-POU-01",
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline HCl",
    species: ["Chicken", "Poultry"],
    indication: "Fowl cholera and bacterial enteritis",
    approvedDoseMgPerKg: 20,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 5,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-CHLOR-POU-01",
    medicineName: "Chlortetracycline",
    activeIngredient: "Chlortetracycline HCl",
    species: ["Chicken", "Poultry"],
    indication: "Avian infectious synovitis and enteritis",
    approvedDoseMgPerKg: 20,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 5,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-AMPI-POU-01",
    medicineName: "Ampicillin",
    activeIngredient: "Ampicillin Sodium",
    species: ["Chicken", "Poultry"],
    indication: "Colibacillosis and salmonellosis in broilers",
    approvedDoseMgPerKg: 15,
    doseUnit: "mg/kg",
    concentrationMgPerMl: 100,
    route: "Oral",
    frequency: "Daily in water",
    durationDays: 4,
    withdrawalDays: 7,
    foodProduct: "Meat",
    minAgeMonths: 0.25,
    maxAgeMonths: null,
    ageWarningNotes: null
  },

  // Aquaculture (Fish & Prawn)
  {
    ruleId: "RULE-FLOR-FIS-01",
    medicineName: "Florfenicol",
    activeIngredient: "Florfenicol",
    species: ["Fish", "Prawn", "Shrimp"],
    indication: "Enteric septicemia and columnaris disease in finfish / vibriosis in shrimp",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg biomass",
    concentrationMgPerMl: 100,
    route: "Oral (Feed)",
    frequency: "Daily medicated feed",
    durationDays: 10,
    withdrawalDays: 15,
    foodProduct: "Fish",
    minAgeMonths: null,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-OXY-AQU-01",
    medicineName: "Oxytetracycline",
    activeIngredient: "Oxytetracycline HCl",
    species: ["Fish", "Prawn", "Shrimp"],
    indication: "Aeromonad septicemia and furunculosis",
    approvedDoseMgPerKg: 20,
    doseUnit: "mg/kg biomass",
    concentrationMgPerMl: 100,
    route: "Oral (Feed)",
    frequency: "Daily medicated feed",
    durationDays: 7,
    withdrawalDays: 21,
    foodProduct: "Fish",
    minAgeMonths: null,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-SULF-FIS-01",
    medicineName: "Sulfadiazine + Trimethoprim",
    activeIngredient: "Sulfadiazine + Trimethoprim",
    species: ["Fish"],
    indication: "Bacterial gill disease and systemic bacteremia",
    approvedDoseMgPerKg: 30,
    doseUnit: "mg/kg biomass",
    concentrationMgPerMl: 100,
    route: "Oral (Feed)",
    frequency: "Daily medicated feed",
    durationDays: 7,
    withdrawalDays: 10,
    foodProduct: "Fish",
    minAgeMonths: null,
    maxAgeMonths: null,
    ageWarningNotes: null
  },
  {
    ruleId: "RULE-ERY-PRW-01",
    medicineName: "Erythromycin",
    activeIngredient: "Erythromycin",
    species: ["Prawn", "Shrimp"],
    indication: "Vibriosis and necrotizing hepatopancreatitis in crustacea",
    approvedDoseMgPerKg: 10,
    doseUnit: "mg/kg biomass",
    concentrationMgPerMl: 100,
    route: "Oral (Feed)",
    frequency: "Daily medicated feed",
    durationDays: 5,
    withdrawalDays: 14,
    foodProduct: "Fish",
    minAgeMonths: null,
    maxAgeMonths: null,
    ageWarningNotes: null
  }
];

/**
 * Dynamically calculate exact animal age from Date of Birth
 * Returns { years, months, days, totalMonths, formattedAge }
 */
function calculateDynamicAge(dob, referenceDate = new Date()) {
  if (!dob) return null;
  const birth = new Date(dob);
  const now = new Date(referenceDate);

  if (isNaN(birth.getTime())) return null;
  if (birth > now) {
    return {
      isValid: false,
      error: "Date of birth cannot be in the future",
      formattedAge: "Invalid (Future Date)"
    };
  }

  let years = now.getFullYear() - birth.getFullYear();
  let months = now.getMonth() - birth.getMonth();
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    // Get previous month's day count
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonthDate.getDate();
  }

  if (months < 0) {
    years -= 1;
    months += 12;
  }

  const totalMonths = years * 12 + months + (days / 30.44);

  let formattedAge = "";
  if (years > 0) {
    formattedAge = `${years} year${years > 1 ? 's' : ''}${months > 0 ? ` ${months} month${months > 1 ? 's' : ''}` : ''}`;
  } else if (months > 0) {
    formattedAge = `${months} month${months > 1 ? 's' : ''}${days > 0 ? ` ${days} day${days > 1 ? 's' : ''}` : ''}`;
  } else {
    formattedAge = `${days} day${days !== 1 ? 's' : ''}`;
  }

  return {
    isValid: true,
    years,
    months,
    days,
    totalMonths: Math.round(totalMonths * 10) / 10,
    formattedAge
  };
}

/**
 * Look up approved dosage rule for given species, medicine, and optional route/indication
 */
function findDosageRule(species, medicineName, route) {
  if (!species || !medicineName) return null;
  const sLower = species.toLowerCase();
  const mLower = medicineName.toLowerCase().trim();

  return APPROVED_DOSAGE_RULES.find(r => {
    const speciesMatch = r.species.some(sp => 
      sLower.includes(sp.toLowerCase()) || sp.toLowerCase().includes(sLower)
    );
    const medMatch = r.medicineName.toLowerCase() === mLower || 
                     r.activeIngredient.toLowerCase() === mLower;
    
    if (speciesMatch && medMatch) {
      if (route) {
        return r.route.toLowerCase().includes(route.toLowerCase().split(" ")[0]);
      }
      return true;
    }
    return false;
  }) || APPROVED_DOSAGE_RULES.find(r => {
    // Fallback: match by medicine name and broad species group
    const medMatch = r.medicineName.toLowerCase() === mLower || 
                     r.activeIngredient.toLowerCase() === mLower;
    const speciesMatch = r.species.some(sp => 
      sLower.includes(sp.toLowerCase()) || sp.toLowerCase().includes(sLower)
    );
    return medMatch && speciesMatch;
  });
}

/**
 * Calculate automated veterinary antibiotic dosage based on animal profile & approved rules
 * 
 * Arithmetic:
 * Active Ingredient (mg) = Approved Dose (mg/kg) * Animal Weight (kg)
 * Calculated Volume (mL) = Active Ingredient (mg) / Formulation Concentration (mg/mL)
 */
function calculateAntibioticDosage({ animalWeight, animalDob, species, medicineName, route, indication }) {
  if (!animalWeight || animalWeight <= 0) {
    return {
      success: false,
      error: "Valid animal weight is required for dosage calculation."
    };
  }

  const rule = findDosageRule(species, medicineName, route);

  if (!rule) {
    return {
      success: false,
      ruleFound: false,
      message: "No approved dosage rule is configured for this medicine and animal profile. Please determine and enter the prescription according to veterinary guidance.",
      warning: "No approved dosage rule is configured for this medicine and animal profile. Please determine and enter the prescription according to veterinary guidance."
    };
  }

  // Evaluate dynamic age and restrictions
  const ageInfo = calculateDynamicAge(animalDob);
  const warnings = [];

  if (ageInfo && ageInfo.isValid) {
    if (rule.minAgeMonths !== null && ageInfo.totalMonths < rule.minAgeMonths) {
      warnings.push(`Warning: This animal's age (${ageInfo.formattedAge}) is below the recommended minimum age of ${rule.minAgeMonths} month(s) for ${rule.medicineName}. ${rule.ageWarningNotes || 'Please review before prescribing.'}`);
    }
    if (rule.maxAgeMonths !== null && ageInfo.totalMonths > rule.maxAgeMonths) {
      warnings.push(`Warning: This animal's age (${ageInfo.formattedAge}) exceeds the configured applicability threshold of ${rule.maxAgeMonths} month(s) for ${rule.medicineName}. ${rule.ageWarningNotes || 'Please review before prescribing.'}`);
    }
  } else if (!animalDob) {
    warnings.push("Notice: Animal Date of Birth is not recorded. Age-specific contraindications could not be verified automatically.");
  }

  if (rule.ageWarningNotes && warnings.length === 0) {
    warnings.push(`Prescription Notice: ${rule.ageWarningNotes}`);
  }

  // Exact Arithmetic Calculations
  const approvedDoseMgPerKg = rule.approvedDoseMgPerKg;
  const activeIngredientMg = Math.round(approvedDoseMgPerKg * animalWeight * 100) / 100;
  const concentrationMgPerMl = rule.concentrationMgPerMl;
  const calculatedVolumeMl = Math.round((activeIngredientMg / concentrationMgPerMl) * 100) / 100;

  return {
    success: true,
    ruleFound: true,
    dosageRule: {
      ruleId: rule.ruleId,
      medicineName: rule.medicineName,
      activeIngredient: rule.activeIngredient,
      approvedDose: approvedDoseMgPerKg,
      doseUnit: rule.doseUnit,
      concentration: concentrationMgPerMl,
      concentrationUnit: "mg/mL",
      route: rule.route,
      frequency: rule.frequency,
      durationDays: rule.durationDays,
      withdrawalDays: rule.withdrawalDays,
      foodProduct: rule.foodProduct,
      indication: indication || rule.indication
    },
    calculation: {
      currentWeight: animalWeight,
      weightUnit: "kg",
      approvedDoseMgPerKg,
      activeIngredientMg,
      concentrationMgPerMl,
      calculatedVolumeMl,
      frequency: rule.frequency,
      durationDays: rule.durationDays,
      withdrawalDays: rule.withdrawalDays,
      formula: `${approvedDoseMgPerKg} mg/kg × ${animalWeight} kg = ${activeIngredientMg} mg active ingredient (${activeIngredientMg} mg ÷ ${concentrationMgPerMl} mg/mL = ${calculatedVolumeMl} mL)`
    },
    ageInfo,
    warnings
  };
}

module.exports = {
  APPROVED_DOSAGE_RULES,
  calculateDynamicAge,
  findDosageRule,
  calculateAntibioticDosage
};
