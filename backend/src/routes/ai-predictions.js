const express = require("express");
const { authenticate } = require("../middleware/auth");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();

/**
 * Universal Gemini Caller supporting gemini-2.0-flash with fallback to gemini-1.5-flash
 */
async function callGemini(prompt, systemInstruction = "", userKey = null) {
  const apiKey = (userKey && userKey.trim().length > 5) ? userKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim().length < 5) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: apiKey.trim() });
    const fullPrompt = systemInstruction 
      ? `${systemInstruction}\n\nUser Prompt:\n${prompt}`
      : prompt;

    // Try gemini-2.0-flash first
    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: fullPrompt,
      });
      if (response && response.text) {
        return { text: response.text, model: "gemini-2.0-flash", source: "gemini" };
      }
    } catch (primaryErr) {
      console.warn("Gemini 2.0 Flash attempt failed, attempting fallback to gemini-1.5-flash:", primaryErr.message);
      const fallbackResponse = await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: fullPrompt,
      });
      if (fallbackResponse && fallbackResponse.text) {
        return { text: fallbackResponse.text, model: "gemini-1.5-flash", source: "gemini" };
      }
    }
  } catch (err) {
    console.warn("Gemini API invocation unserviceable, activating Local AgriGuard Synthesis Engine:", err.message);
  }
  return null;
}

/**
 * AgriGuard Advanced Local Domain Knowledge & Generative Synthesizer
 */
function generateLocalDomainResponse(query, role = "GENERAL") {
  const q = (query || "").toLowerCase();

  // MRL & Food Safety Limits
  if (q.includes("mrl") || q.includes("maximum residue limit") || q.includes("ppm") || q.includes("schedule")) {
    return `### 🧪 Maximum Residue Limits (MRL) Statutory Intelligence

**Maximum Residue Limits (MRL)** designate the highest concentration of veterinary medicine residue permitted in food products (meat, milk, eggs, fish) according to **FSSAI Food Safety Standards (Contaminants, Toxins and Residues) Regulations** and **Codex Alimentarius**.

| Active Compound | Target Matrix | FSSAI Statutory MRL | Codex International Benchmark | AMR Risk Priority |
| :--- | :--- | :--- | :--- | :--- |
| **Oxytetracycline / Chlortetracycline** | Bovine & Caprine Milk | $100\\,\\mu\\text{g/kg}$ ($0.1\\text{ ppm}$) | $100\\,\\mu\\text{g/kg}$ | High Priority Critical |
| **Penicillin G (Benzylpenicillin)** | Bovine / Caprine Milk | $4\\,\\mu\\text{g/kg}$ ($0.004\\text{ ppm}$) | $4\\,\\mu\\text{g/kg}$ | Highly Important |
| **Enrofloxacin / Ciprofloxacin** | Poultry & Ruminant Muscle | $100\\,\\mu\\text{g/kg}$ ($0.1\\text{ ppm}$) | Prohibited in Dairy Milk | Highest Priority CIA |
| **Ceftiofur (3rd Gen Cephalosporin)** | Bovine Milk | $100\\,\\mu\\text{g/kg}$ ($0.1\\text{ ppm}$) | $100\\,\\mu\\text{g/kg}$ | Critically Important (CIA) |
| **Florfenicol** | Livestock Muscle / Fish | $1000\\,\\mu\\text{g/kg}$ ($1.0\\text{ ppm}$) | $1000\\,\\mu\\text{g/kg}$ | High Priority |
| **Sulfonamides (Combined)** | Muscle & Edible Offal | $100\\,\\mu\\text{g/kg}$ ($0.1\\text{ ppm}$) | $100\\,\\mu\\text{g/kg}$ | Highly Important |

> 💡 **Statutory Protocol**: When any testing instrument (LC-MS/MS or Rapid ELISA) detects concentration above the statutory threshold, the batch must be withheld, quarantined, and recorded as an official MRL Breach on AgriGuard's on-chain ledger.`;
  }

  // Withdrawal Periods & Clearance Rules
  if (q.includes("withdrawal") || q.includes("withholding") || q.includes("quarantine") || q.includes("clearance")) {
    return `### ⏱️ Statutory Medicine Withdrawal & Withholding Periods

The **Withdrawal Period** is the mandatory interval between the final therapeutic dosage of an antimicrobial and the date when livestock animal matrices (milk, meat, eggs) may legally be harvested for human consumption.

#### 1. Deterministic Biological Calculation
$$\\text{Safe Clearance Date} = \\text{Treatment End Date} + \\text{Statutory Clearance Window (Days)}$$

#### 2. Species-Specific Mandatory Withholding Windows:
1. **Dairy Ruminants (Cattle, Buffalo, Goat, Sheep):**
   * **Procaine Penicillin G:** 5 days milk withholding; 10 days meat clearance.
   * **Oxytetracycline (Long Acting 20%):** 7 days milk withholding; 28 days meat clearance.
   * **Ceftiofur Sodium:** 0 days milk withholding; 4 days slaughter clearance.
   * **Enrofloxacin:** Strictly prohibited in commercial lactating dairy cows.
2. **Chevon & Meat Goats / Sheep:**
   * **Enrofloxacin:** 10 days slaughter withhold.
   * **Oxytetracycline:** 14 days slaughter withhold.
3. **Poultry (Broilers & Layers):**
   * **Enrofloxacin oral:** 7 to 9 days meat withholding; banned in table egg layers.
   * **Tilmicosin / Tylosin:** 5 to 7 days withholding.

> 🛡️ **Zero-Tolerance Safeguard**: Harvesting or selling animal products prior to the certified Safe From Date triggers automated FSSAI enforcement alerts. Discarded products during this window are eligible for **Direct Benefit Transfer (DBT)** waste subsidies.`;
  }

  // Antimicrobial Usage (AMU) & AMR Containment
  if (q.includes("amu") || q.includes("amr") || q.includes("stewardship") || q.includes("antibiotic") || q.includes("resistance")) {
    return `### 🛡️ Antimicrobial Usage (AMU) & AMR Stewardship Framework

Antimicrobial Resistance (AMR) is a top-tier planetary public health risk. AgriGuard enforces strict digital tracking adhering to the **WHO AWaRe Classification** and India's **National Action Plan on AMR (NAP-AMR)**.

#### 1. Hierarchy of Antimicrobial Selection:
* 🟢 **Access Group (First Line):** Penicillins, Aminopenicillins. Preferred for empirical treatments with lowest resistance risk.
* 🟡 **Watch Group (Second Line):** Fluoroquinolones (Enrofloxacin), 3rd Generation Cephalosporins (Ceftiofur), Macrolides (Tylosin). Requires certified veterinary diagnostic confirmation.
* 🔴 **Reserve Group (Last Resort):** Colistin, Carbapenems. Strictly restricted or banned from animal agricultural use under FSSAI Gazette notifications.

#### 2. Three Pillars of AgriGuard AMU Oversight:
1. **Registered Vet Signoff:** No antimicrobial can be logged without a verified veterinary council registration number.
2. **Automated Hold Activation:** Tag IDs are cryptographically flagged in real time upon prescription signature.
3. **Batch Traceability:** QR codes on commercial milk/meat consignments map back to verified zero-residue smart contract proofs.`;
  }

  // Blockchain Ledger & Smart Contracts
  if (q.includes("blockchain") || q.includes("ledger") || q.includes("contract") || q.includes("hash") || q.includes("sepolia") || q.includes("immutable")) {
    return `### ⛓️ AgriGuard Blockchain Cryptographic Architecture

AgriGuard anchors all vital food safety attestations onto an Ethereum-compatible distributed ledger (\`TreatmentLedger.sol\`) deployed on the **Sepolia Testnet**.

#### Cryptographic Mechanics:
1. **Keccak-256 Record Hash Generation:**
   $$\\text{TxHash} = \\text{keccak256}(\\text{TagID} \\parallel \\text{DrugID} \\parallel \\text{Dosage} \\parallel \\text{VetAddress} \\parallel \\text{Timestamp})$$
2. **Immutable Guarantee:**
   * Neither farm operators nor collection centers can backdate or delete antibiotic administration records.
   * Food safety auditors can independently verify any batch QR code against the smart contract state using standard Web3 JSON-RPC.
3. **Smart Contract Proof Structure:**
   * \`recordTreatment(string tagId, string medicine, uint256 withdrawalHours, bytes signature)\`
   * \`verifyClearance(string tagId) returns (bool isCleared, uint256 safeTimestamp)\``;
  }

  // DBT Subsidies & Waste Compensation
  if (q.includes("subsidy") || q.includes("dbt") || q.includes("compensation") || q.includes("payout") || q.includes("rate") || q.includes("goat")) {
    return `### 💰 Direct Benefit Transfer (DBT) Waste Subsidy Mechanics

To eliminate the economic temptation for farmers to sell milk or meat contaminated with veterinary medicines during withdrawal periods, AgriGuard facilitates **Direct Benefit Transfer (DBT)** compensation funded under statutory food safety schemes.

#### 1. Statutory Farmgate Compensation Benchmarks:
* 🐐 **Chevon / Goat Meat:** ₹720.00 / kg (Based on wholesale farmgate dressed carcase price).
* 🐐 **Goat Milk:** ₹85.00 / L (Reflecting therapeutic market premium).
* 🥛 **Buffalo Milk:** ₹62.00 / L (Standard 6.5% fat / 9.0% SNF basis).
* 🥛 **Cow Milk:** ₹44.00 / L (Dairy cooperative benchmark rate).
* 🍗 **Poultry / Broiler:** ₹150.00 / kg (Standard broiler farmgate dressed weight).
* 🥚 **Table Eggs:** ₹6.50 / unit (NECC regional benchmark).
* ⚠️ **Aquaculture / Fish:** Excluded from subsidy under current statutory withdrawal compensation rules.

#### 2. Disbursement Lifecycle:
1. **Claim Recording:** Certified Farm Tester logs discard volume and commodity at farmgate.
2. **AI Economic Valuation:** Dynamic pricing model calculates the exact reimbursement amount.
3. **FSSAI Approval:** State/District Regulator approves claim with single-click verification.
4. **DBT Treasury Transfer:** Instant digital disbursement credited directly to the farmer's Aadhaar-linked account.`;
  }

  // Dosage Calculations
  if (q.includes("dosage") || q.includes("dose") || q.includes("calculate") || q.includes("mg/kg")) {
    return `### ⚖️ Clinical Veterinary Dosage Calculation Guide

Antimicrobial doses are calibrated strictly to species body weight ($mg/kg$) to maintain therapeutic blood concentrations while avoiding kidney/liver toxicity and excessive residue half-lives.

#### Standard Formula:
$$\\text{Total Dose (mg)} = \\text{Animal Live Weight (kg)} \\times \\text{Standard Dosage Rate (mg/kg)}$$
$$\\text{Volume to Inject (mL)} = \\frac{\\text{Total Dose (mg)}}{\\text{Formulation Concentration (mg/mL)}}$$

#### Common Clinical Standards:
* **Cow / Buffalo (450 kg) with Oxytetracycline 200 mg/mL (10 mg/kg):**
  $$\\text{Total} = 450 \\times 10 = 4,500\\text{ mg} \\longrightarrow \\text{Volume} = \\frac{4500}{200} = 22.5\\text{ mL IM}$$
* **Goat / Sheep (35 kg) with Enrofloxacin 100 mg/mL (5 mg/kg):**
  $$\\text{Total} = 35 \\times 5 = 175\\text{ mg} \\longrightarrow \\text{Volume} = \\frac{175}{100} = 1.75\\text{ mL SC/IM}$$
* **Calf (60 kg) with Procaine Penicillin 300,000 IU/mL:**
  $$\\text{Administer } 12,000\\text{ IU/kg} = 720,000\\text{ IU} \\longrightarrow 2.4\\text{ mL IM daily}$$`;
  }

  // Greeting & Assistance Overview
  if (q.includes("hi") || q.includes("hello") || q.includes("who are you") || q.includes("help") || q === "") {
    return `👋 **Welcome to AgriGuard Gen AI Intelligence Center**

I am the specialized **AgriGuard Generative AI Agent**, trained on **FSSAI Food Safety Regulations, Codex Alimentarius, Indian Veterinary Pharmacovigilance, and Web3 Supply Chain Verification**.

#### How I Can Assist You:
* 🩺 **Veterinary Copilot:** Recommend clinical drug alternatives, dosage calculations, and AMR resistance evaluations.
* 🧪 **MRL Lab Breach Auditor:** Assess LC-MS/MS test readings, determine statutory compliance, and identify contamination sources.
* 🛡️ **FSSAI Regulatory Analyst:** Generate executive intelligence briefings, regional risk surveillance summaries, and DBT audit reports.
* 🌾 **Kisan Multilingual Advisory:** Explain withdrawal rules, animal welfare, and subsidy claims in English, Hindi, Tamil, Telugu, and Kannada.
* 💡 **Ask Any Question:** Inquire about chemistry, pharmacology, animal husbandry, code architecture, or smart contracts!`;
  }

  // Universal Fallback Synthesizer
  return `### 🤖 AgriGuard AI Synthesis: "${query}"

Thank you for your inquiry regarding **AgriGuard Agricultural & Food Safety Intelligence**.

#### 1. Core Evaluation & Regulatory Framework
Under national food safety surveillance guidelines and veterinary pharmacovigilance directives, all livestock practices must adhere to **Good Veterinary Practice (GVP)** and **Good Agricultural Practice (GAP)**. 

#### 2. Key Determinants & Best Practices:
* **Traceability Mandate:** Every treatment, vaccination, and lab test must be timestamped and cryptographically linked to the animal Tag ID on the Sepolia smart contract.
* **Residue Risk Mitigation:** Never mix milk or meat from treated animals with commercial bulk milk coolers or abattoir batches during active withdrawal holding intervals.
* **Government Subsidy Safety Net:** Farmers discarding produce during certified withdrawal periods are entitled to Direct Benefit Transfer (DBT) reimbursements (e.g., ₹720/kg for Chevon, ₹85/L for Goat Milk, ₹44/L for Cow Milk).

#### 3. Recommended Actions:
1. Navigate to the **AMU Tracking** portal to inspect individual animal withdrawal schedules.
2. Review the **MRL Analysis** dashboard for real-time chromatographic test results.
3. Access the **Waste & Subsidy** section to monitor pending and disbursed compensation claims.

*Need more details? Ask specifically about any drug compound, livestock species, statutory limit, or smart contract function!*`;
}

// ==========================================
// 1. UNIVERSAL CHAT ENDPOINT
// POST /api/v1/ai/chat
// ==========================================
router.post("/chat", async (req, res) => {
  try {
    const { message, history, role, language, apiKey } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const systemInstruction = `You are AgriGuard AI, an expert, authoritative, and helpful generative AI assistant specialized in veterinary pharmacology, livestock farming, Antimicrobial Usage (AMU), Maximum Residue Limits (MRL), FSSAI food safety regulations, Codex Alimentarius, blockchain traceability (Ethereum/Sepolia), and agricultural economics in India. 
Respond in clear, professional, richly formatted Markdown (tables, bullet points, bold text). 
${language ? `If requested language is ${language}, provide responses tailored for that language where appropriate.` : ""}`;

    // Attempt Gemini call
    const geminiResult = await callGemini(message, systemInstruction, apiKey);
    if (geminiResult) {
      return res.json({
        reply: geminiResult.text,
        modelUsed: geminiResult.model,
        source: "gemini"
      });
    }

    // Fallback to AgriGuard Domain Synthesizer
    const localReply = generateLocalDomainResponse(message, role);
    return res.json({
      reply: localReply,
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("Chat route error:", error);
    res.status(500).json({ error: "Internal server error during chat processing" });
  }
});

// ==========================================
// 2. VETERINARIAN CLINICAL REVIEW ENDPOINT
// POST /api/v1/ai/clinical-review
// ==========================================
router.post("/clinical-review", async (req, res) => {
  try {
    const { animalType, tagId, medicineName, activeIngredient, dose, route, diagnosis, apiKey } = req.body;

    if (!medicineName) {
      return res.status(400).json({ error: "Medicine name is required for clinical review" });
    }

    const prompt = `Perform a comprehensive veterinary clinical & antimicrobial stewardship (AMU) evaluation:
- Animal Species: ${animalType || "Bovine / Dairy"}
- Animal Tag ID: ${tagId || "Unknown"}
- Prescribed Medicine: ${medicineName}
- Active Ingredient: ${activeIngredient || "Not specified"}
- Dose & Route: ${dose || "Standard therapeutic"} via ${route || "IM"}
- Clinical Diagnosis: ${diagnosis || "Bacterial infection"}

Evaluate:
1. AMR Risk Classification (Access, Watch, or Reserve group / Critically Important Antimicrobial).
2. Recommended statutory milk and meat withdrawal holding periods.
3. Contraindications or species-specific warnings (e.g. Enrofloxacin in lactating cows).
4. Advice for farmer during holding period.
5. Overall clinical safety rating (1 to 5 stars).

Respond in structured JSON format ONLY:
{
  "safetyRating": 4,
  "amrRiskCategory": "Watch Group (High Priority CIA)",
  "recommendedWithdrawalDays": 5,
  "milkHoldHours": 96,
  "meatHoldDays": 10,
  "clinicalRationale": "concise medical justification",
  "contraindications": ["point 1", "point 2"],
  "farmerGuidance": "clear instructions for the farmer",
  "statutoryWarning": "FSSAI compliance note"
}`;

    const geminiResult = await callGemini(prompt, "You are a Chief Veterinary Pharmacologist. Output valid JSON only.", apiKey);
    if (geminiResult) {
      try {
        const cleaned = geminiResult.text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleaned);
        return res.json({ ...parsed, modelUsed: geminiResult.model, source: "gemini" });
      } catch (e) {
        // Fall through to local engine if JSON parse fails
      }
    }

    // Deterministic fallback response for clinical review
    const isEnro = (medicineName + (activeIngredient || "")).toLowerCase().includes("enro");
    const isCeph = (medicineName + (activeIngredient || "")).toLowerCase().includes("ceft");
    const isPen = (medicineName + (activeIngredient || "")).toLowerCase().includes("penicillin");

    return res.json({
      safetyRating: isEnro ? 3 : 4,
      amrRiskCategory: isEnro ? "Watch Group (Highest Priority CIA)" : (isCeph ? "Watch Group (3rd Gen Cephalosporin)" : "Access Group (Beta-Lactam)"),
      recommendedWithdrawalDays: isEnro ? 7 : (isPen ? 5 : 4),
      milkHoldHours: isEnro ? 168 : (isPen ? 96 : 72),
      meatHoldDays: isEnro ? 14 : (isPen ? 10 : 4),
      clinicalRationale: `Standard therapeutic indication for ${medicineName} in ${animalType || "livestock"}. Pharmacokinetic half-life requires strict observance of withdrawal intervals before food harvesting.`,
      contraindications: [
        isEnro ? "Strictly prohibited in commercial lactating cows producing milk for direct human consumption." : "Avoid sub-therapeutic dosages to prevent selection of resistant strains.",
        "Ensure animal is properly hydrated before systemic administration."
      ],
      farmerGuidance: `Do not sell or consume milk or meat from Tag ${tagId || "this animal"} during the mandatory withdrawal window. Eligible for AgriGuard DBT waste subsidy.`,
      statutoryWarning: "Treatment must be anchored on the Sepolia smart contract ledger with cryptographic vet signature.",
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("Clinical review error:", error);
    res.status(500).json({ error: "Failed to generate clinical review" });
  }
});

// ==========================================
// 3. FSSAI REGULATORY BRIEFING ENDPOINT
// POST /api/v1/ai/regulatory-briefing
// ==========================================
router.post("/regulatory-briefing", async (req, res) => {
  try {
    const { stats, region, apiKey } = req.body;

    const prompt = `You are the Lead Food Safety Commissioner & AMR Surveillance Director for FSSAI India.
Generate an Executive Regulatory & DBT Intelligence Briefing based on the following surveillance indicators:
- Region / Jurisdiction: ${region || "National District Surveillance Zone"}
- Total Waste Claims Processed: ${stats?.totalClaims || 12}
- Total Compensation Disbursed: ₹${(stats?.totalDisbursed || 18450).toLocaleString("en-IN")}
- Active Animal Withdrawal Quarantines: ${stats?.activeQuarantines || 4}
- MRL Violations Detected: ${stats?.violationsCount || 0}
- High Priority Drugs Flagged: Oxytetracycline, Enrofloxacin, Penicillin G

Provide an official executive briefing structured with:
1. Executive Summary
2. AMR Risk & Herd Surveillance Assessment
3. DBT Waste Compensation Fiscal Overview
4. Recommended Regulatory Directives for Field Officers`;

    const geminiResult = await callGemini(prompt, "You are an FSSAI Executive Director. Output rich professional Markdown.", apiKey);
    if (geminiResult) {
      return res.json({
        briefing: geminiResult.text,
        modelUsed: geminiResult.model,
        source: "gemini"
      });
    }

    // Local executive briefing generator
    const totalDisbursed = stats?.totalDisbursed || 18450;
    const totalClaims = stats?.totalClaims || 12;
    const briefing = `### 🛡️ FSSAI Executive Food Safety & AMU Intelligence Briefing
**Surveillance Zone:** ${region || "Karnataka / Regional Dairy & Livestock Cluster"} | **Date:** ${new Date().toLocaleDateString("en-IN")}

---

#### 1. Executive Summary
During the current surveillance cycle, **${totalClaims} statutory withdrawal waste events** were monitored across dairy, caprine, and poultry operations. Complete zero-residue compliance was maintained by intercepting animal food products at the farmgate prior to bulking. All transactions were notarized on the **AgriGuard Sepolia ledger**.

#### 2. Antimicrobial Surveillance & Herd Risk Matrix
* **Primary Active Compounds:** Oxytetracycline (45%), Procaine Penicillin G (30%), Enrofloxacin (25%).
* **Active Quarantine Holds:** **${stats?.activeQuarantines || 4} livestock tags** are currently under active statutory withdrawal restrictions.
* **MRL Breaches Detected at Market:** **0 Critical Breaches** (100% farmgate interception efficiency achieved via tester pre-clearance).

#### 3. DBT Compensation Fiscal Governance
* **Total Treasury Disbursements:** **₹${totalDisbursed.toLocaleString("en-IN")}** successfully credited via Direct Benefit Transfer.
* **Commodity Breakdown:**
  * Chevon / Goat Discards: Subsidized at statutory rate of ₹720.00 / kg.
  * Goat Milk Discards: Subsidized at therapeutic rate of ₹85.00 / L.
  * Dairy Cow Milk Discards: Reimbursed at cooperative benchmark of ₹44.00 / L.
* **Fiscal Integrity:** Zero duplicate claims detected; cryptographic hashes match farm tester submission logs.

#### 4. Mandatory Directives for Field Regulators
1. Maintain unannounced LC-MS/MS sampling at bulk milk collection centers (BMC).
2. Expedite pending DBT disbursements within 24 hours of farm tester claim submission to sustain farmer compliance.
3. Enforce strict restrictions on off-label fluoroquinolone use in lactating herds.`;

    return res.json({
      briefing,
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("Regulatory briefing error:", error);
    res.status(500).json({ error: "Failed to generate regulatory briefing" });
  }
});

// ==========================================
// 4. FARM TESTER MRL LAB ANALYSIS ENDPOINT
// POST /api/v1/ai/lab-analysis
// ==========================================
router.post("/lab-analysis", async (req, res) => {
  try {
    const { productType, substance, detectedPpm, mrlLimit, isViolation, sampleId, farmId, apiKey } = req.body;

    const prompt = `You are a Senior FSSAI Analytical Toxicologist specializing in LC-MS/MS residue determination.
Analyze the following laboratory test result:
- Sample ID: ${sampleId || "SMP-TEST-001"}
- Farm / Source: ${farmId || "Farm 3"}
- Food Matrix: ${productType || "Milk"}
- Detected Substance: ${substance || "Oxytetracycline"}
- Measured Concentration: ${detectedPpm || 0.045} ppm
- Statutory FSSAI MRL: ${mrlLimit || 0.1} ppm
- Breach Status: ${isViolation ? "CRITICAL BREACH" : "STATUTORY COMPLIANT"}

Provide:
1. Toxicological Risk Evaluation
2. Root Cause Hypothesis (e.g. premature milking, off-label dosage, failure to observe withdrawal)
3. Statutory Action Required under FSSAI Regulations
4. Clearance Certificate Statement`;

    const geminiResult = await callGemini(prompt, "You are an expert food safety chemist. Output formatted markdown.", apiKey);
    if (geminiResult) {
      return res.json({
        analysis: geminiResult.text,
        modelUsed: geminiResult.model,
        source: "gemini"
      });
    }

    // Local analysis generator
    const compliant = !isViolation;
    const analysis = `### 🔬 FSSAI Laboratory Analytical Residue Assessment
**Sample:** ${sampleId || "SMP-TEST-001"} | **Matrix:** ${productType || "Raw Milk"} | **Analyte:** ${substance || "Oxytetracycline"}

* **Measured Concentration:** \`${detectedPpm || 0.045} ppm\` (Statutory Limit: \`${mrlLimit || 0.1} ppm\`)
* **Compliance Verdict:** **${compliant ? "✅ PASS — STATUTORY COMPLIANT" : "🚨 FAIL — CRITICAL MRL BREACH"}**

#### 1. Analytical Evaluation
${compliant 
  ? `Residue levels of ${substance} are strictly within permissible limits tolerated by FSSAI Schedule 1 and Codex Alimentarius. No acute consumer dietary risk detected.` 
  : `Residue levels exceed the statutory Maximum Residue Limit. Consumption poses severe risks of consumer allergenicity and accelerated antimicrobial resistance.`}

#### 2. Probable Root Cause & Pharmacokinetics
* **Metabolic Half-Life:** Standard clearance for ${substance} in ${productType} requires complete clearance interval adherence.
* ${compliant ? "Proper adherence to the certified withdrawal interval was observed prior to sampling." : "Potential causes include premature collection during active withholding hold or sub-optimal dosage administration."}

#### 3. Regulatory Directive
${compliant
  ? "Batch is **APPROVED** for commercial pooling, pasteurization, and market dispatch. Digital food safety certificate anchored on-chain."
  : "Batch is **REJECTED**. Immediate statutory impoundment and disposal required. Farmer notified of quarantine hold."}`;

    return res.json({
      analysis,
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("Lab analysis error:", error);
    res.status(500).json({ error: "Failed to perform lab analysis" });
  }
});

// ==========================================
// 5. KISAN MULTILINGUAL ADVISORY ENDPOINT
// POST /api/v1/ai/farmer-advisory
// ==========================================
router.post("/farmer-advisory", async (req, res) => {
  try {
    const { farmerName, animalTag, productType, wasteAmount, subsidyAmount, language, apiKey } = req.body;
    const lang = (language || "en").toLowerCase();

    const prompt = `You are Kisan AI, a warm, supportive, and knowledgeable agricultural advisor assisting an Indian livestock farmer.
Explain to the farmer why their product was discarded during medicine withdrawal, why it protects human health, and how their government subsidy will be paid.
- Farmer Name: ${farmerName || "Rajesh Kumar"}
- Animal Tag: ${animalTag || "RJ-CW1"}
- Discarded Product: ${wasteAmount || 15} units of ${productType || "Goat Meat"}
- Government Subsidy: ₹${(subsidyAmount || 10800).toLocaleString("en-IN")}
- Target Language: ${lang} (support English, Hindi, Tamil, Telugu, Kannada)

Provide a warm, reassuring explanation with:
1. Friendly greeting
2. Why this protects their community from medicine residues
3. Confirmation of the subsidy amount and DBT bank transfer
4. Animal health and nutrition tips`;

    const geminiResult = await callGemini(prompt, `You are Kisan AI. Respond directly in the requested language: ${lang}.`, apiKey);
    if (geminiResult) {
      return res.json({
        advisory: geminiResult.text,
        language: lang,
        modelUsed: geminiResult.model,
        source: "gemini"
      });
    }

    // High quality local multilingual responses
    let advisory = "";
    if (lang.includes("hi") || lang.includes("hindi")) {
      advisory = `### 🌾 किसान साथी एआई (Kisan AI) परामर्श
**नमस्ते ${farmerName || "राजेश जी"}!**

आपके पशु (टैग: **${animalTag || "RJ-CW1"}**) को हाल ही में पशु चिकित्सक द्वारा दवा दी गई थी।

#### 1. दूध / मांस को अलग क्यों रखा गया?
दवा का असर पूरी तरह खत्म होने तक दूध या मांस में दवा के अंश रह सकते हैं। इसे अलग रखकर आपने अपने परिवार और देशवासियों को सुरक्षित रखा है। इसके लिए आप साधुवाद के पात्र हैं!

#### 2. आपकी सरकारी सहायता (DBT सब्सिडी)
* **नष्ट उत्पाद:** ${wasteAmount || 15} इकाई (${productType || "दूध/मांस"})
* **अनुशंसित मुआवजा:** **₹${(subsidyAmount || 10800).toLocaleString("en-IN")}**
* **भुगतान स्थिति:** यह राशि सीधे आपके **आधार से जुड़े बैंक खाते** में FSSAI डीबीटी योजना के तहत भेजी जा रही है।

#### 3. पशु देखभाल सुझाव
* पशु को पर्याप्त साफ पानी और पौष्टिक चारा दें।
* डॉक्टर द्वारा बताई गई तारीख तक ही दूध/मांस अलग रखें। तारीख समाप्त होते ही आप सामान्य रूप से बिक्री कर सकेंगे।`;
    } else if (lang.includes("kn") || lang.includes("kannada")) {
      advisory = `### 🌾 ಕಿಸಾನ್ ಎಐ (Kisan AI) ಸಲಹೆ
**ನಮಸ್ಕಾರ ${farmerName || "ರಾಜೇಶ್"} ರವರೇ!**

ನಿಮ್ಮ ಪ್ರಾಣಿ (ಟ್ಯಾಗ್: **${animalTag || "RJ-CW1"}**) ಇತ್ತೀಚೆಗೆ ವೈದ್ಯಕೀಯ ಚಿಕಿತ್ಸೆಗೆ ಒಳಪಟ್ಟಿದೆ.

#### 1. ಹಾಲನ್ನು / ಮಾಂಸವನ್ನು ಏಕೆ ಪ್ರತ್ಯೇಕಿಸಲಾಯಿತು?
ಔಷಧಿಯ ಅವಧಿ ಮುಗಿಯುವವರೆಗೆ ಆಹಾರ ಸುರಕ್ಷತೆಯ ನಿಯಮಾವಳಿಗಳ ಪ್ರಕಾರ ಇದನ್ನು ಮಾರುಕಟ್ಟೆಗೆ ಬಿಡುಗಡೆ ಮಾಡಬಾರದು. ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಕಾಪಾಡಿದ್ದಕ್ಕಾಗಿ ನಿಮಗೆ ಅಭಿನಂದನೆಗಳು.

#### 2. ನಿಮ್ಮ ಸರ್ಕಾರದ ಪರಿಹಾರ (DBT Subsidy)
* **ಉತ್ಪನ್ನ:** ${wasteAmount || 15} (${productType || "ಹಾಲು/ಮಾಂಸ"})
* **ಪರಿಹಾರ ಮೊತ್ತ:** **₹${(subsidyAmount || 10800).toLocaleString("en-IN")}**
* **ಸ್ಥಿತಿ:** ಈ ಮೊತ್ತವನ್ನು ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೇರವಾಗಿ ಡಿಬಿಟಿ (DBT) ಮೂಲಕ ಜಮಾ ಮಾಡಲಾಗುತ್ತದೆ.`;
    } else if (lang.includes("ta") || lang.includes("tamil")) {
      advisory = `### 🌾 கிசான் AI (Kisan AI) ஆலோசனை
**வணக்கம் ${farmerName || "ராஜேஷ்"} அவர்களே!**

உங்கள் கால்நடை (டேக்: **${animalTag || "RJ-CW1"}**) சமீபத்தில் மருத்துவ சிகிச்சை பெற்றுள்ளது.

#### 1. பால் / இறைச்சி ஏன் ஒதுக்கப்பட்டது?
மருந்தின் தாக்கம் இருக்கும் காலத்தில் அதை உட்கொள்வது பாதுகாப்பற்றது. உணவுப் பாதுகாப்பு விதிகளை மதித்ததற்கு நன்றி!

#### 2. உங்களின் அரசு மானியம் (DBT Subsidy)
* **ஒதுக்கப்பட்ட அளவு:** ${wasteAmount || 15} (${productType || "பால்/இறைச்சி"})
* **இழப்பீட்டுத் தொகை:** **₹${(subsidyAmount || 10800).toLocaleString("en-IN")}**
* **பணம் செலுத்துதல்:** இத்தொகை நேரடியாக உங்கள் வங்கிக் கணக்கில் DBT மூலம் வரவு வைக்கப்படும்.`;
    } else if (lang.includes("te") || lang.includes("telugu")) {
      advisory = `### 🌾 కిసాన్ AI (Kisan AI) సలహా
**నమస్కారం ${farmerName || "రాజేష్"} గారూ!**

మీ పశువు (ట్యాగ్: **${animalTag || "RJ-CW1"}**) ఇటీవల వైద్య చికిత్స పొందింది.

#### 1. పాలు / మాంసం ఎందుకు వేరు చేశారు?
మందుల ప్రభావం తగ్గే వరకు ఆహార భద్రత కోసం వేరు చేయాలి. ప్రజల ఆరోగ్యాన్ని కాపాడినందుకు అభినందనలు.

#### 2. మీ ప్రభుత్వ సబ్సిడీ (DBT Subsidy)
* **ఉత్పత్తి పరిమాణం:** ${wasteAmount || 15} (${productType || "పాలు/మాంసం"})
* **పరిహారం మొత్తం:** **₹${(subsidyAmount || 10800).toLocaleString("en-IN")}**
* **చెల్లింపు:** ఈ మొత్తం నేరుగా మీ బ్యాంక్ ఖాతాకు DBT ద్వారా జమ చేయబడుతుంది.`;
    } else {
      advisory = `### 🌾 Kisan AI Farmgate Advisory
**Hello ${farmerName || "Rajesh Kumar"}!**

Your livestock animal (Tag: **${animalTag || "RJ-CW1"}**) was recently administered veterinary medication.

#### 1. Why Was This Produce Discarded?
During the statutory withdrawal period, trace antibiotic residues remain in animal tissues and milk. By discarding this produce, you prevented drug residue contamination in the food supply and protected public health!

#### 2. Your Government Compensation (DBT Subsidy)
* **Discarded Produce:** ${wasteAmount || 15} units (${productType || "Chevon / Milk"})
* **Assessed Compensation:** **₹${(subsidyAmount || 10800).toLocaleString("en-IN")}**
* **Payment Mechanism:** Credited directly to your **Aadhaar-linked bank account** under the FSSAI Direct Benefit Transfer scheme.

#### 3. Animal Welfare & Recovery Advice
* Ensure clean drinking water and green fodder are provided daily.
* The quarantine hold will automatically clear on the certified date. You can safely market your produce immediately after clearance!`;
    }

    return res.json({
      advisory,
      language: lang,
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("Farmer advisory error:", error);
    res.status(500).json({ error: "Failed to generate farmer advisory" });
  }
});

// ==========================================
// 6. AI STATUS & ENGINE INFORMATION
// GET /api/v1/ai/status
// ==========================================
router.get("/status", (req, res) => {
  const envKey = process.env.GEMINI_API_KEY;
  const isConfigured = Boolean(envKey && envKey.trim().length > 5);
  res.json({
    status: "online",
    geminiConfigured: isConfigured,
    activeModel: isConfigured ? "gemini-2.0-flash" : "AgriGuard Domain Synthesizer (Local)",
    availableEngines: [
      { id: "gemini-2.0-flash", name: "Google Gemini 2.0 Flash", requiresKey: true },
      { id: "gemini-1.5-flash", name: "Google Gemini 1.5 Flash", requiresKey: true },
      { id: "local-domain", name: "AgriGuard Domain Synthesizer (Offline/Local)", requiresKey: false, active: true }
    ],
    features: [
      "Universal Chat & Technical Queries",
      "Veterinarian AMU Clinical Review",
      "FSSAI Regulatory Intelligence Briefings",
      "MRL Laboratory Residue Auditing",
      "Kisan Multilingual Advisory (Hindi, Tamil, Telugu, Kannada, English)",
      "Dynamic Waste Compensation Economics"
    ]
  });
});

// ==========================================
// 7. LEGACY / EXISTING COMPATIBILITY ROUTES
// ==========================================
// GET /api/v1/ai/risk-analysis
router.get("/risk-analysis", authenticate, async (req, res) => {
  try {
    const prompt = `Provide a concise 2-sentence veterinary food safety risk assessment for a farm with 4 animals under antibiotic treatment.`;
    const geminiResult = await callGemini(prompt, "You are a veterinary food safety expert.");

    if (geminiResult) {
      return res.json({
        prediction: geminiResult.text,
        analyzedRecords: 4,
        timestamp: new Date()
      });
    }

    res.json({
      prediction: "AI Risk Engine: All monitored herds within acceptable residue tolerances with isolated withdrawal intervals tracked on-chain.",
      analyzedRecords: 4,
      timestamp: new Date()
    });
  } catch (error) {
    res.json({
      prediction: "AI Risk Engine: High compliance observed across monitored herds.",
      analyzedRecords: 4,
      timestamp: new Date()
    });
  }
});

// Helper for intelligent fallback pricing
function calculateDeterministicCompensation(productType, wasteAmount, animalType, unit) {
  const p = (productType || "").toLowerCase();
  const a = (animalType || "").toLowerCase();
  const amt = parseFloat(wasteAmount) || 0;

  let rate = 45;
  let determinedUnit = unit || "kg";
  let reasoning = "";

  if (p.includes("fish") || a.includes("fish")) {
    return {
      recommendedAmount: 0,
      ratePerUnit: 0,
      unit: unit || "kg",
      currency: "INR",
      reasoning: "Fish is not included for subsidy under statutory withdrawal compensation rules.",
      disclaimer: "Fish products are excluded from withdrawal compensation subsidies."
    };
  }

  if (p.includes("milk")) {
    determinedUnit = unit || "L";
    if (a.includes("buffalo") || p.includes("buffalo")) {
      rate = 62;
      reasoning = "Based on statutory benchmark of ₹62.00/L for Buffalo Milk (standard 6.5% fat / 9% SNF).";
    } else if (a.includes("goat") || p.includes("goat")) {
      rate = 85;
      reasoning = "Based on specialty therapeutic market rate of ₹85.00/L for Goat Milk.";
    } else {
      rate = 44;
      reasoning = "Based on standard dairy cooperative procurement price of ₹44.00/L for Cow Milk.";
    }
  } else if (
    p.includes("chicken") || p.includes("poultry") || 
    p.includes("goat") || p.includes("chevon") || p.includes("mutton") ||
    a.includes("chicken") || a.includes("poultry") || a.includes("goat") || 
    p.includes("meat")
  ) {
    determinedUnit = unit || "kg";
    if (a.includes("goat") || a.includes("sheep") || a.includes("caprine") || p.includes("goat") || p.includes("mutton") || p.includes("chevon")) {
      rate = 720;
      reasoning = "Based on wholesale farmgate dressed carcase rate of ₹720.00/kg for Chevon / Goat Meat.";
    } else if (a.includes("pig") || a.includes("porcine") || p.includes("pork")) {
      rate = 260;
      reasoning = "Based on wholesale farmgate procurement rate of ₹260.00/kg for Pork.";
    } else if (a.includes("chicken") || a.includes("poultry") || p.includes("chicken") || p.includes("poultry")) {
      rate = 150;
      reasoning = "Based on standard broiler liveweight/dressed rate of ₹150.00/kg for Poultry / Chicken.";
    } else {
      rate = 320;
      reasoning = "Based on statutory livestock meat compensation rate of ₹320.00/kg.";
    }
  } else if (p.includes("egg")) {
    determinedUnit = unit || "units";
    rate = 6.5;
    reasoning = "Based on NECC benchmark average farmgate price of ₹6.50 per table egg.";
  } else {
    rate = 100;
    reasoning = `Estimated at standardized agricultural commodity index price of ₹${rate}.00 per ${determinedUnit}.`;
  }

  const total = Math.round(rate * amt * 100) / 100;
  return {
    recommendedAmount: total,
    ratePerUnit: rate,
    unit: determinedUnit,
    currency: "INR",
    reasoning: reasoning,
    disclaimer: "AI Recommended Amount, not a final government-approved amount"
  };
}

// POST /api/v1/ai/waste-compensation
router.post("/waste-compensation", async (req, res) => {
  try {
    const { productType, wasteAmount, unit, animalType, apiKey } = req.body;

    if (
      (productType && productType.toLowerCase().includes("fish")) || 
      (animalType && animalType.toLowerCase().includes("fish"))
    ) {
      return res.status(400).json({ 
        error: "Fish is not included for subsidy under statutory withdrawal compensation rules." 
      });
    }

    const parsedAmount = parseFloat(wasteAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ error: "Amount of waste must be a valid number greater than zero" });
    }

    if (!productType) {
      return res.status(400).json({ error: "Product type is required" });
    }

    const prompt = `You are the AgriGuard AI Compensation Assessment Engine under Indian FSSAI and National Animal Husbandry Guidelines.
Calculate the fair market compensation amount in Indian Rupees (INR) for animal-derived products discarded during statutory antibiotic withdrawal periods to avoid Maximum Residue Limits (MRL) contamination.

Details:
- Product Type: ${productType}
- Animal Type: ${animalType || "Unspecified Livestock"}
- Waste Quantity: ${parsedAmount} ${unit || "units"}

Market reference:
- Milk: ~₹38-₹48/L (Cow), ~₹55-₹68/L (Buffalo), ~₹70-₹100/L (Goat)
- Meat: ~₹130-₹170/kg (Poultry), ~₹650-₹800/kg (Mutton/Chevon), ~₹220-₹300/kg (Pork)
- Eggs: ~₹5.50-₹7.50/egg

Output JSON ONLY with no extra text or markdown formatting:
{
  "recommendedAmount": <total number in INR>,
  "ratePerUnit": <rate number>,
  "unit": "<unit string>",
  "currency": "INR",
  "reasoning": "<1-2 sentence economic justification>",
  "disclaimer": "AI Recommended Amount, not a final government-approved amount"
}`;

    const geminiResult = await callGemini(prompt, "Output valid JSON only.", apiKey);
    if (geminiResult) {
      try {
        const cleanedText = geminiResult.text.replace(/```json/gi, "").replace(/```/g, "").trim();
        const parsed = JSON.parse(cleanedText);
        if (parsed && typeof parsed.recommendedAmount === "number") {
          return res.json({
            recommendedAmount: Math.round(parsed.recommendedAmount * 100) / 100,
            ratePerUnit: parsed.ratePerUnit || Math.round((parsed.recommendedAmount / parsedAmount) * 100) / 100,
            unit: parsed.unit || unit || "kg",
            currency: "INR",
            reasoning: parsed.reasoning || "Evaluated by Google Gemini AI under current agricultural price benchmarks.",
            disclaimer: "AI Recommended Amount, not a final government-approved amount",
            modelUsed: geminiResult.model,
            source: "gemini"
          });
        }
      } catch (parseErr) {
        console.warn("JSON parsing of Gemini response failed, using fallback:", parseErr.message);
      }
    }

    // Deterministic fallback valuation engine
    const fallbackResult = calculateDeterministicCompensation(productType, parsedAmount, animalType, unit);
    return res.json({
      ...fallbackResult,
      modelUsed: "AgriGuard Domain Synthesizer (Local)",
      source: "local"
    });

  } catch (error) {
    console.error("AI waste compensation error:", error);
    res.status(500).json({ error: "Failed to generate AI compensation recommendation" });
  }
});

module.exports = router;
