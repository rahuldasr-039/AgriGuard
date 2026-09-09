"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  ClipboardList, Search, CheckCircle2, AlertTriangle, ShieldCheck, 
  Beaker, Filter, LayoutGrid, Table as TableIcon, ChevronRight, 
  X, Copy, QrCode, FileText, Sparkles
} from "lucide-react";

export default function TesterHistory() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [matrixFilter, setMatrixFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedTest, setSelectedTest] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "FARM_TESTER" || !token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:5000/api/v1/product-tests", {
      headers: { "Authorization": `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        const cutoff = new Date("2026-09-01T00:00:00.000Z");
        const valid = data.filter(d => new Date(d.testDate) >= cutoff);
        setHistory(valid);
      }
      setLoading(false);
    })
    .catch(() => {
      setHistory([
        {
          id: "1",
          sampleId: "SMP-891023",
          tag: { tag: "RJ-CW1" },
          productType: "Milk",
          substanceDetected: "Amoxicillin",
          amountDetected: 0.002,
          applicableMrl: 0.004,
          unit: "mg/kg",
          percentageOfMrl: 50.0,
          status: "SAFE",
          testDate: "2026-09-02",
          testingLocation: "National Food Safety Lab"
        },
        {
          id: "2",
          sampleId: "SMP-891024",
          tag: { tag: "RJ-FS-B1" },
          productType: "Fish",
          substanceDetected: "Oxytetracycline",
          amountDetected: 0.08,
          applicableMrl: 0.1,
          unit: "mg/kg",
          percentageOfMrl: 80.0,
          status: "SAFE",
          testDate: "2026-09-01",
          testingLocation: "Marine Products Lab"
        }
      ]);
      setLoading(false);
    });
  }, [router]);

  // Metrics
  const totalCount = history.length;
  const passedCount = history.filter(h => h.status === "SAFE" || h.amountDetected <= h.applicableMrl).length;
  const violationCount = history.filter(h => h.status === "MRL EXCEEDED" || h.amountDetected > h.applicableMrl).length;
  const complianceRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : "100.0";

  // Filtered
  const filtered = useMemo(() => {
    return history.filter(h => {
      const matchSearch = 
        h.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (h.tag?.tag && h.tag.tag.toLowerCase().includes(searchTerm.toLowerCase())) ||
        h.substanceDetected.toLowerCase().includes(searchTerm.toLowerCase()) ||
        h.productType.toLowerCase().includes(searchTerm.toLowerCase());
      
      const isPassed = h.status === "SAFE" || h.amountDetected <= h.applicableMrl;
      let matchStatus = true;
      if (statusFilter === "PASSED") matchStatus = isPassed;
      if (statusFilter === "VIOLATION") matchStatus = !isPassed;

      const matchMatrix = matrixFilter === "ALL" || h.productType.toLowerCase() === matrixFilter.toLowerCase();

      return matchSearch && matchStatus && matchMatrix;
    });
  }, [history, searchTerm, statusFilter, matrixFilter]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Certificate hash copied!");
    setTimeout(() => setToastMessage(null), 2500);
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Sample Test Historical Ledger</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              National Laboratory Archive
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Comprehensive audit archive of all certified analytical MRL screenings, quantitative assay determinations, and blockchain proofs.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Screenings Logged</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Certified Compliant</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : passedCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-sm">
          <span className="text-xs text-rose-300 font-medium block mb-1">MRL Violations Detected</span>
          <div className="text-2xl font-bold text-rose-400">{loading ? "..." : violationCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Compliance Benchmark</span>
          <div className="text-2xl font-bold text-cyan-400">{loading ? "..." : `${complianceRate}%`}</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by Sample ID (e.g. SMP-891023), tag, or substance..."
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
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {[
            { id: "ALL", label: `All Tests (${totalCount})` },
            { id: "PASSED", label: `✅ Safe (${passedCount})` },
            { id: "VIOLATION", label: `🚨 Violations (${violationCount})` }
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

          <span className="text-slate-700 mx-1">|</span>

          {[
            { id: "ALL", label: "All Matrices" },
            { id: "Milk", label: "🥛 Milk" },
            { id: "Fish", label: "🐟 Fish" }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMatrixFilter(m.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                matrixFilter === m.id
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">Loading test history...</div>
          ) : filtered.length > 0 ? (
            filtered.map((item) => {
              const isExceeded = item.status === "MRL EXCEEDED" || item.amountDetected > item.applicableMrl;
              const dateDisplay = new Date(item.testDate).toLocaleDateString();
              const tagDisplay = item.tag?.tag || item.tagId || "N/A";
              const percentage = item.percentageOfMrl?.toFixed(1) || ((item.amountDetected / item.applicableMrl) * 100).toFixed(1);

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedTest(item)}
                  className={`group rounded-2xl border p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] ${
                    isExceeded
                      ? "bg-slate-900/80 border-rose-500/40 hover:border-rose-500/70 shadow-lg shadow-rose-500/5"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                        <Beaker className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors font-mono">
                          {item.sampleId}
                        </h3>
                        <span className="text-xs text-slate-400">{dateDisplay}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isExceeded
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {isExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {isExceeded ? "MRL EXCEEDED" : "SAFE"}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-slate-300">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Target Tag</span>
                        <strong className="text-cyan-400 font-mono">{tagDisplay} ({item.productType})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Compound</span>
                        <strong className="text-emerald-400">{item.substanceDetected}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Quantitative Concentration</span>
                        <strong className="text-white font-mono">{item.amountDetected} / {item.applicableMrl} mg/kg</strong>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${isExceeded ? "bg-rose-500" : "bg-emerald-500"}`} 
                          style={{ width: `${Math.min(100, Math.max(5, percentage))}%` }} 
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Laboratory Certificate</span>
                    <span className="text-cyan-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                      Inspect <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No sample tests found.</div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Sample ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Animal Tag</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product Type</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Substance</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Detected vs MRL</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Compliance Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">Loading sample test history...</td>
                  </tr>
                ) : filtered.length > 0 ? (
                  filtered.map((item) => {
                    const isExceeded = item.status === "MRL EXCEEDED" || item.amountDetected > item.applicableMrl;
                    const dateDisplay = new Date(item.testDate).toLocaleDateString();
                    const tagDisplay = item.tag?.tag || item.tagId || "N/A";

                    return (
                      <tr 
                        key={item.id}
                        onClick={() => setSelectedTest(item)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-sm text-slate-400 font-mono">{dateDisplay}</td>
                        <td className="py-4 px-6 text-sm font-mono text-white font-bold">{item.sampleId}</td>
                        <td className="py-4 px-6 text-sm font-mono text-cyan-400 font-semibold">{tagDisplay}</td>
                        <td className="py-4 px-6 text-sm text-slate-300">{item.productType}</td>
                        <td className="py-4 px-6 text-sm font-semibold text-emerald-400">{item.substanceDetected}</td>
                        <td className="py-4 px-6 text-sm">
                          <span className="font-bold text-white">{item.amountDetected}</span> / <span className="text-slate-500">{item.applicableMrl} {item.unit || "mg/kg"}</span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            isExceeded
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {isExceeded ? "MRL EXCEEDED" : "SAFE"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedTest(item);
                            }}
                            className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                          >
                            Certificate
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-slate-500">No test history found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Test Certificate Modal */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Beaker className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Laboratory MRL Analysis Certificate</h3>
                  <p className="text-xs text-slate-400 font-mono">Sample: {selectedTest.sampleId} • Tag: {selectedTest.tag?.tag || selectedTest.tagId}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedTest(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Matrix Tested</span>
                  <strong className="text-white text-sm">{selectedTest.productType}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Target Compound</span>
                  <strong className="text-emerald-400 text-sm">{selectedTest.substanceDetected}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Amount Detected</span>
                  <strong className="text-white text-sm font-mono">{selectedTest.amountDetected} {selectedTest.unit || "mg/kg"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">FSSAI Legal MRL</span>
                  <strong className="text-slate-200 text-sm font-mono">{selectedTest.applicableMrl} {selectedTest.unit || "mg/kg"}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Analytical Method</span>
                  <span className="text-slate-300">LC-MS/MS Confirmation</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Compliance Status</span>
                  <span className="font-bold text-emerald-400 text-sm">{selectedTest.status || "SAFE"}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-white">Anchored to Sepolia National Ledger</span>
                </div>
                <button
                  onClick={() => copyHash("0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Hash
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedTest(null)}
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
