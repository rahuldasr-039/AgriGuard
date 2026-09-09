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

export default function FarmerSubsidiesPage() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedClaim, setSelectedClaim] = useState(null);

  // Kisan AI Modal State
  const [showKisanModal, setShowKisanModal] = useState(false);
  const [kisanLang, setKisanLang] = useState("hi");
  const [kisanLoading, setKisanLoading] = useState(false);
  const [kisanResponse, setKisanResponse] = useState("");
  const [kisanModel, setKisanModel] = useState("");

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
              title="Back to Farmer Dashboard"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-emerald-400" />
              Direct Benefit Transfer (DBT) Scheme
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              PFMS / Aadhaar Active
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            My Withdrawal Waste Subsidies & Compensation
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Complete audited breakdown of statutory food product discards (Goat Meat, Goat Milk, Milk, Chicken) and treasury payment statuses for <strong>{data?.fullName || "Farmer"} ({data?.farmerId || "FR10293"})</strong>.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleOpenKisan}
            className="px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-emerald-500/20 hover:from-amber-500/30 hover:to-emerald-500/30 border border-amber-500/40 text-amber-300 transition-all flex items-center gap-2 text-xs font-bold shadow-md shadow-amber-500/10 group"
          >
            <Sparkles className="w-4 h-4 text-amber-400 group-hover:rotate-12 transition-transform" />
            <span>🌾 Ask Kisan AI</span>
          </button>

          <button
            onClick={fetchSubsidies}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/80 transition-all flex items-center gap-2 text-xs font-medium"
            title="Refresh Subsidy Records"
          >
            <RefreshCw className={`w-4 h-4 text-emerald-400 ${loading ? "animate-spin" : ""}`} />
            <span>Sync</span>
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
            <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">All Claims</span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Submissions</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{loading ? "..." : data?.summary?.totalClaims || 0}</span>
            <span className="text-xs text-slate-500">recorded</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Verified by certified testing labs</p>
        </div>

        {/* Total Entitlement */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">Assessed Value</span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Subsidy Entitlement</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-indigo-400">
              ₹{loading ? "..." : (data?.summary?.totalEntitlement || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-2">AI-evaluated fair market value</p>
        </div>

        {/* Total Received (Paid) */}
        <div className="bg-emerald-500/5 border border-emerald-500/30 rounded-2xl p-5 backdrop-blur-sm shadow-lg shadow-emerald-500/5">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded">
              PAID IN ACCOUNT
            </span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Amount Disbursed (Paid)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              ₹{loading ? "..." : (data?.summary?.totalDisbursed || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-emerald-300/80 mt-2 font-medium">Successfully transferred via DBT</p>
        </div>

        {/* Pending Clearance */}
        <div className="bg-amber-500/5 border border-amber-500/30 rounded-2xl p-5 backdrop-blur-sm shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-xs font-mono font-bold text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded">
              IN REVIEW
            </span>
          </div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Pending Treasury Allocation</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">
              ₹{loading ? "..." : (data?.summary?.totalPending || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-xs text-amber-300/80 mt-2 font-medium">Awaiting final FSSAI treasury signoff</p>
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
            placeholder="Search claim ID, product, tag, or reference..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> Status:
          </span>
          <button
            onClick={() => setStatusFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "ALL"
                ? "bg-slate-200 text-slate-900"
                : "bg-slate-800/80 text-slate-400 hover:text-white"
            }`}
          >
            All Claims ({data?.claims?.length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("PAID")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "PAID"
                ? "bg-emerald-500 text-slate-950 font-bold"
                : "bg-slate-800/80 text-emerald-400 hover:bg-slate-800"
            }`}
          >
            Disbursed (Paid) ({data?.claims?.filter(c => c.status === "DISBURSED (PAID)").length || 0})
          </button>
          <button
            onClick={() => setStatusFilter("PENDING")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
              statusFilter === "PENDING"
                ? "bg-amber-500 text-slate-950 font-bold"
                : "bg-slate-800/80 text-amber-400 hover:bg-slate-800"
            }`}
          >
            Pending ({data?.claims?.filter(c => c.status !== "DISBURSED (PAID)").length || 0})
          </button>
        </div>
      </div>

      {/* Main Detailed Claims Table */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">Detailed Subsidy Claims & Disbursal Records</h2>
            <p className="text-xs text-slate-400">Complete breakdown of discarded commodities, dates produced, and DBT status</p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Showing {filteredClaims.length} of {data?.claims?.length || 0} claims
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3.5 px-6">Claim Reference</th>
                <th className="py-3.5 px-6">Date Produced / Discarded</th>
                <th className="py-3.5 px-6">Product & Species</th>
                <th className="py-3.5 px-6">Amount Produced</th>
                <th className="py-3.5 px-6">Assessed Subsidy</th>
                <th className="py-3.5 px-6">Payment Process</th>
                <th className="py-3.5 px-6">Amount Received</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading your official subsidy records...
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
                        <div className="font-mono font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {claim.claimId}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          ID: {claim.farmerId || data?.farmerId}
                        </div>
                      </td>

                      {/* 2. Date */}
                      <td className="py-4 px-6">
                        <div className="text-slate-300 font-medium">{formattedDate}</div>
                        <div className="text-[11px] text-slate-500">Quarantine Discard</div>
                      </td>

                      {/* 3. Product & Species */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {claim.productType}
                        </div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <span>{claim.animalType}</span>
                          <span className="font-mono text-cyan-400">({claim.animalId})</span>
                        </div>
                      </td>

                      {/* 4. Amount Produced */}
                      <td className="py-4 px-6">
                        <div className="font-mono text-slate-200 font-extrabold text-base">
                          {claim.wasteAmount} <span className="text-xs text-slate-400 font-normal">{claim.unit || "kg"}</span>
                        </div>
                        <div className="text-[11px] text-slate-500">Withheld from Market</div>
                      </td>

                      {/* 5. Assessed Subsidy */}
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-amber-300 text-base">
                          ₹{(claim.aiRecommendedAmount || 0).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[11px] text-slate-500">Statutory Valuation</div>
                      </td>

                      {/* 6. Payment Process / Status */}
                      <td className="py-4 px-6">
                        {isPaid ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              DISBURSED (PAID)
                            </span>
                            {claim.transactionId && (
                              <div className="text-[10px] font-mono text-slate-400 truncate max-w-[140px]" title={claim.transactionId}>
                                Ref: {claim.transactionId}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              PENDING FSSAI APPROVAL
                            </span>
                            <div className="text-[10px] text-slate-500">Scheduled Treasury Batch</div>
                          </div>
                        )}
                      </td>

                      {/* 7. Amount Received */}
                      <td className="py-4 px-6">
                        <div className={`font-mono font-extrabold text-base ${isPaid ? "text-emerald-400" : "text-slate-500"}`}>
                          {isPaid ? `₹${(claim.aiRecommendedAmount || 0).toLocaleString("en-IN")}` : "₹0 (Pending)"}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {isPaid ? "Bank Credited" : "Awaiting Release"}
                        </div>
                      </td>

                      {/* 8. Actions */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition-all inline-flex items-center gap-1.5 shadow-sm"
                        >
                          <FileText className="w-3.5 h-3.5 text-cyan-400" />
                          <span>View Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">
                    No subsidy claims match your search or filter.
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
              <p className="text-xs uppercase font-mono tracking-widest text-emerald-400 font-bold">Government of India — FSSAI</p>
              <h3 className="text-xl font-bold text-white mt-1">Direct Benefit Transfer (DBT) Voucher</h3>
              <p className="text-xs text-slate-400 mt-1">Statutory Antimicrobial Withdrawal Compensation Certificate</p>
              <div className="mt-3 inline-block px-3 py-1 rounded-full text-xs font-mono bg-slate-950 border border-slate-800 text-slate-300">
                Citation ID: <strong className="text-white">{selectedClaim.claimId}</strong>
              </div>
            </div>

            {/* Receipt Body Details */}
            <div className="py-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <span className="text-xs text-slate-500 block">Beneficiary Farmer</span>
                  <strong className="text-white">{data?.fullName || "Farmer Rajesh"}</strong>
                  <span className="text-xs font-mono text-cyan-400 block">{selectedClaim.farmerId || data?.farmerId}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Disposal Date</span>
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
                  <span className="text-xs text-slate-500 block">Product Produced & Withheld</span>
                  <strong className="text-white text-base">{selectedClaim.productType}</strong>
                  <span className="text-xs text-slate-400 block">
                    Animal: {selectedClaim.animalType} ({selectedClaim.animalId})
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">Quantity Produced</span>
                  <strong className="text-white font-mono text-lg">
                    {selectedClaim.wasteAmount} {selectedClaim.unit}
                  </strong>
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Statutory Evaluated Rate</span>
                  <span className="text-slate-300 font-mono">Fair Market Value</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-300 font-medium">Assessed Subsidy Entitlement</span>
                  <span className="text-amber-300 font-mono font-bold">
                    ₹{(selectedClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-800">
                  <span className="text-white font-bold">Actual Amount Received</span>
                  <span className="text-emerald-400 font-mono font-extrabold text-lg">
                    {selectedClaim.status === "DISBURSED (PAID)"
                      ? `₹${(selectedClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}`
                      : "₹0 (Pending Disbursal)"}
                  </span>
                </div>
              </div>

              {/* Payment Processing Details */}
              <div className="space-y-2 text-xs pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Lifecycle Status</span>
                  <span className={`font-bold ${
                    selectedClaim.status === "DISBURSED (PAID)" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {selectedClaim.status}
                  </span>
                </div>
                {selectedClaim.transactionId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">DBT Transaction Reference</span>
                    <span className="font-mono text-slate-300 font-semibold">{selectedClaim.transactionId}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway</span>
                  <span className="text-slate-300">{selectedClaim.gateway || "PFMS / Aadhaar Payment Bridge"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Inspecting Lab & Officer</span>
                  <span className="text-slate-300 font-mono">
                    {selectedClaim.tester?.fullName || "Accredited Tester"} ({selectedClaim.tester?.testerId || "FT72B91K1"})
                  </span>
                </div>
                {selectedClaim.notes && (
                  <div className="pt-2">
                    <span className="text-slate-500 block mb-1">Statutory Reason / Notes:</span>
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
                <span>Print Voucher</span>
              </button>

              <button
                onClick={() => setSelectedClaim(null)}
                className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-bold transition-all"
              >
                Close
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
                  <h3 className="text-lg font-bold text-white">किसान साथी एआई (Kisan AI Farm Advisor)</h3>
                  <p className="text-xs text-slate-400">
                    Transparent subsidy explanation &amp; animal care in your native language.
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

            {/* Language Selector Chips */}
            <div className="flex items-center gap-2 flex-wrap flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium">भाषा / Language:</span>
              {[
                { code: "hi", label: "हिंदी (Hindi)" },
                { code: "en", label: "English" },
                { code: "kn", label: "ಕನ್ನಡ (Kannada)" },
                { code: "ta", label: "தமிழ் (Tamil)" },
                { code: "te", label: "తెలుగు (Telugu)" }
              ].map(lang => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setKisanLang(lang.code);
                    askKisanAi(lang.code);
                  }}
                  className={`text-xs px-3 py-1 rounded-lg border transition-all ${
                    kisanLang === lang.code
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-sm"
                      : "bg-slate-800/80 text-slate-300 border-slate-700 hover:border-slate-600"
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Advisory Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {kisanLoading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-400" />
                  <p className="font-semibold text-white">किसान एआई परामर्श तैयार कर रहा है...</p>
                  <p className="text-xs text-slate-500">Generating plain-language guidance in your chosen language.</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap bg-slate-950/70 p-5 rounded-2xl border border-slate-800">
                  {kisanResponse}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-shrink-0">
              <span className="text-[10px] text-slate-500 font-mono">
                ⚡ Powered by {kisanModel || "AgriGuard Gen AI"}
              </span>
              <button
                onClick={() => setShowKisanModal(false)}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all"
              >
                Done / बंद करें
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
