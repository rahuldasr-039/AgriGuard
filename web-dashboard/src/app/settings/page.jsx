"use client";

import { useState } from "react";
import { Settings, Save, Shield, Database, BellRing } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export default function SettingsPage() {
  const { t } = useLanguage();
  const [sepoliaRpc, setSepoliaRpc] = useState("https://sepolia.infura.io/v3/YOUR_KEY");
  const [contractAddress, setContractAddress] = useState("0x5FbDB2315678afecb367f032d93F642f64180aa3");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = (e) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-8 pb-20 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Settings className="w-8 h-8 text-slate-400" />
          {t("systemSettings")}
        </h1>
        <p className="text-slate-400 mt-1">{t("settingsDesc")}</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Blockchain Settings */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-emerald-400" />
            {t("blockchainConfig")}
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t("sepoliaRpcUrl")}</label>
              <input
                type="text"
                value={sepoliaRpc}
                onChange={(e) => setSepoliaRpc(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 notranslate"
                translate="no"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t("contractAddress")}</label>
              <input
                type="text"
                value={contractAddress}
                onChange={(e) => setContractAddress(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-emerald-500/50 notranslate"
                translate="no"
              />
            </div>
          </div>
        </div>

        {/* MRL Thresholds */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-cyan-400" />
            {t("mrlAlertingLimits")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t("oxytetracyclineLimit")}</label>
              <input
                type="number"
                defaultValue={10}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">{t("penicillinLimit")}</label>
              <input
                type="number"
                defaultValue={50}
                className="w-full bg-slate-800/80 border border-slate-700 rounded-lg px-4 py-2 text-white text-sm focus:outline-none focus:border-cyan-500/50"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BellRing className="w-5 h-5 text-indigo-400" />
            <div>
              <div className="text-white font-medium text-sm">{t("automatedEmailAlerts")}</div>
              <div className="text-slate-400 text-xs">{t("automatedEmailAlertsDesc")}</div>
            </div>
          </div>
          <input
            type="checkbox"
            checked={notificationsEnabled}
            onChange={(e) => setNotificationsEnabled(e.target.checked)}
            className="w-5 h-5 accent-emerald-500 cursor-pointer"
          />
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4">
          <button
            type="submit"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {t("saveSettings")}
          </button>
          {saved && (
            <span className="text-sm font-medium text-emerald-400">{t("settingsSaved")}</span>
          )}
        </div>
      </form>
    </div>
  );
}
