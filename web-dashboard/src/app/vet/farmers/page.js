"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Search, CheckCircle2, AlertTriangle, XCircle, 
  MapPin, ShieldCheck, Filter, LayoutGrid, Table as TableIcon,
  ChevronRight, X, ExternalLink, RefreshCw, Sparkles, Building2,
  Trash2, AlertCircle
} from "lucide-react";
import Link from "next/link";

export default function VetFarmers() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmers, setFarmers] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | Approved | Pending Verification
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  
  // Modals
  const [selectedFarmer, setSelectedFarmer] = useState(null);
  const [farmerToDelete, setFarmerToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchFarmers = async () => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "VETERINARIAN" || !token) {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/farmers/my-farmers", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (Array.isArray(data)) {
        const mapped = data.map(f => ({
          id: f.id,
          farmerId: f.farmerId || f.id,
          name: f.fullName || "Unknown",
          location: f.farmLocation || f.fullAddress || "District 1, State",
          email: f.user?.email || "farmer@example.com",
          animals: f.farms?.length > 0 ? f.farms.reduce((sum, farm) => {
            const ind = farm.animals?.length || 0;
            const bat = farm.batches?.reduce((bSum, b) => bSum + (b.count || 0), 0) || 0;
            return sum + ind + bat;
          }, 0) : 0,
          status: f.approvalStatus === "PENDING" ? "Pending Verification" : 
                  f.approvalStatus === "APPROVED" ? "Approved" : "Rejected",
          rawStatus: f.approvalStatus
        }));
        setFarmers(mapped);
      }
    } catch (err) {
      console.error("Failed to fetch farmers:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, [router]);

  // Approve / Reject Handler
  const handleApprovalAction = async (farmerId, newStatus, reason = "Veterinary verified") => {
    setActionLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/v1/farmers/${farmerId}/approval`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus, reason })
      });
      if (!res.ok) throw new Error("Failed to update verification status");

      setToastMessage(`Farmer ${newStatus === "APPROVED" ? "Approved" : "Rejected"} successfully!`);
      setTimeout(() => setToastMessage(null), 3500);
      setSelectedFarmer(null);
      fetchFarmers();
    } catch (err) {
      alert(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Farmer Handler
  const handleDeleteFarmer = async () => {
    if (!farmerToDelete) return;
    setDeleteLoading(true);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`http://localhost:5000/api/v1/farmers/${farmerToDelete.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete farmer record");

      setToastMessage(`Farmer ${farmerToDelete.name} (${farmerToDelete.farmerId}) deleted successfully`);
      setTimeout(() => setToastMessage(null), 4000);
      setFarmerToDelete(null);
      if (selectedFarmer?.id === farmerToDelete.id) {
        setSelectedFarmer(null);
      }
      fetchFarmers();
    } catch (err) {
      alert(err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  // Metrics
  const totalCount = farmers.length;
  const approvedCount = farmers.filter(f => f.status === "Approved").length;
  const pendingCount = farmers.filter(f => f.status === "Pending Verification").length;
  const totalSupervisedLivestock = farmers.reduce((sum, f) => sum + f.animals, 0);

  // Filtered
  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => {
      const matchSearch = 
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.farmerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || f.status === statusFilter;
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Assigned Farmers & Premises</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              {totalCount} Registered Holdings
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Supervise farm premises, verify livestock inventories, certify compliance, and manage practice records.
          </p>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Assigned Farms</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Verified & Approved</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : approvedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">Pending Verification</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : pendingCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Supervised Livestock</span>
          <div className="text-2xl font-bold text-cyan-400">{loading ? "..." : totalSupervisedLivestock} head</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by farmer name, ID (e.g. FR10293), or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
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
            <Filter className="w-3 h-3" /> Filter:
          </span>
          {[
            { id: "ALL", label: `All Farmers (${totalCount})` },
            { id: "Approved", label: `✅ Approved (${approvedCount})` },
            { id: "Pending Verification", label: `⚠️ Pending Verification (${pendingCount})`, highlight: "text-amber-400 border-amber-500/30" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? (f.highlight ? `${f.highlight} bg-amber-500/10` : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40")
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
            <div className="col-span-full py-16 text-center text-slate-500">Loading farmer records...</div>
          ) : filteredFarmers.length > 0 ? (
            filteredFarmers.map((f) => {
              const isPending = f.status === "Pending Verification";

              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFarmer(f)}
                  className={`group rounded-2xl border p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] relative ${
                    isPending
                      ? "bg-slate-900/80 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-500/5"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-indigo-500/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-lg">
                        {f.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                          {f.name}
                        </h3>
                        <span className="text-xs font-mono text-cyan-400 font-medium">{f.farmerId}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      f.status === "Approved"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                    }`}>
                      {f.status === "Approved" ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {f.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{f.location}</span>
                    </div>
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">Supervised Livestock</span>
                      <strong className="text-white font-mono text-sm">{f.animals} head</strong>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                    {isPending ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFarmer(f);
                        }}
                        className="flex-1 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" /> Verify Premises
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFarmer(f);
                        }}
                        className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                      >
                        Inspect Dossier <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Delete Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setFarmerToDelete(f);
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                      title="Delete Farmer Record"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No farmers found matching filters.</div>
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
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer / Farm Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Premises Location</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Animals</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Verification Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">Loading farmers...</td>
                  </tr>
                ) : filteredFarmers.length > 0 ? (
                  filteredFarmers.map((f) => (
                    <tr 
                      key={f.id}
                      onClick={() => setSelectedFarmer(f)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-cyan-400">{f.farmerId}</td>
                      <td className="py-4 px-6 text-sm text-white font-bold">{f.name}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{f.location}</td>
                      <td className="py-4 px-6 text-sm text-slate-200 font-mono font-semibold">{f.animals}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          f.status === "Approved"
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedFarmer(f);
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all ${
                              f.status === "Pending Verification"
                                ? "bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
                                : "bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border-indigo-500/30"
                            }`}
                          >
                            {f.status === "Pending Verification" ? "Verify Premises" : "View Dossier"}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setFarmerToDelete(f);
                            }}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">No farmers found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Farmer Details & Verification Modal */}
      {selectedFarmer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-lg">
                  {selectedFarmer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedFarmer.name}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedFarmer.farmerId} • {selectedFarmer.email}</p>
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
                  <strong className="text-white text-sm">{selectedFarmer.location}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Supervised Animals</span>
                  <strong className="text-cyan-400 text-sm font-mono">{selectedFarmer.animals} Head</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Current Status</span>
                  <span className={`font-bold text-sm ${
                    selectedFarmer.status === "Approved" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {selectedFarmer.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Assigned Veterinarian</span>
                  <strong className="text-slate-200">Dr. Suresh Kumar</strong>
                </div>
              </div>

              {selectedFarmer.status === "Pending Verification" ? (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold">Veterinary Inspection Required</h4>
                      <p className="text-[11px] opacity-90 mt-0.5">
                        Verify that animal holdings, hygiene standards, and biosecurity measures meet FSSAI guidelines before authorizing AMU drug administrations.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handleApprovalAction(selectedFarmer.id, "APPROVED")}
                      disabled={actionLoading}
                      className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Approve & Certify Farm
                    </button>
                    <button
                      onClick={() => handleApprovalAction(selectedFarmer.id, "REJECTED", "Biosecurity deficit")}
                      disabled={actionLoading}
                      className="py-2.5 px-4 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold transition-colors disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>This farm holding has been verified and certified for official veterinary interventions.</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setFarmerToDelete(selectedFarmer);
                }}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Farmer Record
              </button>

              <button
                onClick={() => setSelectedFarmer(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {farmerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex items-center gap-3 text-rose-400 border-b border-slate-800 pb-4">
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Delete Farmer Record</h3>
                <p className="text-xs text-slate-400">Permanent practice action</p>
              </div>
            </div>

            <div className="space-y-3 text-sm text-slate-300">
              <p>
                Are you sure you want to permanently delete <strong className="text-white">{farmerToDelete.name}</strong> (<span className="font-mono text-cyan-400">{farmerToDelete.farmerId}</span>)?
              </p>
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 leading-relaxed">
                ⚠️ <strong>Warning:</strong> This will delete this farmer's holdings, registered animal tags ({farmerToDelete.animals} head), and associated clinical records from your practice roster.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setFarmerToDelete(null)}
                className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleDeleteFarmer}
                className="bg-rose-500 hover:bg-rose-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                {deleteLoading ? "Deleting Record..." : "Yes, Delete Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
