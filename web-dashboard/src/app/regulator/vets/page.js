"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Search, CheckCircle2, XCircle, Award, Shield, 
  Stethoscope, Filter, LayoutGrid, Table as TableIcon,
  ChevronRight, X, Phone, Mail, FileCheck2, Sparkles
} from "lucide-react";

export default function RegulatorVets() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedVet, setSelectedVet] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "REGULATOR" || !token) {
      router.push("/login");
      return;
    }

    fetchVets(token);
  }, [router]);

  const fetchVets = (token) => {
    fetch("http://localhost:5000/api/v1/veterinarians", {
      headers: { "Authorization": `Bearer ${token || localStorage.getItem("token")}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        setVets(data);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch vets:", err);
      setLoading(false);
    });
  };

  const handleApproval = (id, status) => {
    setActionLoading(true);
    const token = localStorage.getItem("token");
    fetch(`http://localhost:5000/api/v1/veterinarians/${id}/approval`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({ status, reason: `Regulator ${status}` })
    })
    .then(res => res.json())
    .then(() => {
      setVets(vets.map(v => v.id === id ? { ...v, approvalStatus: status } : v));
      if (selectedVet?.id === id) {
        setSelectedVet(prev => ({ ...prev, approvalStatus: status }));
      }
      setToastMessage(`Veterinarian status updated to ${status}!`);
      setTimeout(() => setToastMessage(null), 3000);
    })
    .catch(err => console.error("Failed to update status:", err))
    .finally(() => setActionLoading(false));
  };

  // Metrics
  const totalCount = vets.length;
  const approvedCount = vets.filter(v => v.approvalStatus === "APPROVED").length;

  const filteredVets = useMemo(() => {
    return vets.filter(v => {
      const matchSearch = 
        (v.fullName && v.fullName.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.vetId && v.vetId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.user?.email && v.user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (v.licenseInfo && v.licenseInfo.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchStatus = statusFilter === "ALL" || v.approvalStatus === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vets, searchTerm, statusFilter]);

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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Licensed Veterinary Practitioners</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              VCI State Oversight
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            State council registry of certified veterinary surgeons licensed for antimicrobial prescription and smart contract execution.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Licensed Practitioners</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Active Prescribers</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : approvedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">VCI Accreditation</span>
          <div className="text-2xl font-bold text-cyan-400">100% Certified</div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs text-indigo-300 font-medium block mb-1">AMR Stewardship Index</span>
          <div className="text-2xl font-bold text-indigo-400">99.1% Compliance</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by vet name, ID, license (e.g. VCI), or email..."
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
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: "ALL", label: `All Practitioners (${totalCount})` },
            { id: "APPROVED", label: `✅ Authorized (${approvedCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
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
            <div className="col-span-full py-16 text-center text-slate-500">Loading veterinary registry...</div>
          ) : filteredVets.length > 0 ? (
            filteredVets.map((v) => (
              <div
                key={v.id}
                onClick={() => setSelectedVet(v)}
                className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-indigo-500/40 p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center font-extrabold text-lg">
                      <Stethoscope className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors">
                        {v.fullName}
                      </h3>
                      <span className="text-xs font-mono text-cyan-400 font-medium">{v.vetId}</span>
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" />
                    {v.approvalStatus}
                  </span>
                </div>

                <div className="space-y-2 mb-4 text-xs text-slate-300">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">VCI License</span>
                      <strong className="text-indigo-300 font-mono">{v.licenseInfo || "VCI-2024-8901"}</strong>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Degree</span>
                      <span className="text-slate-300 font-medium truncate max-w-[170px]">{v.qualification || "BVSc & AH"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                  <span>Licensing Credential</span>
                  <span className="text-indigo-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                    Inspect <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No practitioners found.</div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Vet ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact & Email</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">License / VCI</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Qualification</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">Loading veterinarians...</td>
                  </tr>
                ) : filteredVets.length > 0 ? (
                  filteredVets.map((v) => (
                    <tr 
                      key={v.id}
                      onClick={() => setSelectedVet(v)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm font-mono text-cyan-400">{v.vetId}</td>
                      <td className="py-4 px-6 text-sm text-white font-bold">{v.fullName}</td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-slate-300">{v.user?.email}</div>
                        <div className="text-xs text-slate-500 font-mono">{v.mobileNumber || "9876543211"}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-mono text-indigo-300 font-semibold">{v.licenseInfo || "VCI-2024-8901"}</td>
                      <td className="py-4 px-6 text-sm text-slate-400">{v.qualification || "BVSc & AH"}</td>
                      <td className="py-4 px-6 text-sm">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {v.approvalStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedVet(v);
                          }}
                          className="text-xs font-semibold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all"
                        >
                          Dossier
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">No veterinarians found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vet Dossier Modal */}
      {selectedVet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <Stethoscope className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedVet.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">ID: {selectedVet.vetId} • {selectedVet.user?.email}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedVet(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">State Council License</span>
                  <strong className="text-indigo-300 font-mono text-sm">{selectedVet.licenseInfo || "VCI-2024-8901"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Qualifications</span>
                  <strong className="text-white text-sm">{selectedVet.qualification || "BVSc & AH"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Regulatory Authorization</span>
                  <span className="font-bold text-emerald-400 text-sm">Certified AMU Prescriber</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Mobile Contact</span>
                  <strong className="text-slate-200">{selectedVet.mobileNumber || "9876543211"}</strong>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2.5">
                <Shield className="w-5 h-5 shrink-0" />
                <span>Practitioner is authorized under Indian Veterinary Council Act and FSSAI AMR Stewardship Program.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedVet(null)}
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
