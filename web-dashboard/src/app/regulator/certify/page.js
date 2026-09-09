"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Award, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  Search, RefreshCw, Filter, Clock, Calendar, ExternalLink, 
  ChevronRight, AlertCircle, FileText, Check, X, Building2,
  Syringe, Beaker, QrCode, ArrowUpRight, Lock, Unlock, Eye
} from "lucide-react";
import Link from "next/link";

const API_BASE = "http://localhost:5000/api/v1";

export default function FssaiCertifyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState({ summary: {}, certificates: [] });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  // Review Drawer / Modal State
  const [selectedFarmerId, setSelectedFarmerId] = useState(null);
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidence, setEvidence] = useState(null);
  const [evidenceTab, setEvidenceTab] = useState("treatments");

  // Action States
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);

  // Status Setting State (Step 2)
  const [selectedMrlStatus, setSelectedMrlStatus] = useState("SAFE");
  const [validFrom, setValidFrom] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState(null);
  const [errorToast, setErrorToast] = useState(null);

  // Load Main Certificate List
  const fetchCertificates = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch certificates");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      setErrorToast("Failed to load certificates. Check backend connection.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!token || (role !== "REGULATOR" && role !== "ADMIN")) {
      router.push("/login");
      return;
    }
    fetchCertificates();
  }, []);

  // Open Farmer Review Drawer & Fetch Evidence
  const openReviewDrawer = async (farmerId) => {
    setSelectedFarmerId(farmerId);
    setEvidenceLoading(true);
    setEvidence(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates/evidence/${farmerId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to load farmer evidence");
      const json = await res.json();
      setEvidence(json);

      // Pre-fill validity dates if active cert or default 7 days
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      setValidFrom(now.toISOString().split("T")[0]);
      setValidUntil(nextWeek.toISOString().split("T")[0]);
      if (json.latestCertificate?.mrlStatus && json.latestCertificate.mrlStatus !== "NOT_SET") {
        setSelectedMrlStatus(json.latestCertificate.mrlStatus);
      } else {
        setSelectedMrlStatus("SAFE");
      }
    } catch (err) {
      console.error(err);
      setErrorToast("Failed to load farmer evidence.");
    } finally {
      setEvidenceLoading(false);
    }
  };

  // Step 1: Approve or Reject Certification
  const handleApproveReject = async (action, reason = "") => {
    if (!evidence?.latestCertificate?.id) {
      // Need to initiate first if no record exists
      try {
        setActionLoading(true);
        const token = localStorage.getItem("token");
        const initRes = await fetch(`${API_BASE}/certificates/initiate`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}` 
          },
          body: JSON.stringify({ farmerId: selectedFarmerId })
        });
        const initData = await initRes.json();
        if (!initRes.ok) throw new Error(initData.error || "Failed to initiate");

        // Now approve
        await executeApproval(initData.id, action, reason);
      } catch (e) {
        setErrorToast(e.message);
        setActionLoading(false);
      }
      return;
    }

    await executeApproval(evidence.latestCertificate.id, action, reason);
  };

  const executeApproval = async (certDbId, action, reason) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates/${certDbId}/approve`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ action, reason })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Action failed");

      setSuccessToast(`Certification successfully ${action === "APPROVE" ? "APPROVED" : "REJECTED"}!`);
      setShowRejectModal(false);
      setRejectionReason("");
      await openReviewDrawer(selectedFarmerId);
      await fetchCertificates();
    } catch (err) {
      setErrorToast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Step 2: Set MRL Status (SAFE / UNSAFE)
  const handleSetMrlStatus = async () => {
    if (!evidence?.latestCertificate?.id) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates/${evidence.latestCertificate.id}/status`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          mrlStatus: selectedMrlStatus,
          validFrom: validFrom ? new Date(validFrom).toISOString() : undefined,
          validUntil: validUntil ? new Date(validUntil).toISOString() : undefined,
          notes: statusNotes
        })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to set status");

      setSuccessToast(`MRL Status set to ${selectedMrlStatus}! Blockchain proof anchored.`);
      setShowConfirmModal(false);
      setStatusNotes("");
      await openReviewDrawer(selectedFarmerId);
      await fetchCertificates();
    } catch (err) {
      setErrorToast(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered List
  const filteredCertificates = useMemo(() => {
    return (data.certificates || []).filter(c => {
      const matchesSearch = 
        c.farmerId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.farmerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.farmName?.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;
      if (statusFilter === "ALL") return true;
      if (statusFilter === "PENDING") return c.approvalStatus === "PENDING";
      if (statusFilter === "SAFE") return c.approvalStatus === "APPROVED" && c.mrlStatus === "SAFE" && !c.isExpired;
      if (statusFilter === "UNSAFE") return c.approvalStatus === "APPROVED" && c.mrlStatus === "UNSAFE";
      if (statusFilter === "EXPIRED") return c.isExpired || c.approvalStatus === "EXPIRED";
      return true;
    });
  }, [data.certificates, searchTerm, statusFilter]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Toast Notifications */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-emerald-400/40 animate-in fade-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5" />
          <span className="font-semibold text-sm">{successToast}</span>
          <button onClick={() => setSuccessToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}
      {errorToast && (
        <div className="fixed top-6 right-6 z-50 bg-rose-500/90 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md border border-rose-400/40 animate-in fade-in slide-in-from-top-4">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold text-sm">{errorToast}</span>
          <button onClick={() => setErrorToast(null)} className="ml-2 hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">FSSAI Regulatory Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            FSSAI CERTIFY <span className="text-slate-500 font-light">— Weekly MRL Certification Management</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Evaluate antimicrobial adherence, enforce Maximum Residue Limits, and authorize digitally verifiable weekly farmer certificates.
          </p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchCertificates(); }}
          disabled={refreshing}
          className="self-start md:self-auto flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-sm font-medium text-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Farmers</span>
            <Building2 className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white mt-2">
            {data.summary?.totalFarmers ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Registered in cluster</span>
        </div>

        <div className="bg-slate-900/80 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-300 mt-2">
            {data.summary?.pendingCertifications ?? 0}
          </p>
          <span className="text-[11px] text-amber-500/80 mt-1">Awaiting FSSAI approval</span>
        </div>

        <div className="bg-slate-900/80 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">MRL SAFE</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-emerald-300 mt-2">
            {data.summary?.mrlSafe ?? 0}
          </p>
          <span className="text-[11px] text-emerald-500/80 mt-1">Premium market eligible</span>
        </div>

        <div className="bg-slate-900/80 border border-rose-500/20 rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-xs font-semibold uppercase tracking-wider">MRL NOT SAFE</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-rose-300 mt-2">
            {data.summary?.mrlNotSafe ?? 0}
          </p>
          <span className="text-[11px] text-rose-500/80 mt-1">Quarantined / non-compliant</span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Expired</span>
            <XCircle className="w-4 h-4 text-slate-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-300 mt-2">
            {data.summary?.expiredCertificates ?? 0}
          </p>
          <span className="text-[11px] text-slate-500 mt-1">Elapsed weekly cycle</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Farmer ID, Name, Farm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 transition-colors"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto p-1 bg-slate-950/80 border border-slate-800/80 rounded-xl text-xs font-medium">
          {["ALL", "PENDING", "SAFE", "UNSAFE", "EXPIRED"].map(tab => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                statusFilter === tab 
                  ? "bg-emerald-500 text-slate-950 font-bold shadow-sm" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800/60"
              }`}
            >
              {tab === "ALL" ? "All Farmers" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/90 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
              <tr>
                <th className="px-5 py-3.5">Farmer ID</th>
                <th className="px-5 py-3.5">Farmer Name</th>
                <th className="px-5 py-3.5">Farm</th>
                <th className="px-5 py-3.5">Approval Status</th>
                <th className="px-5 py-3.5">MRL Status</th>
                <th className="px-5 py-3.5">Valid Until</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-400" />
                    <span>Loading compliance database...</span>
                  </td>
                </tr>
              ) : filteredCertificates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-slate-500">
                    <Award className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <span>No farmer certification records matched your filters.</span>
                  </td>
                </tr>
              ) : (
                filteredCertificates.map((c) => {
                  const isSafe = c.approvalStatus === "APPROVED" && c.mrlStatus === "SAFE" && !c.isExpired;
                  const isUnsafe = c.approvalStatus === "APPROVED" && c.mrlStatus === "UNSAFE";
                  const isPending = c.approvalStatus === "PENDING";
                  const isExpired = c.isExpired || c.approvalStatus === "EXPIRED";

                  return (
                    <tr key={c.farmerId} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-white text-xs">
                        {c.farmerId}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-200">
                        {c.farmerName}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {c.farmName}
                      </td>
                      <td className="px-5 py-4">
                        {c.approvalStatus === "APPROVED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <Check className="w-3 h-3" /> APPROVED
                          </span>
                        )}
                        {c.approvalStatus === "PENDING" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" /> PENDING
                          </span>
                        )}
                        {c.approvalStatus === "REJECTED" && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <X className="w-3 h-3" /> REJECTED
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
                            <Clock className="w-3 h-3" /> EXPIRED
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {isSafe && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                            🟢 SAFE
                          </span>
                        )}
                        {isUnsafe && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                            🔴 UNSAFE
                          </span>
                        )}
                        {!isSafe && !isUnsafe && (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-slate-400 text-xs">
                        {c.validUntil ? new Date(c.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => openReviewDrawer(c.farmerId)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 text-xs font-semibold transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>{isPending ? "Review" : "Manage"}</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Drawer / Modal */}
      {selectedFarmerId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white">
                    FSSAI Certification Review: {selectedFarmerId}
                  </h2>
                  <p className="text-xs text-slate-400">
                    Comprehensive compliance evidence verification & MRL authorization
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedFarmerId(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {evidenceLoading ? (
                <div className="py-16 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
                  <p className="text-sm font-medium">Querying livestock treatments, lab assays, and withdrawal ledger...</p>
                </div>
              ) : evidence ? (
                <>
                  {/* Farmer Profile Card */}
                  <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Farmer</span>
                      <p className="font-bold text-white text-sm mt-0.5">{evidence.farmer.fullName}</p>
                      <p className="text-slate-400 text-[11px] font-mono">{evidence.farmer.farmerId}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Location</span>
                      <p className="text-slate-200 mt-0.5">{evidence.farmer.farmLocation || "Regional Cluster"}</p>
                      <p className="text-slate-500 text-[11px] truncate">{evidence.farmer.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Current Approval</span>
                      <p className="mt-0.5">
                        <span className={`inline-block font-bold ${
                          evidence.latestCertificate?.approvalStatus === "APPROVED" ? "text-emerald-400" :
                          evidence.latestCertificate?.approvalStatus === "REJECTED" ? "text-rose-400" : "text-amber-400"
                        }`}>
                          {evidence.latestCertificate?.approvalStatus || "PENDING"}
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Current MRL Status</span>
                      <p className="mt-0.5">
                        <span className={`inline-block font-bold ${
                          evidence.latestCertificate?.mrlStatus === "SAFE" ? "text-emerald-400" :
                          evidence.latestCertificate?.mrlStatus === "UNSAFE" ? "text-rose-400" : "text-slate-400"
                        }`}>
                          {evidence.latestCertificate?.mrlStatus === "SAFE" ? "🟢 MRL SAFE" :
                           evidence.latestCertificate?.mrlStatus === "UNSAFE" ? "🔴 MRL NOT SAFE" : "— NOT SET"}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Supporting Evidence Tabs */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Supporting Evidence</span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEvidenceTab("treatments")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            evidenceTab === "treatments" 
                              ? "bg-slate-800 text-emerald-400 border border-slate-700" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Treatments & AMU ({evidence.evidence?.recentTreatments?.length || 0})
                        </button>
                        <button
                          onClick={() => setEvidenceTab("withdrawals")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            evidenceTab === "withdrawals" 
                              ? "bg-slate-800 text-amber-400 border border-slate-700" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Active Withholdings ({evidence.evidence?.activeWithdrawals?.length || 0})
                        </button>
                        <button
                          onClick={() => setEvidenceTab("tests")}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                            evidenceTab === "tests" 
                              ? "bg-slate-800 text-cyan-400 border border-slate-700" 
                              : "text-slate-400 hover:text-white"
                          }`}
                        >
                          Lab MRL Assays ({evidence.evidence?.recentMrlTests?.length || 0})
                        </button>
                      </div>
                    </div>

                    {/* Evidence Content */}
                    <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 min-h-[160px] max-h-[220px] overflow-y-auto">
                      {evidenceTab === "treatments" && (
                        (evidence.evidence?.recentTreatments?.length || 0) === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No recent veterinary treatments recorded.</p>
                        ) : (
                          <div className="space-y-2">
                            {evidence.evidence.recentTreatments.map((t, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                                <div>
                                  <span className="font-bold text-slate-200">{t.medicineName}</span>
                                  <span className="text-slate-500 ml-2">({t.activeIngredient})</span>
                                  <p className="text-[11px] text-slate-400">
                                    Target: {t.entityName} (Tag: {t.tagCode}) • Dose: {t.dose} {t.doseUnit}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-[11px] text-slate-400">
                                    {new Date(t.dateAdministered).toLocaleDateString("en-IN")}
                                  </span>
                                  <p className="text-[11px] text-emerald-400 font-semibold">{t.status}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {evidenceTab === "withdrawals" && (
                        (evidence.evidence?.activeWithdrawals?.length || 0) === 0 ? (
                          <p className="text-xs text-emerald-400 py-6 text-center font-medium">✓ No animals currently under active statutory withdrawal withholding.</p>
                        ) : (
                          <div className="space-y-2">
                            {evidence.evidence.activeWithdrawals.map((w, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                <div>
                                  <span className="font-bold text-amber-300">{w.foodProduct} Quarantine</span>
                                  <span className="text-slate-400 ml-2">Due to {w.medicineName}</span>
                                  <p className="text-[11px] text-slate-400">{w.entityName} (Tag: {w.tagCode})</p>
                                </div>
                                <div className="text-right">
                                  <span className="text-xs font-bold text-amber-400">WITHHOLD UNTIL:</span>
                                  <p className="text-xs font-bold text-white">{new Date(w.safeFromDate).toLocaleDateString("en-IN")}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}

                      {evidenceTab === "tests" && (
                        (evidence.evidence?.recentMrlTests?.length || 0) === 0 ? (
                          <p className="text-xs text-slate-500 py-6 text-center">No chemical laboratory test results on record for this farm.</p>
                        ) : (
                          <div className="space-y-2">
                            {evidence.evidence.recentMrlTests.map((test, idx) => (
                              <div key={idx} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                                <div>
                                  <span className="font-bold text-slate-200">{test.productType} Test</span>
                                  <span className="text-slate-400 ml-2">(Sample #{test.sampleId})</span>
                                  <p className="text-[11px] text-slate-400">
                                    Substance: {test.substanceDetected} ({test.amountDetected} {test.unit})
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                                    test.status === "SAFE" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"
                                  }`}>
                                    {test.status}
                                  </span>
                                  <p className="text-[11px] text-slate-500 mt-0.5">{new Date(test.testDate).toLocaleDateString("en-IN")}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )
                      )}
                    </div>
                  </div>

                  {/* Two-Step Workflow Control Box */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>Two-Step FSSAI Authorization Workflow</span>
                    </h3>

                    {/* Step 1: Certification Approval */}
                    <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold uppercase text-slate-400">Step 1 — Certification Approval</span>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Verify documentation and authorize this farmer for weekly certification.
                          </p>
                        </div>
                        <div>
                          {evidence.latestCertificate?.approvalStatus === "APPROVED" ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-lg text-xs font-bold">
                              <Check className="w-3.5 h-3.5" /> APPROVED
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold">
                              <Clock className="w-3.5 h-3.5" /> {evidence.latestCertificate?.approvalStatus || "PENDING"}
                            </span>
                          )}
                        </div>
                      </div>

                      {evidence.latestCertificate?.approvalStatus !== "APPROVED" && (
                        <div className="flex items-center gap-3 pt-2">
                          <button
                            onClick={() => handleApproveReject("APPROVE")}
                            disabled={actionLoading}
                            className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 transition-all disabled:opacity-50"
                          >
                            <Check className="w-4 h-4" />
                            <span>APPROVE CERTIFICATION</span>
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            disabled={actionLoading}
                            className="py-2.5 px-4 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold rounded-xl text-xs flex items-center gap-2 transition-all disabled:opacity-50"
                          >
                            <X className="w-4 h-4" />
                            <span>REJECT</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Step 2: MRL Status Selection (UNLOCKED ONLY WHEN APPROVED) */}
                    <div className={`p-4 rounded-xl border transition-all ${
                      evidence.latestCertificate?.approvalStatus === "APPROVED" 
                        ? "bg-slate-900 border-emerald-500/40" 
                        : "bg-slate-900/40 border-slate-800 opacity-60 pointer-events-none"
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase text-slate-400">Step 2 — Set MRL Safety Benchmark</span>
                            {evidence.latestCertificate?.approvalStatus !== "APPROVED" ? (
                              <span className="inline-flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                                <Lock className="w-3 h-3" /> LOCKED (Approve Step 1 First)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                <Unlock className="w-3 h-3" /> UNLOCKED
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Designate verified MRL safety status based on lab reports and withdrawal compliance.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        {/* Status Radio Choices */}
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            type="button"
                            onClick={() => setSelectedMrlStatus("SAFE")}
                            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                              selectedMrlStatus === "SAFE"
                                ? "bg-emerald-500/20 border-emerald-500 text-emerald-200 shadow-md shadow-emerald-950/50"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">🟢</span>
                              <div>
                                <span className="font-bold text-xs">MRL SAFE</span>
                                <p className="text-[10px] opacity-70">Premium Market Eligible</p>
                              </div>
                            </div>
                            {selectedMrlStatus === "SAFE" && <Check className="w-4 h-4 text-emerald-400" />}
                          </button>

                          <button
                            type="button"
                            onClick={() => setSelectedMrlStatus("UNSAFE")}
                            className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${
                              selectedMrlStatus === "UNSAFE"
                                ? "bg-rose-500/20 border-rose-500 text-rose-200 shadow-md shadow-rose-950/50"
                                : "bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="text-lg">🔴</span>
                              <div>
                                <span className="font-bold text-xs">MRL NOT SAFE</span>
                                <p className="text-[10px] opacity-70">Exceeds limits / Withholding active</p>
                              </div>
                            </div>
                            {selectedMrlStatus === "UNSAFE" && <Check className="w-4 h-4 text-rose-400" />}
                          </button>
                        </div>

                        {/* Validity Dates */}
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Certificate Valid From</label>
                            <input
                              type="date"
                              value={validFrom}
                              onChange={(e) => setValidFrom(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-semibold text-slate-400 block mb-1">Certificate Valid Until</label>
                            <input
                              type="date"
                              value={validUntil}
                              onChange={(e) => setValidUntil(e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                            />
                          </div>
                        </div>

                        {/* Notes */}
                        <div>
                          <label className="text-[11px] font-semibold text-slate-400 block mb-1">Regulatory Notes / Assay Reference</label>
                          <textarea
                            rows={2}
                            placeholder="e.g. Mass spectrometry screening verified below Codex benchmark..."
                            value={statusNotes}
                            onChange={(e) => setStatusNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 placeholder-slate-600"
                          />
                        </div>

                        {/* Commit Button */}
                        <button
                          onClick={() => setShowConfirmModal(true)}
                          disabled={actionLoading || evidence.latestCertificate?.approvalStatus !== "APPROVED"}
                          className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/40 transition-all active:scale-95 disabled:opacity-50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          <span>COMMIT MRL STATUS & ISSUE CERTIFICATE</span>
                        </button>
                      </div>
                    </div>

                    {/* Audit Trail Timeline */}
                    {evidence.latestCertificate?.auditLogs && evidence.latestCertificate.auditLogs.length > 0 && (
                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-2">
                          Audit Trail & Regulatory Sign-offs
                        </span>
                        <div className="space-y-1.5 max-h-28 overflow-y-auto pr-1">
                          {evidence.latestCertificate.auditLogs.map((log, lIdx) => (
                            <div key={lIdx} className="text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800/40 flex items-center justify-between text-slate-400">
                              <div>
                                <span className="font-bold text-slate-300">{log.action}</span>
                                <span className="text-slate-500 ml-2">by {log.regulatorName || "FSSAI"}</span>
                                {log.details && <p className="text-[10px] text-slate-500 mt-0.5">{log.details}</p>}
                              </div>
                              <span className="text-[10px] text-slate-500">
                                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
              <h3 className="text-lg font-black text-white">Confirm MRL Certification</h3>
            </div>
            
            <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Farmer:</span>
                <span className="font-bold text-white">{selectedFarmerId} ({evidence?.farmer?.fullName})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Designated Status:</span>
                <span className={`font-bold ${selectedMrlStatus === "SAFE" ? "text-emerald-400" : "text-rose-400"}`}>
                  {selectedMrlStatus === "SAFE" ? "🟢 MRL SAFE" : "🔴 MRL NOT SAFE"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Validity Window:</span>
                <span className="font-mono text-white">{validFrom} to {validUntil}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Approving Authority:</span>
                <span className="text-slate-300">Current FSSAI Regulator</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Blockchain Anchoring:</span>
                <span className="text-emerald-400 font-semibold">Keccak-256 Proof Generation</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              By confirming, this certificate will immediately be published to the public QR verification ledger and updated in the farmer&apos;s portal.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSetMrlStatus}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                <span>Confirm & Issue</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-lg font-black text-white">Reject MRL Certification</h3>
            </div>

            <p className="text-xs text-slate-400">
              Specify the compliance deficiency or reason for denying certification for this weekly cycle.
            </p>

            <textarea
              rows={3}
              placeholder="e.g. Unexplained antimicrobial administration logs without withdrawal record..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
            />

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleApproveReject("REJECT", rejectionReason)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
                <span>Confirm Rejection</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
