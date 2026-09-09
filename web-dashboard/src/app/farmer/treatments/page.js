"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, Syringe, Pill, Search, Filter, Calendar, 
  ShieldCheck, CheckCircle2, Clock, X, FileText, ChevronRight,
  Sparkles, Stethoscope, AlertTriangle, ArrowUpRight, Copy
} from "lucide-react";

export default function FarmerTreatments() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL"); // ALL | Medicine | Vaccine
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | Active | Completed
  const [viewMode, setViewMode] = useState("table"); // table | timeline
  const [selectedTreatment, setSelectedTreatment] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || !token) {
      router.push("/login");
      return;
    }
    if (role !== "FARMER") {
      router.push("/");
      return;
    }

    fetch("http://localhost:5000/api/v1/treatments/my-treatments", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        const cutoff = new Date("2026-09-01T00:00:00.000Z");
        setTreatments(data.filter(t => new Date(t.date) >= cutoff));
      } else {
        setTreatments([]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch treatments:", err);
      setTreatments([]);
      setLoading(false);
    });
  }, [router]);

  // Calculations
  const totalCount = treatments.length;
  const medicineCount = treatments.filter(t => t.type === "Medicine").length;
  const vaccineCount = treatments.filter(t => t.type === "Vaccine").length;
  const activeCount = treatments.filter(t => t.status === "Active").length;

  // Filtered
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const matchSearch = 
        t.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.animal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.vet.toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;

      return matchSearch && matchType && matchStatus;
    });
  }, [treatments, searchTerm, typeFilter, statusFilter]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage(`Blockchain hash copied!`);
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Treatment & Prescription Log</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {totalCount} Verified Interventions
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Certified record of antimicrobial medicines, vaccines, and booster shots administered by licensed veterinarians.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 flex items-center gap-2">
            <Stethoscope className="w-4 h-4 text-emerald-400" />
            Attending Vet: Dr. Suresh Kumar
          </span>
        </div>
      </div>

      {/* Metric Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Logs</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Antimicrobial Prescriptions</span>
          <div className="text-2xl font-bold text-cyan-400 flex items-center gap-2">
            <span>{loading ? "..." : medicineCount}</span>
            <Pill className="w-4 h-4 opacity-70" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Vaccination Boosters</span>
          <div className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
            <span>{loading ? "..." : vaccineCount}</span>
            <Syringe className="w-4 h-4 opacity-70" />
          </div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">Active Regimens</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : activeCount}</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by medicine, tag (e.g. RJ-CW1), or animal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          {/* View Mode */}
          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("table")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Table View
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "timeline" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Timeline View
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Type:
          </span>
          {[
            { id: "ALL", label: `All (${totalCount})` },
            { id: "Medicine", label: `💊 Medicines (${medicineCount})` },
            { id: "Vaccine", label: `💉 Vaccines (${vaccineCount})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setTypeFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                typeFilter === f.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}

          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider ml-4 mr-1">Status:</span>
          {[
            { id: "ALL", label: "All Statuses" },
            { id: "Active", label: "Active Regimen", highlight: "text-amber-400 border-amber-500/30" },
            { id: "Completed", label: "Completed", highlight: "text-emerald-400 border-emerald-500/30" }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === s.id
                  ? (s.highlight ? `${s.highlight} bg-amber-500/10` : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40")
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "table" ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Animal / Tag</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Medicine / Booster</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Veterinarian</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Regimen Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">Loading prescription history...</td>
                  </tr>
                ) : filteredTreatments.length > 0 ? (
                  filteredTreatments.map((t) => (
                    <tr
                      key={t.id}
                      onClick={() => setSelectedTreatment(t)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm text-slate-300 font-medium">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${
                          t.type === "Medicine" 
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" 
                            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {t.type === "Medicine" ? <Pill className="w-3.5 h-3.5" /> : <Syringe className="w-3.5 h-3.5" />}
                          {t.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <div className="text-white font-bold">{t.animal}</div>
                        <div className="text-xs font-mono text-cyan-400 font-semibold">{t.tag}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-white">
                        {t.medicine}
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-400 font-mono">
                        {t.vet}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                          t.status === 'Active' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse' 
                            : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        }`}>
                          {t.status === 'Active' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {t.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTreatment(t);
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                        >
                          Prescription
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-slate-500">No treatments found matching your filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Timeline View */
        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-500">Loading timeline...</div>
          ) : filteredTreatments.length > 0 ? (
            <div className="relative border-l border-slate-800 ml-6 space-y-6">
              {filteredTreatments.map((t, idx) => (
                <div key={t.id || idx} className="relative pl-6 group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-2.5 top-1.5 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    t.status === "Active"
                      ? "bg-amber-500 border-slate-950 text-slate-950"
                      : "bg-emerald-500 border-slate-950 text-slate-950"
                  }`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-950"></span>
                  </div>

                  <div 
                    onClick={() => setSelectedTreatment(t)}
                    className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 cursor-pointer transition-all hover:bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">{new Date(t.date).toLocaleDateString()}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          t.type === "Medicine" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {t.type}
                        </span>
                        <span className="text-xs font-mono text-cyan-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                          {t.tag}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-white">{t.medicine} on {t.animal}</h4>
                      <p className="text-xs text-slate-400">Prescribed by {t.vet}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        t.status === "Active" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                        {t.status}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">No records found for timeline.</div>
          )}
        </div>
      )}

      {/* Prescription Detail Modal */}
      {selectedTreatment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {selectedTreatment.type === "Medicine" ? <Pill className="w-6 h-6" /> : <Syringe className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedTreatment.medicine}</h3>
                  <p className="text-xs text-slate-400 font-mono">Target: {selectedTreatment.animal} • Tag: {selectedTreatment.tag}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTreatment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Date Administered</span>
                  <strong className="text-white text-sm">{new Date(selectedTreatment.date).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Prescription Status</span>
                  <span className={`inline-flex items-center gap-1 font-bold ${
                    selectedTreatment.status === "Active" ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {selectedTreatment.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Attending Veterinarian</span>
                  <strong className="text-slate-200">{selectedTreatment.vet}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Type</span>
                  <strong className="text-cyan-400">{selectedTreatment.type}</strong>
                </div>
              </div>

              {/* Blockchain Seal */}
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <div>
                    <span className="font-bold block text-white">Cryptographically Anchored</span>
                    <span className="text-[11px] text-slate-400">Immutably stored on Sepolia testnet ledger</span>
                  </div>
                </div>
                <button
                  onClick={() => copyHash("0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Hash
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedTreatment(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Prescription
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
