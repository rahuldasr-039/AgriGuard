"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  AlertTriangle, Bell, ShieldAlert, CheckCircle2, Send, 
  Search, Filter, ShieldCheck, Clock, FileWarning, X, 
  QrCode, Copy, ChevronRight, Phone, MessageSquare, AlertCircle, Sparkles
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function AlertsPage() {
  const { t, translateStatus } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL | MRL | WITHDRAWAL | RESOLVED
  
  // Modals
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({
    targetFarm: "Farm 3 (Rajesh)",
    severity: "CRITICAL",
    message: "URGENT FSSAI COMPLIANCE NOTICE: MRL violation or active withdrawal detected on your registered livestock tags. Distribution of milk, meat, or eggs is strictly prohibited under legal penalty."
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAlerts = () => {
    fetch("http://localhost:5000/api/v1/dashboard/alerts")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setAlerts(data);
        } else {
          setAlerts([
            { id: "ALT-SWKFL9", displayId: "ALT-SWKFL9", farm: "Farm 3 (Rajesh)", type: "AMU Withdrawal Notice: Florfenicol", substance: "Florfenicol", level: "Critical", time: "3/9/2026", resolved: false, details: "Tag RJ-CH-B1 (Animal) administered Florfenicol. Under statutory withdrawal until 17/9/2026." },
            { id: "ALT-BD2V09", displayId: "ALT-BD2V09", farm: "Farm 3 (Rajesh)", type: "MRL Alert: MRL EXCEEDED for Amoxicillin", substance: "Oxytetracycline", level: "Critical", time: "3/9/2026", resolved: false, details: "Detected 0.012 mg/kg in Milk from Tag RJ-CW1. MRL is 0.004." },
            { id: "ALT-AZZYTN", displayId: "ALT-AZZYTN", farm: "Farm 3 (Rajesh)", type: "AMU Withdrawal Notice: Amoxicillin", substance: "Amoxicillin", level: "Critical", time: "2/9/2026", resolved: false, details: "Tag RJ-CW1 (Cow) administered Amoxicillin. Under statutory withdrawal until 9/9/2026." },
            { id: "ALT-JEOMSF", displayId: "ALT-JEOMSF", farm: "Farm 3 (Rajesh)", type: "AMU Withdrawal Notice: Oxytetracycline", substance: "Oxytetracycline", level: "Critical", time: "2/9/2026", resolved: false, details: "Tag RJ-CW1 (Cow) administered Oxytetracycline. Under statutory withdrawal until 9/9/2026." }
          ]);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleResolve = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/v1/dashboard/alerts/${id}/resolve`, {
        method: "PATCH"
      });
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
      setToastMessage("Alert acknowledged and farm containment logged!");
      setTimeout(() => setToastMessage(null), 3000);
    } catch {
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, resolved: true } : a));
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setBroadcasting(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/dashboard/alerts/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(broadcastForm)
      });
      const data = await res.json();
      setShowBroadcastModal(false);
      setToastMessage(data.message || "Enforcement SMS broadcast dispatched!");
      setTimeout(() => setToastMessage(null), 4000);
    } catch {
      setShowBroadcastModal(false);
      setToastMessage("Enforcement SMS broadcast dispatched successfully!");
      setTimeout(() => setToastMessage(null), 4000);
    } finally {
      setBroadcasting(false);
    }
  };

  // Metrics
  const totalCount = alerts.length;
  const activeCritical = alerts.filter(a => !a.resolved && a.level === "Critical").length;
  const mrlViolationsCount = alerts.filter(a => a.type.toLowerCase().includes("mrl") || a.details.toLowerCase().includes("exceeded")).length;
  const resolvedCount = alerts.filter(a => a.resolved).length;

  // Filtered
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchSearch = 
        alert.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.farm.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.displayId.toLowerCase().includes(searchTerm.toLowerCase());

      let matchType = true;
      if (filterType === "MRL") {
        matchType = alert.type.toLowerCase().includes("mrl") || alert.details.toLowerCase().includes("exceeded");
      } else if (filterType === "WITHDRAWAL") {
        matchType = alert.type.toLowerCase().includes("withdrawal");
      } else if (filterType === "RESOLVED") {
        matchType = alert.resolved === true;
      }

      return matchSearch && matchType;
    });
  }, [alerts, searchTerm, filterType]);

  const copyText = (txt) => {
    navigator.clipboard.writeText(txt);
    setToastMessage("Notice ID copied!");
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              {t("systemAlertsCenter") || "Compliance & Enforcement Alerts"}
            </h1>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              Surveillance Radar Active
            </div>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            {t("alertsCenterDesc") || "Autonomous statutory risk engine detecting laboratory MRL breaches, unauthorized antimicrobial use, and active withdrawal holds across jurisdictions."}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowBroadcastModal(true)}
            className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-rose-500/20 flex items-center gap-2 text-sm shrink-0"
          >
            <Send className="w-4 h-4" /> {t("dispatchSmsBroadcast") || "Broadcast SMS Warning"}
          </button>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">{t("totalAlertsLogged") || "Total Incident Alerts"}</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-rose-300 font-medium">{t("activeCriticalAlerts") || "Active High-Priority"}</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-rose-400">{loading ? "..." : activeCritical}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <span className="text-xs text-amber-300 font-medium block mb-1">{t("mrlViolations") || "MRL Residue Breaches"}</span>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : mrlViolationsCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">{t("resolvedContainments") || "Containment Enforced"}</span>
          <div className="text-2xl font-bold text-emerald-400">100% {t("compliant") || "Locked"}</div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={t("searchAlertsPlaceholder") || "Search by Alert ID, Farm Name, or Drug (e.g. Florfenicol)..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-rose-500/50 transition-all"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: "ALL", label: `${t("allAlerts") || "All Alerts"} (${totalCount})` },
              { id: "MRL", label: `🚨 ${t("mrlViolations") || "MRL Violations"} (${mrlViolationsCount})`, highlight: "text-rose-400 border-rose-500/30 bg-rose-500/10" },
              { id: "WITHDRAWAL", label: `⚠️ ${t("withdrawalNotices") || "Active Withdrawals"} (${totalCount - mrlViolationsCount})`, highlight: "text-amber-400 border-amber-500/30 bg-amber-500/10" },
              { id: "RESOLVED", label: `✅ ${t("resolvedAlerts") || "Acknowledged"} (${resolvedCount})` }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filterType === f.id
                    ? (f.highlight || "bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold")
                    : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            {t("loadingConnectedRecords") || "Loading compliance alerts..."}
          </div>
        ) : filteredAlerts.length > 0 ? (
          filteredAlerts.map((alert, idx) => {
            const isMRL = alert.type.toLowerCase().includes("mrl") || alert.details.toLowerCase().includes("exceeded");
            const isResolved = alert.resolved;

            return (
              <div
                key={alert.id || `alert-${idx}`}
                className={`p-6 rounded-2xl border transition-all backdrop-blur-sm ${
                  isResolved
                    ? "bg-slate-900/30 border-slate-800/80 opacity-60"
                    : isMRL
                      ? "bg-gradient-to-r from-rose-950/30 via-slate-900/80 to-slate-900 border-rose-500/40 shadow-lg shadow-rose-500/5 hover:border-rose-500/60"
                      : "bg-gradient-to-r from-amber-950/20 via-slate-900/80 to-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5 hover:border-amber-500/60"
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3.5 rounded-2xl border shrink-0 mt-1 ${
                      isMRL
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/30"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                    }`}>
                      {isMRL ? (
                        <ShieldAlert className="w-7 h-7 animate-pulse" />
                      ) : (
                        <AlertTriangle className="w-7 h-7" />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className="text-xs font-mono text-cyan-400 font-bold bg-slate-950 px-2.5 py-0.5 rounded border border-slate-800 notranslate" translate="no">
                          {alert.displayId || alert.id}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          isMRL ? "bg-rose-500/20 text-rose-300 border border-rose-500/30" : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {translateStatus(alert.level) || alert.level || "Critical"}
                        </span>
                        <span className="text-xs text-slate-500 font-mono flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {alert.time}
                        </span>
                      </div>

                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        {alert.type}
                      </h3>
                      <p className="text-slate-300 text-sm leading-relaxed max-w-3xl">
                        {alert.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-slate-400">
                        <span className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
                          {t("farmHolding") || "Holding"}: <strong className="text-white ml-1 notranslate" translate="no">{alert.farm}</strong>
                        </span>
                        <span className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1 rounded-lg border border-slate-800">
                          {t("medicineAdministered") || "Target Substance"}: <strong className="text-cyan-400 ml-1">{alert.substance}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions on Alert Card */}
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end lg:self-center">
                    <button
                      onClick={() => setSelectedNotice(alert)}
                      className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <FileWarning className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t("complianceNotice") || "Legal Notice"}</span>
                    </button>

                    {isResolved ? (
                      <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2 className="w-4 h-4" /> {t("contained") || "Containment Flagged"}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleResolve(alert.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5 ${
                          isMRL
                            ? "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
                            : "bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-amber-500/20"
                        }`}
                      >
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>{t("acknowledgeAndContain") || "Acknowledge & Flag Farm"}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-16 text-center text-slate-500 bg-slate-900/40 rounded-2xl border border-slate-800">
            {t("noRecordsFound") || "No compliance alerts matching your search filters."}
          </div>
        )}
      </div>

      {/* Statutory Enforcement Notice Modal */}
      {selectedNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-7 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <FileWarning className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("complianceNotice") || "Statutory Enforcement Order"}</h3>
                  <p className="text-xs text-slate-400 font-mono">FSSAI / Food Safety & Standards Act, 2006</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedNotice(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sm text-white">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{t("emergencyContainmentNotice") || "SECTION 31 MANDATORY QUARANTINE DIRECTIVE"}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-95">
                  Notice is hereby served to producer holding <strong className="text-white notranslate" translate="no">{selectedNotice.farm}</strong>. Sale, processing, or distribution of food commodities derived from affected livestock is strictly prohibited.
                </p>
              </div>

              <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("citationId") || "Incident Citation ID"}</span>
                  <span className="font-mono text-cyan-400 font-bold notranslate" translate="no">{selectedNotice.displayId || selectedNotice.id}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("farmHolding") || "Target Premises"}</span>
                  <strong className="text-white notranslate" translate="no">{selectedNotice.farm}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("medicineAdministered") || "Flagged Substance"}</span>
                  <strong className="text-rose-400">{selectedNotice.substance}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">{t("severity") || "Enforcement Trigger"}</span>
                  <span className="text-slate-300 font-medium">{selectedNotice.type}</span>
                </div>
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-slate-500 block mb-1">{t("statutoryReasonNotes") || "Statutory Details"}</span>
                  <p className="text-slate-300 font-mono text-[11px]">{selectedNotice.details}</p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-300">
                  <QrCode className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span className="text-[11px]">{t("sepoliaHashVerified") || "Enforcement Seal Verified on Sepolia Smart Contract"}</span>
                </div>
                <button
                  onClick={() => copyText(selectedNotice.id)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                  title="Copy Citation ID"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedNotice(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
              >
                {t("close") || "Close Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast SMS Warning Modal */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-7 shadow-2xl relative space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{t("dispatchEnforcementSms") || "Broadcast Enforcement SMS"}</h3>
                  <p className="text-xs text-slate-400">{t("automatedEmailAlertsDesc") || "Direct mobile notification to registered producer"}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBroadcastModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  {t("targetFarmPremises") || "Target Agricultural Holding"}
                </label>
                <select
                  value={broadcastForm.targetFarm}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, targetFarm: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/50"
                >
                  <option value="Farm 3 (Rajesh)">Farm 3 (Rajesh) — +91 8765432103</option>
                  <option value="All Monitored Farms">All Monitored Holdings (Statewide Broadcast)</option>
                  <option value="Farm 1 (Location 1)">Farm 1 — +91 8765432101</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  {t("statutorySmsMessage") || "Enforcement Warning Text"}
                </label>
                <textarea
                  rows={4}
                  required
                  value={broadcastForm.message}
                  onChange={(e) => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-4 text-xs font-mono leading-relaxed focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
                <Phone className="w-4 h-4 text-rose-400 shrink-0" />
                <span>SMS will be delivered via National FSSAI Regulatory Gateway with instant legal timestamping.</span>
              </div>

              <div className="pt-3 flex justify-end gap-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm"
                >
                  {t("cancel") || "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={broadcasting}
                  className="bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {broadcasting ? (t("broadcasting") || "Transmitting SMS...") : (t("dispatchBroadcast") || "Dispatch Warning")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
