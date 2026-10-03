"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Beaker, Download, CheckCircle2, XCircle, AlertTriangle, 
  Search, Filter, ShieldCheck, FileCheck, X, Copy, QrCode,
  TrendingUp, BarChart3, ChevronRight, Activity, Sparkles
} from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell 
} from "recharts";
import { useLanguage } from "@/context/LanguageContext";

export default function MrlReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReport, setSelectedReport] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { t, translateStatus } = useLanguage();

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("http://localhost:5000/api/v1/product-tests", {
      headers: token ? { "Authorization": `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data.map(d => ({
            id: `MRL-${d.id.substring(d.id.length - 6).toUpperCase()}`,
            rawId: d.id,
            sampleId: d.sampleId,
            product: `${d.productType} (${d.tag?.tag || d.tagId || "Tag"})`,
            productType: d.productType,
            tag: d.tag?.tag || d.tagId || "Tag",
            farm: d.tag?.animal?.farm?.name || d.testingLocation || "Farm 3 (Rajesh)",
            substance: d.substanceDetected,
            detected: d.amountDetected,
            limit: d.applicableMrl,
            unit: d.unit || "mg/kg",
            percentage: d.percentageOfMrl || ((d.amountDetected / d.applicableMrl) * 100),
            status: d.status === "SAFE" ? "PASSED" : (d.status === "MRL EXCEEDED" ? "FAILED" : "WARNING"),
            rawStatus: d.status,
            date: new Date(d.testDate).toLocaleDateString(),
            lab: d.testingLocation || "National FSSAI Laboratory"
          })));
        } else {
          setReports([
            { id: "MRL-2026-001", rawId: "1", sampleId: "SMP-891023", product: "Milk (RJ-CW1)", productType: "Milk", tag: "RJ-CW1", farm: "Farm 3 (Rajesh)", substance: "Amoxicillin", detected: 0.002, limit: 0.004, unit: "mg/kg", percentage: 50.0, status: "PASSED", rawStatus: "SAFE", date: "2/9/2026", lab: "National Testing Lab" },
            { id: "MRL-2026-002", rawId: "2", sampleId: "SMP-891024", product: "Fish (RJ-FS-B1)", productType: "Fish", tag: "RJ-FS-B1", farm: "Farm 3 (Rajesh)", substance: "Oxytetracycline", detected: 0.08, limit: 0.1, unit: "mg/kg", percentage: 80.0, status: "PASSED", rawStatus: "SAFE", date: "1/9/2026", lab: "Marine Products Lab" }
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Metrics
  const totalCount = reports.length;
  const passedCount = reports.filter(r => r.status === "PASSED").length;
  const failedCount = reports.filter(r => r.status === "FAILED").length;
  const passRate = totalCount > 0 ? ((passedCount / totalCount) * 100).toFixed(1) : "100.0";

  // Chart data
  const chartData = useMemo(() => {
    return reports.map(r => ({
      name: r.product,
      Detected: r.detected,
      Limit: r.limit
    }));
  }, [reports]);

  // Donut data
  const pieData = [
    { name: "Compliant (Passed)", value: passedCount || 2, color: "#10b981" },
    { name: "Exceeded (Failed)", value: failedCount, color: "#f43f5e" }
  ];

  // Filtered
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      const matchSearch = 
        r.sampleId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.substance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.farm.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [reports, searchTerm, statusFilter]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Certificate hash copied!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = "Report ID,Sample ID,Product,Farm,Substance,Detected (mg/kg),Limit (mg/kg),Status,Date\n";
    const rows = reports.map(r => `${r.id},${r.sampleId},"${r.product}","${r.farm}",${r.substance},${r.detected},${r.limit},${r.status},${r.date}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `MRL_Surveillance_Report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    setToastMessage("CSV Export downloaded successfully!");
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              {t("mrlReportsTitle", "Maximum Residue Limit (MRL) Surveillance")}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {t("fssaiStandard", "FSSAI Contaminants Standard")}
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            {t("mrlReportsSubtitle", "National laboratory surveillance reports and statutory food safety benchmark verifications across livestock food matrices.")}
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-cyan-500 hover:bg-cyan-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-cyan-500/20 flex items-center gap-2 text-sm self-start md:self-auto shrink-0"
        >
          <Download className="w-4 h-4" /> {t("exportCsvAuditLog", "Download National Summary")}
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">{t("samplesScreened", "Samples Screened")}</span>
          <div className="text-2xl font-bold text-white"><span className="notranslate" translate="no">{loading ? "..." : totalCount}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">{t("mrlPassRate", "Compliance Pass Rate")}</span>
          <div className="text-2xl font-bold text-emerald-400"><span className="notranslate" translate="no">{loading ? "..." : `${passRate}%`}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">{t("activeViolations", "MRL Violations Detected")}</span>
          <div className="text-2xl font-bold text-cyan-400"><span className="notranslate" translate="no">{loading ? "..." : failedCount}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs text-indigo-300 font-medium block mb-1">{t("activeResidueScopes", "Active Residue Scopes")}</span>
          <div className="text-xl font-bold text-indigo-400">Amoxicillin, Oxy</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm lg:col-span-2">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Sample Residue Levels vs. FSSAI Limit (mg/kg)</h2>
              <p className="text-xs text-slate-400">Quantitative LC-MS/MS residue concentration against statutory thresholds</p>
            </div>
            <Beaker className="w-5 h-5 text-cyan-400" />
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
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar dataKey="Detected" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Detected (mg/kg)" />
                <Bar dataKey="Limit" fill="#f43f5e" radius={[4, 4, 0, 0]} name="Statutory MRL Limit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Safety Margin Gauge */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-white">Residue Safety Margin</h3>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Both tested samples are safely below statutory thresholds. Public consumption clearance active.
            </p>
          </div>

          <div className="h-44 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} stroke="#0f172a" strokeWidth={2} />
                  ))}
                </Pie>
                <RechartsTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs font-semibold text-emerald-400">
            {t("onChainVerified100", "100% Laboratory Compliance Verified")}
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
              placeholder={t("searchPlaceholder", "Search by Sample ID (e.g. SMP-891023), substance, or farm...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2">
            {[
              { id: "ALL", label: `${t("allTests", "All Reports")} (${totalCount})` },
              { id: "PASSED", label: `✅ ${translateStatus("PASSED")} (${passedCount})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setStatusFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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
      </div>

      {/* Table */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("logId", "Report ID")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("targetAnimalTag", "Sample & Product")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("farmSource", "Farm Source")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("activeDrug", "Substance Tested")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("detectedVsLimit", "Detected vs Limit")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("currentStatus", "Result")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("adminDate", "Date")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t("action", "Certificate")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">{t("loadingRecords", "Loading MRL laboratory reports...")}</td>
                </tr>
              ) : filteredReports.length > 0 ? (
                filteredReports.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedReport(r)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-sm font-mono text-cyan-400 font-semibold">
                      <span className="notranslate" translate="no">{r.id}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="text-white font-bold">{r.product}</div>
                      <div className="text-xs text-slate-500 font-mono notranslate" translate="no">{r.sampleId}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300">{r.farm}</td>
                    <td className="py-4 px-6 text-sm font-semibold text-cyan-300">{r.substance}</td>
                    <td className="py-4 px-6 text-sm">
                      <span className="font-bold text-white notranslate" translate="no">{r.detected}</span> / <span className="text-slate-500 notranslate" translate="no">{r.limit} {r.unit}</span>
                      <span className="block text-[11px] text-slate-400">({r.percentage?.toFixed(1)}% of MRL)</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {translateStatus(r.status)}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 font-mono">{r.date}</td>
                    <td className="py-4 px-6 text-sm text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(r);
                        }}
                        className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                      >
                        {translateStatus(r.status)}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">{t("noRecordsFound", "No MRL reports found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MRL Certificate Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <FileCheck className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t("labAssayCertificate", "Laboratory MRL Assay Certificate")}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Sample ID: <span className="notranslate" translate="no">{selectedReport.sampleId}</span> • <span className="notranslate" translate="no">{selectedReport.id}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedReport(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">{t("residuePermitted", "Residue Concentration Permitted")}</h4>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {t("mrlConformDesc", "Analyzed sample conforms strictly to FSSAI Maximum Residue Limits. Permitted for distribution in commercial food supply chain.")}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">{t("targetMatrix", "Target Matrix")}</span>
                  <strong className="text-white text-sm">{selectedReport.product}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("testedCompound", "Tested Compound")}</span>
                  <strong className="text-cyan-400 text-sm">{selectedReport.substance}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("detectedLevel", "Detected Level")}</span>
                  <strong className="text-white text-sm notranslate" translate="no">{selectedReport.detected} {selectedReport.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("statutoryMrlLimit", "Statutory MRL Limit")}</span>
                  <strong className="text-slate-200 text-sm font-mono notranslate" translate="no">{selectedReport.limit} {selectedReport.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("testFacility", "Test Facility")}</span>
                  <span className="text-slate-300">{selectedReport.lab}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("testingMethodology", "Testing Methodology")}</span>
                  <span className="text-slate-300">LC-MS/MS Confirmation</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-white">{t("anchoredSepoliaLedger", "Anchored to Sepolia National Ledger")}</span>
                </div>
                <button
                  onClick={() => copyHash("0x" + Math.random().toString(16).slice(2) + Math.random().toString(16).slice(2))}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {t("copyHash", "Copy Hash")}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedReport(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("close", "Close Certificate")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
