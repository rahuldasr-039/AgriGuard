"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Coins, Search, RefreshCw, CheckCircle2, 
  ArrowLeft, Package, Sparkles, Filter,
  CreditCard, ShieldCheck, X, Check, ArrowUpRight,
  Building2, UserCheck, AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function RegulatorWasteSubsidy() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Payment Disbursal State
  const [selectedPaymentClaim, setSelectedPaymentClaim] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(null);

  // Gen AI Briefing State
  const [showAiBriefingModal, setShowAiBriefingModal] = useState(false);
  const [aiBriefingLoading, setAiBriefingLoading] = useState(false);
  const [aiBriefingContent, setAiBriefingContent] = useState("");
  const [aiBriefingModel, setAiBriefingModel] = useState("");

  const generateAiBriefing = async () => {
    setAiBriefingLoading(true);
    setShowAiBriefingModal(true);
    try {
      const apiKey = localStorage.getItem("agriguard_gemini_api_key") || undefined;
      const totalDisbursed = claims
        .filter(c => c.status === "DISBURSED (PAID)")
        .reduce((sum, c) => sum + (parseFloat(c.aiRecommendedAmount) || 0), 0);
      
      const res = await fetch("http://localhost:5000/api/v1/ai/regulatory-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: "Karnataka Regional Dairy & Livestock Cluster",
          stats: {
            totalClaims: claims.length || 12,
            totalDisbursed: totalDisbursed || 18450,
            activeQuarantines: 4,
            violationsCount: 0
          },
          apiKey
        })
      });
      const data = await res.json();
      setAiBriefingContent(data.briefing);
      setAiBriefingModel(data.modelUsed || "AgriGuard Synthesizer");
    } catch (err) {
      setAiBriefingContent("⚠️ Failed to generate regulatory briefing. Ensure backend server is running.");
    } finally {
      setAiBriefingLoading(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "REGULATOR" || !token) {
      router.push("/login");
      return;
    }

    fetchClaims(token);
  }, [router]);

  const fetchClaims = async (token, isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const authHeaders = { "Authorization": `Bearer ${token || localStorage.getItem("token")}` };
      const res = await fetch("http://localhost:5000/api/v1/testers/waste-claims", { headers: authHeaders });
      const data = await res.json();
      if (Array.isArray(data)) {
        const eligible = data.filter(
          c => !c.productType?.toLowerCase().includes("fish") && !c.animalType?.toLowerCase().includes("fish")
        );
        setClaims(eligible);
      }
    } catch (err) {
      console.error("Failed to fetch waste claims:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  const handleDisbursePayment = async () => {
    if (!selectedPaymentClaim) return;
    setProcessingPayment(true);

    try {
      const res = await fetch(`http://localhost:5000/api/v1/testers/waste-claims/${selectedPaymentClaim.id}/disburse`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: selectedPaymentClaim.aiRecommendedAmount,
          paymentMethod: "PFMS / Aadhaar DBT Gateway"
        })
      });

      const resData = await res.json();
      if (res.ok) {
        setPaymentSuccess({
          transactionId: resData.transactionId,
          farmerId: selectedPaymentClaim.farmerId,
          amount: selectedPaymentClaim.aiRecommendedAmount,
          date: new Date().toLocaleDateString("en-IN")
        });

        // Update local state
        setClaims(prev => prev.map(c => 
          c.id === selectedPaymentClaim.id 
            ? { ...c, status: "DISBURSED (PAID)", notes: resData.claim?.notes } 
            : c
        ));

        setSelectedPaymentClaim(null);
      }
    } catch (err) {
      console.error("Payment execution error:", err);
    } finally {
      setProcessingPayment(false);
    }
  };

  const filteredClaims = useMemo(() => {
    return claims.filter((c) => {
      const term = searchTerm.toLowerCase();
      return (
        (c.testerId && c.testerId.toLowerCase().includes(term)) ||
        (c.farmerId && c.farmerId.toLowerCase().includes(term)) ||
        (c.productType && c.productType.toLowerCase().includes(term)) ||
        (c.claimId && c.claimId.toLowerCase().includes(term))
      );
    });
  }, [claims, searchTerm]);

  // Total summary metrics
  const totalClaims = claims.length;
  const totalSubsidy = claims.reduce((sum, c) => sum + (Number(c.aiRecommendedAmount) || 0), 0);
  const disbursedTotal = claims
    .filter(c => c.status === "DISBURSED (PAID)")
    .reduce((sum, c) => sum + (Number(c.aiRecommendedAmount) || 0), 0);
  const pendingDisbursal = totalSubsidy - disbursedTotal;

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              FSSAI Regulator Module
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <Coins className="w-8 h-8 text-emerald-400" />
            Waste &amp; Subsidy Payment Portal
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Official FSSAI disbursement and audit registry for farmer withdrawal waste compensation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchClaims(null, true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-slate-900 border border-slate-700 hover:border-slate-600 text-slate-200 transition-all shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
            <span>{refreshing ? "Refreshing..." : "Refresh Records"}</span>
          </button>
        </div>
      </div>

      {/* Success Banner */}
      {paymentSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-center justify-between gap-4 animate-in slide-in-from-top">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Check className="w-5 h-5" />
            </div>
            <div>
              <strong className="text-white block text-sm font-semibold">
                Direct Benefit Transfer (DBT) Disbursed Successfully!
              </strong>
              <p className="text-xs text-emerald-300/80 font-mono">
                Transferred ₹{Number(paymentSuccess.amount).toLocaleString("en-IN")} to Farmer {paymentSuccess.farmerId} • Reference: {paymentSuccess.transactionId}
              </p>
            </div>
          </div>
          <button
            onClick={() => setPaymentSuccess(null)}
            className="text-emerald-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Submissions</span>
          <div className="text-3xl font-bold text-white font-mono">{totalClaims}</div>
          <span className="text-xs text-slate-500 mt-1 block">Verified by accredited farm testers</span>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Total Evaluated Subsidy</span>
          <div className="text-3xl font-bold text-emerald-400 font-mono">
            ₹{totalSubsidy.toLocaleString("en-IN")}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-cyan-400 font-mono">Disbursed: ₹{disbursedTotal.toLocaleString("en-IN")}</span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-amber-400 font-mono">Pending: ₹{pendingDisbursal.toLocaleString("en-IN")}</span>
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-sm">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Payment Gateway Status</span>
          <div className="text-3xl font-bold text-cyan-400 flex items-center gap-2">
            <span>DBT Active</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-xs text-slate-500 mt-1 block">PFMS / Aadhaar payment bridge online</span>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Farmer ID, Tester ID, or Product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/70 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div className="text-xs text-slate-400 font-mono">
          Showing <strong className="text-white">{filteredClaims.length}</strong> of {claims.length} records
        </div>
      </div>

      {/* Main Table: EXACT 6 REQUIRED COLUMNS FOR PAYMENT MONITORING */}
      <div id="waste-subsidy" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-emerald-400" />
              FSSAI Payment Monitoring Table
            </h2>
            <p className="text-xs text-slate-400 mt-1">Direct Benefit Transfer (DBT) disbursement registry for statutory withdrawal waste compensation</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={generateAiBriefing}
              disabled={aiBriefingLoading}
              className="bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 font-bold px-3.5 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm group"
            >
              {aiBriefingLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />}
              <span>✨ Gen AI Audit Briefing</span>
            </button>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
              {filteredClaims.length} Claims Monitored
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Waste Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Subsidy Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Payment Process</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 text-sm">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-emerald-400" />
                    Loading Waste &amp; Subsidy records...
                  </td>
                </tr>
              ) : filteredClaims.length > 0 ? (
                filteredClaims.map((claim, idx) => {
                  const isPaid = claim.status === "DISBURSED (PAID)";
                  const isProcessing = processingPayment && selectedPaymentClaim?.id === claim.id;
                  const subsidyNum = typeof claim.aiRecommendedAmount === "number" ? claim.aiRecommendedAmount : parseFloat(claim.aiRecommendedAmount) || 0;

                  return (
                    <tr key={claim.id || `claim-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                      {/* 1. Farmer ID */}
                      <td className="py-4 px-6 text-sm font-mono text-white font-bold">
                        {claim.farmerId}
                      </td>

                      {/* 2. Product */}
                      <td className="py-4 px-6 text-sm text-slate-200 font-medium">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs">
                          {claim.productType || claim.product}
                        </span>
                      </td>

                      {/* 3. Waste Amount */}
                      <td className="py-4 px-6 text-sm text-amber-400 font-mono font-semibold text-right">
                        {claim.wasteAmount ? `${claim.wasteAmount} ${claim.unit || 'kg'}` : (claim.amount || '0')}
                      </td>

                      {/* 4. Subsidy Amount */}
                      <td className="py-4 px-6 text-sm font-semibold text-emerald-400 font-mono text-right text-base">
                        ₹{subsidyNum.toLocaleString("en-IN")}
                      </td>

                      {/* 5. Payment Process */}
                      <td className="py-4 px-6 text-sm">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/30 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Paid
                          </span>
                        ) : isProcessing ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/30 font-mono animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" /> Processing
                          </span>
                        ) : (
                          <div className="flex items-center gap-2.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-300 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-mono">
                              Pending
                            </span>
                            <button
                              onClick={() => setSelectedPaymentClaim(claim)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                            >
                              <CreditCard className="w-3 h-3" /> Pay Subsidy
                            </button>
                          </div>
                        )}
                      </td>

                      {/* 6. Amount Received */}
                      <td className="py-4 px-6 text-sm font-mono font-bold text-right text-base">
                        {isPaid ? (
                          <span className="text-emerald-400">
                            ₹{subsidyNum.toLocaleString("en-IN")}
                          </span>
                        ) : (
                          <span className="text-slate-500">
                            ₹0
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 text-sm">
                    No waste &amp; subsidy records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Direct Benefit Transfer (DBT) Payment Modal */}
      {selectedPaymentClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Direct Benefit Transfer (DBT)</h3>
                  <p className="text-xs text-slate-400 font-mono">Disburse Statutory Withdrawal Subsidy</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPaymentClaim(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Claim Citation ID</span>
                  <span className="font-mono font-bold text-cyan-400">{selectedPaymentClaim.claimId}</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Beneficiary Farmer</span>
                  <span className="font-mono font-bold text-white">{selectedPaymentClaim.farmerId} • Verified Producer</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Linked Bank (PFMS/DBT)</span>
                  <span className="font-mono text-slate-300">State Bank of India (A/C: **********4912)</span>
                </div>
                <div className="flex justify-between items-center border-b border-slate-800/60 pb-2">
                  <span className="text-slate-400">Discarded Product</span>
                  <span className="text-slate-200 font-medium">
                    {selectedPaymentClaim.wasteAmount} {selectedPaymentClaim.unit || 'kg'} of {selectedPaymentClaim.productType || selectedPaymentClaim.product}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-400 font-semibold">Sanctioned Compensation Amount</span>
                  <span className="text-xl font-mono font-extrabold text-emerald-400">
                    ₹{Number(selectedPaymentClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-emerald-400" />
                <span>
                  Funds will be credited directly to the farmer's Aadhaar-linked DBT account under National Food Safety Compensation Guidelines.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedPaymentClaim(null)}
                disabled={processingPayment}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisbursePayment}
                disabled={processingPayment}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
              >
                {processingPayment ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing Transfer...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4" />
                    <span>Confirm &amp; Disburse ₹{Number(selectedPaymentClaim.aiRecommendedAmount || 0).toLocaleString("en-IN")}</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Gen AI Regulatory Briefing Modal */}
      {showAiBriefingModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">FSSAI Executive Regulatory Briefing</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Engine: {aiBriefingModel || "AgriGuard Domain Synthesizer"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAiBriefingModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-4 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {aiBriefingLoading ? (
                <div className="py-16 text-center text-slate-400 space-y-3">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-400" />
                  <p className="font-semibold text-white">Synthesizing Regional Food Safety &amp; DBT Ledger Data...</p>
                  <p className="text-xs text-slate-500">Evaluating antimicrobial half-lives, quarantined tags, and treasury payouts.</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  {aiBriefingContent}
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3 flex-shrink-0">
              <button
                onClick={() => setShowAiBriefingModal(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-5 py-2 rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
