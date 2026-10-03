"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, User, Send, Sparkles, RefreshCw, HelpCircle, Shield, 
  Award, Activity, Stethoscope, Beaker, Coins, Globe, Key, 
  CheckCircle2, AlertTriangle, ChevronRight, Settings, ExternalLink,
  Copy, Check, FileText, ArrowRight
} from "lucide-react";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

export default function AiAssistantPage() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState("chat"); // "chat" | "vet" | "regulator" | "tester" | "farmer"
  
  // API Key & Engine State
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [customKey, setCustomKey] = useState("");
  const [engineStatus, setEngineStatus] = useState({
    activeModel: "AgriGuard Domain Synthesizer (Local)",
    geminiConfigured: false
  });
  const [keySavedToast, setKeySavedToast] = useState(false);

  // Chat State
  const [messages, setMessages] = useState([
    {
      id: "1",
      sender: "bot",
      text: "👋 Welcome to the **AgriGuard Generative AI Command Center**!\n\nI am powered by deep agricultural pharmacology models, FSSAI statutory standards, and the AgriGuard blockchain ledger. You can chat freely or switch to dedicated Gen AI tools for **Veterinary AMU**, **FSSAI Audits**, **MRL Lab Analysis**, and **Multilingual Kisan Advisory**.",
      time: "Just now",
      source: "local"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Copilot Tool States
  // 1. Vet Tool State
  const [vetForm, setVetForm] = useState({
    animalType: "Caprine (Goat)",
    tagId: "GT-401",
    medicineName: "Enrofloxacin 10%",
    activeIngredient: "Enrofloxacin",
    dose: "5 mg/kg",
    route: "Intramuscular (IM)",
    diagnosis: "Respiratory Mycoplasmosis"
  });
  const [vetResult, setVetResult] = useState(null);
  const [vetLoading, setVetLoading] = useState(false);

  // 2. Regulator Tool State
  const [regRegion, setRegRegion] = useState("Karnataka Dairy & Caprine Cluster - Zone 4");
  const [regResult, setRegResult] = useState(null);
  const [regLoading, setRegLoading] = useState(false);

  // 3. Tester Tool State
  const [testerForm, setTesterForm] = useState({
    sampleId: "SMP-MRL-2026-089",
    farmId: "Farm 3 (Rajesh Kumar)",
    productType: "Caprine Milk (Goat)",
    substance: "Oxytetracycline",
    detectedPpm: "0.042",
    mrlLimit: "0.100",
    isViolation: false
  });
  const [testerResult, setTesterResult] = useState(null);
  const [testerLoading, setTesterLoading] = useState(false);

  // 4. Kisan Multilingual Tool State
  const [kisanForm, setKisanForm] = useState({
    farmerName: "Rajesh Kumar",
    animalTag: "RJ-CW1 (Caprine)",
    productType: "Goat Meat (Chevon)",
    wasteAmount: "15",
    subsidyAmount: "10800",
    language: "hi"
  });
  const [kisanResult, setKisanResult] = useState(null);
  const [kisanLoading, setKisanLoading] = useState(false);

  // Initial load
  useEffect(() => {
    const savedKey = localStorage.getItem("agriguard_gemini_api_key");
    if (savedKey) setCustomKey(savedKey);

    fetch("http://localhost:5000/api/v1/ai/status")
      .then(r => r.json())
      .then(data => {
        if (savedKey) {
          setEngineStatus({
            activeModel: "Google Gemini 2.0 Flash (Custom Key)",
            geminiConfigured: true
          });
        } else {
          setEngineStatus({
            activeModel: data.activeModel || "AgriGuard Domain Synthesizer",
            geminiConfigured: data.geminiConfigured
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (activeTab === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, activeTab]);

  const handleSaveKey = () => {
    if (customKey.trim()) {
      localStorage.setItem("agriguard_gemini_api_key", customKey.trim());
      setEngineStatus({
        activeModel: "Google Gemini 2.0 Flash (Active)",
        geminiConfigured: true
      });
    } else {
      localStorage.removeItem("agriguard_gemini_api_key");
      setEngineStatus({
        activeModel: "AgriGuard Domain Synthesizer (Local)",
        geminiConfigured: false
      });
    }
    setShowKeyModal(false);
    setKeySavedToast(true);
    setTimeout(() => setKeySavedToast(false), 3000);
  };

  // Universal Chat Send
  const handleSend = async (customQuery) => {
    const text = customQuery || input;
    if (!text.trim()) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiKeyToSend = customKey.trim() || undefined;
      const res = await fetch("http://localhost:5000/api/v1/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, apiKey: apiKeyToSend, language: language })
      });
      const data = await res.json();
      const botMsg = {
        id: (Date.now() + 1).toString(),
        sender: "bot",
        text: data.reply || "Response generated.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source: data.source,
        modelUsed: data.modelUsed
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "bot",
          text: "⚠️ Backend connection issue. Please ensure backend server is running on port 5000.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Vet Clinical Review Runner
  const handleRunVetReview = async () => {
    setVetLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/ai/clinical-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...vetForm, apiKey: customKey.trim() || undefined, language: language })
      });
      const data = await res.json();
      setVetResult(data);
    } catch (err) {
      alert("Failed to run clinical review. Ensure backend is running.");
    } finally {
      setVetLoading(false);
    }
  };

  // Regulator Briefing Runner
  const handleRunRegulatorBriefing = async () => {
    setRegLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/ai/regulatory-briefing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region: regRegion,
          stats: { totalClaims: 14, totalDisbursed: 24500, activeQuarantines: 3, violationsCount: 0 },
          apiKey: customKey.trim() || undefined,
          language: language
        })
      });
      const data = await res.json();
      setRegResult(data);
    } catch (err) {
      alert("Failed to generate regulatory briefing.");
    } finally {
      setRegLoading(false);
    }
  };

  // Tester Lab Analysis Runner
  const handleRunTesterAnalysis = async () => {
    setTesterLoading(true);
    try {
      const isBreach = parseFloat(testerForm.detectedPpm) > parseFloat(testerForm.mrlLimit);
      const res = await fetch("http://localhost:5000/api/v1/ai/lab-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...testerForm,
          isViolation: isBreach,
          apiKey: customKey.trim() || undefined,
          language: language
        })
      });
      const data = await res.json();
      setTesterResult(data);
    } catch (err) {
      alert("Failed to run lab analysis.");
    } finally {
      setTesterLoading(false);
    }
  };

  // Kisan Advisory Runner
  const handleRunKisanAdvisory = async () => {
    setKisanLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/ai/farmer-advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...kisanForm, apiKey: customKey.trim() || undefined, language: kisanForm.language || language })
      });
      const data = await res.json();
      setKisanResult(data);
    } catch (err) {
      alert("Failed to generate farmer advisory.");
    } finally {
      setKisanLoading(false);
    }
  };

  // Quick Prompt Samples
  const quickPrompts = [
    t("auditCompliance") || "FSSAI MRL limits for dairy and meat",
    t("evaluateMrl") || "Withdrawal period for Enrofloxacin in goats",
    t("generateBrief") || "How smart contracts verify zero-residue clearance",
    t("generateKisanAdvice") || "DBT subsidy rates for goat meat and milk",
    "WHO AWaRe AMU classification"
  ];

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto flex flex-col min-h-[calc(100vh-5rem)]">
      {/* Toast Notification */}
      {keySavedToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <Check className="w-5 h-5" />
          <span>API Key configuration updated successfully!</span>
        </div>
      )}

      {/* Header & Engine Status Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-cyan-500 p-0.5 shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-emerald-400">
                <Bot className="w-6 h-6" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
                {t("aiCommandCenterTitle")}
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v2.5 Hybrid
                </span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                {t("aiCommandCenterDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* Engine Status Card */}
        <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 p-2.5 rounded-2xl">
          <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800/80">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <div>
              <span className="text-[10px] text-slate-500 uppercase tracking-wider block font-bold">{t("activeEngine")}</span>
              <span className="text-xs font-mono font-semibold text-emerald-300">{engineStatus.activeModel}</span>
            </div>
          </div>

          <button
            onClick={() => setShowKeyModal(true)}
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 flex items-center gap-2 transition-all"
            title={t("setApiKey")}
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">{t("apiKeyBtn") || "API Key"}</span>
          </button>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-2 pt-6 pb-4 overflow-x-auto no-scrollbar border-b border-slate-800/60">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "chat"
              ? "bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>💬 {t("universalAiChat")}</span>
        </button>

        <button
          onClick={() => setActiveTab("vet")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "vet"
              ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span>🩺 {t("vetClinicalCopilot")}</span>
        </button>

        <button
          onClick={() => setActiveTab("regulator")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "regulator"
              ? "bg-indigo-500 text-slate-950 shadow-lg shadow-indigo-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>🛡️ {t("fssaiExecutiveBrief")}</span>
        </button>

        <button
          onClick={() => setActiveTab("tester")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "tester"
              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Beaker className="w-4 h-4" />
          <span>🔬 {t("mrlLabAuditor")}</span>
        </button>

        <button
          onClick={() => setActiveTab("farmer")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeTab === "farmer"
              ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/20"
              : "bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>🌾 {t("kisanMultilingualAi")}</span>
        </button>
      </div>

      {/* ========================================================
          TAB 1: UNIVERSAL CHAT
      ======================================================== */}
      {activeTab === "chat" && (
        <div className="flex-1 flex flex-col mt-4 bg-slate-900/60 border border-slate-800/80 rounded-3xl overflow-hidden backdrop-blur-md">
          {/* Quick Prompts */}
          <div className="bg-slate-950/60 p-3 border-b border-slate-800 flex gap-2 overflow-x-auto no-scrollbar">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider self-center px-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> {t("quickPromptsLabel") || "Prompts:"}
            </span>
            {quickPrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(p)}
                className="text-xs whitespace-nowrap bg-slate-900 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 px-3.5 py-1.5 rounded-full border border-slate-800 transition-all flex-shrink-0"
              >
                {p}
              </button>
            ))}
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[520px]">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.sender === "bot" && (
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="w-4 h-4" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] sm:max-w-[78%] p-4 rounded-2xl ${
                    m.sender === "user"
                      ? "bg-emerald-600 text-white rounded-tr-none shadow-md text-sm font-medium"
                      : "bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-tl-none text-xs sm:text-sm leading-relaxed"
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">{m.text}</div>
                  <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-700/40 text-[10px]">
                    <span className={`${m.sender === "user" ? "text-emerald-200" : "text-slate-500"}`}>{m.time}</span>
                    {m.modelUsed && (
                      <span className="text-[10px] text-emerald-400/80 font-mono">
                        ⚡ {m.modelUsed}
                      </span>
                    )}
                  </div>
                </div>
                {m.sender === "user" && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3.5 justify-start items-center">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="bg-slate-800/90 text-slate-300 border border-slate-700/60 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-2 text-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]"></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]"></span>
                  <span className="ml-2 font-mono text-slate-400">{t("synthesizingDomainKnowledge")}</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-4 bg-slate-950/80 border-t border-slate-800 flex gap-3 items-center"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t("typeMessagePlaceholder")}
              className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm"
            >
              <span>{t("askAiBtn")}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ========================================================
          TAB 2: VET CLINICAL COPILOT
      ======================================================== */}
      {activeTab === "vet" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Input Form */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-cyan-500/30 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t("prescriptionAmuAnalyzer")}</h2>
                <p className="text-xs text-slate-400">{t("evaluatesAmrRisk")}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("targetAnimal")}</label>
                <select
                  value={vetForm.animalType}
                  onChange={(e) => setVetForm({ ...vetForm, animalType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white"
                >
                  <option value="Caprine (Goat)">Caprine (Goat)</option>
                  <option value="Bovine (Dairy Cow)">Bovine (Dairy Cow)</option>
                  <option value="Bubaline (Buffalo)">Bubaline (Buffalo)</option>
                  <option value="Ovine (Sheep)">Ovine (Sheep)</option>
                  <option value="Poultry (Broiler / Layer)">Poultry (Broiler / Layer)</option>
                  <option value="Porcine (Swine)">Porcine (Swine)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("tagId")}</label>
                <input
                  type="text"
                  value={vetForm.tagId}
                  onChange={(e) => setVetForm({ ...vetForm, tagId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono notranslate"
                  translate="no"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("medicineAdministered")}</label>
                <input
                  type="text"
                  value={vetForm.medicineName}
                  onChange={(e) => setVetForm({ ...vetForm, medicineName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("prescriptionDosage")}</label>
                <input
                  type="text"
                  value={vetForm.activeIngredient}
                  onChange={(e) => setVetForm({ ...vetForm, activeIngredient: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("approvedDose")}</label>
                  <input
                    type="text"
                    value={vetForm.dose}
                    onChange={(e) => setVetForm({ ...vetForm, dose: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("route")}</label>
                  <input
                    type="text"
                    value={vetForm.route}
                    onChange={(e) => setVetForm({ ...vetForm, route: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("details")}</label>
                <input
                  type="text"
                  value={vetForm.diagnosis}
                  onChange={(e) => setVetForm({ ...vetForm, diagnosis: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <button
                onClick={handleRunVetReview}
                disabled={vetLoading}
                className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-cyan-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {vetLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("evaluatingSafety")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t("analyzeTreatmentSafety")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Display */}
          <div className="lg:col-span-7">
            {vetResult ? (
              <div className="bg-slate-900/80 border border-cyan-500/40 rounded-3xl p-6 backdrop-blur-md space-y-5 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{t("clinicalReviewTool")}</span>
                    <h3 className="text-xl font-black text-white">{vetForm.medicineName} for {vetForm.animalType}</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                    Safety: {"★".repeat(vetResult.safetyRating || 4)}{"☆".repeat(5 - (vetResult.safetyRating || 4))}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">AMR Category</span>
                    <span className="text-xs font-bold text-amber-400 font-mono">{vetResult.amrRiskCategory}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">{t("withdrawalHold")} (Milk)</span>
                    <span className="text-xs font-bold text-cyan-400 font-mono">{vetResult.milkHoldHours} Hours</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[10px] text-slate-400 block mb-1 uppercase font-bold">{t("withdrawalPeriod")} (Meat)</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{vetResult.meatHoldDays} {t("days")}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2 text-xs">
                  <strong className="block text-slate-200 font-bold">💡 Pharmacological Rationale:</strong>
                  <p className="text-slate-300 leading-relaxed">{vetResult.clinicalRationale}</p>
                </div>

                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1.5">
                  <strong className="block text-white font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-400" /> Contraindications & Warnings:
                  </strong>
                  <ul className="list-disc list-inside space-y-1 text-slate-300">
                    {Array.isArray(vetResult.contraindications) ? (
                      vetResult.contraindications.map((c, i) => <li key={i}>{c}</li>)
                    ) : (
                      <li>{vetResult.contraindications}</li>
                    )}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs space-y-1">
                  <strong className="block text-white font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Farmer Counseling Guidance:
                  </strong>
                  <p className="text-slate-300">{vetResult.farmerGuidance}</p>
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Stethoscope className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-slate-400 mb-1">{t("clinicalReviewTool")}</h3>
                <p className="text-xs max-w-sm">
                  {t("clinicalReviewDesc")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 3: FSSAI REGULATORY BRIEFING
      ======================================================== */}
      {activeTab === "regulator" && (
        <div className="mt-4 space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900/60 border border-indigo-500/30 backdrop-blur-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                {t("regulatorBriefingTool")}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {t("regulatorBriefingDesc")}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="text"
                value={regRegion}
                onChange={(e) => setRegRegion(e.target.value)}
                placeholder={t("selectTargetCluster")}
                className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white"
              />
              <button
                onClick={handleRunRegulatorBriefing}
                disabled={regLoading}
                className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20 text-xs flex items-center gap-2 shrink-0"
              >
                {regLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{regLoading ? t("generatingBrief") : t("generateClusterBrief")}</span>
              </button>
            </div>
          </div>

          {regResult ? (
            <div className="p-8 rounded-3xl bg-slate-900/80 border border-indigo-500/40 backdrop-blur-md animate-in fade-in space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <span className="text-xs font-mono text-indigo-400 uppercase tracking-widest font-bold">
                  {t("regulatorBriefingTool")}
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Engine: {regResult.modelUsed || "AgriGuard Synthesizer"}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-sans">
                {regResult.briefing}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-slate-900/40 border border-slate-800 text-center text-slate-500">
              <Shield className="w-12 h-12 mx-auto text-slate-700 mb-3" />
              <h3 className="text-base font-bold text-slate-400 mb-1">{t("regulatorBriefingTool")}</h3>
              <p className="text-xs max-w-md mx-auto">
                {t("regulatorBriefingDesc")}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 4: MRL LAB AUDITOR
      ======================================================== */}
      {activeTab === "tester" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/60 border border-rose-500/30 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Beaker className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t("mrlAuditorTool")}</h2>
                <p className="text-xs text-slate-400">{t("mrlAuditorDesc")}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("sampleId") || "Sample ID"}</label>
                <input
                  type="text"
                  value={testerForm.sampleId}
                  onChange={(e) => setTesterForm({ ...testerForm, sampleId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono notranslate"
                  translate="no"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("productSpecies") || "Food Matrix / Product"}</label>
                <input
                  type="text"
                  value={testerForm.productType}
                  onChange={(e) => setTesterForm({ ...testerForm, productType: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("medicineAdministered") || "Detected Substance / Analyte"}</label>
                <input
                  type="text"
                  value={testerForm.substance}
                  onChange={(e) => setTesterForm({ ...testerForm, substance: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("detectedConc") || "Detected Conc (ppm)"}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={testerForm.detectedPpm}
                    onChange={(e) => setTesterForm({ ...testerForm, detectedPpm: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("mrlLimit") || "Statutory MRL (ppm)"}</label>
                  <input
                    type="number"
                    step="0.001"
                    value={testerForm.mrlLimit}
                    onChange={(e) => setTesterForm({ ...testerForm, mrlLimit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>

              <button
                onClick={handleRunTesterAnalysis}
                disabled={testerLoading}
                className="w-full bg-rose-500 hover:bg-rose-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-rose-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {testerLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("auditingResidue")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t("auditSampleResidue")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {testerResult ? (
              <div className="bg-slate-900/80 border border-rose-500/40 rounded-3xl p-6 backdrop-blur-md space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold">{t("statutoryCompensationCert") || "FSSAI Laboratory Certificate"}</span>
                    <h3 className="text-xl font-black text-white notranslate" translate="no">{testerForm.sampleId}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                    parseFloat(testerForm.detectedPpm) > parseFloat(testerForm.mrlLimit)
                      ? "bg-rose-500/20 text-rose-400 border-rose-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  }`}>
                    {parseFloat(testerForm.detectedPpm) > parseFloat(testerForm.mrlLimit)
                      ? (t("violation") ? t("violation").toUpperCase() : "CRITICAL BREACH")
                      : (t("compliant") ? t("compliant").toUpperCase() : "COMPLIANT")}
                  </span>
                </div>

                <div className="whitespace-pre-wrap text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {testerResult.analysis}
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Beaker className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-slate-400 mb-1">{t("mrlAuditorTool")}</h3>
                <p className="text-xs max-w-sm">
                  {t("mrlAuditorDesc")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: KISAN MULTILINGUAL ADVISOR
      ======================================================== */}
      {activeTab === "farmer" && (
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 bg-slate-900/60 border border-amber-500/30 rounded-3xl p-6 backdrop-blur-md">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800 mb-5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{t("kisanAiFarmAdvisor")}</h2>
                <p className="text-xs text-slate-400">{t("kisanAiSubtitle")}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("languageLabel") || "Select Language"}</label>
                <select
                  value={kisanForm.language}
                  onChange={(e) => setKisanForm({ ...kisanForm, language: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-semibold"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.native} ({lang.name})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("beneficiaryFarmer") || "Farmer Name"}</label>
                <input
                  type="text"
                  value={kisanForm.farmerName}
                  onChange={(e) => setKisanForm({ ...kisanForm, farmerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("tagId") || "Animal Tag"}</label>
                <input
                  type="text"
                  value={kisanForm.animalTag}
                  onChange={(e) => setKisanForm({ ...kisanForm, animalTag: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white notranslate font-mono"
                  translate="no"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("productProducedWithheld") || "Product Discarded"}</label>
                  <input
                    type="text"
                    value={kisanForm.productType}
                    onChange={(e) => setKisanForm({ ...kisanForm, productType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 font-medium mb-1">{t("quantityProduced") || "Quantity"}</label>
                  <input
                    type="text"
                    value={kisanForm.wasteAmount}
                    onChange={(e) => setKisanForm({ ...kisanForm, wasteAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">{t("assessedSubsidyEntitlement") || "Subsidy Entitlement (INR)"}</label>
                <input
                  type="text"
                  value={kisanForm.subsidyAmount}
                  onChange={(e) => setKisanForm({ ...kisanForm, subsidyAmount: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white font-mono text-amber-300"
                />
              </div>

              <button
                onClick={handleRunKisanAdvisory}
                disabled={kisanLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-4"
              >
                {kisanLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{t("generatingGuidance")}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>{t("generatePlainLanguageAdvice")}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="lg:col-span-7">
            {kisanResult ? (
              <div className="bg-slate-900/80 border border-amber-500/40 rounded-3xl p-6 backdrop-blur-md space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-amber-400 uppercase tracking-wider font-bold">{t("kisanAiFarmAdvisor")}</span>
                    <h3 className="text-xl font-black text-white">{kisanForm.farmerName} (<span className="notranslate" translate="no">{kisanForm.animalTag}</span>)</h3>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 uppercase font-mono">
                    {t("languageLabel") || "Language:"} {kisanResult.language || "Native"}
                  </span>
                </div>

                <div className="whitespace-pre-wrap text-sm text-slate-200 leading-relaxed font-sans">
                  {kisanResult.advisory}
                </div>
              </div>
            ) : (
              <div className="h-full bg-slate-900/40 border border-slate-800/80 rounded-3xl p-8 flex flex-col items-center justify-center text-center text-slate-500">
                <Globe className="w-12 h-12 text-slate-700 mb-3" />
                <h3 className="text-base font-bold text-slate-400 mb-1">{t("kisanAiFarmAdvisor")}</h3>
                <p className="text-xs max-w-sm">
                  {t("kisanAiSubtitle")}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          API KEY MODAL
      ======================================================== */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{t("enterCustomGeminiKey")}</h3>
                <p className="text-xs text-slate-400">Google Gemini 2.0 Flash</p>
              </div>
            </div>

            <div className="text-xs text-slate-300 space-y-2">
              <p>
                {t("keyPrivacyNotice")}
              </p>
            </div>

            <div>
              <label className="block text-xs text-slate-400 font-medium mb-1">{t("geminiApiKey")}</label>
              <input
                type="password"
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500/50"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowKeyModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                {t("cancel")}
              </button>
              <button
                onClick={handleSaveKey}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20"
              >
                {t("saveKey")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
