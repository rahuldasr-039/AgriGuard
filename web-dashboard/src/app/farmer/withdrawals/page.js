"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertTriangle, CalendarDays, CheckCircle2, Clock, 
  Search, Filter, ShieldCheck, X, ChevronRight, Copy,
  Calendar, AlertCircle, Info, Sparkles, FileCheck2
} from "lucide-react";

export default function FarmerWithdrawals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [withdrawals, setWithdrawals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | WAIT | SAFE
  const [productFilter, setProductFilter] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(null); // Clicked date in timeline
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
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

    fetch("http://localhost:5000/api/v1/treatments/my-withdrawals", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        const cutoff = new Date("2026-09-01T00:00:00.000Z");
        setWithdrawals(data.filter(w => new Date(w.lastDose) >= cutoff));
      } else {
        setWithdrawals([]);
      }
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch withdrawals:", err);
      setWithdrawals([]);
      setLoading(false);
    });
  }, [router]);

  // Aggregate Metrics
  const totalEntries = withdrawals.length;
  const activeQuarantines = withdrawals.filter(w => w.status === "WAIT").length;
  const clearedSafe = withdrawals.filter(w => w.status === "SAFE").length;

  // Distinct products
  const products = useMemo(() => {
    const set = new Set(withdrawals.map(w => w.product).filter(Boolean));
    return Array.from(set);
  }, [withdrawals]);

  // Calendar Day Tiles for Sept 2026
  const timelineDays = useMemo(() => {
    const days = [];
    for (let d = 1; d <= 18; d++) {
      const dateStr = `2026-09-${d < 10 ? '0' + d : d}`;
      const matchingClearing = withdrawals.filter(w => {
        const s = new Date(w.safeFrom).toISOString().split('T')[0];
        return s === dateStr;
      });
      const matchingActive = withdrawals.filter(w => {
        const dose = new Date(w.lastDose).toISOString().split('T')[0];
        const safe = new Date(w.safeFrom).toISOString().split('T')[0];
        return dateStr >= dose && dateStr <= safe;
      });

      days.push({
        day: d,
        dateStr,
        clearingCount: matchingClearing.length,
        clearingItems: matchingClearing,
        hasActiveWithdrawal: matchingActive.some(w => w.status === "WAIT")
      });
    }
    return days;
  }, [withdrawals]);

  // Filtered
  const filteredWithdrawals = useMemo(() => {
    return withdrawals.filter(w => {
      const matchSearch = 
        w.animal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.product.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === "ALL" || w.status === statusFilter;
      const matchProduct = productFilter === "ALL" || w.product.toLowerCase().includes(productFilter.toLowerCase());
      
      let matchDate = true;
      if (selectedDate) {
        const safe = new Date(w.safeFrom).toISOString().split('T')[0];
        const dose = new Date(w.lastDose).toISOString().split('T')[0];
        matchDate = selectedDate === safe || (selectedDate >= dose && selectedDate <= safe);
      }

      return matchSearch && matchStatus && matchProduct && matchDate;
    });
  }, [withdrawals, searchTerm, statusFilter, productFilter, selectedDate]);

  // Calculate days remaining helper
  const getDaysRemaining = (safeFromDate) => {
    const now = new Date();
    const safe = new Date(safeFromDate);
    const diffTime = safe - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Withdrawal & Food Safety Calendar</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              Statutory FSSAI Monitoring
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Track statutory medicine withdrawal periods in real time to ensure milk, meat, and eggs are certified safe before market harvest.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400 font-mono bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-xl">
          <Clock className="w-4 h-4 text-amber-400" />
          <span>Current Date: <strong>03/09/2026</strong></span>
        </div>
      </div>

      {/* High Alert Quarantine Banner if any active */}
      {activeQuarantines > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-1">
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Active Food Safety Holds ({activeQuarantines} Regimens Monitored)
                  </h2>
                </div>
                <p className="text-sm text-slate-300">
                  Products from quarantined livestock must <strong className="text-amber-300">NOT</strong> be sold or distributed into commercial supply chains. Clearance occurs automatically once residue periods lapse.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Restricted Commodities: <strong className="text-amber-300 ml-1">Milk, Eggs</strong>
                  </span>
                  <span className="text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    Final Clearance: <strong className="text-emerald-400 ml-1">17/09/2026</strong> (Chicken Eggs)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Regimens Tracked</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalEntries}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">Under Active Hold</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : activeQuarantines}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Clearance Reached (Safe)</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : clearedSafe}</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Earliest Clearance Date</span>
          <div className="text-xl font-bold text-cyan-400">08/09/2026</div>
        </div>
      </div>

      {/* Interactive September 2026 Calendar Visualizer */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-indigo-400" />
              September 2026 Clearance Timeline
            </h3>
            <p className="text-xs text-slate-400">Click on any date to inspect animals and clearance events.</p>
          </div>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs text-cyan-400 hover:text-cyan-300 underline font-mono flex items-center gap-1 self-start sm:self-auto"
            >
              Reset date filter ({selectedDate})
            </button>
          )}
        </div>

        {/* Calendar Day Grid (Sept 1 to 18) */}
        <div className="grid grid-cols-6 sm:grid-cols-9 md:grid-cols-18 gap-2 pt-2">
          {timelineDays.map(item => {
            const isToday = item.day === 3;
            const isSelected = selectedDate === item.dateStr;

            return (
              <div
                key={item.day}
                onClick={() => setSelectedDate(isSelected ? null : item.dateStr)}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all ${
                  isSelected
                    ? "bg-cyan-500/20 border-cyan-400 shadow-lg shadow-cyan-500/10 scale-105"
                    : isToday
                      ? "bg-indigo-500/10 border-indigo-500/40 ring-2 ring-indigo-500/30"
                      : item.hasActiveWithdrawal
                        ? "bg-slate-950/80 border-amber-500/30 hover:border-amber-500/60"
                        : "bg-slate-950/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <span className="text-[10px] text-slate-500 block uppercase font-bold">
                  {isToday ? "TODAY" : `Sept`}
                </span>
                <span className={`text-base font-extrabold block my-0.5 ${
                  isToday ? "text-indigo-300 font-mono" : (isSelected ? "text-cyan-300" : "text-white")
                }`}>
                  {item.day}
                </span>

                <div className="flex justify-center items-center gap-1 h-3 mt-1">
                  {item.clearingCount > 0 ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" title={`${item.clearingCount} cleared on this day`}></span>
                  ) : item.hasActiveWithdrawal ? (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Withdrawal active"></span>
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-6 pt-2 text-[11px] text-slate-400 border-t border-slate-800/60">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Active Withdrawal Hold</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Food Safety Clearance Day</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>Today (Sept 3)</span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by animal tag, medicine, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Showing {filteredWithdrawals.length} of {totalEntries} entries</span>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>
          {[
            { id: "ALL", label: `All (${totalEntries})` },
            { id: "WAIT", label: `🚨 DO NOT USE (${activeQuarantines})`, highlight: "text-amber-400 border-amber-500/30" },
            { id: "SAFE", label: `✅ SAFE TO USE (${clearedSafe})`, highlight: "text-emerald-400 border-emerald-500/30" }
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

          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider ml-4 mr-1">Product:</span>
          {["ALL", "Milk", "Eggs", "Meat"].map(prod => (
            <button
              key={prod}
              onClick={() => setProductFilter(prod)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                productFilter === prod
                  ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {prod === "ALL" ? "All Products" : prod}
            </button>
          ))}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Animal / Tag</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Administered Medicine</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Last Dose Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Safe Harvest Date</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Restricted Product</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Clearance Status</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Certificate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">Loading withdrawal schedule...</td>
                </tr>
              ) : filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((w) => {
                  const isSafe = w.status === "SAFE";
                  const daysRemaining = getDaysRemaining(w.safeFrom);

                  return (
                    <tr
                      key={w.id}
                      onClick={() => setSelectedWithdrawal(w)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 text-sm">
                        <div className="text-white font-bold">{w.animal}</div>
                        <div className="text-xs font-mono text-cyan-400 font-semibold">{w.tag}</div>
                      </td>
                      <td className="py-4 px-6 text-sm font-semibold text-slate-200">
                        {w.medicine}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-400">
                        {new Date(w.lastDose).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-slate-300 font-mono">
                        {w.period}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className={`font-semibold ${isSafe ? "text-emerald-400" : "text-amber-400 font-mono"}`}>
                          {new Date(w.safeFrom).toLocaleDateString()}
                        </span>
                        {!isSafe && daysRemaining > 0 && (
                          <span className="block text-[11px] text-amber-300/80">
                            {daysRemaining} day{daysRemaining > 1 ? "s" : ""} remaining
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-950 border border-slate-800 text-slate-300">
                          {w.product}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm">
                        {isSafe ? (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>SAFE TO USE</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>DO NOT USE</span>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedWithdrawal(w);
                          }}
                          className="text-xs font-semibold text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3 py-1.5 rounded-lg border border-amber-500/30 transition-all"
                        >
                          Clearance Pass
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">No withdrawal records match your filter criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Food Safety Clearance Certificate Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <FileCheck2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Food Safety Harvest Clearance</h3>
                  <p className="text-xs text-slate-400 font-mono">Tag: {selectedWithdrawal.tag} • Product: {selectedWithdrawal.product}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedWithdrawal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Status Banner */}
              <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                selectedWithdrawal.status === "SAFE"
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  : "bg-amber-500/10 border-amber-500/30 text-amber-300"
              }`}>
                {selectedWithdrawal.status === "SAFE" ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {selectedWithdrawal.status === "SAFE" ? "Certified Safe to Harvest & Market" : "Statutory Sale Restriction in Effect"}
                  </h4>
                  <p className="text-xs opacity-90 mt-0.5">
                    {selectedWithdrawal.status === "SAFE"
                      ? `The required withdrawal duration of ${selectedWithdrawal.period} has elapsed. Residue levels comply with FSSAI regulations.`
                      : `Do not collect, process, or sell ${selectedWithdrawal.product} from ${selectedWithdrawal.animal} (${selectedWithdrawal.tag}) until ${new Date(selectedWithdrawal.safeFrom).toLocaleDateString()}.`}
                  </p>
                </div>
              </div>

              {/* Specs */}
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Target Livestock</span>
                  <strong className="text-white text-sm">{selectedWithdrawal.animal}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Administered Drug</span>
                  <strong className="text-cyan-400 text-sm">{selectedWithdrawal.medicine}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Withdrawal Period</span>
                  <strong className="text-slate-200">{selectedWithdrawal.period}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Safe Harvest Date</span>
                  <strong className="text-emerald-400 text-sm font-mono">{new Date(selectedWithdrawal.safeFrom).toLocaleDateString()}</strong>
                </div>
              </div>

              {/* Regulatory Seal */}
              <div className="p-3 bg-slate-950/50 border border-slate-800 rounded-xl flex items-center gap-2 text-slate-400 text-[11px]">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Anchored under FSSAI Food Safety & Standards (Contaminants, Toxins and Residues) Regulation.</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedWithdrawal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
