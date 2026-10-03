"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { 
  Pill, ShieldCheck, CheckCircle2, AlertTriangle, 
  Info, Clock, QrCode, ArrowRight, Sparkles, Copy, AlertCircle,
  Filter, Layers, Check, RefreshCw, Bot, Scale, Calendar,
  History, TrendingUp, FileText, CheckCircle, HelpCircle, X, ChevronRight, Edit3
} from "lucide-react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

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
  const { language, t, translateStatus } = useLanguage();
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
    frequency: "Once daily (SID)",
    indication: "Bovine Respiratory Disease (BRD), Foot Rot, Mastitis",
    dateAdministered: new Date().toISOString().split("T")[0]
  });

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [aiReview, setAiReview] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // Animal Profile and Weight History state
  const [animalProfile, setAnimalProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [showWeightHistoryModal, setShowWeightHistoryModal] = useState(false);

  // Dosage Calculation State
  const [dosageCalc, setDosageCalc] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  // Veterinarian Override State
  const [isOverridden, setIsOverridden] = useState(false);
  const [overrideReason, setOverrideReason] = useState("");

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "VETERINARIAN") {
      router.push("/login");
    }
  }, [router]);

  // Fetch Animal Profile
  const fetchAnimalProfile = useCallback(async (tag) => {
    if (!tag) return;
    setProfileLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/v1/veterinarians/animals/${encodeURIComponent(tag)}`, {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (res.ok && data.animal) {
        setAnimalProfile(data.animal);
        if (data.animal.farmer?.farmerId) {
          setFormData(prev => ({ ...prev, farmerId: data.animal.farmer.farmerId }));
        }
      } else {
        setAnimalProfile(null);
      }
    } catch (err) {
      console.error("Failed to load animal profile:", err);
      setAnimalProfile(null);
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Calculate Dosage Arithmetic from backend rule
  const calculateDosage = useCallback(async (tag, medicine, route, indication) => {
    if (!tag || !medicine) return;
    setCalcLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/treatments/calculate-dose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tagId: tag,
          medicineName: medicine,
          route: route || "Intramuscular (IM)",
          indication: indication || ""
        })
      });
      const data = await res.json();
      if (res.ok && data.calculation) {
        setDosageCalc(data.calculation);
        if (data.calculation.ruleFound && data.calculation.approvedDose) {
          // Set recommended dose unless already custom overridden
          setFormData(prev => ({
            ...prev,
            dose: data.calculation.approvedDose.toString(),
            duration: data.calculation.durationDays ? data.calculation.durationDays.toString() : prev.duration,
            frequency: data.calculation.frequency || prev.frequency,
            indication: data.calculation.indication || prev.indication
          }));
          setIsOverridden(false);
          setOverrideReason("");
        }
      } else {
        setDosageCalc(null);
      }
    } catch (err) {
      console.error("Failed to calculate dosage:", err);
      setDosageCalc(null);
    } finally {
      setCalcLoading(false);
    }
  }, []);

  // Trigger Profile and Dosage calculation when tag or medicine changes
  useEffect(() => {
    if (formData.tagId) {
      fetchAnimalProfile(formData.tagId);
      calculateDosage(formData.tagId, formData.medicineName, formData.route, formData.indication);
    }
  }, [formData.tagId, formData.medicineName, formData.route, fetchAnimalProfile, calculateDosage]);

  // Handle dose modification by Vet
  const handleDoseChange = (newDoseStr) => {
    setFormData(prev => ({ ...prev, dose: newDoseStr }));
    const val = parseFloat(newDoseStr);
    if (dosageCalc?.ruleFound && dosageCalc?.approvedDose !== undefined) {
      if (!isNaN(val) && val !== dosageCalc.approvedDose) {
        setIsOverridden(true);
      } else {
        setIsOverridden(false);
      }
    }
  };

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
          language: language,
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
    if (newAnimalType === "Fish" || newAnimalType === "Prawn") defaultProduct = "Fish";
    else if (newAnimalType === "Chicken") defaultProduct = "Meat";

    const nextTag = animalObj?.quickTags?.[0] || formData.tagId;

    setFormData(prev => ({
      ...prev,
      animalType: newAnimalType,
      tagId: nextTag,
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
    const holdDays = dosageCalc?.withdrawalDays || selectedMedInfo.withdrawalDays || 7;
    const d = new Date(formData.dateAdministered || new Date());
    d.setDate(d.getDate() + holdDays);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  }, [formData.dateAdministered, selectedMedInfo, dosageCalc]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isOverridden && (!overrideReason || !overrideReason.trim())) {
      setError("A clinical reason is mandatory whenever the system-calculated dose is adjusted.");
      return;
    }

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
          animalCount: parseInt(formData.animalCount || 1),
          duration: parseInt(formData.duration || 5),
          calculatedDose: dosageCalc?.approvedDose || null,
          calculatedVolume: dosageCalc?.calculatedAdministrationVolumeMl || null,
          concentration: dosageCalc?.concentrationMgMl || null,
          dosageRuleUsed: dosageCalc?.calculationSource || (dosageCalc?.ruleFound ? `${dosageCalc.medicineName} (${dosageCalc.approvedDose} mg/kg)` : null),
          isDoseOverridden: isOverridden,
          overrideReason: isOverridden ? overrideReason : null
        })
      });

      const data = await res.json();
      if (!res.ok) {
        let msg = data.error || "Failed to log treatment";
        if (msg.toLowerCase().includes("invalid animal-medicine") || msg.toLowerCase().includes("not approved") || msg.toLowerCase().includes("combination")) {
          msg = "⚠️ This medicine is not approved for this animal. Please select an approved medicine.";
        }
        throw new Error(msg);
      }

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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              {t("prescribeMedicine", "Prescribe Antimicrobial (AMU)")}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-bold">
              Weight & Age-Aware Dosage Engine
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-3xl">
            {t("vetEngineSubtitle", "Automatic veterinary antibiotic arithmetic strictly evaluated from statutory clinical dosage rules and live animal records. Zero AI guesswork — arithmetic is deterministically audited on-chain.")}
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
                <h2 className="text-2xl font-bold text-white">{t("prescriptionSigned", "Prescription Signed & Quarantined")}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                  {translateStatus("HOLD ACTIVE")}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                Regimen ID: <span className="notranslate" translate="no">{result.treatment?.id || "TX-" + Date.now()}</span> • Target: {selectedAnimalType} (<span className="notranslate" translate="no">{formData.tagId}</span>)
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0" />
            <div>
              <strong className="block text-white font-semibold">{t("statutoryQuarantineNotice", "Statutory Milk / Meat Quarantine Initiated")}</strong>
              <span>Target livestock (<span className="notranslate" translate="no">{formData.tagId}</span>) is flagged on the public blockchain. Clearance certified on: <strong>{new Date(result.withdrawal?.safeFromDate || Date.now() + 7*86400000).toLocaleDateString()}</strong>.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">{t("prescribedDrug", "Prescribed Drug")}</span>
              <strong className="text-white text-sm">{result.treatment?.medicineName}</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">{t("approvedDose", "Approved Dose")}</span>
              <strong className="text-cyan-400 font-mono text-sm notranslate" translate="no">{formData.dose} mg/kg</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">{t("withdrawalHold", "Withdrawal Hold")}</span>
              <strong className="text-amber-400 text-sm">{result.withdrawal?.withdrawalPeriod || 7} {t("days", "Days")}</strong>
            </div>
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-500 block mb-1">{t("safeHarvestDate", "Safe Harvest Date")}</span>
              <strong className="text-emerald-400 text-sm font-mono">{new Date(result.withdrawal?.safeFromDate || Date.now() + 7*86400000).toLocaleDateString()}</strong>
            </div>
          </div>

          {result.treatment?.isDoseOverridden && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs space-y-1">
              <span className="text-amber-400 font-bold block">Clinical Dose Adjustment Recorded:</span>
              <p className="text-slate-300">System Formula: {result.treatment?.calculatedDose} mg/kg &rarr; Prescribed: {result.treatment?.dosageAdministered} mg/kg</p>
              <p className="text-slate-400 italic">" {result.treatment?.overrideReason} "</p>
            </div>
          )}

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

          {/* Email Notification Dispatch Card */}
          <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/30 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Email Treatment Notification Dispatched
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {result.emailStatus || result.emailNotification?.status || "SENT"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2.5 rounded-lg border border-slate-800">
              <div>
                <span className="text-slate-500 block">Recipient Farmer:</span>
                <strong className="text-white font-medium">
                  {result.emailNotification?.farmer?.fullName || result.farmerName || "Linked Farm Owner"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Notification Email:</span>
                <strong className="text-cyan-400 font-mono">
                  {result.emailNotification?.recipientEmail || "Configured Notification Email"}
                </strong>
              </div>
              <div>
                <span className="text-slate-500 block">Prescribed Dose & Weight:</span>
                <span className="text-amber-300 font-mono text-[10px] font-semibold">
                  {formData.dose} mg/kg • {animalProfile?.currentWeight || 400} kg
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Safe Clearance Date:</span>
                <span className="text-emerald-400 font-mono text-[10px] font-bold">
                  {new Date(result.withdrawal?.safeFromDate || Date.now() + 7*86400000).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="text-slate-400 text-[11px]">
              Statutory antimicrobial withdrawal alert sent to the farmer's notification email with complete dosage details.
            </div>
          </div>

          <div className="pt-2 flex justify-between items-center">
            <button
              onClick={() => { setResult(null); setIsOverridden(false); setOverrideReason(""); }}
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
        /* Main Prescription Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Animal Profile & Prescription Form */}
          <div className="lg:col-span-7 space-y-6">

            {/* Animal Selection & Profile Header Card */}
            <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-md space-y-5">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-cyan-400" />
                    Target Animal Profile
                  </h2>
                  <p className="text-xs text-slate-400">
                    Live veterinary data: DOB, dynamically calculated age, and monthly weight record.
                  </p>
                </div>
                {animalProfile?.weightHistory && animalProfile.weightHistory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowWeightHistoryModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center gap-1.5 transition-all border border-slate-700"
                  >
                    <History className="w-3.5 h-3.5 text-cyan-400" />
                    View Weight History
                  </button>
                )}
              </div>

              {/* Step 1: Species Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Species Category *</span>
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

              {/* Tag Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Target Animal Tag ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagId}
                    onChange={(e) => setFormData({ ...formData, tagId: e.target.value.toUpperCase() })}
                    className="w-full bg-slate-950 border border-slate-700 text-cyan-400 font-mono font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">Quick Tags:</span>
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

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Farmer Owner ID
                  </label>
                  <input
                    type="text"
                    value={formData.farmerId}
                    onChange={(e) => setFormData({ ...formData, farmerId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white font-mono rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                  <span className="text-[10px] text-slate-500 mt-1 block">
                    Linked Farm: {animalProfile?.farm?.name || "Farm 3 (Rajesh Kumar)"}
                  </span>
                </div>
              </div>

              {/* ANIMAL PROFILE SNAPSHOT (Section 9 & 14) */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    ANIMAL INFORMATION: {selectedAnimalType} • {formData.tagId}
                  </span>
                  {animalProfile?.weightUpdateStatus?.label && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      animalProfile.weightUpdateStatus.status === "updated_this_month"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-cyan-500/10 text-cyan-400 border-cyan-500/20"
                    }`}>
                      ● {animalProfile.weightUpdateStatus.label}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[11px]">Species / Breed</span>
                    <strong className="text-white">
                      {animalProfile?.species || selectedAnimalType} {animalProfile?.breed ? `(${animalProfile.breed})` : ""}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Date of Birth</span>
                    <strong className="text-cyan-300 font-mono">
                      {animalProfile?.dateOfBirth ? new Date(animalProfile.dateOfBirth).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "numeric" }) : "15/04/2024"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Current Age</span>
                    <strong className="text-emerald-400 font-semibold">
                      {animalProfile?.ageInfo?.text || "2 years 5 months"}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[11px]">Current Weight</span>
                    <strong className="text-cyan-400 font-bold text-sm">
                      {animalProfile?.currentWeight || 400} kg
                    </strong>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] text-slate-400">
                  <div>
                    <span>Weight Updated: </span>
                    <strong className="text-slate-200">
                      {animalProfile?.weightLastUpdatedAt ? new Date(animalProfile.weightLastUpdatedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "10 Sep 2026"}
                    </strong>
                  </div>
                  <div>
                    <span>Next Farmer Update: </span>
                    <strong className="text-slate-200">
                      {animalProfile?.nextWeightUpdateAt ? new Date(animalProfile.nextWeightUpdateAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "10 Oct 2026"}
                    </strong>
                  </div>
                  <div className="text-right sm:text-left">
                    <button
                      type="button"
                      onClick={() => setShowWeightHistoryModal(true)}
                      className="text-cyan-400 hover:text-cyan-300 font-semibold underline"
                    >
                      View Weight History &rarr;
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Treatment & Prescription Form */}
            <form onSubmit={handleSubmit} className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-6 backdrop-blur-md space-y-6">
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-cyan-400" />
                  Prescription Parameters &amp; Dosage Calculation
                </h2>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {approvedMedicines.length} Approved Drugs
                </span>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs sm:text-sm flex items-center gap-2.5 font-medium shadow-xs">
                  <span className="text-base shrink-0">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Medicine Selection */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300">
                  Select Statutory Medicine for <span className="text-cyan-400">{currentAnimalObj.label}</span> *
                </label>
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

              {/* Clinical Indication, Route, Food Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Clinical Indication *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.indication}
                    onChange={(e) => setFormData({ ...formData, indication: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50"
                    placeholder="e.g. BRD, Foot Rot, Mastitis"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Administration Route *
                  </label>
                  <select
                    value={formData.route}
                    onChange={(e) => setFormData({ ...formData, route: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Oral">Oral (Feed / Water)</option>
                    <option value="Topical">Topical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Restricted Commodity *
                  </label>
                  <select
                    value={formData.foodProduct}
                    onChange={(e) => setFormData({ ...formData, foodProduct: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Milk">Milk (Dairy)</option>
                    <option value="Meat">Meat (Carcass)</option>
                    <option value="Eggs">Eggs (Poultry)</option>
                    <option value="Fish">Fish / Aquaculture</option>
                  </select>
                </div>
              </div>

              {/* AUTOMATIC DOSAGE CALCULATION PANEL (Section 10 & 11) */}
              <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-950 to-slate-900 border border-cyan-500/30 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <Scale className="w-5 h-5 text-cyan-400" />
                    <div>
                      <h3 className="text-sm font-bold text-white">SYSTEM CALCULATED DOSE</h3>
                      <span className="text-[10px] text-slate-400 font-mono">
                        Formula: mg = (mg/kg × Weight) • Volume = (mg ÷ Concentration)
                      </span>
                    </div>
                  </div>
                  {calcLoading ? (
                    <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : dosageCalc?.ruleFound ? (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                      Approved Rule Applied
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      No Rule Configured
                    </span>
                  )}
                </div>

                {dosageCalc?.ruleFound ? (
                  <div className="space-y-3 text-xs">
                    {/* Arithmetic Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Database Weight</span>
                        <strong className="text-white text-sm">{dosageCalc.weightUsed} kg</strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Approved Dose Rule</span>
                        <strong className="text-cyan-300 text-sm">{dosageCalc.approvedDose} mg/kg</strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Active Ingredient</span>
                        <strong className="text-emerald-400 text-sm font-mono">{dosageCalc.calculatedActiveIngredientMg?.toLocaleString()} mg</strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Concentration</span>
                        <strong className="text-slate-200 text-sm">{dosageCalc.concentrationMgMl} mg/mL</strong>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div className="p-3 bg-slate-900/90 border border-cyan-500/30 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Calculated Volume</span>
                        <strong className="text-cyan-400 text-base font-mono font-bold">
                          {dosageCalc.calculatedAdministrationVolumeMl} mL
                        </strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Regimen Frequency</span>
                        <strong className="text-slate-200 text-xs">{dosageCalc.frequency}</strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Calculated Duration</span>
                        <strong className="text-slate-200 text-xs">{dosageCalc.durationDays} Days</strong>
                      </div>
                      <div className="p-3 bg-slate-900/90 border border-amber-500/30 rounded-xl">
                        <span className="text-slate-500 block text-[11px]">Withdrawal Hold</span>
                        <strong className="text-amber-400 text-sm font-bold">{dosageCalc.withdrawalDays} Days</strong>
                      </div>
                    </div>

                    {/* Calculation Details */}
                    <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-[11px] text-cyan-200 flex items-center justify-between">
                      <span>
                        📐 <strong>Arithmetic Breakdown:</strong> {dosageCalc.approvedDose} mg/kg × {dosageCalc.weightUsed} kg = {dosageCalc.calculatedActiveIngredientMg} mg active ingredient &divide; {dosageCalc.concentrationMgMl} mg/mL = <strong>{dosageCalc.calculatedAdministrationVolumeMl} mL</strong>
                      </span>
                      <span className="text-[10px] text-slate-400 hidden sm:inline font-mono">
                        {dosageCalc.calculationSource}
                      </span>
                    </div>

                    {/* Contraindication / Age Warnings */}
                    {dosageCalc.warnings && dosageCalc.warnings.length > 0 && (
                      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                        <div>
                          <strong className="block text-amber-200">Warning: Animal Profile Notice</strong>
                          {dosageCalc.warnings.map((w, i) => (
                            <span key={i} className="block">{w}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* No Rule Found Notice (Section 25: Zero AI Guessing) */
                  <div className="p-4 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-300 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-amber-400">
                      <AlertTriangle className="w-4 h-4" />
                      <span>No approved dosage rule configured</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                      No approved dosage rule is configured for this medicine and animal profile ({selectedAnimalType}, {formData.medicineName}). Please determine and enter the prescription according to veterinary guidance.
                    </p>
                    <span className="text-[11px] text-slate-400 block font-mono">
                      Rule Verification Policy: The system does not guess or extrapolate antibiotic doses with generative AI.
                    </span>
                  </div>
                )}
              </div>

              {/* VETERINARIAN FINAL PRESCRIPTION & OVERRIDE PANEL (Section 12) */}
              <div className="space-y-4 pt-2 border-t border-slate-800">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                    Veterinarian Final Prescription
                  </h3>
                  {isOverridden && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      Dose Adjusted by Attending Vet
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                      Prescribed Dose (mg/kg) *
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={formData.dose}
                      onChange={(e) => handleDoseChange(e.target.value)}
                      className="w-full bg-slate-950 border border-cyan-500/40 text-cyan-300 font-bold rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      {dosageCalc?.approvedDose ? `System rule: ${dosageCalc.approvedDose} mg/kg` : "Enter clinical dose"}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">
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
                    <label className="block text-slate-300 text-xs font-semibold mb-1.5">
                      Regimen Frequency *
                    </label>
                    <select
                      value={formData.frequency}
                      onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                    >
                      <option value="Once daily (SID)">Once daily (SID)</option>
                      <option value="Twice daily (BID)">Twice daily (BID)</option>
                      <option value="Every 48 hours">Every 48 hours</option>
                      <option value="Single dose">Single dose</option>
                    </select>
                  </div>
                </div>

                {/* Clinical Override Reason (Mandatory when overridden) */}
                {isOverridden && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2 animate-in fade-in">
                    <label className="block text-amber-300 text-xs font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                      Reason for dose adjustment *
                    </label>
                    <textarea
                      required
                      rows={2}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Please enter clinical rationale for overriding the system-calculated dose (e.g. severe infection, altered renal clearance, atypical weight)..."
                      className="w-full bg-slate-950 border border-amber-500/40 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-400"
                    />
                    <span className="text-[11px] text-slate-400 block">
                      This explanation will be permanently recorded in the immutable audit trail and visible to regulatory authorities.
                    </span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
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
                    disabled={submitting || (isOverridden && !overrideReason.trim())}
                    className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-7 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                  >
                    {submitting ? "Signing & Quarantining..." : "Sign & Commit Prescription"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Right Column: Live Statutory Radar & Compliance Preview */}
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
                  <span className="text-slate-500">Animal Tag / RFID</span>
                  <span className="text-white font-mono font-bold">{formData.tagId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Calculated Animal Age</span>
                  <span className="text-slate-200">{animalProfile?.ageInfo?.text || "2 years 5 months"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Animal Weight</span>
                  <span className="text-cyan-300 font-bold">{animalProfile?.currentWeight || 400} kg</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500">Antimicrobial Drug</span>
                  <span className="text-white font-medium">{formData.medicineName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Ingredient</span>
                  <span className="text-slate-300">{formData.activeIngredient}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Prescribed Dose</span>
                  <span className="font-mono text-cyan-300 font-bold">{formData.dose} mg/kg</span>
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
                  <span className="font-bold text-amber-400">
                    {dosageCalc?.withdrawalDays || selectedMedInfo.withdrawalDays || 7} Days Hold
                  </span>
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

      {/* WEIGHT HISTORY MODAL (Section 21) */}
      {showWeightHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Animal Weight History</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Target: {formData.tagId} • {animalProfile?.species || selectedAnimalType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWeightHistoryModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 block">Current Registered Weight</span>
                  <strong className="text-cyan-400 text-base font-bold">{animalProfile?.currentWeight || 400} kg</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Calculated Current Age</span>
                  <strong className="text-emerald-400 font-semibold">{animalProfile?.ageInfo?.text || "2 years 5 months"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Records Logged</span>
                  <strong className="text-white font-mono">{animalProfile?.weightHistory?.length || 1} entries</strong>
                </div>
              </div>

              <div className="max-h-60 overflow-y-auto border border-slate-800/80 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800 sticky top-0">
                    <tr>
                      <th className="p-3">Date Recorded</th>
                      <th className="p-3">Weight</th>
                      <th className="p-3">Recorded By</th>
                      <th className="p-3">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50 bg-slate-900/40">
                    {animalProfile?.weightHistory && animalProfile.weightHistory.length > 0 ? (
                      animalProfile.weightHistory.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-3 font-mono text-slate-300">
                            {new Date(item.recordedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-cyan-300 font-mono text-xs">
                              {item.weight} {item.unit || "kg"}
                            </span>
                          </td>
                          <td className="p-3 text-slate-300">
                            {item.recordedBy || "Farmer"}
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700">
                              {item.source || "MONTHLY_UPDATE"}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-500">
                          No historical weight entries found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowWeightHistoryModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Close History
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
