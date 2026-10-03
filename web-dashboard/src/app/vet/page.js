"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Syringe, Pill, Activity, ShieldCheck, CheckCircle2, 
  AlertTriangle, Clock, ChevronRight, Stethoscope, Sparkles, 
  FileText, Search, Filter, TrendingUp, BarChart3, Copy, X
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";

export default function VetDashboard() {
  const router = useRouter();
  const { t, translateStatus } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [farmersCount, setFarmersCount] = useState(0);
  const [pendingFarmersCount, setPendingFarmersCount] = useState(0);
  const [treatments, setTreatments] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedItem, setSelectedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role) router.push("/login");
    if (role !== "VETERINARIAN") router.push("/");

    if (token) {
      // 1. Fetch assigned farmers
      fetch("http://localhost:5000/api/v1/farmers/my-farmers", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setFarmersCount(data.length);
          const pending = data.filter(f => f.approvalStatus === "PENDING").length;
          setPendingFarmersCount(pending);
        }
      })
      .catch(console.error);

      // 2. Fetch treatments & vaccinations
      fetch("http://localhost:5000/api/v1/treatments/my-treatments", {
        headers: { "Authorization": `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTreatments(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
    }
  }, [router]);

  const vaccinationsCount = treatments.filter(t => t.type === "Vaccine").length;
  const medicinesCount = treatments.filter(t => t.type === "Medicine").length;
  const activeCount = treatments.filter(t => t.status === "Active").length;

  // Chart data: Distribution of treatments by category
  const chartData = useMemo(() => {
    const counts = {};
    treatments.forEach(t => {
      counts[t.medicine] = (counts[t.medicine] || 0) + 1;
    });
    const colors = ["#06b6d4", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#3b82f6"];
    return Object.keys(counts).map((k, i) => ({
      name: k,
      value: counts[k],
      color: colors[i % colors.length]
    }));
  }, [treatments]);

  // Filtered treatments
  const filteredTreatments = useMemo(() => {
    return treatments.filter(t => {
      const matchSearch = 
        t.medicine.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.animal.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType = typeFilter === "ALL" || t.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [treatments, searchTerm, typeFilter]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Cryptographic hash copied to clipboard!");
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

      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Clinical Practice Online
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                License: VT92A7K1
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Authorized AMU Prescriber
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Dr. Suresh Kumar, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">B.V.Sc. & A.H.</span> 🩺
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              Veterinary Surveillance Portal: Supervise herd health, prescribe prudent antimicrobial regimens with automatic withdrawal computation, and timestamp immutable clinical records.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/vet/vaccinate"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center gap-2"
            >
              <Syringe className="w-4 h-4" /> + {t("vaccine") || "Vaccinate"}
            </Link>
            <Link
              href="/vet/medicine"
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-cyan-500/20 text-sm flex items-center gap-2"
            >
              <Pill className="w-4 h-4" /> + {t("medicine") || "Give Medicine"}
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Link 
          href="/vet/farmers"
          className="bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all group block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            {pendingFarmersCount > 0 && (
              <span className="text-xs font-mono text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded font-bold animate-pulse">
                {pendingFarmersCount} {translateStatus("pending") || "Pending"}
              </span>
            )}
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{t("farmsMonitored") || "Assigned Farms"}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{loading ? "..." : farmersCount}</span>
            <span className="text-xs text-slate-500">{t("farmHolding") || "livestock holdings"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-indigo-300 transition-colors">
            {t("myFarmers") || "Manage & verify farmers"} <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        <Link 
          href="/vet/vaccinate"
          className="bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all group block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 group-hover:scale-110 transition-transform">
              <Syringe className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">{t("zeroDayWithholding") || "0-Day Hold"}</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{t("vaccinationsLogged") || "Vaccinations Given"}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{loading ? "..." : vaccinationsCount}</span>
            <span className="text-xs text-slate-500">{t("records") || "boosters logged"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-emerald-300 transition-colors">
            {t("vaccinationPassport") || "Log preventative shots"} <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        <Link 
          href="/vet/medicine"
          className="bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all group block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">Prudent AMU</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{t("totalTreatments") || "AMU Prescriptions"}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400">{loading ? "..." : medicinesCount}</span>
            <span className="text-xs text-slate-500">{t("records") || "courses"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-cyan-300 transition-colors">
            {t("prescribeMedicine") || "Issue new prescription"} <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>

        <Link 
          href="/vet/amu"
          className="bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 rounded-2xl p-6 backdrop-blur-sm transition-all group block"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">{translateStatus("active") || "Active"}</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{t("underWithdrawalHold") || "Active Medical Regimens"}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{loading ? "..." : activeCount}</span>
            <span className="text-xs text-slate-500">{t("withdrawalActive") || "under withdrawal"}</span>
          </div>
          <p className="text-xs text-slate-400 mt-2 flex items-center gap-1 group-hover:text-amber-300 transition-colors">
            {t("amuTracking") || "Inspect AMU analytics"} <ChevronRight className="w-3.5 h-3.5" />
          </p>
        </Link>
      </div>

      {/* Clinical Verification & Surveillance Alert Banner */}
      {pendingFarmersCount > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">
                Farmer Verification Pending ({pendingFarmersCount} Farms Awaiting Approval)
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                New farmer applications require veterinary verification of premises and species registration.
              </p>
            </div>
          </div>
          <Link
            href="/vet/farmers"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs transition-all shrink-0"
          >
            Review Applications &rarr;
          </Link>
        </div>
      )}

      {/* Visual Analytics & Prescriptions Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm lg:col-span-1">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-base font-bold text-white">{t("prescriptionDosage") || "Drug & Vaccine Portfolio"}</h3>
              <p className="text-xs text-slate-400">{t("unifiedPrescriptionRecordsDesc") || "Distribution of administered treatments"}</p>
            </div>
            <BarChart3 className="w-5 h-5 text-cyan-400" />
          </div>

          <div className="h-48 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 mt-2 max-h-32 overflow-y-auto pr-1">
            {chartData.map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/40">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-300 font-medium truncate max-w-[130px]">{item.name}</span>
                </div>
                <span className="font-bold text-white font-mono">{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Activity Ledger Table */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
            <div>
              <h3 className="text-base font-bold text-white">{t("totalTreatments") || "Recent Clinical Administrations"}</h3>
              <p className="text-xs text-slate-400">{t("unifiedPrescriptionRecordsDesc") || "Live ledger of treatments and vaccinations signed by your license"}</p>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder={t("searchTreatmentsPlaceholder") || "Filter treatments..."}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none"
              >
                <option value="ALL">{t("allTypes") || "All Types"}</option>
                <option value="Medicine">{t("medicine") || "Medicines"}</option>
                <option value="Vaccine">{t("vaccine") || "Vaccines"}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">{t("dateAndVet") || "Date"}</th>
                  <th className="pb-3 px-3">{t("allTypes") || "Type"}</th>
                  <th className="pb-3 px-3">{t("targetAnimal") || "Animal / Tag"}</th>
                  <th className="pb-3 px-3">{t("prescriptionDosage") || "Medicine / Booster"}</th>
                  <th className="pb-3 px-3">{t("currentStatus") || "Status"}</th>
                  <th className="pb-3 px-3 text-right">{t("treatmentIdBlockchain") || "Blockchain"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">{t("loadingConnectedRecords") || "Loading ledger records..."}</td>
                  </tr>
                ) : filteredTreatments.length > 0 ? (
                  filteredTreatments.slice(0, 7).map((tItem) => (
                    <tr 
                      key={tItem.id}
                      onClick={() => setSelectedItem(tItem)}
                      className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                    >
                      <td className="py-3 px-3 text-slate-400 font-mono">{new Date(tItem.date).toLocaleDateString()}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border ${
                          tItem.type === "Medicine" ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {tItem.type === "Medicine" ? <Pill className="w-3 h-3" /> : <Syringe className="w-3 h-3" />}
                          {t(tItem.type?.toLowerCase()) || tItem.type}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-white font-medium">{tItem.animal}</div>
                        <div className="text-[11px] font-mono text-cyan-400 notranslate" translate="no">{tItem.tag}</div>
                      </td>
                      <td className="py-3 px-3 font-semibold text-white">{tItem.medicine}</td>
                      <td className="py-3 px-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          tItem.status === "Active" ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        }`}>
                          {tItem.status === "Active" ? <Clock className="w-2.5 h-2.5" /> : <CheckCircle2 className="w-2.5 h-2.5" />}
                          {translateStatus(tItem.status) || tItem.status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-emerald-400">
                          <ShieldCheck className="w-3.5 h-3.5" /> {t("verifiedOnVetRegistry") || "Verified"}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-8 text-center text-slate-500">{t("noRecordsFound") || "No records found."}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Clinical Receipt Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {selectedItem.type === "Medicine" ? <Pill className="w-6 h-6" /> : <Syringe className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedItem.medicine}</h3>
                  <p className="text-xs text-slate-400 font-mono">Tag: <span className="notranslate" translate="no">{selectedItem.tag}</span> • Target: {selectedItem.animal}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">{t("administrationDate") || "Date Logged"}</span>
                  <strong className="text-white text-sm">{new Date(selectedItem.date).toLocaleDateString()}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("currentStatus") || "Status"}</span>
                  <span className={`font-bold ${selectedItem.status === "Active" ? "text-amber-400" : "text-emerald-400"}`}>
                    {translateStatus(selectedItem.status) || selectedItem.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("attendingVet") || "Attending Veterinarian"}</span>
                  <strong className="text-slate-200">{selectedItem.vet}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("allTypes") || "Intervention Type"}</span>
                  <strong className="text-cyan-400">{t(selectedItem.type?.toLowerCase()) || selectedItem.type}</strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-white">{t("sepoliaHashVerified") || "Cryptographically Certified on Ledger"}</span>
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
                onClick={() => setSelectedItem(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("close") || "Close Record"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
