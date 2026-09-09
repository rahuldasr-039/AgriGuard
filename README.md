# 🛡️ AgriGuard (SIH25007): AI & Blockchain-Powered Digital Farm Management System

> **An enterprise-grade, decentralized platform for Antimicrobial Usage (AMU) surveillance, Maximum Residue Limit (MRL) enforcement, statutory withdrawal tracking, and direct benefit transfer (DBT) compensation for livestock producers.**

[![Solidity](https://img.shields.io/badge/Solidity-0.8.19-363636.svg?style=flat&logo=solidity)](https://soliditylang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B%20%7C%2020%2B%20%7C%2024%2B-339933.svg?style=flat&logo=node.js)](https://nodejs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black.svg?style=flat&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB.svg?style=flat&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38B2AC.svg?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.14+-2D3748.svg?style=flat&logo=prisma)](https://prisma.io/)
[![Flutter](https://img.shields.io/badge/Flutter-3.x-02569B.svg?style=flat&logo=flutter)](https://flutter.dev/)
[![Google Gemini](https://img.shields.io/badge/Google_Gemini-2.0_Flash-4285F4.svg?style=flat&logo=google)](https://ai.google.dev/)
[![Hardhat](https://img.shields.io/badge/Hardhat-Ethereum-yellow.svg?style=flat&logo=ethereum)](https://hardhat.org/)

---

## 📋 Table of Contents
1. [Project Overview & Problem Statement](#-project-overview--problem-statement)
2. [High-Level Architecture](#-high-level-architecture)
3. [End-to-End Workflow](#-end-to-end-workflow)
4. [Key Stakeholders & Role Portals](#-key-stakeholders--role-portals)
5. [PART 1 — FSSAI Payment Monitoring Area](#-part-1--fssai-payment-monitoring-area)
6. [PART 2 — Veterinarian Dynamic Medicine & Immunization Module](#-part-2--veterinarian-dynamic-medicine--immunization-module)
7. [PART 3 — Universal 1-Click Multi-Portal Navigation](#-part-3--universal-1-click-multi-portal-navigation)
8. [PART 4 — Dedicated Farmer Subsidy Portal & Ledger](#-part-4--dedicated-farmer-subsidy-portal--ledger)
9. [PART 5 — Hybrid Generative AI (Gen AI) Intelligence Subsystem](#-part-5--hybrid-generative-ai-gen-ai-intelligence-subsystem)
10. [PART 6 — MRL-Safe Digital Certification, QR Verification & Premium Pricing](#-part-6--mrl-safe-digital-certification-qr-verification--premium-pricing)
11. [PART 7 — Farm Tester Analytical Suite & Statutory MRL Library](#-part-7--farm-tester-analytical-suite--statutory-mrl-library)
12. [Withdrawal Waste & Statutory AI Valuation Benchmarks](#-withdrawal-waste--statutory-ai-valuation-benchmarks)
13. [Core Deterministic & AI Engines](#-core-deterministic--ai-engines)
14. [Smart Contract & Blockchain Security](#-smart-contract--blockchain-security)
15. [Database Schema & Entity Models](#-database-schema--entity-models)
16. [Complete REST API Catalog](#-complete-rest-api-catalog)
17. [Monorepo Directory Structure](#-monorepo-directory-structure)
18. [Installation & Local Setup](#-installation--local-setup)
19. [Default Seed Credentials](#-default-seed-credentials)
20. [Testing & Verification Proofs](#-testing--verification-proofs)
21. [Cloud Deployment Guide](#-cloud-deployment-guide)

---

## 🎯 Project Overview & Problem Statement

### The Problem (SIH Problem Statement SIH25007)
The routine, indiscriminate administration of antimicrobials in food-producing animals is one of the primary global drivers of **Antimicrobial Resistance (AMR)**. When treated animals or their products (milk, eggs, meat) are harvested before the statutory **withdrawal period** has elapsed, harmful drug residues enter the human food supply:
- **Residue Toxicity:** Direct physiological harm, allergic anaphylaxis, and carcinogenicity.
- **AMR Selection Pressure:** Resistant bacteria enter the food chain, rendering frontline antibiotics ineffective in clinical medicine.
- **Economic Dilemma for Farmers:** Livestock producers face severe economic losses if they discard produce during mandatory withdrawal windows. Without transparent, verifiable compensation mechanisms, farmers are financially incentivized to bypass withdrawal mandates and sell contaminated produce.

### The AgriGuard Solution
**AgriGuard** provides an end-to-end, cryptographic, and automated compliance ecosystem designed for the **Food Safety and Standards Authority of India (FSSAI)**, state animal husbandry departments, veterinary practitioners, accredited testing laboratories, and livestock producers:
1. **Automated Withdrawal Calculation:** Dynamically calculates statutory withholding days based on species, administered antimicrobial, dosage, route, and target food matrix.
2. **Immutable On-Chain Ledger:** Every prescription, vaccination, and lab test is cryptographically hashed (`Keccak-256` / `SHA-256`) and anchored to an Ethereum smart contract (`TreatmentLedger.sol`) on the Sepolia testnet.
3. **MRL Chemical Testing Surveillance:** Accredited laboratories submit mass spectrometry assay results, which are automatically verified against statutory FSSAI Gazette schedules and Codex Alimentarius Maximum Residue Limits.
4. **Statutory Waste Compensation & Direct Benefit Transfer (DBT):** Fair-market compensation is evaluated by an AI pricing engine for discarded produce during active withdrawal periods. Regulators review and disburse payments directly via the **PFMS / NPCI-Aadhaar DBT Bridge**, removing the financial incentive for early harvesting.
5. **Full Multi-Role Portal Suite:** Distinct, purpose-built interfaces for Regulators, Veterinarians, Farmers, and Testers with instant 1-click role transitions.
6. **MRL-Safe Digital Certification & Consumer QR Verification:** Weekly compliance cycles designate verified farms as `🟢 MRL SAFE`, unlocking commercial premium market pricing via a public, fraud-proof digital verification seal.

---

## 🏗️ High-Level Architecture

```mermaid
flowchart TD
    subgraph Clients["Frontend Client Layer"]
        WD["Next.js 16 Web Dashboard\n(Regulator, Vet, Tester, Farmer Portals)"]
        MA["Flutter Cross-Platform Mobile App\n(Offline Field Logging & RFID Scanner)"]
    end

    subgraph Gateway["API & Security Layer"]
        AUTH["JWT / RBAC Middleware\n(REGULATOR, VET, FARMER, TESTER)"]
        CORS["CORS & Request Sanitizer"]
    end

    subgraph Engines["Core Micro-Engines"]
        WE["Withdrawal Calculation Engine\n(Pharmacokinetic Benchmark Mapping)"]
        MRLE["MRL Analysis Engine\n(FSSAI & Codex Statutory Limits)"]
        PE["AI Fair-Market Pricing Engine\n(Commodity Benchmark Valuation)"]
        AIE["Gemini 2.0 AI Assistant & Domain Synthesizer\n(Pharmacovigilance & Explainability)"]
        CE["Certificate & State-Machine Engine\n(Two-Step Verification & Dynamic Expiry)"]
        BB["Web3 Blockchain Bridge\n(Ethers.js / Hardhat / Sepolia)"]
    end

    subgraph Data["Persistence Layer"]
        PRISMA["Prisma ORM"]
        DB[("PostgreSQL / SQLite Database\n(Livestock, Treatments, Claims, Tests, Certs)")]
    end

    subgraph Blockchain["Decentralized Trust Layer"]
        SC["TreatmentLedger.sol Smart Contract\n(Sepolia Testnet / Hardhat)"]
    end

    WD -->|REST / JSON| Gateway
    MA -->|REST / JSON| Gateway
    Gateway --> AUTH
    AUTH --> Engines
    WE --> PRISMA
    MRLE --> PRISMA
    PE --> PRISMA
    AIE --> PRISMA
    CE --> PRISMA
    BB -->|JSON-RPC Tx Sign| SC
    PRISMA --> DB
```

---

## 🔄 End-to-End Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as Livestock Farmer
    actor Vet as Certified Veterinarian
    actor Tester as Farm Tester / Lab
    actor Reg as FSSAI Regulator
    participant System as AgriGuard Engines
    participant BC as Sepolia Smart Contract

    Note over Farmer,Reg: 1. Registration & Asset Onboarding
    Farmer->>System: Registers farm, logs RFID tags (Cow, Goat, Pig) & batch flocks (Poultry, Fish)
    Vet->>System: Onboards with veterinary council registration; approved by Regulator

    Note over Vet,BC: 2. Veterinary Prescription & Dynamic Drug Selection
    Vet->>System: Selects animal category (7 species) -> dropdown dynamically filters to approved drugs
    System->>System: Validates (species, drug) pair; rejects invalid combinations with HTTP 400
    System->>System: Withdrawal Engine computes mandatory withdrawal hold days & safe-from date
    System->>System: Sets animal status to 'WITHDRAWAL ACTIVE'
    System->>BC: Writes Keccak-256 cryptographic proof to TreatmentLedger.sol

    Note over Farmer,System: 3. Withdrawal Period Monitoring
    Farmer->>System: Checks live withdrawal calendar on Farmer Dashboard (SAFE vs WAIT)
    System-->>Farmer: Blocks harvesting/sale until statutory safe date elapses

    Note over Tester,Reg: 4. Lab Chemical Testing & MRL Verification
    Tester->>System: Samples product (milk/meat), enters chemical assay concentrations (ppm)
    System->>System: MRL Engine evaluates test against statutory FSSAI limits
    alt MRL Limit Exceeded
        System->>Reg: Dispatches Critical MRL Violation Alert
        Reg->>Farmer: Sends regulatory quarantine order & violation notice
    end
    System->>BC: Logs test verification hash on-chain

    Note over Tester,Reg: 5. Withdrawal Waste Claim & AI Compensation
    Tester->>System: Records discarded withdrawal produce (Goat Meat, Milk, Goat Milk, Chicken)
    System->>System: Pricing Engine evaluates fair market compensation using statutory benchmark rates
    System->>System: Creates claim citation (WST-XXXXXX) with status 'PENDING FSSAI APPROVAL'

    Note over Reg,Farmer: 6. FSSAI Payment Disbursal & DBT Settlement
    Reg->>System: Audits claim in 6-column FSSAI Payment Monitoring Table
    Reg->>System: Clicks 'Pay Subsidy' -> confirms DBT payment modal
    System->>System: Simulates PFMS / Aadhaar DBT Gateway transfer -> issues ref DBT-XXXXXXXX
    System->>System: Updates status to 'DISBURSED (PAID)' and sets Amount Received

    Note over Reg,Farmer: 7. Weekly MRL-Safe Certification & Public QR
    Reg->>System: Reviews weekly farm compliance evidence (AMU, tests, withholdings)
    Reg->>System: Approves certification (Step 1) and designates MRL SAFE (Step 2)
    System->>System: Generates Keccak-256 proof, verification ID (AGV-XXXXXX), and dynamic QR
    Farmer->>System: Accesses official MRL Certificate (/farmer/certificate)
    Note over Farmer,Tester: 8. Buyer / Consumer Verification
    Farmer->>System: Consumer or procurement buyer scans QR code
    System-->>Farmer: Displays Public Zero-Auth Verification Card (🟢 MRL SAFE, Premium Eligible)
```

---

## 👥 Key Stakeholders & Role Portals

| Role | Portal Path | Primary Capabilities |
| :--- | :--- | :--- |
| **🏛️ FSSAI National Regulator** | `/`, `/regulator/certify`, `/regulator/waste-subsidy`, `/regulator/traceability`, `/regulator/vets`, `/regulator/testers`, `/regulator/farmers`, `/alerts`, `/compliance`, `/mrl-reports`, `/amu-logs` | National AMU surveillance, MRL violation alerts, stakeholder approvals, withdrawal waste & subsidy surveillance via the **standardized 6-column table**, direct DBT disbursement execution, **two-step weekly MRL certification**, and immutable blockchain audit trail inspection. |
| **🩺 Certified Veterinarian** | `/vet`, `/vet/medicine`, `/vet/vaccinate`, `/vet/amu`, `/vet/farmers` | Prescribe statutory antimicrobials with **dynamic animal-wise drug filtering across 7 species**, automated withdrawal calculation, **immunization & vaccination digital passports**, blockchain proof anchoring, and linked farmer herd management. |
| **🌾 Livestock Farmer** | `/farmer`, `/farmer/certificate`, `/farmer/subsidies`, `/farmer/animals`, `/farmer/withdrawals`, `/farmer/treatments` | Herd inventory (RFID ear tags & flock batches), real-time withdrawal calendar (SAFE vs WAIT), **official MRL Digital Certificate with verifiable QR**, **dedicated Subsidies & DBT ledger** with dates produced, payment status, transaction IDs, and printable official DBT vouchers. |
| **🧪 Farm Tester / Lab** | `/tester`, `/tester?tab=waste`, `/tester/waste`, `/tester/new-test`, `/tester/mrl`, `/tester/history` | Product testing, automated MRL pass/fail evaluation, withdrawal waste recording with dynamic 3-tier livestock selector, **interactive Statutory MRL Chemical Reference Library**, AI fair-market compensation recommendation, and lab report generation. |
| **🤖 AI Pharmacovigilance Assistant** | `/ai-assistant` | Gemini 2.0 Flash-powered multi-tool hub for antimicrobial withdrawal guidelines, MRL legal limits, risk scoring, clinical safety checks, executive briefings, and 5-language native Kisan advisory. |
| **🌐 General Public / Buyers** | `/certify/verify/:verificationId` | **Public Zero-Authentication QR Landing Page** for consumers, cooperatives, and commercial buyers to instantly authenticate farm chemical safety and premium off-take eligibility. |

---

## 💳 PART 1 — FSSAI Payment Monitoring Area

The **FSSAI Payment Monitoring Table** is deployed across both the dedicated regulator portal ([`/regulator/waste-subsidy`](http://localhost:3000/regulator/waste-subsidy)) and the main regulator dashboard ([`http://localhost:3000/`](http://localhost:3000/)).

### The 6 Required Columns
The table strictly displays these 6 columns:

| Column # | Column Name | Source Field | Description | Example Values |
| :---: | :--- | :--- | :--- | :--- |
| **1** | **Farmer ID** | `claim.farmerId` | Beneficiary livestock producer receiving statutory subsidy | `FR10293` |
| **2** | **Product** | `claim.productType` | Agricultural commodity withheld during withdrawal quarantine | `Goat Meat`, `Goat Milk`, `Chicken`, `Milk` |
| **3** | **Waste Amount** | `claim.wasteAmount` + `unit` | Total volume/quantity produced and withheld | `15 kg`, `20 L`, `35 kg`, `30 L` |
| **4** | **Subsidy Amount** | `claim.aiRecommendedAmount` | AI-evaluated fair-market compensation amount in INR | `₹10,800`, `₹1,700`, `₹5,250`, `₹1,320` |
| **5** | **Payment Process** | `claim.status` | Real-time lifecycle stage (**Pending → Processing → Paid**) | `Pending` (with Pay button) / `Paid` |
| **6** | **Amount Received** | Computed Disbursed Sum | Actual monetary sum disbursed to the farmer's linked account | `₹0` (Unpaid) or `₹10,800` (Paid) |

### Live Verified Database Records

```text
┌─────────┬───────────┬─────────────┬──────────────┬────────────────┬─────────────────┬─────────────────┐
│ (index) │ Farmer ID │ Product     │ Waste Amount │ Subsidy Amount │ Payment Process │ Amount Received │
├─────────┼───────────┼─────────────┼──────────────┼────────────────┼─────────────────┼─────────────────┤
│ 0       │ 'FR10293' │ 'Goat Milk' │ '20 L'       │ '₹1,700'       │ 'Pending'       │ '₹0'            │
│ 1       │ 'FR10293' │ 'Goat Meat' │ '15 kg'      │ '₹10,800'      │ 'Paid'          │ '₹10,800'       │
│ 2       │ 'FR10293' │ 'Chicken'   │ '35 kg'      │ '₹5,250'       │ 'Pending'       │ '₹0'            │
│ 3       │ 'FR10293' │ 'Milk'      │ '30 L'       │ '₹1,320'       │ 'Paid'          │ '₹1,320'        │
│ 4       │ 'FR10293' │ 'Milk'      │ '30 L'       │ '₹1,320'       │ 'Pending'       │ '₹0'            │
└─────────┴───────────┴─────────────┴──────────────┴────────────────┴─────────────────┴─────────────────┘
```

### Direct Benefit Transfer (DBT) Disbursement Flow
1. **Regulator Review:** Regulator navigates to `/regulator/waste-subsidy` and locates an unpaid record with status `Pending`.
2. **Payment Trigger:** Clicks the inline <kbd>💳 Pay Subsidy</kbd> button.
3. **DBT Confirmation Modal:** Displays verified Farmer ID, commodity type, quantity, assessed amount, and statutory reference.
4. **Disbursement Execution:** The frontend issues `PATCH /api/v1/testers/waste-claims/:id/disburse`.
5. **Settlement Simulation:** The backend simulates settlement via **PFMS / NPCI-Aadhaar DBT Bridge**, assigns an official transaction reference (`DBT-XXXXXXXX`), transitions status to `DISBURSED (PAID)`, and updates **Amount Received** from `₹0` to the full subsidy amount.

---

## 🩺 PART 2 — Veterinarian Dynamic Medicine & Immunization Module

Located at [`/vet/medicine`](http://localhost:3000/vet/medicine) and [`/vet/vaccinate`](http://localhost:3000/vet/vaccinate), this module prevents the off-label, unapproved prescription of antimicrobials and provides official immunization digital records.

### Approved Drug Mapping Across All 7 Species

| # | Animal Category | Approved Antimicrobial Medicines | Primary Delivery Route | Statutory Hold |
| :-: | :--- | :--- | :--- | :---: |
| **1** | **Chicken / Poultry** | • Oxytetracycline<br>• Chlortetracycline<br>• Doxycycline<br>• Amoxicillin<br>• Ampicillin<br>• Enrofloxacin | Oral (Medicated Feed / Drinking Water) | 7 – 10 Days |
| **2** | **Pig / Swine** | • Tylosin<br>• Tiamulin<br>• Oxytetracycline<br>• Amoxicillin<br>• Apramycin<br>• Neomycin | Oral / Intramuscular (IM) | 7 – 14 Days |
| **3** | **Prawn / Shrimp** | • Oxytetracycline<br>• Erythromycin<br>• Florfenicol | Immersion Bath / Medicated Feed | 14 – 21 Days |
| **4** | **Fish** | • Oxytetracycline<br>• Florfenicol<br>• Sulfadiazine + Trimethoprim | Medicated Pelleted Feed | 10 – 21 Days |
| **5** | **Cow / Cattle** | • Procaine Penicillin G<br>• Ceftiofur<br>• Tulathromycin<br>• Tilmicosin<br>• Oxytetracycline | Intramuscular (IM) / Subcutaneous (SC) | 4 – 28 Days |
| **6** | **Goat** | • Penicillin G + Streptomycin<br>• Oxytetracycline<br>• Enrofloxacin | Intramuscular (IM) / Subcutaneous (SC) | 5 – 10 Days |
| **7** | **Sheep** | • Penicillin G + Streptomycin<br>• Oxytetracycline<br>• Enrofloxacin | Intramuscular (IM) / Subcutaneous (SC) | 5 – 10 Days |

### Dual-Layer Validation Architecture
1. **Frontend Dynamic Filtering:** Selecting an animal category instantly re-filters the dropdown and quick-select pills. Unapproved drugs are completely removed from the selection DOM.
2. **Backend Guard (`POST /api/v1/treatments`):** Validates the `(animalType, medicineName)` pair before saving to database. Any attempt to prescribe an unapproved pair is rejected with **HTTP 400 Bad Request** and an explicit error message:
   ```json
   {
     "error": "Invalid animal-medicine combination: 'Procaine Penicillin G' is not approved for 'Fish'. Approved medicines: Oxytetracycline, Florfenicol, Sulfadiazine + Trimethoprim"
   }
   ```
3. **Dynamic Catalog API:** `GET /api/v1/treatments/medicines?animalType=...` enables external clients and mobile apps to fetch approved drugs per species dynamically.

### Immunization & Vaccination Passport (`/vet/vaccinate`)
- **Endpoint:** `POST /api/v1/treatments/vaccinations`
- Logs preventative vaccinations (e.g. Foot-and-Mouth Disease Booster, Anthrax Spore Vaccine, Brucellosis S19).
- Generates an immutable **SHA-256 cryptographic record** (`recordType: "VACCINATION"`).
- Links seamlessly into the farmer's withdrawal calendar with a `0-day` withholding hold, designating immediate `SAFE` status.
- Features a **Live Immunization Certificate Preview** with digital health credential QR seals.

---

## 🔄 PART 3 — Universal 1-Click Multi-Portal Navigation

To facilitate rapid evaluation and live switching between roles without requiring manual logout/login cycles, AgriGuard features three persistent navigation mechanisms:

### 1. Persistent Top Header Switcher (All Screen Sizes)
In [Header.jsx](file:///c:/Users/ASHITH/Documents/SIH/SIH/web-dashboard/src/components/layout/Header.jsx), responsive quick-switch buttons appear permanently in the top bar:
- <kbd>🛡️ FSSAI Payment</kbd> &rarr; Auto-authenticates as FSSAI Regulator (`fssaigovt@gmail.com`) and navigates to [`/regulator/waste-subsidy`](http://localhost:3000/regulator/waste-subsidy).
- <kbd>🩺 Vet Medicine</kbd> &rarr; Auto-authenticates as Veterinarian (`vet1@example.com`) and navigates to [`/vet/medicine`](http://localhost:3000/vet/medicine).
- <kbd>🌾 Farmer</kbd> &rarr; Auto-authenticates as Farmer Rajesh (`farmer1@gmail.com`) and navigates to [`/farmer`](http://localhost:3000/farmer).

### 2. Left Sidebar "Portals & Modules" Quick-Access
In [Sidebar.jsx](file:///c:/Users/ASHITH/Documents/SIH/SIH/web-dashboard/src/components/layout/Sidebar.jsx), a dedicated shortcut section is permanently positioned above the blockchain status card, allowing 1-click switching from any page.

### 3. Farmer Dashboard Direct Shortcuts Banner
Prominently displayed below the welcome banner on [`/farmer`](http://localhost:3000/farmer) to direct users to the FSSAI payment area or Veterinarian medicine form.

---

## 🌾 PART 4 — Dedicated Farmer Subsidy Portal & Ledger

Accessible via **"Subsidies & DBT"** in the Farmer Sidebar or directly at [`http://localhost:3000/farmer/subsidies`](http://localhost:3000/farmer/subsidies), this portal provides the farmer with complete transparency over their statutory claims.

### Details Visible to the Farmer

```text
┌────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                          FARMER WITHDRAWAL WASTE SUBSIDIES & DBT LEDGER                                                │
├───────────────┬─────────────────┬─────────────────┬─────────────────┬──────────────────┬───────────────────────┬───────────────────────┤
│ Claim Ref     │ Date Produced   │ Product & Tag   │ Amount Produced │ Assessed Subsidy │ Payment Process       │ Amount Received       │
├───────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┼───────────────────────┼───────────────────────┤
│ WST-631500    │ 09 Sep 2026     │ Goat Meat       │ 15 kg           │ ₹10,800          │ DISBURSED (PAID)      │ ₹10,800               │
│               │                 │ (RJ-GT1)        │                 │                  │ Ref: DBT-85933634     │ (Bank Credited)       │
├───────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┼───────────────────────┼───────────────────────┤
│ WST-732818    │ 09 Sep 2026     │ Milk            │ 30 L            │ ₹1,320           │ DISBURSED (PAID)      │ ₹1,320                │
│               │                 │ (RJ-CW1)        │                 │                  │ Ref: DBT-15618262     │ (Bank Credited)       │
├───────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┼───────────────────────┼───────────────────────┤
│ WST-630342    │ 09 Sep 2026     │ Goat Milk       │ 20 L            │ ₹1,700           │ PENDING APPROVAL      │ ₹0                    │
│               │                 │ (RJ-GT2)        │                 │                  │ (Treasury Review)     │ (Pending)             │
├───────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┼───────────────────────┼───────────────────────┤
│ WST-868318    │ 09 Sep 2026     │ Chicken         │ 35 kg           │ ₹5,250           │ PENDING APPROVAL      │ ₹0                    │
│               │                 │ (RJ-CH-B1)      │                 │                  │ (Treasury Review)     │ (Pending)             │
├───────────────┼─────────────────┼─────────────────┼─────────────────┼──────────────────┼───────────────────────┼───────────────────────┤
│ WST-575899    │ 09 Sep 2026     │ Milk            │ 30 L            │ ₹1,320           │ PENDING APPROVAL      │ ₹0                    │
│               │                 │ (RJ-CW1)        │                 │                  │ (Treasury Review)     │ (Pending)             │
└───────────────┴─────────────────┴─────────────────┴─────────────────┴──────────────────┴───────────────────────┴───────────────────────┘
```

### Key Features of the Farmer Subsidies Portal
1. **Financial Metric Cards:**
   - **Total Claims:** `5 Claims recorded`
   - **Total Entitlement:** `₹20,390 assessed value`
   - **Amount Disbursed (Paid):** `₹12,120 successfully transferred`
   - **Pending Treasury Allocation:** `₹8,270 in review`
2. **Interactive Search & Status Filter:** Filter between `All Claims`, `Disbursed (Paid)`, and `Pending FSSAI Approval`.
3. **Official Printable DBT Voucher Modal:** Clicking **"View Receipt"** on any claim opens an official **Government of India — FSSAI Direct Benefit Transfer Voucher** displaying:
   - Beneficiary Farmer Name & ID (`RAJESH / FR10293`)
   - Disposal & Withholding Date
   - Commodity & Animal Tag ID
   - Assessed Subsidy Rate & Net Credited Sum
   - DBT Transaction Reference ID (`DBT-85933634`)
   - Payment Gateway (`PFMS / Aadhaar DBT Gateway`)
   - Inspecting Laboratory & Tester Citation (`Tester 1 / FT72B91K1`)
   - Clinical Reason for Quarantine
   - **1-Click "Print Voucher" button**

---

## 🤖 PART 5 — Hybrid Generative AI (Gen AI) Intelligence Subsystem

AgriGuard integrates an enterprise **Hybrid Generative AI Engine** designed to eliminate antibiotic misuse, accelerate regulatory decision-making, and assist livestock farmers in regional Indian languages.

```mermaid
graph TD
    User([User: Vet / Regulator / Tester / Farmer]) --> UI[Web Dashboard / Floating Copilot]
    UI --> APIRouter["Backend /api/v1/ai Router"]
    
    Dispatcher{Gemini Key Valid?}
    APIRouter --> Dispatcher
    
    Dispatcher -- "Yes (Cloud Scale)" --> Gemini["Google Gemini 2.0 Flash / 1.5 Flash\n(@google/genai SDK)"]
    Dispatcher -- "No / Offline (Zero-Config)" --> Local["AgriGuard Domain Synthesizer\n(Embedded Indian Agro-Pharmacology Engine)"]
    
    Gemini & Local --> Output["Structured Output:\n• Clinical AMU Review\n• FSSAI Regulatory Briefing\n• MRL Toxicological Analysis\n• Multilingual Kisan Advisory (5 Languages)\n• Dynamic Waste Compensation"]
```

### 1. AgriGuard Gen AI Command Center (`/ai-assistant`)
A dedicated multi-tool hub located at [`http://localhost:3000/ai-assistant`](http://localhost:3000/ai-assistant) featuring:

| Module | Purpose | Target Persona | Key Capabilities |
| :--- | :--- | :--- | :--- |
| 💬 **Universal AI Chat** | Multi-turn conversational AI | All Stakeholders | Pharmacovigilance, MRL schedules, withdrawal hold formulas, Sepolia smart contracts, and agricultural science. Quick prompt chips included. |
| 🩺 **Vet Clinical Copilot** | AMU Prescription Safety Audit | Veterinarians | Evaluates species, drug, dosage, and route against WHO AWaRe classifications; returns AMR risk score, milk/meat withholding windows, and contraindications. |
| 🛡️ **FSSAI Executive Brief** | Regulatory Intelligence Generator | Regulators & FSSAI Directors | Synthesizes regional herd AMU, active quarantines, and DBT payout ledgers into a formal executive intelligence briefing. |
| 🔬 **MRL Lab Auditor** | Chromatographic Residue Analysis | Farm Testers & Lab Analysts | Compares LC-MS/MS analyte readings against statutory limits, generating toxicological evaluations and official clearance certificates. |
| 🌾 **Kisan Multilingual AI** | Native Language Farmer Advisory | Livestock Farmers | Delivers empathetic, plain-language explanations of withdrawal discards, animal care tips, and DBT compensation in **5 Indian languages** (Hindi, Tamil, Telugu, Kannada, English). |
| 🔑 **API Key & Engine Selector** | Live Engine Management | Evaluators & Admins | One-click toggle between live Google Gemini 2.0 Flash (with custom API key input stored locally) and the zero-config offline domain synthesizer. |

### 2. In-Workflow Gen AI Copilots Across Role Portals
Gen AI is deeply embedded directly inside daily operational workflows:
1. **Veterinarian Prescription Portal (`/vet/medicine`):** Veterinarians can click **"✨ Run Gen AI Safety Check"** before signing any prescription to receive an AMR safety rating, milk/meat holding hours, and farmer counseling notes.
2. **FSSAI Payment Monitoring Area (`/regulator/waste-subsidy`):** Regulators can click **"✨ Gen AI Audit Briefing"** in the table header to open an executive briefing modal with aggregated fiscal analytics, quarantine counts, and surveillance directives.
3. **Farmer Subsidies Portal (`/farmer/subsidies`):** Farmers can click **"🌾 Ask Kisan AI"** to open an interactive multilingual modal with instant language switching (`हिंदी`, `English`, `ಕನ್ನಡ`, `தமிழ்`, `తెలుగు`).
4. **Universal Header & Sidebar:** Direct shortcut badges are visible across every page, and the floating chatbot widget provides 1-click full-screen expansion.

---

## 🎖️ PART 6 — MRL-Safe Digital Certification, QR Verification & Premium Pricing

> **Core Axiom:** *Compliance should not merely be a punishment; verified compliance must unlock an immediate, high-value premium market opportunity.*

AgriGuard transforms statutory compliance into economic advantage through a **weekly digital certification protocol**. Livestock producers verified through the AgriGuard workflow receive an official **FSSAI MRL-Safe Digital Certificate** with a cryptographically verifiable QR code, enabling food processors, dairy cooperatives, and discerning consumers to authenticate chemical safety in real time.

```text
FARMER
   ↓
FSSAI REGULATORY REVIEW
   ↓
CERTIFICATION APPROVAL (Step 1)
   ↓
FSSAI SETS MRL STATUS (Step 2)
   ↓
┌─────────────────────────────────┐
│                                 │
🟢 MRL SAFE                    🔴 MRL NOT SAFE
│                                 │
└───────────────┬─────────────────┘
                ↓
    OFFICIAL DIGITAL CERTIFICATE
                ↓
     DYNAMIC UNIQUE QR CODE
                ↓
    PUBLIC ZERO-AUTH VERIFICATION
                ↓
   PREMIUM MARKET ACCESS ELIGIBILITY
```

### 1. Strict Two-Step State Machine Enforcement
To eliminate administrative corruption and prevent premature or unauthorized status assignment, the backend strictly enforces a two-step state machine:

```text
               ┌──────────────┐
               │   PENDING    │
               └──────┬───────┘
                      │
           ┌──────────┴──────────┐
           ▼                     ▼
     ┌───────────┐         ┌───────────┐
     │ APPROVED  │         │ REJECTED  │
     └─────┬─────┘         └───────────┘
           │ (Unlocks Step 2)
     ┌─────┴─────┐
     ▼           ▼
  🟢 SAFE     🔴 UNSAFE
```

| State Transition | Permitted? | Backend Rule & Validation |
| :--- | :---: | :--- |
| `PENDING ➔ APPROVED` | ✅ **YES** | FSSAI Regulator validates AMU logs, active withholdings, and lab assays. |
| `PENDING ➔ REJECTED` | ✅ **YES** | FSSAI Regulator flags non-compliance, missing records, or unrecorded AMU. |
| `PENDING ➔ SAFE` | ❌ **BLOCKED** | **HTTP 400 Bad Request:** *"Certificate must be approved before MRL status can be set."* |
| `PENDING ➔ UNSAFE` | ❌ **BLOCKED** | **HTTP 400 Bad Request:** *"Certificate must be approved before MRL status can be set."* |
| `APPROVED ➔ SAFE` | ✅ **YES** | Regulator designates MRL Safe; generates Keccak-256 blockchain proof and QR payload. |
| `APPROVED ➔ UNSAFE` | ✅ **YES** | Designated when active residues exceed MRL limits; produce quarantine triggered. |
| `* ➔ EXPIRED` | ✅ **AUTO** | Dynamic evaluation when `currentDate > validUntil` (weekly validity elapses). |

- **Farmer Self-Modification:** Blocked with **HTTP 403 Forbidden**. Farmers cannot alter approval or MRL status.
- **Non-Regulator Execution:** Blocked with **HTTP 403 Forbidden**. Only authorized FSSAI regulators can sign approvals and set statuses.

---

### 2. Weekly Validity & Dynamic Expiry Protection
Certificates operate on a statutory **7-day weekly cycle** (`validFrom` to `validUntil`):
- **Real-Time Dynamic Evaluation:** Whenever a certificate or QR code is verified, the system dynamically checks `now > validUntil`.
- **Zero Counterfeit Staleness:** If a weekly cycle has elapsed, the status instantly returns `EXPIRED` and `mrlStatus = NOT_SET`.
- **Public Protection:** A scanned QR code from last week will **NEVER** falsely display `🟢 MRL SAFE`. It clearly renders `⚪ CERTIFICATE EXPIRED`.

---

### 3. FSSAI Regulator Certify Module (`/regulator/certify`)
Accessible via **"MRL Certification"** in the Regulator Sidebar or directly at [`http://localhost:3000/regulator/certify`](http://localhost:3000/regulator/certify):
1. **Executive KPI Overview:** Real-time counters for Total Farmers, Pending Review (🟡), MRL SAFE (🟢), MRL NOT SAFE (🔴), and Expired Certificates (⚪).
2. **Search & Filter Table:** Instant filtering by farmer name, ID (`FR10293`), farm, or compliance category.
3. **Comprehensive Evidence Drawer:**
   - **Veterinary Treatment History:** Medicine name, active ingredient, dosage, and administering veterinarian.
   - **Active Statutory Withholdings:** Real-time countdowns of animals under withdrawal quarantine.
   - **Accredited Laboratory Assays:** Mass spectrometry LC-MS/MS test readings from accredited testers.
4. **Two-Step Authorization Workflow:**
   - **Step 1:** Click `[APPROVE CERTIFICATION]` or `[REJECT]`. Status toggle remains locked until approved.
   - **Step 2:** Unlocks `🟢 MRL SAFE` or `🔴 MRL NOT SAFE`, custom validity dates, and regulatory notes.
   - **Confirmation Modal:** Final sign-off summary with approving regulator credentials and blockchain proof generation.
   - **Immutable Audit Trail:** Chronological timeline of all regulatory decisions (`CREATED`, `APPROVED`, `SAFE_SET`, `UNSAFE_SET`).

---

### 4. Dedicated Farmer MRL Certificate Portal (`/farmer/certificate`)
Accessible via **"My MRL Certificate"** in the Farmer Sidebar or directly at [`http://localhost:3000/farmer/certificate`](http://localhost:3000/farmer/certificate):
1. **Dynamic State Rendering:**
   - **Pending:** Shows `⏳ PENDING` card informing the farmer that FSSAI review is underway. QR verification is withheld.
   - **MRL Safe:** Renders official **AgriGuard MRL Digital Certificate** with FSSAI insignia, dynamic farmer data, `🟢 MRL SAFE` badge, Keccak-256 hash, and high-resolution QR code.
   - **MRL Not Safe:** Displays `🔴 MRL NOT SAFE` warning banner advising immediate withdrawal compliance and directing the farmer to the statutory DBT compensation portal.
   - **Expired:** Shows renewal prompt with `1-Click Request Weekly Certification Review`.
2. **MRL-Safe Market Status & Commercial Incentive:**
   - Highlights **Premium Market Eligibility: YES (ACTIVE)** with estimated `8% – 15%` market premium.
   - Built-in **Download / Print Certificate PDF** button.
3. **Certification History Ledger:** Complete historical table tracking every past weekly certificate, validity dates, approving officers, and direct verification links.

---

### 5. Public Zero-Auth QR Code Verification (`/certify/verify/:verificationId`)
Accessible publicly by consumers, procurement officers, and dairy cooperatives scanning the physical or digital QR code:
- **No Login Required:** Instant mobile-responsive web view for field and retail verification.
- **Dynamic URL Architecture:** Embeds `/certify/verify/AGV-XXXXXX` (not static data), ensuring status updates and expirations reflect immediately.
- **Verification Cards:**
  - `🟢 VERIFIED MRL SAFE`: Producer name, farm, validity window, approving regulator, Keccak-256 cryptographic hash, and **Premium Market Eligible: YES**.
  - `🔴 NOT SAFE FOR CONSUMPTION`: Clear food safety warning advising against procurement.
  - `⚪ CERTIFICATE EXPIRED`: Advises the buyer to request the producer's current weekly QR code.
  - `⚠️ INVALID CERTIFICATE (404)`: Fraud warning against counterfeit QR codes.

---

### 📱 QR Code Scanning & Local Network Guide (Desktop vs Mobile)

When testing QR codes during development, understanding network routing avoids the common **"localhost loopback trap"**:

| Testing Scenario | What the QR Encodes | How to Test | Expected Result |
| :--- | :--- | :--- | :--- |
| **Option 1: Desktop Browser (Direct)** | `http://localhost:3000/certify/verify/AGV-8F2K9L` | Open `/farmer/certificate` on your laptop, and click the blue link: **"Open Public Verification Link"**. | ✅ Opens verification page instantly on PC; displays `🟢 VALID CERTIFICATE — MRL SAFE`. |
| **Option 2: Mobile Phone via Local Wi-Fi** | `http://<YOUR_PC_IP>:3000/certify/verify/AGV-8F2K9L` | 1. Ensure laptop and phone are on the same Wi-Fi.<br>2. On laptop, open `http://<YOUR_PC_IP>:3000/farmer/certificate` (e.g. `http://10.39.79.97:3000`).<br>3. Scan the screen with your phone camera! | ✅ The phone opens your PC's IP, queries the backend dynamically, and renders the verification badge! |
| **Option 3: Public / Cloud Deployment** | `https://your-domain.com/certify/verify/AGV-8F2K9L` | Deployed on Vercel / Render or forwarded via tunnel (`ngrok http 3000`). | ✅ Works globally on any smartphone or barcode scanner without any Wi-Fi restrictions. |

> [!NOTE]
> **Why scanning `localhost` with a phone fails:** When a QR code contains `http://localhost:3000`, a phone camera scanning it tries to open port 3000 **on the phone itself**, resulting in `ERR_CONNECTION_REFUSED`. The AgriGuard public verify page includes dynamic host detection (`http://${window.location.hostname}:5000/api/v1`) so that accessing via your local network IP works seamlessly across devices.

---

## 🔬 PART 7 — Farm Tester Analytical Suite & Statutory MRL Library

Located under `/tester/*`, this suite empowers accredited food safety laboratory analysts to enter chemical assay tests, audit Maximum Residue Limits, and register withdrawal waste claims.

### 1. Statutory MRL Benchmark Reference Library (`/tester/mrl`)
Accessible at [`http://localhost:3000/tester/mrl`](http://localhost:3000/tester/mrl), this module provides analysts with an interactive statutory chemical library:
- **Comprehensive Chemical Directory:** Amoxicillin, Oxytetracycline, Florfenicol, Enrofloxacin, Ivermectin, Ciprofloxacin, Tylosin, Sulfadiazine + Trimethoprim, Ceftiofur, and more.
- **FSSAI Gazette Benchmarks:** Shows statutory MRL thresholds (`0.004 mg/kg` for Amoxicillin in Milk, `0.1 mg/kg` for Oxytetracycline in Milk, `0.2 mg/kg` for Florfenicol in Meat).
- **Toxicological Profiles:** Acceptable Daily Intake (ADI) metrics, target species matrices (Bovine, Swine, Poultry, Aquaculture), and validated analytical methods (LC-MS/MS Electrospray Ionization).
- **View Flexibility:** 1-click toggle between responsive card grid and dense data table views with instant keyword and category search.

### 2. New Chemical Assay Sample Logging (`/tester/new-test`)
- **Endpoint:** `POST /api/v1/product-tests`
- Farm testers log mass spectrometry readings (`amountDetected` vs statutory limit).
- Instant percentage limit calculation and automated violation flagging.
- Real-time blockchain hash generation anchoring test credentials to Sepolia testnet.

### 3. Withdrawal Waste Claim Entry (`/tester` & `/tester/waste`)
- **Endpoint:** `POST /api/v1/testers/waste-claims`
- Dynamic 3-tier livestock selector linking registered farmers, herds, and tagged livestock.
- Real-time valuation estimation powered by the AI fair-market pricing engine.

---

## 📊 Withdrawal Waste & Statutory AI Valuation Benchmarks

To ensure consistent, fair reimbursement across India, AgriGuard implements deterministic pricing benchmarks:

| Commodity | Eligible Species | Benchmark Rate | Unit | Economic Basis | Subsidy Eligibility |
| :--- | :--- | :---: | :---: | :--- | :---: |
| **Goat Meat** | Goat, Caprine, Sheep | **₹720.00** | `kg` | Farmgate dressed carcase rate | ✅ **Eligible** |
| **Goat Milk** | Goat (Caprine) | **₹85.00** | `L` | Therapeutic market benchmark | ✅ **Eligible** |
| **Broiler Chicken** | Poultry, Chicken | **₹150.00** | `kg` | Liveweight/dressed carcase standard | ✅ **Eligible** |
| **Cow Milk** | Cattle / Bovine | **₹44.00** | `L` | Dairy cooperative procurement rate | ✅ **Eligible** |
| **Buffalo Milk** | Buffalo | **₹62.00** | `L` | Standard 6.5% Fat / 9% SNF benchmark | ✅ **Eligible** |
| **Pork** | Swine / Porcine | **₹260.00** | `kg` | Farmgate wholesale carcase rate | ✅ **Eligible** |
| **Table Eggs** | Poultry / Layers | **₹6.50** | `units` | NECC average benchmark rate | ✅ **Eligible** |
| **Fish & Aquaculture** | Fish, Prawns, Shrimp | **₹0.00** | N/A | *Statutorily excluded from subsidy* | ❌ **Excluded** |

> **Statutory Exclusion:** Fish and aquaculture products are statutorily excluded from the withdrawal waste compensation subsidy under FSSAI statutory regulations.

---

## ⚙️ Core Deterministic & AI Engines

### 1. Withdrawal Calculation Engine (`backend/src/services/withdrawalEngine.js`)
- Maps `(animalType, medicine, route, targetMatrix)` against pharmacokinetic clearance curves.
- Computes mandatory withdrawal hold days and returns `safeFromDate`.
- Updates livestock status to `WITHDRAWAL ACTIVE` and flags associated batch flocks.

### 2. MRL Analysis Engine (`backend/src/services/mrlEngine.js`)
- Compares detected analyte concentrations (ppm / ppb) against statutory thresholds from FSSAI Gazette schedules and Codex Alimentarius standards.
- Classification categories:
  - `COMPLIANT`: Analyte concentration `< 80%` of legal MRL.
  - `WARNING`: Analyte concentration `80% – 100%` of legal MRL.
  - `MRL EXCEEDED`: Analyte concentration `> 100%` of legal MRL (triggers regulatory alerts).

### 3. AI Fair-Market Pricing Engine (`backend/src/services/pricingEngine.js`)
- Evaluates fair compensation for discarded produce based on quantity, commodity type, and national wholesale price indices.
- Supports Goat Meat (₹720/kg), Goat Milk (₹85/L), Buffalo Milk (₹62/L), Cow Milk (₹44/L), Broiler Chicken (₹150/kg), and Pork (₹260/kg).

### 4. Hybrid Generative AI Engine (`backend/src/routes/ai-predictions.js`)
- **Primary:** Google Gemini 2.0 Flash / 1.5 Flash via `@google/genai` SDK for complex natural language queries.
- **Secondary (Offline):** Built-in AgriGuard Domain Synthesizer providing zero-latency, deterministic pharmacological and regulatory guidance without external API keys.
- Powers Vet clinical reviews, FSSAI executive briefings, MRL lab audits, and multilingual Kisan advisory.

### 5. Certificate & State-Machine Engine (`backend/src/services/certificateService.js`)
- Enforces strict two-step state machine (`PENDING -> APPROVED -> SAFE/UNSAFE`).
- Generates unique Keccak-256 blockchain proof hashes for approved MRL certificates.
- Dynamically evaluates weekly expiry (`now > validUntil`), preventing stale certificates from displaying false compliance.

---

## ⛓️ Smart Contract & Blockchain Security

The decentralized layer is governed by **`TreatmentLedger.sol`**, deployed on the Ethereum Sepolia Testnet.

### Smart Contract Methods
```solidity
// Records an immutable veterinary prescription hash
function recordTreatment(
    string memory tagId,
    string memory drugName,
    uint256 withdrawalDays,
    bytes32 proofHash
) external returns (bool);

// Records chemical laboratory assay test results
function recordTestResult(
    string memory sampleId,
    string memory analyte,
    uint256 concentrationPpm,
    bool isCompliant,
    bytes32 proofHash
) external returns (bool);

// Verifies on-chain authenticity of a prescription proof
function verifyTreatment(bytes32 proofHash) external view returns (bool, uint256);
```

### Cryptographic Proof Hash Generation
```javascript
const proofHash = ethers.keccak256(
  ethers.toUtf8Bytes(
    `${tagId}:${drugName}:${dateAdministered}:${vetLicenseNumber}:${withdrawalDays}`
  )
);
```

---

## 🗄️ Database Schema & Entity Models

AgriGuard uses **Prisma ORM** with SQLite/PostgreSQL. Core domain models include:

- **User:** Authentication identity with RBAC role (`REGULATOR`, `VETERINARIAN`, `FARMER`, `FARM_TESTER`).
- **FarmerProfile:** Farm name, location, FSSAI registration ID (`FR10293`), assigned vet, and compliance status.
- **VeterinarianProfile:** License number (`VT92A7K1`), qualifications, clinic jurisdiction, and verification status.
- **FarmTester:** Accredited laboratory profile, facility citation ID (`FT72B91K1`), and lab credentials.
- **Animal:** Individual tagged livestock with RFID/ear tag (`RJ-CW1`, `RJ-GT1`), species, breed, and health state (`SAFE`, `WITHDRAWAL`).
- **AnimalBatch:** Flock/batch tracking for poultry (`RJ-CH-B1`) and aquaculture (`RJ-FS-B1`, `RK-PR-B1`) with head count.
- **AnimalTag:** Universal tag entity linking treatments, withdrawals, and test results to animals and batches.
- **Treatment:** Prescribed antimicrobial, dosage, route, target matrix, statutory hold days, safe-from date, and Keccak-256 blockchain hash.
- **Vaccination:** Immunization records tracking tag ID, vaccine name, volume, injection route, and cryptographic confirmation hash.
- **WithdrawalWasteClaim:** Discarded produce claims:
  - `claimId`: Unique citation (`WST-XXXXXX`).
  - `farmerId`: Beneficiary farmer citation (`FR10293`).
  - `testerId`: Inspecting tester citation (`FT72B91K1`).
  - `animalType` & `animalId`: Livestock identifiers (`Goat`, `RJ-GT1`).
  - `date`: Statutory disposal date.
  - `productType`: Discarded commodity (`Goat Meat`, `Milk`, etc.).
  - `wasteAmount` & `unit`: Discarded quantity (`15`, `kg`).
  - `aiRecommendedAmount`: Fair-market evaluated subsidy.
  - `status`: Lifecycle state (`PENDING FSSAI APPROVAL`, `DISBURSED (PAID)`).
  - `notes`: Audit trail containing transaction IDs and timestamps.
- **MedicineReference:** Approved statutory drug catalog per animal species with active ingredients and dosage guidelines.
- **ProductTest:** Laboratory test results comparing detected chemical residues against MRL limits.
- **Alert:** Automated compliance notifications dispatched to regulators and farmers.
- **MRLCertificate:** Weekly digital compliance certificate entity:
  - `certificateId`: Unique citation (`CERT-XXXXXX`).
  - `farmerId`: Foreign key to `Farmer` model.
  - `farmerCode`: Cached citation string (`FR10293`).
  - `approvalStatus`: Lifecycle state (`PENDING`, `APPROVED`, `REJECTED`, `EXPIRED`).
  - `mrlStatus`: Safety designation (`NOT_SET`, `SAFE`, `UNSAFE`).
  - `validFrom` & `validUntil`: 7-day weekly validity period.
  - `verificationId`: Unique public verification code (`AGV-XXXXXX`).
  - `qrPayload`: Relative verification URL (`/certify/verify/:verificationId`).
  - `blockchainHash`: Keccak-256 cryptographic hash of certificate proof.
  - `approvedBy`: Approving FSSAI regulator name.
  - `notes`: Regulatory observations and assay citations.
- **CertificateAuditLog:** Regulatory audit trail tracking each action (`CREATED`, `APPROVED`, `SAFE_SET`, `UNSAFE_SET`, `REJECTED`, `EXPIRED`) with regulator ID, timestamps, and previous/new state diffs.

---

## 📡 Complete REST API Catalog

### 1. Withdrawal Waste & Compensation
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/testers/waste-claims` | Public / Regulator | Retrieves all submitted claims (excluding Fish). |
| `POST` | `/api/v1/testers/waste-claims` | `FARM_TESTER` | Submits a new withdrawal waste claim (`PENDING FSSAI APPROVAL`). |
| `PATCH` | `/api/v1/testers/waste-claims/:id/disburse` | Public / Regulator | Disburses DBT subsidy to farmer; sets status to `DISBURSED (PAID)`. |
| `GET` | `/api/v1/farmers/my-subsidies` | `FARMER` | Retrieves the authenticated farmer's verified claims and financial totals. |
| `POST` | `/api/v1/ai/waste-compensation` | Public | Evaluates statutory market compensation using AI pricing engine. |
| `GET` | `/api/v1/testers/farmers-livestock` | `FARM_TESTER` | Retrieves registered farmers and active tags for dynamic 3-tier selector. |

### 2. Regulatory Dashboard & Surveillance
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard` | Public / Regulator | Returns national AMU metrics and `wasteClaims` formatted with the 6 columns. |
| `GET` | `/api/v1/farmers` | `REGULATOR` | Lists registered livestock producers and compliance status. |
| `GET` | `/api/v1/veterinarians` | `REGULATOR` | Lists registered veterinary officers. |
| `GET` | `/api/v1/testers` | `REGULATOR` | Lists accredited testing laboratories and approval statuses. |
| `PATCH` | `/api/v1/testers/:id/approval` | `REGULATOR` | Approves or rejects laboratory testing credentials. |

### 3. Treatments, Prescriptions & Vaccinations
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/treatments/medicines` | Public / Vet | Returns approved medicines catalog filtered by `?animalType=...`. |
| `POST` | `/api/v1/treatments` | `VETERINARIAN` | Logs drug administration with animal-medicine validation (rejects invalid with 400). |
| `POST` | `/api/v1/treatments/vaccinations` | `VETERINARIAN` | Logs vaccination administration with SHA-256 cryptographic confirmation hash. |
| `GET` | `/api/v1/treatments/my-treatments` | `FARMER` / `VET` | Returns treatment and vaccination history from 1/9/2026 onwards. |
| `GET` | `/api/v1/treatments/my-withdrawals` | `FARMER` | Returns active withdrawal calendar countdowns for the farmer's herd. |

### 4. Generative AI & Decision Support
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/ai/status` | Public | Returns active AI engine (`Gemini 2.0 Flash` or `AgriGuard Domain Synthesizer`). |
| `POST` | `/api/v1/ai/chat` | Public | Universal conversational AI endpoint for agricultural and veterinary queries. |
| `POST` | `/api/v1/ai/clinical-review` | Public / Vet | Evaluates AMR resistance risk, withdrawal hold hours, and contraindications. |
| `POST` | `/api/v1/ai/regulatory-briefing` | Public / Regulator | Generates executive FSSAI surveillance and DBT fiscal governance briefing. |
| `POST` | `/api/v1/ai/lab-analysis` | Public / Tester | Audits LC-MS/MS test readings against statutory limits; generates certificates. |
| `POST` | `/api/v1/ai/farmer-advisory` | Public / Farmer | Produces multilingual farm advisory in Hindi, Tamil, Telugu, Kannada, or English. |
| `POST` | `/api/v1/ai/waste-compensation` | Public | Dynamic economic valuation engine for animal withdrawal discards. |

### 5. Authentication & Laboratory Testing
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Authenticates user; returns JWT token and role profile. |
| `POST` | `/api/v1/product-tests` | `FARM_TESTER` | Submits chemical assay test results with automated MRL evaluation. |

### 6. MRL-Safe Digital Certification & QR Verification
| Method | Route | Role / Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/certificates/my` | `FARMER` | Retrieves logged-in farmer's current active certificate, QR code, and market status. |
| `GET` | `/api/v1/certificates` | `REGULATOR` | Lists all farmers with certificate statuses and summary KPI counters. |
| `GET` | `/api/v1/certificates/:id` | `REGULATOR` | Retrieves full certificate detail including audit log timeline. |
| `GET` | `/api/v1/certificates/evidence/:farmerId` | `REGULATOR` | Retrieves supporting evidence (treatments, active withholdings, lab assays) for review. |
| `POST` | `/api/v1/certificates/initiate` | `REGULATOR` / `FARMER` | Initiates a weekly certification review in `PENDING` state. |
| `PATCH` | `/api/v1/certificates/:id/approve` | `REGULATOR` | **Step 1:** Approves (`APPROVED`) or rejects (`REJECTED`) certification. |
| `PATCH` | `/api/v1/certificates/:id/status` | `REGULATOR` | **Step 2:** Designates `SAFE` or `UNSAFE` (strictly blocked if not `APPROVED`). |
| `GET` | `/api/v1/certificates/verify/:verificationId` | **Public (Zero-Auth)** | Scanned QR endpoint; dynamically verifies validity, returns `SAFE`, `UNSAFE`, or `EXPIRED`. |
| `GET` | `/api/v1/certificates/history/:farmerId` | `REGULATOR` / `FARMER` | Returns historical weekly certificates for a farmer (farmers restricted to own data). |

---

## 📦 Monorepo Directory Structure

```text
SIH/
├── backend/                        # Node.js + Express REST API Server
│   ├── prisma/
│   │   ├── schema.prisma           # Prisma database models & relations
│   │   └── dev.db                  # Local SQLite database
│   ├── scripts/
│   │   ├── seed-medicines.js       # Seeds 18 approved medicines across 7 species
│   │   ├── seed-certificates.js    # Seeds demo MRL certificates across SAFE, PENDING, UNSAFE, EXPIRED
│   │   ├── test-vet-validation.js  # Automated tests for veterinary validation rules
│   │   └── test-certification-system.js # 12-point automated verification suite for MRL certificates
│   ├── src/
│   │   ├── index.js                # Server entrypoint and route mounting
│   │   ├── middleware/auth.js      # JWT authentication and RBAC authorization
│   │   ├── routes/
│   │   │   ├── auth.js             # Authentication endpoints
│   │   │   ├── dashboard.js        # Regulator AMU metrics and waste claims
│   │   │   ├── farmers.js          # Farmer profile and /my-subsidies endpoints
│   │   │   ├── farm-testers.js     # Waste claims, DBT disbursement, testing
│   │   │   ├── treatments.js       # Drug prescriptions, vaccinations & species validation
│   │   │   ├── product-tests.js    # Chemical assay MRL evaluation
│   │   │   ├── certificates.js     # MRL-Safe Certification, QR verify, and state-machine endpoints
│   │   │   └── ai-predictions.js   # AI pricing and Gemini chat
│   │   ├── services/
│   │   │   ├── withdrawalEngine.js # Pharmacokinetic withdrawal calculation
│   │   │   ├── mrlEngine.js        # MRL limit evaluation engine
│   │   │   ├── pricingEngine.js    # AI fair-market compensation valuation
│   │   │   ├── certificateService.js# Two-step state machine, blockchain hash, dynamic expiry engine
│   │   │   └── blockchainService.js# Web3/Ethers contract interaction
│   │   └── seed.js                 # Primary database seed script
│   ├── test_vaccination_api.js     # Verification script for vaccination API endpoint
│   ├── test_treatment_api.js       # Verification script for treatment prescription API
│   └── package.json
│
├── smart-contracts/                # Solidity Hardhat development environment
│   ├── contracts/
│   │   └── TreatmentLedger.sol     # Cryptographic treatment ledger contract
│   ├── scripts/deploy.js           # Contract deployment script
│   ├── test/                       # Hardhat smart contract tests
│   └── hardhat.config.js
│
├── web-dashboard/                  # Next.js 16 Web Application (React 19, Tailwind v4)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.js             # Main regulator overview dashboard
│   │   │   ├── ai-assistant/       # AgriGuard Gen AI Command Center (5 modules)
│   │   │   ├── regulator/
│   │   │   │   ├── waste-subsidy/  # FSSAI Payment Monitoring Portal (6-column table)
│   │   │   │   ├── certify/        # FSSAI Weekly MRL Certification Management Hub
│   │   │   │   ├── vets/           # Veterinarian registry & approvals
│   │   │   │   ├── testers/        # Lab tester registry & approvals
│   │   │   │   ├── farmers/        # Farmer registry & compliance
│   │   │   │   └── traceability/   # Blockchain livestock provenance trail
│   │   │   ├── vet/
│   │   │   │   ├── page.js         # Veterinarian overview dashboard
│   │   │   │   ├── medicine/       # Dynamic 7-species medicine prescription form
│   │   │   │   ├── vaccinate/      # Immunization & vaccination passport preview
│   │   │   │   ├── amu/            # AMU surveillance ledger
│   │   │   │   └── farmers/        # Linked client herd management
│   │   │   ├── farmer/
│   │   │   │   ├── page.js         # Farmer dashboard with DBT summary
│   │   │   │   ├── certificate/    # Official Farmer MRL Digital Certificate & QR
│   │   │   │   ├── subsidies/      # Dedicated Farmer Subsidies & DBT Ledger
│   │   │   │   ├── animals/        # Herd inventory management
│   │   │   │   └── withdrawals/    # Live withdrawal calendar
│   │   │   ├── tester/
│   │   │   │   ├── page.js         # Tester portal with 3-tier livestock selector
│   │   │   │   ├── new-test/       # Chemical assay sample logging
│   │   │   │   ├── mrl/            # Statutory MRL Chemical Reference Library
│   │   │   │   ├── history/        # Assay test history ledger
│   │   │   │   └── waste/          # Waste claim recording
│   │   │   ├── certify/
│   │   │   │   └── verify/         # Public Zero-Auth QR Code Verification Page
│   │   │   ├── alerts/             # Regulatory quarantine notices & citations
│   │   │   ├── compliance/         # FSSAI compliance schedules & holding limits
│   │   │   ├── mrl-reports/        # Analytical lab reports & exceedance audits
│   │   │   ├── amu-logs/           # Global AMU prescription on-chain archive
│   │   │   └── login/              # Multi-role authentication page
│   │   └── components/
│   │       ├── chat/
│   │       │   └── ChatBotWidget.jsx # Floating Gen AI copilot with full-hub link
│   │       └── layout/
│   │           ├── Header.jsx      # Top bar with role switcher & Gen AI Hub button
│   │           └── Sidebar.jsx     # Navigation with role items and Gen AI link
│   └── package.json
│
├── mobile-app/                     # Flutter mobile client for farmers
│   ├── lib/main.dart               # Flutter farmer offline field application
│   └── pubspec.yaml
│
└── package.json                    # Monorepo root configuration
```

---

## ⚙️ Installation & Local Setup

### Prerequisites
- **Node.js:** v18.0.0, v20.x, or v24.x
- **npm:** v9.0.0 or higher
- **Flutter SDK:** (Optional, for mobile app) v3.x+

### Step-by-Step Setup

1. **Clone the Repository & Install Dependencies**
   ```bash
   git clone <repo-url>
   cd SIH
   npm run install:all
   ```

2. **Initialize Database & Seed All Data**
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   npm run seed
   node scripts/seed-medicines.js
   node scripts/seed-certificates.js
   cd ..
   ```

3. **Start Local Blockchain (Optional for local testnet, Terminal 1)**
   ```bash
   cd smart-contracts
   npx hardhat node
   ```

4. **Deploy Smart Contract (Terminal 2)**
   ```bash
   cd smart-contracts
   npx hardhat run scripts/deploy.js --network localhost
   cd ..
   ```

5. **Start Backend Server & Web Dashboard (Terminal 3)**
   ```bash
   npm run dev
   ```
   - **Web Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **FSSAI Certify Portal:** [http://localhost:3000/regulator/certify](http://localhost:3000/regulator/certify)
   - **Farmer MRL Certificate:** [http://localhost:3000/farmer/certificate](http://localhost:3000/farmer/certificate)
   - **Public QR Verification:** [http://localhost:3000/certify/verify/AGV-8F2K9L](http://localhost:3000/certify/verify/AGV-8F2K9L)
   - **AgriGuard Gen AI Hub:** [http://localhost:3000/ai-assistant](http://localhost:3000/ai-assistant)
   - **FSSAI Payment Area:** [http://localhost:3000/regulator/waste-subsidy](http://localhost:3000/regulator/waste-subsidy)
   - **Vet Medicine Area:** [http://localhost:3000/vet/medicine](http://localhost:3000/vet/medicine)
   - **Vet Vaccination Module:** [http://localhost:3000/vet/vaccinate](http://localhost:3000/vet/vaccinate)
   - **Farmer Dashboard:** [http://localhost:3000/farmer](http://localhost:3000/farmer)
   - **Farmer Subsidies Ledger:** [http://localhost:3000/farmer/subsidies](http://localhost:3000/farmer/subsidies)
   - **Farm Tester Portal:** [http://localhost:3000/tester](http://localhost:3000/tester)
   - **MRL Reference Library:** [http://localhost:3000/tester/mrl](http://localhost:3000/tester/mrl)
   - **Backend API:** [http://localhost:5000/api/v1](http://localhost:5000/api/v1)

---

## 🔑 Default Seed Credentials

All seeded accounts use standard credentials for testing and evaluation:

| Role | Email | Password | Primary Identity | Access Portals |
| :--- | :--- | :--- | :--- | :--- |
| **🏛️ FSSAI Regulator** | `fssaigovt@gmail.com` | `Fssai@123` | FSSAI Administrator | [`/`](http://localhost:3000/), [`/regulator/certify`](http://localhost:3000/regulator/certify), [`/regulator/waste-subsidy`](http://localhost:3000/regulator/waste-subsidy), `/alerts`, `/compliance` |
| **🩺 Veterinarian 1** | `vet1@example.com` | `Password@123` | Dr. Suresh Kumar (`VT92A7K1`) | [`/vet`](http://localhost:3000/vet), [`/vet/medicine`](http://localhost:3000/vet/medicine), [`/vet/vaccinate`](http://localhost:3000/vet/vaccinate), `/vet/amu` |
| **🩺 Veterinarian 2** | `vet2@example.com` | `Password@123` | Dr. Vet 2 (`VT92A7K2`) | [`/vet`](http://localhost:3000/vet), [`/vet/medicine`](http://localhost:3000/vet/medicine), [`/vet/vaccinate`](http://localhost:3000/vet/vaccinate) |
| **🌾 Farmer 1 (Rajesh)** | `farmer1@gmail.com` | `Password@123` | RAJESH (`FR10293`) | [`/farmer`](http://localhost:3000/farmer), [`/farmer/certificate`](http://localhost:3000/farmer/certificate), [`/farmer/subsidies`](http://localhost:3000/farmer/subsidies), `/farmer/animals`, `/farmer/withdrawals` |
| **🌾 Farmer 2** | `farmer2@example.com` | `Password@123` | Farmer 2 (`FR10292`) | [`/farmer`](http://localhost:3000/farmer), [`/farmer/certificate`](http://localhost:3000/farmer/certificate), [`/farmer/subsidies`](http://localhost:3000/farmer/subsidies) |
| **🧪 Farm Tester 1** | `tester1@example.com` | `Password@123` | Tester 1 (`FT72B91K1`) | [`/tester`](http://localhost:3000/tester), [`/tester/mrl`](http://localhost:3000/tester/mrl), `/tester?tab=waste`, `/tester/new-test` |

---

## 🧪 Testing & Verification Proofs

### 1. Veterinarian Species-Medicine Validation Test
Run the automated test script to verify backend validation:
```bash
node backend/scripts/test-vet-validation.js
```
**Test Results:**
```text
=== Testing Veterinarian AMU Validation ===
Vet authenticated successfully!

1. Testing VALID: Cow (RJ-CW1) + Procaine Penicillin G
Status: 200 OK
Treatment ID: cmttqcz1t0001k3uvaocvnq7h
Blockchain Hash: 0xaea61494a7f726b9e3c687e0c933042daac8d4c5fbd044b1823794c7f941f4dd

2. Testing INVALID: Fish (RJ-FS-B1) + Procaine Penicillin G
Status: 400 Bad Request
Error response: Invalid animal-medicine combination: 'Procaine Penicillin G' is not approved for 'Fish'. Approved medicines: Oxytetracycline, Florfenicol, Sulfadiazine + Trimethoprim

3. Testing INVALID: Cow (RJ-CW1) + Tylosin
Status: 400 Bad Request
Error response: Invalid animal-medicine combination: 'Tylosin' is not approved for 'Cow'. Approved medicines: Procaine Penicillin G, Ceftiofur, Tulathromycin, Tilmicosin, Oxytetracycline

4. Testing VALID: Chicken (RJ-CH-B1) + Enrofloxacin
Status: 200 OK
Withdrawal Days: 7 Days
```

### 2. Immunization & Vaccination API Verification
Verify that preventative vaccinations are logged with SHA-256 blockchain records:
```bash
node backend/test_vaccination_api.js
```
**Output:**
```json
{
  "vaccination": {
    "id": "cmttqcz...",
    "tagId": "RJ-CW1",
    "vaccineName": "Foot-and-Mouth Disease (FMD) Booster",
    "amount": 5,
    "amountUnit": "mL",
    "route": "Subcutaneous (SC)"
  },
  "blockchainRecord": {
    "recordType": "VACCINATION",
    "status": "CONFIRMED",
    "hash": "0x3f4e8b9..."
  }
}
```

### 3. Farmer Subsidies API Verification
Verify that the farmer's dedicated subsidies endpoint returns live verified data:
```bash
node -e "fetch('http://localhost:5000/api/v1/farmers/my-subsidies', { headers: { Authorization: 'Bearer <FARMER_TOKEN>' } }).then(r=>r.json()).then(d=>console.log(d.summary))"
```
**Output:**
```json
{
  "totalClaims": 5,
  "totalEntitlement": 20390,
  "totalDisbursed": 12120,
  "totalPending": 8270
}
```

### 4. MRL Digital Certification 12-Point Automated Test Suite
Run the comprehensive test script to verify state-machine transitions, RBAC constraints, dynamic expiry, and public QR verification:
```bash
node backend/scripts/test-certification-system.js
```
**Test Results:**
```text
===============================================================
🚀 STARTING MRL DIGITAL CERTIFICATION 12-POINT VERIFICATION SUITE
===============================================================

✅ [PASS] Regulator logged in successfully
✅ [PASS] Farmer 1 logged in successfully
✅ [PASS] Veterinarian logged in successfully

---------------------------------------------------------------
TEST 1: Create Certificate in PENDING status
---------------------------------------------------------------
✅ [PASS] Status code is 201 (got 201)
✅ [PASS] approvalStatus is PENDING (got PENDING)
✅ [PASS] mrlStatus is NOT_SET (got NOT_SET)

---------------------------------------------------------------
TEST 2: Attempt PENDING -> SAFE (Must FAIL with error)
---------------------------------------------------------------
✅ [PASS] Premature status set returns HTTP 400 (got 400)
✅ [PASS] Error message correctly informs: "Certificate must be approved before MRL status can be set."

---------------------------------------------------------------
TEST 3: Approve PENDING -> APPROVED (Must SUCCEED)
---------------------------------------------------------------
✅ [PASS] Status code is 200 (got 200)
✅ [PASS] approvalStatus transitioned to APPROVED (got APPROVED)
✅ [PASS] mrlStatus remains NOT_SET until explicitly determined (got NOT_SET)

---------------------------------------------------------------
TEST 4: Set APPROVED -> SAFE (Must SUCCEED)
---------------------------------------------------------------
✅ [PASS] Status code is 200 (got 200)
✅ [PASS] mrlStatus is SAFE (got SAFE)
✅ [PASS] Keccak-256 blockchain proof generated (0x7e0bcbb1d3ddd1...)
✅ [PASS] Farmer is premiumEligible = true

---------------------------------------------------------------
TEST 5: Set APPROVED -> UNSAFE (Must SUCCEED)
---------------------------------------------------------------
✅ [PASS] Status code is 200 (got 200)
✅ [PASS] mrlStatus is UNSAFE (got UNSAFE)
✅ [PASS] Farmer premiumEligible revoked to false

---------------------------------------------------------------
TEST 6: Farmer tries to modify certificate status (Must return 403 Forbidden)
---------------------------------------------------------------
✅ [PASS] Farmer unauthorized modification blocked with HTTP 403 (got 403)

---------------------------------------------------------------
TEST 7: Non-Regulator (Vet) tries to approve certificate (Must return 403 Forbidden)
---------------------------------------------------------------
✅ [PASS] Veterinarian unauthorized approval blocked with HTTP 403 (got 403)

---------------------------------------------------------------
TEST 8: Public QR verification of active safe certificate (Must return 200)
---------------------------------------------------------------
✅ [PASS] Public verification HTTP 200 without auth (got 200)
✅ [PASS] Certificate verified valid: true
✅ [PASS] Certificate MRL status is SAFE (got SAFE)
✅ [PASS] Premium Market Eligibility confirmed in public badge

---------------------------------------------------------------
TEST 9: Dynamic Expiration Detection
---------------------------------------------------------------
✅ [PASS] HTTP status 200 for expired QR lookup (got 200)
✅ [PASS] Expired certificate is marked valid = false
✅ [PASS] Dynamic evaluation designated status = EXPIRED (got EXPIRED)

---------------------------------------------------------------
TEST 10: Old QR after expiry displays EXPIRED badge (never falsely SAFE)
---------------------------------------------------------------
✅ [PASS] Badge text is 'CERTIFICATE EXPIRED' (got 'CERTIFICATE EXPIRED')
✅ [PASS] Expired certificate mrlStatus reset to NOT_SET (got 'NOT_SET')

---------------------------------------------------------------
TEST 11: Farmer tries to access another farmer's certificate history (Must return 403)
---------------------------------------------------------------
✅ [PASS] Farmer accessing another farmer's history blocked with HTTP 403 (got 403)

---------------------------------------------------------------
TEST 12: QR verification with invalid verification ID (Must return 404)
---------------------------------------------------------------
✅ [PASS] Non-existent verification ID returns HTTP 404 (got 404)
✅ [PASS] Response indicates notFound = true

===============================================================
🏁 VERIFICATION SUITE COMPLETE: 32 PASSED, 0 FAILED
===============================================================
```

---

## 🌐 Cloud Deployment Guide

| Component | Platform | Configuration |
| :--- | :--- | :--- |
| **Backend REST API** | [Render](https://render.com) | Build: `cd backend && npm install && npx prisma generate && npx prisma db push`<br>Start: `cd backend && npm start` |
| **Web Dashboard** | [Vercel](https://vercel.com) | Root: `web-dashboard`<br>Env: `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api/v1` |
| **Database** | [Supabase](https://supabase.com) | PostgreSQL connection string set as `DATABASE_URL` |
| **Smart Contracts** | [Sepolia](https://sepolia.etherscan.io) | `cd smart-contracts && npx hardhat run scripts/deploy.js --network sepolia` |

---

## 🛡️ License & Acknowledgements
Built for the **Smart India Hackathon (SIH25007)** under Food Safety & Animal Husbandry track guidelines.
Licensed under the [MIT License](LICENSE).
