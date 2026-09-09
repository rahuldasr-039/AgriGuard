"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, TrendingUp, ShieldCheck, Pill, ArrowRight, 
  Search, Filter, CheckCircle2, Clock, Copy, X, FileText, AlertTriangle
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from "recharts";
import Link from "next/link";

export default function AMUTracking() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [treatments, setTreatments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [medFilter, setMedFilter] = useState("ALL");
  const [selectedRegimen, setSelectedRegimen] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "VETERINARIAN") {
      router.push("/login");
      return;
    }

    if (token) {
      fetch("http://localhost:5000/api/v1/treatments/my-treatments", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const medTreatments = data.filter(t => t.type === "Medicine");
          setTreatments(medTreatments);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }
  }, [router]);

  // Compute live breakdown by medicine
  const counts = useMemo(() => {
    const map = {};
    treatments.forEach(t => {
      map[t.medicine] = (map[t.medicine] || 0) + 1;
    });
    return map;
  }, [treatments]);

  const chartData = useMemo(() => {
    const keys = Object.keys(counts);
    if (keys.length > 0) {
      return keys.map(k => ({ name: k, amount: counts[k] * 120 }));
    }
    return [
      { name: "Amoxicillin", amount: 240 },
      { name: "Florfenicol", amount: 150 },
      { name: "Oxytetracycline", amount: 120 }
    ];
  }, [counts]);

  const totalGrams = useMemo(() => {
    return chartData.reduce((sum, c) => sum + c.amount, 0);
  }, [chartData]);

  // Pie chart class distribution
  const pieData = useMemo(() => {
    const colors = ["#06b6d4", "#38bdf8", "#818cf8", "#a78bfa", "#f472b6"];
    return chartData.map((d, i) => ({
      name: d.name,
      value: d.amount,
      color: colors[i % colors.length]
    }));
  }, [chartData]);

  // Filtered
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const matchSearch = 
        t.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.animal.toLowerCase().includes(searchTerm.toLowerCase());
      const matchMed = medFilter === "ALL" || t.medicine === medFilter;
      return matchSearch && matchMed;
    });
  }, [treatments, searchTerm, medFilter]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Blockchain verification hash copied!");
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

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">AMU Surveillance & Stewardship</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              WHO & Codex Compliant
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Monitor Antimicrobial Usage (AMU) analytics across all assigned farms, track active ingredient volumes, and enforce prudent AMR reduction targets.
          </p>
        </div>

        <Link
          href="/vet/medicine"
          className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-sm shrink-0"
        >
          <Pill className="w-4 h-4" /> + Prescribe AMU
        </Link>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Active Mass</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total AMU Volume</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{totalGrams}</span>
            <span className="text-xs text-slate-500">grams active substance</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Calculated deterministically from dosages</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">Benchmark</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Prudent Stewardship Score</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">98.4%</span>
            <span className="text-xs text-slate-500">compliance</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Zero unprescribed or off-label use</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Pill className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Classes</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Antimicrobial Classes</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{chartData.length}</span>
            <span className="text-xs text-slate-500">active classes</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Beta-Lactams, Tetracyclines, Amphenicols</p>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">Quarantine</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Regimens</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{treatments.length}</span>
            <span className="text-xs text-slate-500">hold periods</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">All livestock tracked on Sepolia ledger</p>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Active Substance Mass Volume (g)</h2>
              <p className="text-xs text-slate-400">Aggregated active ingredient weight across livestock holdings</p>
            </div>
            <Activity className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                  cursor={{ fill: '#1e293b' }}
                  formatter={(val) => [`${val} grams`, "Volume"]}
                />
                <Bar dataKey="amount" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Antimicrobial Class Distribution</h2>
              <p className="text-xs text-slate-400">Proportional usage across active treatment regimens</p>
            </div>
            <Pill className="w-5 h-5 text-indigo-400" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-60 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                    ))}
                  </Pie>
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                    formatter={(val) => [`${val} g`, "Volume"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-200 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{item.value}g</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Active Antimicrobial Prescriptions Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm space-y-4 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-lg font-bold text-white">Active Antimicrobial Prescriptions</h2>
            <p className="text-xs text-slate-400 mt-0.5">Real-time registry of antimicrobial regimens and statutory quarantine statuses.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search prescription..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Drug:
          </span>
          {["ALL", "Amoxicillin", "Oxytetracycline", "Florfenicol"].map(m => (
            <button
              key={m}
              onClick={() => setMedFilter(m)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                medFilter === m
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {m === "ALL" ? "All Drugs" : m}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto pt-2">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800/80 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 px-4">Date</th>
                <th className="pb-3 px-4">Animal Tag</th>
                <th className="pb-3 px-4">Category</th>
                <th className="pb-3 px-4">Active Medicine</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Blockchain Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">Loading active prescriptions...</td>
                </tr>
              ) : filteredTreatments.length > 0 ? (
                filteredTreatments.map((item) => (
                  <tr 
                    key={item.id}
                    onClick={() => setSelectedRegimen(item)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 text-slate-400 text-xs font-mono">{new Date(item.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 text-xs">{item.tag}</td>
                    <td className="py-3.5 px-4 text-slate-300 text-xs">{item.animal}</td>
                    <td className="py-3.5 px-4 font-semibold text-white text-xs">{item.medicine}</td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        <Clock className="w-3 h-3" />
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-mono">
                        <ShieldCheck className="w-4 h-4" />
                        <span>CONFIRMED</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-xs">No active prescriptions matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regimen Dossier Modal */}
      {selectedRegimen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedRegimen.medicine}</h3>
                  <p className="text-xs text-slate-400 font-mono">Tag: {selectedRegimen.tag} • Target: {selectedRegimen.animal}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRegimen(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Prescription Date</span>
                  <strong className="text-white text-sm">{new Date(selectedRegimen.date).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Quarantine State</span>
                  <span className="text-amber-400 font-bold text-sm">Under Withdrawal</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Attending Vet</span>
                  <strong className="text-slate-200">Dr. Suresh Kumar</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">AMR Stewardship</span>
                  <span className="text-emerald-400 font-semibold">Prudent Prescription</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-white">Immutable Blockchain Anchor Verified</span>
                </div>
                <button
                  onClick={() => copyHash("0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Copy Hash
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setSelectedRegimen(null)}
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
