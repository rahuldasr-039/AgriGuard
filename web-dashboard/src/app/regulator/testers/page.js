"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Beaker, Search, CheckCircle2, XCircle, Building2, 
  ShieldCheck, Filter, LayoutGrid, Table as TableIcon,
  ChevronRight, X, FlaskConical, Award, Sparkles
} from "lucide-react";

export default function RegulatorTesters() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [testers, setTesters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedTester, setSelectedTester] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [wasteClaims, setWasteClaims] = useState([]);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "REGULATOR" || !token) {
      router.push("/login");
      return;
    }

    fetchTesters(token);
  }, [router]);

  const fetchTesters = (token) => {
    const authHeaders = { "Authorization": `Bearer ${token || localStorage.getItem("token")}` };
    fetch("http://localhost:5000/api/v1/testers", { headers: authHeaders })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setTesters(data);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch testers:", err);
      setLoading(false);
    });

    fetch("http://localhost:5000/api/v1/testers/waste-claims", { headers: authHeaders })
    .then(res => res.json())
    .then(claimsData => {
      if (Array.isArray(claimsData)) {
        setWasteClaims(claimsData.filter(c => !c.productType?.toLowerCase().includes("fish") && !c.animalType?.toLowerCase().includes("fish")));
      }
    })
    .catch(err => console.error("Failed to fetch waste claims:", err));
  };

  const handleApproval = (id, status) => {
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/v1/testers/${id}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason: `Regulator ${status}` })
    })
    .then(res => res.json())
    .then(() => {
      setTesters(testers.map(t => t.id === id ? { ...t, approvalStatus: status } : t));
      if (selectedTester?.id === id) {
        setSelectedTester(prev => ({ ...prev, approvalStatus: status }));
      }
      setToastMessage(`Testing facility status updated to ${status}!`);
      setTimeout(() => setToastMessage(null), 3000);
    })
    .catch(err => console.error("Failed to update status:", err));
  };

  // Metrics
  const totalCount = testers.length;
  const approvedCount = testers.filter(t => t.approvalStatus === "APPROVED").length;

  const filteredTesters = useMemo(() => {
    return testers.filter(t => {
      const matchSearch = 
        (t.fullName && t.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.testerId && t.testerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.user?.email && t.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (t.labDetails && t.labDetails.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || t.approvalStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [testers, searchTerm, statusFilter]);

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Accredited Testing Facilities & Chemists</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              FSSAI / NABL Accredited
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            National directory of certified analytical testing laboratories and surveillance technicians authorized for official MRL compliance determination.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Accredited Laboratories</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Certified Technicians</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : approvedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Surveillance Testing Scopes</span>
          <div className="text-2xl font-bold text-cyan-400">Milk, Aqua, Meat</div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs text-indigo-300 font-medium block mb-1">NABL Lab Compliance</span>
          <div className="text-2xl font-bold text-indigo-400">100% Certified</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by chemist name, tester ID, or facility (e.g. Govt Lab)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: "ALL", label: `All Facilities (${totalCount})` },
            { id: "APPROVED", label: `✅ Accredited (${approvedCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">Loading accredited laboratories...</div>
          ) : filteredTesters.length > 0 ? (
            filteredTesters.map((t) => (
              <div
                key={t.id}
                onClick={() => setSelectedTester(t)}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-cyan-500/40 p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                      <Beaker className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                        {t.fullName}
                      </h3>
                      <span className="text-xs font-mono text-cyan-400 font-medium">{t.testerId}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {t.approvalStatus}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Facility / Laboratory</span>
                      <strong className="text-white">{t.labDetails || "Govt Testing Lab"}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Qualification</span>
                      <span className="text-slate-300 font-medium truncate max-w-[170px]">{t.qualification || "MSc Dairy Tech"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Facility Dossier</span>
                  <span className="text-cyan-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No laboratories found.</div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tester ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Chemist / Technician</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Email</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Lab / Facility Details</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qualification</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">Loading accredited testers...</td>
                  </tr>
                ) : filteredTesters.length > 0 ? (
                  filteredTesters.map((t) => (
                    <tr 
                      key={t.id}
                      onClick={() => setSelectedTester(t)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-cyan-400">{t.testerId}</td>
                      <td className="py-4 px-6 text-sm text-white font-bold">{t.fullName}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-slate-300">{t.user?.email}</div>
                        <div className="text-xs text-slate-500 font-mono">{t.mobileNumber || "7654321091"}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-white font-medium">{t.labDetails || "Govt Lab"}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{t.qualification || "MSc Dairy Technology"}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {t.approvalStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTester(t);
                          }}
                          className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">No laboratory testers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Waste & Subsidy Section */}
      <div id="waste-subsidy" className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white">Waste & Subsidy</h2>
            <p className="text-xs text-slate-400 mt-1">Withdrawal waste and compensation records submitted by certified testers</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
              {wasteClaims.length} Submissions
            </span>
            <Link 
              href="/regulator/waste-subsidy"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
            >
              Open Dedicated View →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Collected</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tester ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer ID</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Amount</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Subsidy</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {wasteClaims && wasteClaims.length > 0 ? (
                wasteClaims.map((claim, idx) => (
                  <tr key={claim.id || `claim-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                    <td className="py-4 px-6 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Yes
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm font-mono text-cyan-400 font-semibold">{claim.testerId}</td>
                    <td className="py-4 px-6 text-sm font-mono text-white font-medium">{claim.farmerId}</td>
                    <td className="py-4 px-6 text-sm text-slate-300">{claim.productType || claim.product}</td>
                    <td className="py-4 px-6 text-sm text-amber-400 font-medium font-mono">
                      {claim.wasteAmount ? `${claim.wasteAmount} ${claim.unit || 'kg'}` : claim.amount}
                    </td>
                    <td className="py-4 px-6 text-sm font-semibold text-emerald-400 font-mono">
                      {typeof claim.aiRecommendedAmount === 'number' ? `₹${claim.aiRecommendedAmount.toLocaleString("en-IN")}` : claim.subsidy}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    No waste & subsidy records submitted yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tester Facility Modal */}
      {selectedTester && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                  <FlaskConical className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTester.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedTester.testerId} • {selectedTester.user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTester(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Testing Facility</span>
                  <strong className="text-white text-sm">{selectedTester.labDetails || "National Lab"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Technical Credentials</span>
                  <strong className="text-cyan-400 text-sm">{selectedTester.qualification || "MSc Dairy Technology"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">FSSAI Accreditation</span>
                  <span className="font-bold text-emerald-400 text-sm">Certified Testing Officer</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Contact Details</span>
                  <strong className="text-slate-200">{selectedTester.mobileNumber || "7654321091"}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 shrink-0 text-cyan-400" />
                <span>Facility authorized for confirmatory LC-MS/MS and rapid receptor assay MRL testing under FSSAI Gazette Notification.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTester(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
