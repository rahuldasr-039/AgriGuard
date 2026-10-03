"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Coins, Shield, CheckCircle2, Clock, AlertTriangle, 
  ArrowLeft, Search, Filter, RefreshCw, FileText, 
  ExternalLink, Building2, User, Calendar, IndianRupee,
  Check, X, Download, Printer, QrCode, Sparkles, Globe
} from "lucide-react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

export default function FarmerSubsidiesPage() {
  const router = useRouter();
  const { t, translateStatus, language } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Kisan AI Modal State
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [kisanLang, setKisanLang] = useState(language || "hi");
  const [kisanLoading, setKisanLoading] = useState(false);
  const [kisanResponse, setKisanResponse] = useState("");
  const [kisanModel, setKisanModel] = useState("");

  useEffect(() => {
    if (language) setKisanLang(language);
  }, [language]);

  const askKisanAi = async (lang = kisanLang) => {
    setKisanLoading(true);
    try {
      const apiKey = localStorage.getItem("agriguard_gemini_api_key") || undefined;
      const res = await fetch("http://localhost:5000/api/v1/ai/farmer-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          farmerName: data?.fullName || "Rajesh Kumar",
          animalTag: "Caprine / Bovine Livestock",
          productType: "Goat Meat & Milk Discards",
          wasteAmount: "25 kg / L",
          subsidyAmount: data?.summary?.totalAmount || 18450,
          language: lang,
          apiKey
        })
      });
      const resData = await res.json();
      setKisanResponse(resData.advisory);
      setKisanModel(resData.modelUsed || "AgriGuard Synthesizer");
    } catch (err) {
      setKisanResponse("⚠️ Failed to generate advisory. Ensure backend server is running.");
    } finally {
      setKisanLoading(false);
    }
  };

  const handleOpenKisan = () => {
    setShowKisanModal(true);
    if (!kisanResponse) {
      askKisanAi(kisanLang);
    }
  };

  const fetchSubsidies = async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!token || !role) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/farmers/my-subsidies", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        // Fallback to public waste-claims endpoint if needed
        const fallbackRes = await fetch("http://localhost:5000/api/v1/testers/waste-claims");
        const allClaims = await fallbackRes.json();
        const myClaims = Array.isArray(allClaims) ? allClaims.filter(c => c.farmerId === "FR10293" || !c.farmerId) : [];
        
        const totalEntitlement = myClaims.reduce((sum, c) => sum + (c.aiRecommendedAmount || 0), 0);
        const totalDisbursed = myClaims.filter(c => c.status === "DISBURSED (PAID)").reduce((sum, c) => sum + (c.aiRecommendedAmount || 0), 0);
        const totalPending = myClaims.filter(c => c.status !== "DISBURSED (PAID)").reduce((sum, c) => sum + (c.aiRecommendedAmount || 0), 0);
        
        setData({
          farmerId: "FR10293",
          fullName: "RAJESH",
          bankAccountLinked: true,
          dbtScheme: "FSSAI Statutory Antimicrobial Withdrawal Compensation (DBT)",
          summary: {
            totalClaims: myClaims.length,
            totalEntitlement,
            totalDisbursed,
            totalPending
          },
          claims: myClaims.map(c => {
            const isPaid = c.status === "DISBURSED (PAID)";
            let txnMatch = c.notes?.match(/Reference:\s*([A-Za-z0-9\-]+)/);
            let gatewayMatch = c.notes?.match(/Gateway:\s*([^\.]+)/);
            return {
              id: c.id,
              claimId: c.claimId,
              farmerId: c.farmerId,
              animalType: c.animalType,
              animalId: c.animalId,
              productType: c.productType,
              wasteAmount: c.wasteAmount,
              unit: c.unit || "kg",
              date: c.date,
              aiRecommendedAmount: c.aiRecommendedAmount,
              status: c.status,
              amountReceived: isPaid ? c.aiRecommendedAmount : 0,
              transactionId: txnMatch ? txnMatch[1] : (isPaid ? "DBT-85933634" : null),
              gateway: gatewayMatch ? gatewayMatch[1].trim() : (isPaid ? "PFMS / Aadhaar DBT Gateway" : null),
              disbursedDate: isPaid ? c.updatedAt : null,
              notes: c.notes,
              tester: c.tester
            };
          })
        });
      }
    } catch (err) {
      console.error("Failed to load subsidies:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubsidies();
  }, [router]);

  // Filter claims
  const filteredClaims = useMemo(() => {
    if (!data?.claims) return [];
    return data.claims.filter(c => {
      const matchesStatus = 
        statusFilter === "ALL" ||
        (statusFilter === "PAID" && c.status === "DISBURSED (PAID)") ||
        (statusFilter === "PENDING" && c.status !== "DISBURSED (PAID)");
      
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        !search ||
        c.claimId?.toLowerCase().includes(search) ||
        c.productType?.toLowerCase().includes(search) ||
        c.animalType?.toLowerCase().includes(search) ||
        c.animalId?.toLowerCase().includes(search) ||
        c.transactionId?.toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [data, statusFilter, searchTerm]);

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/farmer"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              title={t("common.back") || "Back"}
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              {t("dbtSchemeTitle")}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              {t("pfmsAadhaarActive")}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            {t("myWithdrawalWasteSubsidies")}
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            {t("subsidySubtitle")} — <strong>{data?.fullName || "Farmer"} (<span className="notranslate" translate="no">{data?.farmerId || "FR10293"}</span>)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenKisan}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-2 text-xs font-bold shadow-md shadow-amber-500/10 group"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>{t("askKisanAi")}</span>
          </button>

          <button
            onClick={fetchSubsidies}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all flex items-center gap-2 text-xs font-medium"
            title={t("sync")}
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            <span>{t("sync")}</span>
          </button>
        </div>
      </div>

      {/* Financial Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Claims */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{t("allClaims")}</span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t("totalSubmissions")}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{loading ? "..." : data?.summary?.totalClaims || 0}</span>
            <span className="text-xs text-slate-500">{t("recorded")}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t("verifiedByTestingLabs")}</p>
        </div>

        {/* Total Entitlement */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">{t("assessedValue")}</span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t("totalSubsidyEntitlement")}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              ₹{loading ? "..." : (data?.summary?.totalEntitlement || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">{t("aiEvaluatedValue")}</p>
        </div>

        {/* Total Received (Paid) */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              {t("paidInAccount")}
            </span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t("amountDisbursed")}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              ₹{loading ? "..." : (data?.summary?.totalDisbursed || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-emerald-300/80 mt-2 font-medium">{t("transferredViaDbt")}</p>
        </div>

        {/* Pending Clearance */}
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              {t("inReview")}
            </span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">{t("pendingTreasuryAllocation")}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              ₹{loading ? "..." : (data?.summary?.totalPending || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-amber-300/80 mt-2 font-medium">{t("awaitingTreasurySignoff")}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("searchClaimsPlaceholder")}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> {t("status")}:
          </span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "ALL"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            {t("allClaims")} ({data?.claims?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "PAID"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800/80 text-emerald-400 hover:bg-slate-800"
            }`}
          >
            {t("disbursedPaid")} ({data?.claims?.filter(c => c.status === "DISBURSED (PAID)").length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800/80 text-amber-400 hover:bg-slate-800"
            }`}
          >
            {t("pending")} ({data?.claims?.filter(c => c.status !== "DISBURSED (PAID)").length || 0})
          </button>
        </div>
      </div>

      {/* Main Detailed Claims Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">{t("detailedClaimsTitle")}</h2>
            <p className="text-xs text-slate-400">{t("detailedClaimsDesc")}</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {t("showing")} {filteredClaims.length} {t("of")} {data?.claims?.length || 0} {t("claims")}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">{t("claimReference")}</th>
                <th className="py-3.5 px-6">{t("dateDiscarded")}</th>
                <th className="py-3.5 px-6">{t("productSpecies")}</th>
                <th className="py-3.5 px-6">{t("amountProduced")}</th>
                <th className="py-3.5 px-6">{t("assessedSubsidy")}</th>
                <th className="py-3.5 px-6">{t("paymentProcess")}</th>
                <th className="py-3.5 px-6">{t("amountReceived")}</th>
                <th className="py-3.5 px-6 text-right">{t("actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    {t("loadingSubsidies")}
                  </td>
                </tr>
              ) : filteredClaims.length > 0 ? (
                filteredClaims.map((claim) => {
                  const isPaid = claim.status === "DISBURSED (PAID)";
                  const formattedDate = new Date(claim.date).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric"
                  });

                  return (
                    <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors group">
                      {/* 1. Claim Reference */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-white group-hover:text-emerald-300 transition-colors notranslate" translate="no">
                          {claim.claimId}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono notranslate" translate="no">
                          ID: {claim.farmerId || data?.farmerId}
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-medium">{formattedDate}</div>
                        <div className="text-[11px] text-slate-500">{t("quarantineDiscard")}</div>
                      </td>

                      {/* 3. Product & Species */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {claim.productType}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <span>{claim.animalType}</span>
                          <span className="font-mono text-cyan-400 notranslate" translate="no">({claim.animalId})</span>
                        </div>
                      </td>

                      {/* 4. Amount Produced */}
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-200 font-extrabold text-base">
                          {claim.wasteAmount} <span className="text-xs text-slate-400 font-normal">{claim.unit || "kg"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">{t("withheldFromMarket")}</div>
                      </td>

                      {/* 5. Assessed Subsidy */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-amber-300 text-base">
                          ₹{(claim.aiRecommendedAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-slate-500">{t("statutoryValuation")}</div>
                      </td>

                      {/* 6. Payment Process / Status */}
                      <td className="py-4 px-6">
                        {isPaid ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              {translateStatus("DISBURSED (PAID)")}
                            </span>
                            {claim.transactionId && (
                              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px] notranslate" translate="no" title={claim.transactionId}>
                                Ref: {claim.transactionId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {translateStatus("PENDING FSSAI APPROVAL")}
                            </span>
                            <div className="text-[10px] text-slate-500">{t("scheduledTreasuryBatch")}</div>
                          </div>
                        )}
                      </td>

                      {/* 7. Amount Received */}
                      <td className="py-4 px-6">
                        <div className={`font-mono font-extrabold text-base ${isPaid ? "text-emerald-400" : "text-slate-500"}`}>
                          {isPaid ? `₹${(claim.aiRecommendedAmount || 0).toLocaleString("en-IN")}` : "₹0"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isPaid ? t("bankCredited") : t("awaitingRelease")}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{t("viewReceipt")}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    {t("noClaimsMatch")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>


      {/* Official DBT Compensation Receipt Modal */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl relative my-8">
            {/* Close Button */}
            <button
              onClick={() => setSelectedClaim(null)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Receipt Header */}
            <div className="text-center pb-6 border-b border-slate-800">
              <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mb-3">
                <Shield className="w-8 h-8" />
              </div>
              <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">{t("govtOfIndiaFSSAI")}</p>
              <h3 className="text-xl font-bold text-white mt-1">{t("dbtVoucher")}</h3>
              <p className="text-xs text-slate-400 mt-1">{t("statutoryCompensationCert")}</p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300">
                {t("citationId")}: <strong className="text-white notranslate" translate="no">{selectedClaim.claimId}</strong>
              </div>
            </div>

            {/* Receipt Body Details */}
            <div className="py-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-500 block">{t("beneficiaryFarmer")}</span>
                  <strong className="text-white">{data?.fullName || "Farmer Rajesh"}</strong>
                  <span className="text-xs font-mono text-cyan-400 block notranslate" translate="no">{selectedClaim.farmerId || data?.farmerId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{t("disposalDate")}</span>
                  <strong className="text-slate-200">
                    {new Date(selectedClaim.date).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric"
                    })}
                  </strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-500 block">{t("productProducedWithheld")}</span>
                  <strong className="text-white text-base">{selectedClaim.productType}</strong>
                  <span className="text-xs text-slate-400 block">
                    {t("animal")}: {selectedClaim.animalType} <span className="notranslate" translate="no">({selectedClaim.animalId})</span>
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">{t("quantityProduced")}</span>
                  <strong className="text-white font-mono text-lg notranslate" translate="no">
                    {selectedClaim.wasteAmount} {selectedClaim.unit}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">{t("statutoryEvaluatedRate")}</span>
                  <span className="text-slate-300 font-mono">{t("fairMarketValue")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">{t("assessedSubsidyEntitlement")}</span>
                  <span className="text-amber-300 font-mono font-bold">
                    ₹{(selectedClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                  <span className="text-white font-bold">{t("actualAmountReceived")}</span>
                  <span className="text-emerald-400 font-mono font-extrabold text-lg">
                    {selectedClaim.status === "DISBURSED (PAID)"
                      ? `₹${(selectedClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}`
                      : "₹0"}
                  </span>
                </div>
              </div>

              {/* Payment Processing Details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("paymentLifecycleStatus")}</span>
                  <span className={`font-bold ${
                    selectedClaim.status === "DISBURSED (PAID)" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {translateStatus(selectedClaim.status)}
                  </span>
                </div>
                {selectedClaim.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{t("dbtTransactionRef")}</span>
                    <span className="font-mono text-slate-300 font-semibold notranslate" translate="no">{selectedClaim.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("paymentGateway")}</span>
                  <span className="text-slate-300">{selectedClaim.gateway || "PFMS / Aadhaar Payment Bridge"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{t("inspectingLabOfficer")}</span>
                  <span className="text-slate-300 font-mono notranslate" translate="no">
                    {selectedClaim.tester?.fullName || "Accredited Tester"} ({selectedClaim.tester?.testerId || "FT72B91K1"})
                  </span>
                </div>
                {selectedClaim.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">{t("statutoryReasonNotes")}</span>
                    <p className="text-slate-400 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[11px] leading-relaxed">
                      {selectedClaim.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{t("printVoucher")}</span>
              </button>

              <button
                onClick={() => setSelectedClaim(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all"
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kisan AI Multilingual Advisory Modal */}
      {showKisanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t("kisanAiFarmAdvisor")}</h3>
                  <p className="text-xs text-slate-400">
                    {t("kisanAiSubtitle")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowKisanModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Language Selector Chips - All 12 Indian Languages */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium">{t("languageLabel")}</span>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setKisanLang(lang.code);
                    askKisanAi(lang.code);
                  }}
                  className={`text-xs px-2.5 py-1 rounded-lg border transition-all ${
                    kisanLang === lang.code
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {lang.flag} {lang.native} ({lang.name})
                </button>
              ))}
            </div>

            {/* Advisory Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {kisanLoading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                  <p className="font-semibold text-white">{t("kisanGenerating")}</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                  {kisanResponse}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                ⚡ {t("poweredBy")} {kisanModel || "AgriGuard Gen AI"}
              </span>
              <button
                onClick={() => setShowKisanModal(false)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                {t("done")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
