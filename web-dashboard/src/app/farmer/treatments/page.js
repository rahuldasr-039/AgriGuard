"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Activity, Syringe, Pill, Search, Filter, Calendar, 
  ShieldCheck, CheckCircle2, Clock, X, FileText, ChevronRight,
  AlertTriangle, Copy, Check, ExternalLink, RefreshCw, AlertCircle
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/**
 * Combined Treatment Record + Withdrawal Dashboard (Requirement 4)
 * Unifies prescription details with statutory withdrawal periods, safe dates, and hold alerts.
 */
export default function CombinedFarmerTreatmentsAndWithdrawal() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | Medicine | Vaccine
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | WAIT | SAFE
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { t, translateStatus } = useLanguage();

  const loadData = async () => {
    setLoading(true);
    let token = localStorage.getItem("token");

    try {
      if (!token) {
        const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "farmer1@gmail.com", password: "Password@123" })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          token = loginData.token;
          localStorage.setItem("token", token);
          localStorage.setItem("userRole", "FARMER");
          if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));
        }
      }

      const [treatRes, withRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/treatments/my-treatments", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/treatments/my-withdrawals", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      const [treatData, withData] = await Promise.all([
        treatRes.ok ? treatRes.json() : [],
        withRes.ok ? withRes.json() : []
      ]);

      setTreatments(Array.isArray(treatData) ? treatData : []);
      setWithdrawals(Array.isArray(withData) ? withData : []);
    } catch (err) {
      console.error("Failed to fetch treatments & withdrawals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [router]);

  // Combine treatments with their withdrawal countdown metadata
  const unifiedRecords = useMemo(() => {
    const withMap = new Map();
    withdrawals.forEach(w => {
      // Map by tag + medicine or id
      if (w.id) withMap.set(w.id, w);
      if (w.tag) withMap.set(`${w.tag}-${w.medicine}`, w);
    });

    return treatments.map(t => {
      const w = withMap.get(t.id) || withMap.get(`${t.tag}-${t.medicine}`) || {};
      const safeDateObj = new Date(t.safeFromDate || w.safeFrom || Date.now());
      const now = new Date();
      const diffMs = safeDateObj - now;
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
      const isUnderWithdrawal = daysRemaining > 0 && (t.status === "Active" || w.status === "WAIT");

      return {
        ...t,
        withdrawalPeriod: t.withdrawalDays || w.period || 0,
        safeDate: safeDateObj,
        daysRemaining,
        isUnderWithdrawal,
        targetProduct: w.product || (t.type === "Vaccine" ? "None" : "Milk / Meat"),
        withdrawalStatus: isUnderWithdrawal ? "WAIT" : "SAFE",
        emailNotification: w.emailNotification || null
      };
    });
  }, [treatments, withdrawals]);

  // Active Quarantine count
  const activeQuarantineList = useMemo(() => {
    return unifiedRecords.filter(r => r.isUnderWithdrawal);
  }, [unifiedRecords]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    return unifiedRecords.filter(r => {
      // Type Filter
      if (typeFilter === "Medicine" && r.type !== "Medicine") return false;
      if (typeFilter === "Vaccine" && r.type !== "Vaccine") return false;

      // Status Filter
      if (statusFilter === "WAIT" && !r.isUnderWithdrawal) return false;
      if (statusFilter === "SAFE" && r.isUnderWithdrawal) return false;

      // Search Query
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const tag = (r.tag || "").toLowerCase();
        const med = (r.medicine || "").toLowerCase();
        const animal = (r.animal || "").toLowerCase();
        const vet = (r.vet || "").toLowerCase();
        return tag.includes(q) || med.includes(q) || animal.includes(q) || vet.includes(q);
      }
      return true;
    });
  }, [unifiedRecords, typeFilter, statusFilter, searchTerm]);

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setToastMessage(`${label} copied to clipboard!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-6 sm:p-8 pb-24 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1.5">
            <span className="text-2xl">💊</span>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              {t("treatmentAndWithdrawal")}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
              {t("connectedPortal")}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500">
            {t("unifiedPrescriptionRecordsDesc")}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={loadData}
            className="p-2.5 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
            title={t("sync")}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${loading ? "animate-spin" : ""}`} />
            <span>{t("sync")}</span>
          </button>
          <Link
            href="/farmer/subsidies"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
          >
            <span>{t("wasteSubsidiesAndDBT")}</span>
          </Link>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("totalTreatments")}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">{unifiedRecords.length}</span>
            <span className="text-xs text-slate-500">{t("records")}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{t("prescribedByCertifiedVets")}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("underWithdrawalHold")}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-amber-600">{activeQuarantineList.length}</span>
            <span className="text-xs text-amber-700 font-semibold">{t("animalsUnit")}</span>
          </div>
          <span className="text-[11px] text-amber-700 mt-1 block">{t("discardMilkUntilSafe")}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("safeAndCleared")}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-emerald-600">
              {unifiedRecords.filter(r => !r.isUnderWithdrawal).length}
            </span>
            <span className="text-xs text-emerald-700 font-semibold">{t("animalsUnit")}</span>
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block">{t("mrlCompliant100")}</span>
        </div>

        <div className="p-4 rounded-xl bg-white border border-gray-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t("vaccinationsLogged")}</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-slate-800">
              {unifiedRecords.filter(r => r.type === "Vaccine").length}
            </span>
            <span className="text-xs text-slate-500">{t("doses")}</span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">{t("zeroDayWithholding")}</span>
        </div>
      </div>

      {/* Critical Active Withdrawal Warning Banner (if any quarantined) */}
      {activeQuarantineList.length > 0 ? (
        <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 shadow-xs space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <h3 className="text-base font-bold text-amber-900">
                {t("activeWithdrawalWarning")} ({activeQuarantineList.length} {t("livestockAnimalsOnHold")})
              </h3>
              <p className="text-xs text-amber-800">
                {t("statutoryFSSAIWarning")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {activeQuarantineList.map(item => (
              <div key={item.id} className="p-3 bg-white rounded-xl border border-amber-200 shadow-xs flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-800 text-xs">{item.animal}</span>
                    <span className="text-[10px] font-mono text-slate-500 notranslate" translate="no">({item.tag})</span>
                  </div>
                  <p className="text-[11px] text-amber-800 font-semibold notranslate" translate="no">{item.medicine}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 block">
                    {item.daysRemaining} {t("daysLeft")}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">
                    {t("safeDate")}: {item.safeDate.toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs flex items-center gap-3">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="text-sm font-bold text-emerald-900">{t("allLivestockSafeForHarvest")}</h4>
            <p className="text-xs text-emerald-800">{t("zeroActiveWithdrawalDesc")}</p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchTreatmentsPlaceholder")}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 focus:outline-none shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Type Filter */}
          <div className="flex items-center rounded-xl bg-gray-50 p-1 border border-gray-200 text-xs">
            <button
              onClick={() => setTypeFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${typeFilter === "ALL" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("allTypes")}
            </button>
            <button
              onClick={() => setTypeFilter("Medicine")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${typeFilter === "Medicine" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("medicine")}
            </button>
            <button
              onClick={() => setTypeFilter("Vaccine")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${typeFilter === "Vaccine" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("vaccines")}
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex items-center rounded-xl bg-gray-50 p-1 border border-gray-200 text-xs">
            <button
              onClick={() => setStatusFilter("ALL")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "ALL" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("allStatus")}
            </button>
            <button
              onClick={() => setStatusFilter("WAIT")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "WAIT" ? "bg-white text-amber-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("holdActive")}
            </button>
            <button
              onClick={() => setStatusFilter("SAFE")}
              className={`px-3 py-1 rounded-lg font-medium transition-all ${statusFilter === "SAFE" ? "bg-white text-emerald-800 font-bold shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
            >
              {t("safeCleared")}
            </button>
          </div>
        </div>
      </div>

      {/* Connected Treatments & Withdrawal Table */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">{t("targetAnimal")}</th>
                <th className="py-3.5 px-5">{t("prescriptionDosage")}</th>
                <th className="py-3.5 px-5">{t("dateAndVet")}</th>
                <th className="py-3.5 px-5">{t("withdrawalHold")}</th>
                <th className="py-3.5 px-5">{t("safeClearanceDate")}</th>
                <th className="py-3.5 px-5">{t("currentStatus")}</th>
                <th className="py-3.5 px-4 text-right">{t("details")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">{t("loadingConnectedRecords")}</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400">{t("noRecordsFound")}</td>
                </tr>
              ) : (
                filteredRecords.map((item) => (
                  <tr key={item.id} className="hover:bg-emerald-50/30 transition-colors">
                    {/* Animal */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900">{item.animal}</div>
                      <div className="text-[11px] font-mono text-slate-500 notranslate" translate="no">{item.tag}</div>
                    </td>

                    {/* Prescription */}
                    <td className="py-3.5 px-5">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <span>{item.type === "Vaccine" ? "💉" : "💊"}</span>
                        <span className="notranslate" translate="no">{item.medicine}</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {t("dosage")}: <span className="notranslate" translate="no">{item.dose} {item.doseUnit || "mg"}</span> • {item.route || "IM"}
                      </div>
                    </td>

                    {/* Date & Vet */}
                    <td className="py-3.5 px-5">
                      <div className="text-slate-700">{new Date(item.date).toLocaleDateString()}</div>
                      <div className="text-[11px] text-slate-500 font-mono notranslate" translate="no">{item.vet}</div>
                    </td>

                    {/* Withdrawal Period */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-800">
                        {item.withdrawalPeriod > 0 ? `${item.withdrawalPeriod} ${t("duration") || "Days"}` : t("zeroDaysSafe")}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase">
                        {item.targetProduct}
                      </div>
                    </td>

                    {/* Safe Clearance Date */}
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-emerald-800">
                        {item.safeDate.toLocaleDateString()}
                      </div>
                      {item.isUnderWithdrawal && (
                        <span className="text-[10px] font-bold text-amber-700">
                          {item.daysRemaining} {t("daysLeft")}
                        </span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-5">
                      {item.isUnderWithdrawal ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-900 border border-amber-300">
                          <Clock className="w-3 h-3 text-amber-700" />
                          <span>{t("withdrawalActive")}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-900 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                          <span>{t("safeToHarvest")}</span>
                        </span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedItem(item)}
                        className="px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-gray-200 text-xs font-medium transition-colors"
                      >
                        {t("details")} &rarr;
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail View */}
      {selectedItem && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white border border-gray-200 rounded-2xl w-full max-w-lg p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedItem.type === "Vaccine" ? "💉" : "💊"}</span>
                <h3 className="font-bold text-slate-900 text-base">{t("prescriptionDetails")}</h3>
              </div>
              <button onClick={() => setSelectedItem(null)} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("animalTag")}</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block">{selectedItem.animal} <span className="notranslate" translate="no">({selectedItem.tag})</span></span>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">{t("medicineAdministered")}</span>
                  <span className="font-bold text-slate-800 text-sm mt-0.5 block notranslate" translate="no">{selectedItem.medicine}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t("dosage")}</span>
                  <span className="font-semibold text-slate-800 notranslate" translate="no">{selectedItem.dose} {selectedItem.doseUnit || "mg"}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t("administrationDate")}</span>
                  <span className="font-semibold text-slate-800">{new Date(selectedItem.date).toLocaleDateString()}</span>
                </div>
                <div className="p-2.5 bg-gray-50 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">{t("safeClearanceDate")}</span>
                  <span className="font-semibold text-emerald-800">{selectedItem.safeDate.toLocaleDateString()}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200">
                <span className="text-[10px] uppercase font-bold text-emerald-900 block">{t("attendingVet")}</span>
                <span className="font-bold text-slate-800 mt-0.5 block notranslate" translate="no">{selectedItem.vet}</span>
                <span className="text-[10px] text-slate-500 block">{t("verifiedOnVetRegistry")}</span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-slate-600 font-mono text-[10px] break-all">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">{t("treatmentIdBlockchain")}</span>
                <span className="notranslate" translate="no">TX-{selectedItem.id}</span> • {t("sepoliaHashVerified")}
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedItem(null)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
