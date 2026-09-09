"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Pill, ShieldCheck, CheckCircle2, AlertTriangle, 
  Info, Clock, QrCode, ArrowRight, Sparkles, Copy, AlertCircle,
  Filter, Layers, Check, RefreshCw, Bot
} from "lucide-react";
import Link from "next/link";

// 7 Supported Animal Categories & Registered Test Tags
const ANIMAL_CATEGORIES = [
  { id: "Cow", label: "Cow / Cattle", defaultProduct: "Milk", quickTags: ["RJ-CW1", "RJ-CW2", "RJ-CW3"] },
  { id: "Goat", label: "Goat", defaultProduct: "Milk", quickTags: ["RJ-GT1", "RJ-GT2", "RJ-GT-TEST1"] },
  { id: "Sheep", label: "Sheep", defaultProduct: "Meat", quickTags: ["RJ-SH1", "RJ-SH2"] },
  { id: "Chicken", label: "Chicken / Poultry", defaultProduct: "Meat", quickTags: ["RJ-CH-B1", "RJ-CH-TESTB"] },
  { id: "Pig", label: "Pig / Swine", defaultProduct: "Meat", quickTags: ["RJ-PG1", "RJ-PG2", "RK-PG1"] },
  { id: "Fish", label: "Fish", defaultProduct: "Fish Meat", quickTags: ["RJ-FS-B1"] },
  { id: "Prawn", label: "Prawn / Shrimp", defaultProduct: "Prawn Meat", quickTags: ["RK-PR-B1"] },
];

// Strict Statutory Animal-Wise Medicine Mapping
const ANIMAL_MEDICINE_MAP = {
  "Chicken": [
    "Oxytetracycline",
    "Chlortetracycline",
    "Doxycycline",
    "Amoxicillin",
    "Ampicillin",
    "Enrofloxacin"
  ],
  "Pig": [
    "Tylosin",
    "Tiamulin",
    "Oxytetracycline",
    "Amoxicillin",
    "Apramycin",
    "Neomycin"
  ],
  "Prawn": [
    "Oxytetracycline",
    "Erythromycin",
    "Florfenicol"
  ],
  "Fish": [
    "Oxytetracycline",
    "Florfenicol",
    "Sulfadiazine + Trimethoprim"
  ],
  "Cow": [
    "Procaine Penicillin G",
    "Ceftiofur",
    "Tulathromycin",
    "Tilmicosin",
    "Oxytetracycline"
  ],
  "Goat": [
    "Penicillin G + Streptomycin",
    "Oxytetracycline",
    "Enrofloxacin"
  ],
  "Sheep": [
    "Penicillin G + Streptomycin",
    "Oxytetracycline",
    "Enrofloxacin"
  ]
};

// Complete Medicine Catalog Metadata
const MEDICINE_CATALOG = {
  "Oxytetracycline": { ingredient: "Oxytetracycline HCl", defaultProduct: "Milk", mrl: "0.1 mg/kg", withdrawalDays: 7, class: "Tetracycline", amrRisk: "Highly Important" },
  "Chlortetracycline": { ingredient: "Chlortetracycline HCl", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 7, class: "Tetracycline", amrRisk: "Highly Important" },
  "Doxycycline": { ingredient: "Doxycycline Hyclate", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 7, class: "Tetracycline", amrRisk: "Highly Important" },
  "Amoxicillin": { ingredient: "Amoxicillin Trihydrate", defaultProduct: "Milk", mrl: "0.004 mg/kg", withdrawalDays: 7, class: "Beta-Lactam / Penicillin", amrRisk: "High Priority" },
  "Ampicillin": { ingredient: "Ampicillin Sodium", defaultProduct: "Meat", mrl: "0.05 mg/kg", withdrawalDays: 7, class: "Beta-Lactam / Penicillin", amrRisk: "High Priority" },
  "Enrofloxacin": { ingredient: "Enrofloxacin", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 10, class: "Fluoroquinolone", amrRisk: "Highest Priority Critical (CIA)" },
  "Tylosin": { ingredient: "Tylosin Tartrate", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 14, class: "Macrolide", amrRisk: "Highest Priority Critical" },
  "Tiamulin": { ingredient: "Tiamulin Hydrogen Fumarate", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 7, class: "Pleuromutilin", amrRisk: "Veterinary Critical" },
  "Apramycin": { ingredient: "Apramycin Sulfate", defaultProduct: "Meat", mrl: "0.2 mg/kg", withdrawalDays: 14, class: "Aminoglycoside", amrRisk: "Critical" },
  "Neomycin": { ingredient: "Neomycin Sulfate", defaultProduct: "Meat", mrl: "0.5 mg/kg", withdrawalDays: 14, class: "Aminoglycoside", amrRisk: "High Priority" },
  "Erythromycin": { ingredient: "Erythromycin", defaultProduct: "Meat", mrl: "0.2 mg/kg", withdrawalDays: 14, class: "Macrolide", amrRisk: "Highest Priority Critical" },
  "Florfenicol": { ingredient: "Florfenicol", defaultProduct: "Meat", mrl: "0.2 mg/kg", withdrawalDays: 15, class: "Amphenicol", amrRisk: "Veterinary Critical" },
  "Sulfadiazine + Trimethoprim": { ingredient: "Sulfadiazine + Trimethoprim", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 10, class: "Potentiated Sulfonamide", amrRisk: "Highly Important" },
  "Procaine Penicillin G": { ingredient: "Procaine Benzylpenicillin", defaultProduct: "Milk", mrl: "0.004 mg/kg", withdrawalDays: 5, class: "Beta-Lactam / Natural Penicillin", amrRisk: "High Priority" },
  "Ceftiofur": { ingredient: "Ceftiofur Hydrochloride", defaultProduct: "Milk", mrl: "0.1 mg/kg", withdrawalDays: 4, class: "Cephalosporin (3rd Gen)", amrRisk: "Highest Priority Critical (CIA)" },
  "Tulathromycin": { ingredient: "Tulathromycin", defaultProduct: "Meat", mrl: "0.1 mg/kg", withdrawalDays: 18, class: "Macrolide (Triamilide)", amrRisk: "Highest Priority Critical" },
  "Tilmicosin": { ingredient: "Tilmicosin Phosphate", defaultProduct: "Meat", mrl: "0.05 mg/kg", withdrawalDays: 28, class: "Macrolide", amrRisk: "Highest Priority Critical" },
  "Penicillin G + Streptomycin": { ingredient: "Procaine Penicillin G + Dihydrostreptomycin", defaultProduct: "Milk", mrl: "0.004 mg/kg", withdrawalDays: 5, class: "Beta-Lactam + Aminoglycoside", amrRisk: "High Priority Critical" }
};

export default function GiveMedicine() {
  const router = useRouter();
  const [selectedAnimalType, setSelectedAnimalType] = useState("Cow");

  const [formData, setFormData] = useState({
    animalType: "Cow",
    farmerId: "FR10293",
    tagId: "RJ-CW1",
    medicineName: "Procaine Penicillin G",
    activeIngredient: "Procaine Benzylpenicillin",
    dose: "15",
    doseUnit: "mg/kg",
    animalCount: "1",
    foodProduct: "Milk",
    duration: "5",
    route: "Intramuscular (IM)",
    dateAdministered: new Date().toISOString().split("T")[0]
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const runAiClinicalCheck = async () => {
    setAiLoading(true);
    try {
      const apiKey = localStorage.getItem("agriguard_gemini_api_key") || undefined;
      const res = await fetch("http://localhost:5000/api/v1/ai/clinical-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          animalType: selectedAnimalType,
          tagId: formData.tagId,
          medicineName: formData.medicineName,
          activeIngredient: formData.activeIngredient,
          dose: formData.dose + " mg/kg",
          route: formData.route,
          diagnosis: "Clinical AMU prescription for " + selectedAnimalType,
          apiKey
        })
      });
      const data = await res.json();
      setAiReview(data);
    } catch (err) {
      console.error("AI clinical check error:", err);
    } finally {
      setAiLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "VETERINARIAN") {
      router.push("/login");
    }
  }, [router]);

  // Dynamically Filtered Medicines for the Selected Animal
  const approvedMedicines = useMemo(() => {
    return ANIMAL_MEDICINE_MAP[selectedAnimalType] || [];
  }, [selectedAnimalType]);

  // Current active animal object
  const currentAnimalObj = useMemo(() => {
    return ANIMAL_CATEGORIES.find(a => a.id === selectedAnimalType) || ANIMAL_CATEGORIES[0];
  }, [selectedAnimalType]);

  // Current active drug info
  const selectedMedInfo = useMemo(() => {
    return MEDICINE_CATALOG[formData.medicineName] || {
      ingredient: formData.medicineName,
      defaultProduct: "Milk",
      mrl: "0.1 mg/kg",
      withdrawalDays: 7,
      class: "Antimicrobial",
      amrRisk: "Standard"
    };
  }, [formData.medicineName]);

  // Handle Animal Type Switch -> Automatically filters medicine dropdown
  const handleAnimalTypeChange = (newAnimalType) => {
    setSelectedAnimalType(newAnimalType);
    const validMeds = ANIMAL_MEDICINE_MAP[newAnimalType] || [];
    const firstMed = validMeds[0] || "Oxytetracycline";
    const animalObj = ANIMAL_CATEGORIES.find(a => a.id === newAnimalType);
    const medMeta = MEDICINE_CATALOG[firstMed] || {};

    let defaultProduct = animalObj?.defaultProduct || "Meat";
    if (newAnimalType === "Fish") defaultProduct = "Fish";
    else if (newAnimalType === "Prawn") defaultProduct = "Fish";
    else if (newAnimalType === "Chicken") defaultProduct = "Meat";

    setFormData(prev => ({
      ...prev,
      animalType: newAnimalType,
      tagId: animalObj?.quickTags?.[0] || prev.tagId,
      medicineName: firstMed,
      activeIngredient: medMeta.ingredient || firstMed,
      foodProduct: defaultProduct
    }));
    setError(null);
  };

  // Handle Medicine Selection
  const handleMedicineSelect = (medName) => {
    const meta = MEDICINE_CATALOG[medName] || {};
    setFormData(prev => ({
      ...prev,
      medicineName: medName,
      activeIngredient: meta.ingredient || medName,
      foodProduct: meta.defaultProduct || prev.foodProduct
    }));
    setError(null);
  };

  // Computed safe clearance date preview
  const safeDatePreview = useMemo(() => {
    const d = new Date(formData.dateAdministered || new Date());
    d.setDate(d.getDate() + (selectedMedInfo.withdrawalDays || 7));
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [formData.dateAdministered, selectedMedInfo]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/v1/treatments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          animalType: selectedAnimalType,
          dose: parseFloat(formData.dose),
          animalCount: parseInt(formData.animalCount),
          duration: parseInt(formData.duration)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to log treatment");

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Blockchain hash copied to clipboard!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Prescribe Antimicrobial (AMU)</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
              Dynamic Animal-Wise Medicines
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Select an animal species to automatically filter approved statutory antimicrobial drugs, compute deterministic withdrawal hold intervals, and log cryptographic proofs on-chain.
          </p>
        </div>
      </div>

      {result ? (
        /* Success Screen */
        <div className="bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-8 backdrop-blur-md shadow-2xl space-y-6 max-w-3xl mx-auto animate-in zoom-in-95">
          <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-2xl font-bold text-white">Prescription Signed &amp; Quarantined</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  Hold Active
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Regimen ID: {result.treatment?.id || "TX-" + Date.now()} • Target: {selectedAnimalType} ({formData.tagId})
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-white font-semibold">Statutory Milk / Meat Quarantine Initiated</strong>
              <span>Target livestock ({formData.tagId}) is flagged on the public blockchain. Clearance certified on: <strong>{new Date(result.withdrawal?.safeFromDate || Date.now() + 7*86400000).toLocaleDateString()}</strong>.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">Prescribed Drug</span>
              <strong className="text-white text-sm">{result.treatment?.medicineName}</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">Target Tag</span>
              <strong className="text-cyan-400 font-mono text-sm">{formData.tagId}</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">Withdrawal Hold</span>
              <strong className="text-amber-400 text-sm">{result.withdrawal?.withdrawalPeriod || 7} Days</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">Safe Harvest Date</span>
              <strong className="text-emerald-400 text-sm font-mono">{new Date(result.withdrawal?.safeFromDate || Date.now() + 7*86400000).toLocaleDateString()}</strong>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold text-white block">Digital Prescription Certified</span>
                <span className="text-slate-400 text-[11px]">SHA-256 state proof dispatched to national AMU repository</span>
              </div>
            </div>
            <button
              onClick={() => copyHash(result.blockchainRecord?.hash || "0x" + Math.random().toString(16).slice(2))}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Copy className="w-3.5 h-3.5" /> Copy Ledger Hash
            </button>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => setResult(null)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors shadow-lg shadow-cyan-500/20"
            >
              + Issue Another Prescription
            </button>
            <Link
              href="/vet"
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Back to Vet Dashboard &rarr;
            </Link>
          </div>
        </div>
      ) : (
        /* Form & Live Withdrawal Radar */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-7 backdrop-blur-sm space-y-6">
            <div className="border-b border-slate-800/80 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Pill className="w-5 h-5 text-cyan-400" />
                Prescription Parameters
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Select animal type to dynamically filter statutory approved drugs.
              </p>
            </div>

            {error && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 font-medium animate-in shake">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Step 1: Animal Type Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>1. Select Animal Type *</span>
                <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                  <Filter className="w-3 h-3" /> Dynamic Filtering
                </span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {ANIMAL_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleAnimalTypeChange(cat.id)}
                    className={`text-xs px-3 py-2 rounded-xl border font-medium transition-all text-left flex items-center justify-between ${
                      selectedAnimalType === cat.id
                        ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-md shadow-cyan-500/10"
                        : "bg-slate-950/80 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    <span>{cat.label}</span>
                    {selectedAnimalType === cat.id && <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: Dynamic Medicine Selection */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  2. Approved Medicines for <span className="text-cyan-400">{currentAnimalObj.label}</span> *
                </label>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {approvedMedicines.length} Approved Drugs
                </span>
              </div>

              {/* Medicine Dropdown */}
              <select
                value={formData.medicineName}
                onChange={(e) => handleMedicineSelect(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 transition-colors"
              >
                {approvedMedicines.map(med => (
                  <option key={med} value={med}>
                    {med} (Hold: {MEDICINE_CATALOG[med]?.withdrawalDays || 7}d)
                  </option>
                ))}
              </select>

              {/* Quick Pills for Approved Medicines */}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {approvedMedicines.map(med => (
                  <button
                    key={med}
                    type="button"
                    onClick={() => handleMedicineSelect(med)}
                    className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                      formData.medicineName === med
                        ? "bg-cyan-500/25 text-cyan-200 border-cyan-500/50 font-bold"
                        : "bg-slate-950/60 text-slate-400 hover:text-slate-200 border-slate-800"
                    }`}
                  >
                    {med}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-2 border-t border-slate-800/80">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Farmer ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.farmerId}
                    onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Target Animal Tag ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagId}
                    onChange={(e) => setFormData({ ...formData, tagId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-800 text-cyan-400 font-mono font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  {/* Tag quick pick */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">Suggested {selectedAnimalType} Tags:</span>
                    {currentAnimalObj.quickTags?.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tagId: t })}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                          formData.tagId === t
                            ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-300 border-transparent"
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Active Ingredient
                  </label>
                  <input
                    type="text"
                    disabled
                    value={formData.activeIngredient}
                    className="w-full bg-slate-950/60 border border-slate-800 text-slate-400 rounded-xl px-4 py-2.5 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Restricted Food Commodity *
                  </label>
                  <select
                    value={formData.foodProduct}
                    onChange={(e) => setFormData({ ...formData, foodProduct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Milk">Milk (Dairy)</option>
                    <option value="Meat">Meat (Carcass)</option>
                    <option value="Eggs">Eggs (Poultry)</option>
                    <option value="Fish">Fish / Aquaculture</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Dose (mg/kg) *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={formData.dose}
                    onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Duration (Days) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Route *
                  </label>
                  <select
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Oral">Oral (Feed / Water)</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={runAiClinicalCheck}
                  disabled={aiLoading}
                  className="bg-slate-900 border border-cyan-500/50 hover:bg-cyan-500/10 text-cyan-300 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-md shadow-cyan-500/10 flex items-center gap-2"
                >
                  {aiLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300" />}
                  <span>✨ Run Gen AI Safety Check</span>
                </button>

                <div className="flex items-center gap-3">
                  <Link
                    href="/vet"
                    className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? "Signing & Quarantining..." : "Sign & Commit Prescription"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Live Withdrawal & MRL Radar */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 border border-cyan-500/30 rounded-2xl p-6 shadow-xl space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block font-bold">
                  Statutory Food Safety Radar
                </span>
                <h3 className="text-lg font-bold text-white">Live Compliance Preview</h3>
              </div>
              <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Target Species</span>
                  <span className="text-cyan-400 font-bold">{currentAnimalObj.label}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Antimicrobial Drug</span>
                  <span className="text-white font-medium">{formData.medicineName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Antimicrobial Class</span>
                  <span className="text-slate-300">{selectedMedInfo.class}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">AMR Criticality</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    {selectedMedInfo.amrRisk}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">FSSAI Legal MRL</span>
                  <span className="font-mono text-cyan-300 font-bold">{selectedMedInfo.mrl}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Required Withdrawal Period</span>
                  <span className="font-bold text-amber-400">{selectedMedInfo.withdrawalDays} Days Hold</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Safe Harvest Clearance</span>
                  <span className="font-mono text-emerald-400 font-bold">{safeDatePreview}</span>
                </div>
              </div>

              {/* Notice */}
              <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-slate-300 text-[11px] leading-relaxed">
                <strong className="text-white block mb-1">Prudent Antimicrobial Use Mandate</strong>
                Prescribing <strong className="text-white">{formData.medicineName}</strong> for <strong className="text-cyan-400">{currentAnimalObj.label} ({formData.tagId})</strong> attaches an immutable withdrawal hold on the blockchain until {safeDatePreview}.
              </div>

              {/* Gen AI Clinical Review Card */}
              {aiReview && (
                <div className="p-4 rounded-xl bg-slate-950/95 border border-cyan-500/50 space-y-2.5 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Gen AI Clinical Advisory
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold">
                      Safety: {"★".repeat(aiReview.safetyRating || 4)}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{aiReview.clinicalRationale}</p>
                  <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px]">
                    <strong>Farmer Instruction:</strong> {aiReview.farmerGuidance}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
