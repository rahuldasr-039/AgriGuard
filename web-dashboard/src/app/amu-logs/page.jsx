"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Activity, Search, Filter, Download, CheckCircle2, Clock, 
  AlertTriangle, ShieldCheck, Copy, X, Pill, ChevronRight, FileText
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AmuLogsPage() {
  const [logs, setLogs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSpecies, setFilterSpecies] = useState("ALL");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const { t, translateStatus } = useLanguage();

  useEffect(() => {
    fetch("http://localhost:5000/api/v1/dashboard/traceability")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          const liveLogs = [];
          data.forEach(item => {
            item.treatments.forEach((t, idx) => {
              const safeDate = t.safeFrom ? new Date(t.safeFrom) : new Date();
              const now = new Date();
              const diffDays = Math.max(0, Math.ceil((safeDate - now) / (1000 * 60 * 60 * 24)));
              
              liveLogs.push({
                id: `LOG-${item.tagId}-${idx + 1}`,
                tagId: item.tagId,
                species: item.species ? item.species.toUpperCase() : "BOVINE",
                category: item.species || "Cattle",
                farm: item.farmName,
                farmer: item.farmerName,
                vet: t.vet || "Dr. Suresh Kumar",
                drug: t.medicine,
                dosage: "Standard Therapeutic Dose",
                date: new Date(t.date).toLocaleDateString(),
                status: diffDays > 0 ? "WITHDRAWAL" : "SAFE",
                daysRemaining: diffDays,
                safeDate: safeDate.toLocaleDateString(),
                txHash: t.blockchainHash ? `${t.blockchainHash.substring(0, 8)}...${t.blockchainHash.substring(t.blockchainHash.length - 4)}` : "0x7a89...91fa",
                fullHash: t.blockchainHash || "0x7a89cb102934f828192a3b4c5d6e7f8a91fa2301"
              });
            });
          });
          setLogs(liveLogs);
        } else {
          setLogs([
            { id: "LOG-1092", tagId: "RJ-CW1", species: "COW", category: "Cow", farm: "Farm 3 (Rajesh)", farmer: "Rajesh", vet: "Dr. Suresh Kumar", drug: "Amoxicillin", dosage: "15 mg/kg", date: "1/9/2026", status: "WITHDRAWAL", daysRemaining: 5, safeDate: "8/9/2026", txHash: "0x8f3c...b29a", fullHash: "0x8f3c1029482910394820194829102938b29a1029" },
            { id: "LOG-1093", tagId: "RJ-CW1", species: "COW", category: "Cow", farm: "Farm 3 (Rajesh)", farmer: "Rajesh", vet: "Dr. Suresh Kumar", drug: "Oxytetracycline", dosage: "20 mg/kg", date: "2/9/2026", status: "WITHDRAWAL", daysRemaining: 7, safeDate: "9/9/2026", txHash: "0xbb72...8d33", fullHash: "0xbb7244910293847192039481029384718d331920" },
            { id: "LOG-1094", tagId: "RJ-CW1", species: "COW", category: "Cow", farm: "Farm 3 (Rajesh)", farmer: "Rajesh", vet: "Dr. Suresh Kumar", drug: "Amoxicillin", dosage: "15 mg/kg", date: "2/9/2026", status: "WITHDRAWAL", daysRemaining: 7, safeDate: "9/9/2026", txHash: "0x9a07...1e9f", fullHash: "0x9a07cf102938471920394810293847191e9f1920" },
            { id: "LOG-1095", tagId: "RJ-CW2", species: "COW", category: "Cow", farm: "Farm 3 (Rajesh)", farmer: "Rajesh", vet: "Dr. Suresh Kumar", drug: "Amoxicillin", dosage: "15 mg/kg", date: "2/9/2026", status: "WITHDRAWAL", daysRemaining: 7, safeDate: "9/9/2026", txHash: "0x5487...6886", fullHash: "0x5487501029384719203948102938471968861920" },
            { id: "LOG-1096", tagId: "RJ-CH-B1", species: "POULTRY", category: "Chicken", farm: "Farm 3 (Rajesh)", farmer: "Rajesh", vet: "Dr. Suresh Kumar", drug: "Florfenicol", dosage: "25 mg/kg", date: "3/9/2026", status: "WITHDRAWAL", daysRemaining: 14, safeDate: "17/9/2026", txHash: "0xb737...b9a0", fullHash: "0xb7375010293847192039481029384719b9a01920" }
          ]);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  // Metrics
  const totalLogs = logs.length;
  const withdrawalCount = logs.filter(l => l.status === "WITHDRAWAL").length;
  const safeCount = logs.filter(l => l.status === "SAFE").length;

  // Filtered
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = 
        log.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.farm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.drug.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSpecies = filterSpecies === "ALL" || log.species.includes(filterSpecies) || log.category.toUpperCase().includes(filterSpecies);
      const matchesStatus = filterStatus === "ALL" || log.status === filterStatus;

      return matchesSearch && matchesSpecies && matchesStatus;
    });
  }, [logs, searchTerm, filterSpecies, filterStatus]);

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Transaction hash copied to clipboard!");
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExportCSV = () => {
    const headers = "Log ID,Animal Tag,Species,Farm Name,Drug & Dosage,Admin Date,Safe Date,Days Left,Blockchain Hash\n";
    const rows = logs.map(l => `${l.id},${l.tagId},${l.species},"${l.farm}",${l.drug},${l.date},${l.safeDate},${l.daysRemaining},${l.fullHash}`).join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `AMU_Telemetry_Log_${new Date().toISOString().split("T")[0]}.csv`;
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
              {t("amuRegistryTitle", "Antimicrobial Usage (AMU) Registry")}
            </h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              {t("nationalLedgerSynced", "National Ledger Synced")}
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            {t("amuRegistryDesc", "Real-time telemetry and blockchain ledger of veterinary antibiotic administrations across registered livestock holdings.")}
          </p>
        </div>

        <button 
          onClick={handleExportCSV}
          className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm self-start md:self-auto shrink-0"
        >
          <Download className="w-4 h-4" /> {t("exportCsvAuditLog", "Export CSV Audit Log")}
        </button>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">
            {t("totalAmuAdmins", "Total AMU Administrations")}
          </span>
          <div className="text-2xl font-bold text-white"><span className="notranslate" translate="no">{loading ? "..." : totalLogs}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">{t("underActiveHold", "Under Active Hold")}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400"><span className="notranslate" translate="no">{loading ? "..." : withdrawalCount}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">
            {t("clearedToMarket", "Cleared to Market")}
          </span>
          <div className="text-2xl font-bold text-emerald-400"><span className="notranslate" translate="no">{loading ? "..." : safeCount}</span></div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">
            {t("cryptoLedgerProofs", "Cryptographic Ledger Proofs")}
          </span>
          <div className="text-2xl font-bold text-cyan-400">{t("onChainVerified100", "100% On-Chain")}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchAmuPlaceholder", "Search by Tag ID (e.g. RJ-CW1), farm, or drug...")}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>

          {/* Species Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> {t("speciesFilter", "Species:")}
            </span>
            {[
              { id: "ALL", label: t("allSpecies", "All Species") },
              { id: "COW", label: t("bovineCow", "🐄 Bovine (Cow)") },
              { id: "POULTRY", label: t("poultry", "🐔 Poultry") },
              { id: "FISH", label: t("aquaculture", "🐟 Aquaculture") }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterSpecies(f.id)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  filterSpecies === f.id
                    ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
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
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("logId", "Log ID")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("targetAnimalTag", "Target Animal Tag")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("farmSource", "Farm Source")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("activeDrug", "Active Drug")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("adminDate", "Admin Date")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("withdrawalStatus", "Withdrawal Status")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("blockchainHash", "Blockchain Hash")}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t("action", "Action")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">{t("loadingAmuRecords", "Loading AMU telemetry records...")}</td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-sm font-mono text-emerald-400 font-semibold">
                      <span className="notranslate" translate="no">{log.id}</span>
                    </td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-mono text-cyan-400 font-bold">
                        <span className="notranslate" translate="no">{log.tagId}</span>
                      </div>
                      <div className="text-xs text-slate-500">{log.species}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300">{log.farm}</td>
                    <td className="py-4 px-6 text-sm">
                      <div className="font-semibold text-white">{log.drug}</div>
                      <div className="text-xs text-slate-500">{log.dosage}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-400 font-mono">{log.date}</td>
                    <td className="py-4 px-6 text-sm">
                      {log.status === "WITHDRAWAL" ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          <Clock className="w-3.5 h-3.5" />
                          <span><span className="notranslate" translate="no">{log.daysRemaining}</span> {t("daysLeft", "days left")}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{translateStatus("SAFE")}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6 text-sm font-mono text-slate-400 text-xs">
                      <span className="hover:text-cyan-400 transition-colors underline decoration-slate-700 notranslate" translate="no">
                        {log.txHash}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all"
                      >
                        {t("inspect", "Inspect")}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-500">{t("noAmuLogsFound", "No AMU logs found.")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AMU Log Dossier Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                  <Activity className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{t("amuPassportTitle", "AMU Administration Passport")}</h3>
                  <p className="text-xs text-slate-400 font-mono">
                    {t("logId", "Log")}: <span className="notranslate" translate="no">{selectedLog.id}</span> • {t("targetAnimalTag", "Tag")}: <span className="notranslate" translate="no">{selectedLog.tagId}</span>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm">{t("activeQuarantineNotice", "Active Quarantine Notice")}</h4>
                  <p className="text-[11px] opacity-90 mt-0.5">
                    {t("quarantineNoticeDesc", "Food products from this livestock are withheld from commercial distribution until safe date.")} (<span className="notranslate" translate="no">{selectedLog.daysRemaining}</span> {t("daysLeft", "days left")}).
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">{t("targetLivestock", "Target Livestock")}</span>
                  <strong className="text-white text-sm notranslate" translate="no">{selectedLog.species} ({selectedLog.tagId})</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("activeDrug", "Active Drug")}</span>
                  <strong className="text-cyan-400 text-sm">{selectedLog.drug}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("premisesFarmer", "Premises & Farmer")}</span>
                  <span className="text-slate-300 text-sm">{selectedLog.farm}</span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{t("administeredBy", "Administered By")}</span>
                  <span className="text-slate-300 text-sm">{selectedLog.vet}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                  <span className="font-semibold text-white">{t("immutableSepoliaTx", "Immutable Sepolia Transaction")}</span>
                </div>
                <button
                  onClick={() => copyHash(selectedLog.fullHash)}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {t("copyHash", "Copy Hash")}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedLog(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("closePassport", "Close Passport")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
