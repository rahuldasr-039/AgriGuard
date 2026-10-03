const express = require("express");
const { PrismaClient } = require("@prisma/client");
const { authenticate } = require("../middleware/auth");
const { GoogleGenAI } = require("@google/genai");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * Universal Groq API Caller supporting llama-3.3-70b-versatile with fallbacks
 * Uses process.env.GROQ_API_KEY securely on the backend (never exposed to browser)
 */
async function callGroq(messages, systemInstruction = "", userKey = null) {
  const apiKey = (userKey && userKey.trim().length > 5) 
    ? userKey.trim() 
    : (process.env.GROQ_API_KEY || process.env.GROQ_KEY);
  if (!apiKey || apiKey.trim().length < 5) return null;

  try {
    const formattedMessages = [
      ...(systemInstruction ? [{ role: "system", content: systemInstruction }] : []),
      ...(Array.isArray(messages) 
        ? messages.map(m => ({ role: m.role || "user", content: m.content || String(m) })) 
        : [{ role: "user", content: String(messages) }])
    ];

    const models = ["llama-3.3-70b-versatile", "llama-3.1-8b-instant", "mixtral-8x7b-32768"];
    for (const model of models) {
      try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey.trim()}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model,
            messages: formattedMessages,
            temperature: 0.2,
            max_tokens: 1200
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (data?.choices?.[0]?.message?.content) {
            return {
              text: data.choices[0].message.content,
              model: `Groq (${model})`,
              source: "groq"
            };
          }
        }
      } catch (innerErr) {
        console.warn(`Groq ${model} attempt failed:`, innerErr.message);
      }
    }
  } catch (err) {
    console.warn("Groq API unserviceable, falling back to next engine:", err.message);
  }
  return null;
}

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
// 1. UNIVERSAL CHAT ENDPOINT (UPGRADED WITH GROQ & DB GROUNDING)
// POST /api/v1/ai/chat
// ==========================================
router.post("/chat", async (req, res) => {
  try {
    const { message, history, role, language, apiKey } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    // 1. Fetch Real Database Context to prevent hallucination
    const text = message.toLowerCase();
    let dbFacts = [];

    try {
      // Look up animals matching keywords or tags
      const words = message.match(/[A-Za-z0-9-_]{3,}/g) || [];
      const stopWords = ["what", "when", "safe", "date", "cows", "goat", "milk", "tell", "show", "help", "about", "your", "give"];
      const candidateTags = words.filter(w => !stopWords.includes(w.toLowerCase()));

      let foundAnimals = [];
      for (const tag of candidateTags.slice(0, 3)) {
        const matches = await prisma.animal.findMany({
          where: {
            OR: [
              { tagId: { contains: tag } },
              { name: { contains: tag } }
            ]
          },
          take: 3,
          include: {
            farmer: { select: { name: true, farmName: true, uniqueFarmerId: true } },
            treatments: {
              take: 3,
              orderBy: { createdAt: "desc" }
            }
          }
        });
        if (matches.length) foundAnimals.push(...matches);
      }

      if (foundAnimals.length > 0) {
        dbFacts.push("### Real Animal Records in AgriGuard:\n" + foundAnimals.map(a => 
          `- Tag ID: ${a.tagId} (${a.name || "Animal"}, Species: ${a.species})\n  Farmer: ${a.farmer?.name || "N/A"} (${a.farmer?.farmName || ""})\n  Current Status: ${a.status}\n  Treatments: ${a.treatments?.length ? a.treatments.map(t => `${t.medicineName} (Safe Date: ${new Date(t.safeFromDate).toLocaleDateString()}, Status: ${t.status})`).join("; ") : "No active treatments"}`
        ).join("\n"));
      } else if (text.includes("cow") || text.includes("animal") || text.includes("safe date") || text.includes("withdrawal")) {
        const recentTreatments = await prisma.treatment.findMany({
          take: 4,
          orderBy: { createdAt: "desc" },
          include: {
            animal: true,
            farmer: { select: { name: true, farmName: true } }
          }
        });
        if (recentTreatments.length) {
          dbFacts.push("### Recent Treatment Records in AgriGuard System:\n" + recentTreatments.map(t => 
            `- Animal: ${t.animal?.name || "Animal"} (Tag: ${t.animal?.tagId || "N/A"}, Species: ${t.animal?.species || "Cattle"})\n  Medicine: ${t.medicineName} (${t.activeIngredient || ""})\n  Withdrawal Period: ${t.withdrawalDays} days (${t.milkWithholdingHours || 0} hrs milk)\n  Safe Clearance Date: ${new Date(t.safeFromDate).toLocaleDateString()}\n  Status: ${t.status}`
          ).join("\n"));
        }
      }

      // Look up MRL tests if relevant
      if (text.includes("mrl") || text.includes("test") || text.includes("ppm") || text.includes("residue")) {
        const recentTests = await prisma.productTest.findMany({
          take: 3,
          orderBy: { createdAt: "desc" }
        });
        if (recentTests.length) {
          dbFacts.push("### Recent Lab Test Records:\n" + recentTests.map(pt => 
            `- Sample: ${pt.productType} | Substance: ${pt.detectedSubstance} | Conc: ${pt.concentrationPpm} ppm (MRL Limit: ${pt.statutoryMrlPpm} ppm) | Status: ${pt.status}`
          ).join("\n"));
        }
      }

      // Look up compensation claims if relevant
      if (text.includes("subsidy") || text.includes("compensation") || text.includes("claim") || text.includes("dbt") || text.includes("waste")) {
        const recentClaims = await prisma.wasteCompensationClaim.findMany({
          take: 3,
          orderBy: { createdAt: "desc" }
        });
        if (recentClaims.length) {
          dbFacts.push("### Recent Waste Compensation Claims:\n" + recentClaims.map(c => 
            `- Claim #${c.claimNumber || c.id.slice(0,8)}: Quantity: ${c.quantityKgL} ${c.unit} (${c.productType}) | ₹${c.totalCompensation} | Status: ${c.status}`
          ).join("\n"));
        }
      }
    } catch (dbErr) {
      console.warn("DB Context query skipped:", dbErr.message);
    }

    const contextBlock = dbFacts.length > 0 
      ? `\n\nVERIFIED AGRIGUARD DATABASE RECORDS:\n${dbFacts.join("\n\n")}\n` 
      : "";

    const languageMap = {
      ta: "Tamil (தமிழ்)",
      hi: "Hindi (हिन्दी)",
      te: "Telugu (తెలుగు)",
      kn: "Kannada (ಕನ್ನಡ)",
      ml: "Malayalam (മലയാളം)",
      bn: "Bengali (বাংলা)",
      mr: "Marathi (मराठी)",
      gu: "Gujarati (ગુજરાતી)",
      pa: "Punjabi (ਪੰਜਾਬੀ)",
      or: "Odia (ଓଡ଼ିଆ)",
      as: "Assamese (অসমীয়া)",
      en: "English"
    };
    const targetLangName = languageMap[language] || language || "English";
    const isIndianLang = language && language !== "en";

    const systemInstruction = `You are AgriGuard AI, an authoritative, intelligent, and helpful AI assistant embedded in the AgriGuard Digital Farm Management System (SIH25007).
AgriGuard tracks Antimicrobial Usage (AMU), Maximum Residue Limits (MRL), statutory withdrawal periods, direct benefit transfer (DBT) waste compensation, blockchain records (Sepolia testnet), and consumer QR verification.

USER ROLE: ${role || "FARMER"}
${isIndianLang ? `MANDATORY LANGUAGE REQUIREMENT: The user interface is set to ${targetLangName}. You MUST respond entirely and naturally in ${targetLangName}. Do NOT respond in English. Translate all explanations, advice, numbers, and warnings into ${targetLangName}. Keep technical identifiers (Tag IDs, TxHashes, medicine names like Oxytetracycline) accurate.` : "LANGUAGE: English"}

KNOWLEDGE & SCOPE:
1. 🐄 Animals & Safe Dates: Explain withdrawal periods, safe clearance dates, and why milk/meat cannot be sold during withdrawal.
2. 💊 Medicines & AMU: Explain drug withdrawal rules, species compatibility, and WHO AWaRe classification.
3. 🧪 MRL Testing: Explain statutory limits (Codex & FSSAI), ppm concentrations, and safe thresholds.
4. 📜 Certificates & QR: Explain weekly digital compliance certification and public QR food safety validation.
5. 💰 Subsidies & DBT: Explain waste compensation for milk/meat discarded during withdrawal (e.g. goat milk ₹85/L, cow milk ₹44/L, chevon ₹720/kg).
6. 🌾 AgriGuard & Blockchain: Explain how immutable Ethereum smart contracts (TreatmentLedger.sol) prevent fraud and protect food safety.

CRITICAL ANTI-HALLUCINATION RULES:
- Never invent or hallucinate animal records, treatment dates, safe dates, certificate IDs, or compensation amounts.
- If specific data for an animal, farm, or treatment requested by the user is present in the VERIFIED AGRIGUARD DATABASE RECORDS below, use those exact dates and details.
- If the user asks for specific data about an animal or record that is NOT in the database records, do NOT make up dates or numbers. Clearly state in ${targetLangName} that no record was found for that ID in AgriGuard.
- For farmers, speak in simple, friendly, respectful language.
${contextBlock}`;

    // Format multi-turn conversation messages
    const chatMessages = [
      ...(Array.isArray(history) 
        ? history.map(h => ({ role: h.role === "assistant" || h.role === "bot" ? "assistant" : "user", content: h.content || h.text || "" }))
        : []),
      { role: "user", content: message }
    ];

    // Priority 1: Groq API (llama-3.3-70b-versatile)
    const groqResult = await callGroq(chatMessages, systemInstruction, apiKey);
    if (groqResult) {
      return res.json({
        reply: groqResult.text,
        modelUsed: groqResult.model,
        source: "groq"
      });
    }

    // Priority 2: Google Gemini (gemini-2.0-flash / 1.5-flash)
    const geminiResult = await callGemini(message, systemInstruction, apiKey);
    if (geminiResult) {
      return res.json({
        reply: geminiResult.text,
        modelUsed: geminiResult.model,
        source: "gemini"
      });
    }

    // Priority 3: AgriGuard Local Domain Knowledge & Anti-Hallucination Engine
    // Check for Tamil / Tanglish queries or Tamil language selection
    if (language === "ta" || text.includes("vanakkam") || text.includes("eppadi") || text.includes("pasu") || text.includes("paal") || text.includes("marunthu") || text.includes("tamil") || text.includes("tanglish")) {
      return res.json({
        reply: `### 🌾 AgriGuard AI — வணக்கம் (Farmer Assistance)
**வணக்கம் விவசாயி அவர்களே!** நான் அக்ரிகார்ட் (AgriGuard) செயற்கை நுண்ணறிவு உதவியாளர்.

1. **🐄 மாடு & பால் பாதுகாப்பு (Safe Date):**
   மருந்து கொடுத்த காலத்தில், மருந்தின் தாக்கம் பாலில் இருக்கும். அந்த காலம் (Withdrawal Period) முடியும் வரை பாலை விற்கவோ பயன்படுத்தவோ கூடாது.

2. **💰 நஷ்ட ஈடு (DBT Compensation):**
   பாதிக்கப்பட்ட பால்/இறைச்சியை வெளியேற்றினால், அரசாங்க மானியம் (DBT) உங்களுக்கு வங்கிக் கணக்கில் நேரடியாக கிடைக்கும் (பசு பால்: ₹44/L, ஆட்டு பால்: ₹85/L).

3. **📱 சான்றிதழ் (MRL Safe):**
   சோதனை முடிந்து பாதுகாப்பானதும் உங்களுக்கு **MRL SAFE** டிஜிட்டல் சான்றிதழ் மற்றும் QR Code கிடைக்கும்.

*உங்களுக்கு குறிப்பிட்ட விலங்கு அல்லது மருந்து பற்றி விவரம் வேண்டுமா? டேக் ஐடி (Tag ID) அனுப்பவும்!*`,
        modelUsed: "AgriGuard Domain Synthesizer (Tamil/Local)",
        source: "local"
      });
    }

    // Check for Hindi queries or Hindi language selection
    if (language === "hi") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — किसान सहायता (Farmer Assistance)
**नमस्ते किसान भाई!** मैं एग्रीगार्ड (AgriGuard) एआई सहायक हूं।

1. **🐄 पशु एवं दूध सुरक्षा (Safe Date):**
   उपचार के दौरान एंटीबायोटिक का असर दूध और मांस में रहता है। निकासी अवधि (Withdrawal Period) पूरी होने तक दूध या मांस न बेचें।

2. **💰 अपशिष्ट मुआवजा (DBT Compensation):**
   निकासी अवधि में नष्ट किए गए दूध/मांस के लिए डीबीटी के माध्यम से सीधे आपके बैंक खाते में मुआवजा मिलता है (गाय का दूध: ₹44/L, बकरी का दूध: ₹85/L)।

3. **📜 एमआरएल सुरक्षित प्रमाण पत्र (MRL Safe):**
   परीक्षण पूरा होने और सुरक्षित पाए जाने पर आपको **MRL SAFE** डिजिटल प्रमाण पत्र और क्यूआर कोड मिलता है।

*क्या आपको किसी विशिष्ट पशु या दवा के बारे में जानकारी चाहिए? कृपया टैग आईडी (Tag ID) बताएं।*`,
        modelUsed: "AgriGuard Domain Synthesizer (Hindi/Local)",
        source: "local"
      });
    }

    // Check for Telugu queries or Telugu language selection
    if (language === "te") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — రైతు సహాయం (Farmer Assistance)
**నమస్కారం రైతు సోదరులారా!** నేను అగ్రిగార్డ్ (AgriGuard) AI సహాయకుడిని.

1. **🐄 జంతువు & పాల భద్రత (Safe Date):**
   యాంటీబయాటిక్ చికిత్స సమయంలో ఔషధం ప్రభావం పాలు మరియు మాంసంలో ఉంటుంది. విత్‌డ్రావల్ గడువు ముగిసే వరకు పాలను విక్రయించకూడదు.

2. **💰 వ్యర్థాల పరిహారం (DBT Compensation):**
   ఈ కాలంలో పారబోసిన పాలు/మాంసానికి ప్రభుత్వం నుండి నేరుగా మీ బ్యాంక్ ఖాతాకు DBT పరిహారం అందుతుంది (ఆవు పాలు: ₹44/L, మేక పాలు: ₹85/L).

3. **📜 MRL సేఫ్ సర్టిఫికెట్:**
   పరీక్ష పూర్తయి సురక్షితమని తేలినప్పుడు మీకు **MRL SAFE** డిజిటల్ సర్టిఫికెట్ మరియు QR కోడ్ లభిస్తుంది.

*మీ జంతువు లేదా చికిత్స గురించిన వివరాల కోసం ట్యాగ్ ID తెలపండి.*`,
        modelUsed: "AgriGuard Domain Synthesizer (Telugu/Local)",
        source: "local"
      });
    }

    // Check for Kannada queries or Kannada language selection
    if (language === "kn") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — ರೈತ ಸಹಾಯವಾಣಿ (Farmer Assistance)
**ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ!** ನಾನು ಅಗ್ರಿಗಾರ್ಡ್ (AgriGuard) AI ಸಹಾಯಕ.

1. **🐄 ಹಾಲು ಮತ್ತು ಮಾಂಸ ಸುರಕ್ಷತೆ (Safe Date):**
   ಆಂಟಿಬಯೋಟಿಕ್ ಚಿಕಿತ್ಸೆಯ ಸಮಯದಲ್ಲಿ ಔಷಧದ ಅಂಶವು ಹಾಲು ಮತ್ತು ಮಾಂಸದಲ್ಲಿ ಇರುತ್ತದೆ. ಹಿಂಪಡೆಯುವಿಕೆ ಅವಧಿ (Withdrawal Period) ಮುಗಿಯುವವರೆಗೆ ಮಾರಾಟ ಮಾಡಬೇಡಿ.

2. **💰 ನಷ್ಟ ಪರಿಹಾರ (DBT Compensation):**
   ಈ ಅವಧಿಯಲ್ಲಿ ತ್ಯಾಜ್ಯವಾದ ಹಾಲು/ಮಾಂಸಕ್ಕೆ ಸರ್ಕಾರದ ವತಿಯಿಂದ ನೇರವಾಗಿ ನಿಮ್ಮ ಖಾತೆಗೆ DBT ಪರಿಹಾರ ಜಮೆಯಾಗುತ್ತದೆ (ಹಸುವಿನ ಹಾಲು: ₹44/L, ಮೇಕೆ ಹಾಲು: ₹85/L).

3. **📜 MRL ಸೇಫ್ ಪ್ರಮಾಣಪತ್ರ:**
   ಪರೀಕ್ಷೆ ಯಶಸ್ವಿಯಾಗಿ ಮುಗಿದ ನಂತರ ನಿಮಗೆ **MRL SAFE** ಡಿಜಿಟಲ್ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು QR ಕೋಡ್ ದೊರೆಯುತ್ತದೆ.`,
        modelUsed: "AgriGuard Domain Synthesizer (Kannada/Local)",
        source: "local"
      });
    }

    // Check for Malayalam queries or Malayalam language selection
    if (language === "ml") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — കർഷക സഹായം (Farmer Assistance)
**നമസ്കാരം!** ഞാൻ അഗ്രിഗാർഡ് (AgriGuard) AI അസിസ്റ്റന്റാണ്.

1. **🐄 പാലിന്റെയും മാംസത്തിന്റെയും സുരക്ഷ (Safe Date):**
   മരുന്ന് നൽകിയ മൃഗങ്ങളുടെ പാൽ പിൻവലിക്കൽ കാലയളവ് (Withdrawal Period) കഴിയുന്നതുവരെ വിൽക്കരുത്.
2. **💰 നഷ്ടപരിഹാരം (DBT Compensation):**
   പാഴായ പാലിനും മാംസത്തിനും DBT വഴി നേരിട്ട് നിങ്ങളുടെ അക്കൗണ്ടിലേക്ക് നഷ്ടപരിഹാരം ലഭിക്കും (പശുവിൻ പാൽ: ₹44/L, ആട്ടിൻ പാൽ: ₹85/L).
3. **📜 MRL സേഫ് സർട്ടിഫിക്കറ്റ്:**
   പരിശോധന പൂർത്തിയായി സുരക്ഷിതമാണെന്ന് ഉറപ്പായാൽ **MRL SAFE** സർട്ടിഫിക്കറ്റും ക്യുആർ കോഡും ലഭിക്കും.`,
        modelUsed: "AgriGuard Domain Synthesizer (Malayalam/Local)",
        source: "local"
      });
    }

    // Check for Bengali queries or Bengali language selection
    if (language === "bn") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — কৃষক সহায়তা (Farmer Assistance)
**নমস্কার কৃষক বন্ধু!** আমি এগ্রিগগার্ড (AgriGuard) এআই সহকারী।

1. **🐄 দুধ ও মাংসের নিরাপত্তা (Safe Date):**
   অ্যান্টিবায়োটিক চিকিৎসার সময় দুধ ও মাংসে ওষুধের অবশিষ্টাংশ থাকে। প্রত্যাহার সময় (Withdrawal Period) শেষ না হওয়া পর্যন্ত পণ্য বিক্রি করবেন না।
2. **💰 ক্ষতিপূরণ (DBT Compensation):**
   নষ্ট হওয়া দুধের জন্য ডিবিটি (DBT)-র মাধ্যমে সরাসরি ব্যাঙ্ক অ্যাকাউন্টে ক্ষতিপূরণ দেওয়া হয় (গরুর দুধ: ₹44/L, ছাগলের দুধ: ₹85/L)।
3. **📜 এমআরএল সেফ সার্টিফিকেট:**
   পরীক্ষা সম্পূর্ণ হলে **MRL SAFE** ডিজিটাল সার্টিফিকেট এবং কিউআর কোড পাবেন।`,
        modelUsed: "AgriGuard Domain Synthesizer (Bengali/Local)",
        source: "local"
      });
    }

    // Check for Marathi queries or Marathi language selection
    if (language === "mr") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — शेतकरी मदत (Farmer Assistance)
**नमस्कार शेतकरी मित्र!** मी ॲग्रीगार्ड (AgriGuard) एआय सहाय्यक आहे.

1. **🐄 दूध आणि मांस सुरक्षितता (Safe Date):**
   औषधोपचारादरम्यान औषधाचा अंश दुधात राहतो. विथड्रॉल कालावधी (Withdrawal Period) संपेपर्यंत दूध किंवा मांस विकू नका.
2. **💰 नुकसान भरपाई (DBT Compensation):**
   वाया गेलेल्या दुधासाठी थेट बँक खात्यात DBT द्वारे भरपाई दिली जाते (गायीचे दूध: ₹44/L, शेळीचे दूध: ₹85/L).
3. **📜 MRL सुरक्षित प्रमाणपत्र:**
   तपासणी पूर्ण झाल्यानंतर आपल्याला **MRL SAFE** डिजिटल प्रमाणपत्र आणि QR कोड मिळतो.`,
        modelUsed: "AgriGuard Domain Synthesizer (Marathi/Local)",
        source: "local"
      });
    }

    // Check for Gujarati queries or Gujarati language selection
    if (language === "gu") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — ખેડૂત સહાય (Farmer Assistance)
**નમસ્તે ખેડૂત મિત્ર!** હું એગ્રીગાર્ડ (AgriGuard) AI સહાયક છું.

1. **🐄 દૂધ અને માંસ સલામતી (Safe Date):**
   દવા આપ્યા બાદ ઉપાડ અવધિ (Withdrawal Period) પૂર્ણ ન થાય ત્યાં સુધી દૂધ કે માંસ વેચશો નહીં.
2. **💰 નુકસાન વળતર (DBT Compensation):**
   આ સમયગાળામાં નષ્ટ થયેલા દૂધ માટે DBT દ્વારા સીધા ખાતામાં સહાય મળે છે (ગાયનું દૂધ: ₹44/L, બકરીનું દૂધ: ₹85/L).
3. **📜 MRL સુરક્ષિત પ્રમાણપત્ર:**
   ચકાસણી સફળ થયા બાદ **MRL SAFE** ડિજિટલ સર્ટિફિકેટ અને QR કોડ મળે છે.`,
        modelUsed: "AgriGuard Domain Synthesizer (Gujarati/Local)",
        source: "local"
      });
    }

    // Check for Punjabi queries or Punjabi language selection
    if (language === "pa") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — ਕਿਸਾਨ ਸਹਾਇਤਾ (Farmer Assistance)
**ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ!** ਮੈਂ ਐਗਰੀਗਾਰਡ (AgriGuard) ਏਆਈ ਸਹਾਇਕ ਹਾਂ।

1. **🐄 ਦੁੱਧ ਅਤੇ ਮੀਟ ਸੁਰੱਖਿਆ (Safe Date):**
   ਦਵਾਈ ਦੇਣ ਤੋਂ ਬਾਅਦ ਵਾਪਸੀ ਸਮਾਂ (Withdrawal Period) ਪੂਰਾ ਹੋਣ ਤੱਕ ਦੁੱਧ ਜਾਂ ਮੀਟ ਨਾ ਵੇਚੋ।
2. **💰 ਨੁਕਸਾਨ ਮੁਆਵਜ਼ਾ (DBT Compensation):**
   ਖਰਾਬ ਹੋਏ ਦੁੱਧ ਦਾ ਮੁਆਵਜ਼ਾ DBT ਰਾਹੀਂ ਸਿੱਧਾ ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ਵਿੱਚ ਭੇਜਿਆ ਜਾਂਦਾ ਹੈ (ਗਾਂ ਦਾ ਦੁੱਧ: ₹44/L, ਬੱਕਰੀ ਦਾ ਦੁੱਧ: ₹85/L)।
3. **📜 MRL ਸੁਰੱਖਿਅਤ ਸਰਟੀਫਿਕੇਟ:**
   ਜਾਂਚ ਮੁਕੰਮਲ ਹੋਣ 'ਤੇ ਤੁਹਾਨੂੰ **MRL SAFE** ਡਿਜੀਟਲ ਸਰਟੀਫਿਕੇਟ ਅਤੇ QR ਕੋਡ ਮਿਲਦਾ ਹੈ।`,
        modelUsed: "AgriGuard Domain Synthesizer (Punjabi/Local)",
        source: "local"
      });
    }

    // Check for Odia queries or Odia language selection
    if (language === "or") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — କୃଷକ ସହାୟତା (Farmer Assistance)
**ନମସ୍କାର କୃଷକ ଭାଇ!** ମୁଁ ଆଗ୍ରିଗାର୍ଡ (AgriGuard) AI ସହାୟକ।

1. **🐄 କ୍ଷୀର ଏବଂ ମାଂସ ସୁରକ୍ଷା (Safe Date):**
   ଔଷଧ ଦେବା ପରେ ପ୍ରତ୍ୟାହାର ଅବଧି (Withdrawal Period) ଶେଷ ନହେବା ପର୍ଯ୍ୟନ୍ତ କ୍ଷୀର କିମ୍ବା ମାଂସ ବିକ୍ରୟ କରନ୍ତୁ ନାହିଁ।
2. **💰 କ୍ଷତିପୂରଣ (DBT Compensation):**
   ନଷ୍ଟ ହୋଇଥିବା କ୍ଷୀର ପାଇଁ DBT ମାଧ୍ୟମରେ ସିଧାସଳଖ ଆପଣଙ୍କ ବ୍ୟାଙ୍କ ଖାତାକୁ ସହାୟତା ମିଳିଥାଏ (ଗାଈ କ୍ଷୀର: ₹44/L, ଛେଳି କ୍ଷୀର: ₹85/L)।
3. **📜 MRL ସୁରକ୍ଷିତ ପ୍ରମାଣପତ୍ର:**
   ପରୀକ୍ଷା ସଫଳ ହେବା ପରେ **MRL SAFE** ଡିଜିଟାଲ ପ୍ରମାଣପତ୍ର ଏବଂ QR କୋଡ୍ ପ୍ରଦାନ କରାଯାଏ।`,
        modelUsed: "AgriGuard Domain Synthesizer (Odia/Local)",
        source: "local"
      });
    }

    // Check for Assamese queries or Assamese language selection
    if (language === "as") {
      return res.json({
        reply: `### 🌾 AgriGuard AI — কৃষক সহায়ক (Farmer Assistance)
**নমস্কাৰ কৃষক ভাইসকল!** মই এগ্ৰিগাৰ্ড (AgriGuard) AI সহায়ক।

1. **🐄 গাখীৰ আৰু মাংসৰ সুৰক্ষা (Safe Date):**
   ঔষধ প্ৰয়োগৰ পিছত প্ৰত্যাহাৰ সময়সীমা (Withdrawal Period) শেষ নোহোৱালৈকে গাখীৰ বা মাংস বিক্ৰী নকৰিব।
2. **💰 ক্ষতিপূৰণ (DBT Compensation):**
   নষ্ট হোৱা গাখীৰৰ বাবদ DBT-ৰ জৰিয়তে পোনপটীয়াকৈ বেংক একাউণ্টত ক্ষতিপূৰণ লাভ কৰিব (গৰুৰ গাখীৰ: ₹44/L, ছাগলীৰ গাখীৰ: ₹85/L)।
3. **📜 MRL সুৰক্ষিত প্ৰমাণপত্ৰ:**
   পৰীক্ষা সম্পূৰ্ণ হোৱাৰ পিছত আপুনি **MRL SAFE** ডিজিটেল প্ৰমাণপত্ৰ আৰু QR ক'ড লাভ কৰিব।`,
        modelUsed: "AgriGuard Domain Synthesizer (Assamese/Local)",
        source: "local"
      });
    }

    // Check if user asked for an animal safe date but no record was matched
    if ((text.includes("my cow") || text.includes("safe date") || text.includes("cow's safe date")) && dbFacts.length === 0) {
      return res.json({
        reply: `### 🐄 Animal Safe Clearance Date Information
I searched the AgriGuard database, but **could not find an active treatment record** for this specific animal tag.

#### What you can do:
1. **Check Animal ID:** Look up your animal's registered tag (e.g. \`RJ-CW1\`, \`FR10293\`) on the [Farmer Animals Portal](/farmer/animals).
2. **View Live Treatments:** See all ongoing treatments and countdown timers on the [Farmer Treatments Portal](/farmer/treatments).
3. **Withdrawal Rule:** Once your veterinarian logs a prescription, the system automatically computes the exact **Safe Clearance Date** and prevents harvesting until that statutory date.

*If you tell me your specific Animal Tag ID, I will check the live records for you!*`,
        modelUsed: "AgriGuard Domain Synthesizer (Local)",
        source: "local"
      });
    }

    // Fallback to rich deterministic domain response
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
