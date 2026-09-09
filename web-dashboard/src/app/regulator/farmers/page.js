"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Search, CheckCircle2, XCircle, ShieldCheck, 
  MapPin, Eye, Filter, LayoutGrid, Table as TableIcon,
  ChevronRight, X, AlertTriangle, Building2, Stethoscope, Copy
} from "lucide-react";

export default function RegulatorFarmers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | APPROVED | PENDING
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "REGULATOR" || !token) {
      router.push("/login");
      return;
    }

    fetchFarmers(token);
  }, [router]);

  const fetchFarmers = (token) => {
    fetch("http://localhost:5000/api/v1/farmers", {
      headers: { "Authorization": `Bearer ${token || localStorage.getItem("token")}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setFarmers(data);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch farmers:", err);
      setLoading(false);
    });
  };

  const handleApproval = (id, status) => {
    setActionLoading(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/v1/farmers/${id}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason: `Regulator ${status}` })
    })
    .then(res => res.json())
    .then(() => {
      setFarmers(farmers.map(f => f.id === id ? { ...f, approvalStatus: status } : f));
      if (selectedFarmer?.id === id) {
        setSelectedFarmer(prev => ({ ...prev, approvalStatus: status }));
      }
      setToastMessage(`Farmer status updated to ${status}!`);
      setTimeout(() => setToastMessage(null), 3000);
    })
    .catch(err => console.error("Failed to update status:", err))
    .finally(() => setActionLoading(false));
  };

  // Metrics
  const totalCount = farmers.length;
  const approvedCount = farmers.filter(f => f.approvalStatus === "APPROVED").length;
  const pendingCount = farmers.filter(f => f.approvalStatus === "PENDING").length;

  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => {
      const matchSearch = 
        (f.fullName && f.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.farmerId && f.farmerId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.user?.email && f.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (f.farmLocation && f.farmLocation.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || f.approvalStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [farmers, searchTerm, statusFilter]);

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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Registered Agricultural Producers</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              National FSSAI Registry
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Surveillance registry of livestock, poultry, and aquaculture producers. Manage statutory registrations, vet allocations, and biosecurity clearances.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Registered Producers</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Certified Compliant</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : approvedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">Pending Review</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : pendingCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Active Jurisdiction</span>
          <div className="text-2xl font-bold text-cyan-400">State District 1-5</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by producer name, ID, email, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all"
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
            { id: "ALL", label: `All Producers (${totalCount})` },
            { id: "APPROVED", label: `✅ Approved (${approvedCount})` },
            { id: "PENDING", label: `⚠️ Pending Review (${pendingCount})`, highlight: "text-amber-400 border-amber-500/30" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? (f.highlight ? `${f.highlight} bg-amber-500/10` : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40")
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
            <div className="col-span-full py-16 text-center text-slate-500">Loading producer records...</div>
          ) : filteredFarmers.length > 0 ? (
            filteredFarmers.map((f) => {
              const isApproved = f.approvalStatus === "APPROVED";

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFarmer(f)}
                  className={`group rounded-2xl border p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] ${
                    isApproved
                      ? "bg-slate-900/60 border-slate-800/80 hover:border-emerald-500/40 hover:bg-slate-900/80"
                      : "bg-slate-900/80 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-500/5"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg">
                        {f.fullName ? f.fullName.substring(0, 2).toUpperCase() : "FM"}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-emerald-300 transition-colors">
                          {f.fullName}
                        </h3>
                        <span className="text-xs font-mono text-cyan-400 font-medium">{f.farmerId}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isApproved
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                    }`}>
                      {isApproved ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {f.approvalStatus}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{f.farmLocation || "Location Not Provided"}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">Supervising Vet</span>
                      <strong className="text-cyan-300 font-medium">
                        {f.assignedVet?.fullName || "Unassigned"}
                      </strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
                    {!isApproved ? (
                      <div className="w-full flex gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(f.id, "APPROVED");
                          }}
                          className="flex-1 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors"
                        >
                          Approve Registration
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApproval(f.id, "REJECTED");
                          }}
                          className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-between text-slate-400">
                        <span>Inspect National Dossier</span>
                        <span className="text-emerald-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                          View <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No producers found matching filters.</div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Email</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Location</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Assigned Vet</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">Loading producers...</td>
                  </tr>
                ) : filteredFarmers.length > 0 ? (
                  filteredFarmers.map((f) => (
                    <tr 
                      key={f.id}
                      onClick={() => setSelectedFarmer(f)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-cyan-400">{f.farmerId}</td>
                      <td className="py-4 px-6 text-sm text-white font-bold">{f.fullName}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-slate-300">{f.user?.email || "No Email"}</div>
                        <div className="text-xs text-slate-500 font-mono">{f.mobileNumber || "N/A"}</div>
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">{f.farmLocation || "District 1"}</td>
                      <td className="py-4 px-6 text-sm text-cyan-400 font-medium">
                        {f.assignedVet?.fullName || "Unassigned"}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          f.approvalStatus === "APPROVED"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {f.approvalStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        {f.approvalStatus === "PENDING" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(f.id, "APPROVED");
                              }}
                              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleApproval(f.id, "REJECTED");
                              }}
                              className="text-xs font-bold px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                            Verified
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">No producers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Producer Dossier Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-extrabold text-lg">
                  {selectedFarmer.fullName ? selectedFarmer.fullName.substring(0, 2).toUpperCase() : "FM"}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedFarmer.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedFarmer.farmerId} • {selectedFarmer.user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedFarmer(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Premises Location</span>
                  <strong className="text-white text-sm">{selectedFarmer.farmLocation || "State District 1"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Assigned Veterinarian</span>
                  <strong className="text-cyan-400 text-sm">
                    {selectedFarmer.assignedVet?.fullName || "Unassigned"}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">FSSAI Accreditation</span>
                  <span className={`font-bold text-sm ${
                    selectedFarmer.approvalStatus === "APPROVED" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {selectedFarmer.approvalStatus}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Mobile Contact</span>
                  <strong className="text-slate-200">{selectedFarmer.mobileNumber || "9876543210"}</strong>
                </div>
              </div>

              {selectedFarmer.approvalStatus === "PENDING" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">FSSAI Producer Clearance Pending</h4>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Authorize this agricultural holding to enable legal livestock movement and veterinary medicine administrations.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApproval(selectedFarmer.id, "APPROVED")}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors disabled:opacity-50"
                    >
                      Certify & Approve Producer
                    </button>
                    <button
                      onClick={() => handleApproval(selectedFarmer.id, "REJECTED")}
                      disabled={actionLoading}
                      className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedFarmer(null)}
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
