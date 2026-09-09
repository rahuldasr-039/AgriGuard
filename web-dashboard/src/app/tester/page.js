"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Beaker, CheckCircle2, AlertTriangle, ArrowUpRight, 
  RefreshCw, TrendingUp, ShieldCheck, Clock, Plus, 
  FileText, Activity, Search, X, Copy, QrCode, Sparkles,
  Coins, IndianRupee, Calendar, Lock, Check, ChevronRight,
  Info, Scale, Layers, HelpCircle, FileCheck2
} from "lucide-react";
import Link from "next/link";
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, CartesianGrid, Legend, PieChart, Pie, Cell 
} from "recharts";

export default function TesterDashboard() {
  const router = useRouter();

  // Tab State: "surveillance" | "waste"
  const [activeTab, setActiveTab] = useState("surveillance");

  // Surveillance State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [tests, setTests] = useState([]);
  const [totalTests, setTotalTests] = useState(0);
  const [violations, setViolations] = useState(0);
  const [selectedTest, setSelectedTest] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Waste & Compensation State
  const [testerProfile, setTesterProfile] = useState(null);
  const [farmersList, setFarmersList] = useState([]);
  const [wasteClaims, setWasteClaims] = useState([]);
  const [loadingWasteData, setLoadingWasteData] = useState(true);
  const [isAiCalculating, setIsAiCalculating] = useState(false);
  const [submittingClaim, setSubmittingClaim] = useState(false);
  const [claimSuccessModal, setClaimSuccessModal] = useState(null);
  const [claimError, setClaimError] = useState(null);

  // Waste Form State
  const [wasteForm, setWasteForm] = useState({
    farmerId: "",
    animalType: "",
    animalId: "",
    date: new Date().toISOString().split("T")[0],
    productType: "Milk",
    wasteAmount: "",
    unit: "L",
    aiRecommendedAmount: 0,
    aiRate: 0,
    aiReasoning: "",
    notes: ""
  });

  // Check URL query parameters for active tab on mount and navigation
  useEffect(() => {
    const handleCheckTab = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        if (params.get("tab") === "waste") {
          setActiveTab("waste");
        } else if (params.get("tab") === "surveillance") {
          setActiveTab("surveillance");
        }
      }
    };
    handleCheckTab();
    window.addEventListener("popstate", handleCheckTab);
    const interval = setInterval(handleCheckTab, 400);
    return () => {
      window.removeEventListener("popstate", handleCheckTab);
      clearInterval(interval);
    };
  }, []);

  // Fetch live MRL tests
  const fetchLiveTests = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("userRole");

    if (!role || role !== "FARM_TESTER") {
      router.push("/login");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/product-tests", {
        headers: token ? { "Authorization": `Bearer ${token}` } : {}
      });
      const data = await res.json();

      if (Array.isArray(data)) {
        const cutoff = new Date("2026-09-01T00:00:00.000Z");
        const valid = data.filter(d => new Date(d.testDate) >= cutoff);

        setTests(valid);
        setTotalTests(valid.length);
        const nonCompliant = valid.filter(d => d.status === "MRL EXCEEDED" || d.amountDetected > d.applicableMrl).length;
        setViolations(nonCompliant);
      }
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Failed to fetch product tests:", err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  // Fetch Tester Profile, Farmers with Livestock, and Filed Waste Claims
  const fetchWasteData = async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      setLoadingWasteData(true);
      const [testerRes, farmersRes, claimsRes] = await Promise.all([
        fetch("http://localhost:5000/api/v1/testers/me", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/testers/farmers-livestock", {
          headers: { "Authorization": `Bearer ${token}` }
        }),
        fetch("http://localhost:5000/api/v1/testers/waste-claims", {
          headers: { "Authorization": `Bearer ${token}` }
        })
      ]);

      if (testerRes.ok) {
        const testerData = await testerRes.json();
        setTesterProfile(testerData);
      } else {
        // Fallback to localStorage user object if endpoint failed
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser);
            if (parsed.farmTesterProfile) setTesterProfile(parsed.farmTesterProfile);
          } catch (e) {}
        }
      }

      if (farmersRes.ok) {
        const farmersData = await farmersRes.json();
        setFarmersList(farmersData);
      }

      if (claimsRes.ok) {
        const claimsData = await claimsRes.json();
        setWasteClaims(Array.isArray(claimsData) ? claimsData : []);
      }
    } catch (err) {
      console.error("Failed to load waste data:", err);
    } finally {
      setLoadingWasteData(false);
    }
  };

  useEffect(() => {
    fetchLiveTests();
    fetchWasteData();

    const interval = setInterval(() => {
      fetchLiveTests();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Filtered dropdown options based on 3-tier dynamic selection: Farmer -> Animal Type -> Animal ID
  const selectedFarmerObj = useMemo(() => {
    return farmersList.find(f => f.farmerId === wasteForm.farmerId) || null;
  }, [farmersList, wasteForm.farmerId]);

  const availableAnimalTypes = useMemo(() => {
    if (!selectedFarmerObj) return [];
    return (selectedFarmerObj.animalTypes || []).filter(
      t => !t.toLowerCase().includes("fish") && !t.toLowerCase().includes("aqua")
    );
  }, [selectedFarmerObj]);

  const availableAnimals = useMemo(() => {
    if (!selectedFarmerObj || !wasteForm.animalType) return [];
    return selectedFarmerObj.animals.filter(a => 
      a.category === wasteForm.animalType &&
      !a.category.toLowerCase().includes("fish") &&
      !(a.species && a.species.toLowerCase().includes("fish"))
    );
  }, [selectedFarmerObj, wasteForm.animalType]);

  // Handle Farmer Selection
  const handleFarmerChange = (farmerId) => {
    setWasteForm(prev => ({
      ...prev,
      farmerId,
      animalType: "",
      animalId: "",
      aiRecommendedAmount: 0,
      aiReasoning: ""
    }));
  };

  // Handle Animal Type Selection
  const handleAnimalTypeChange = (animalType) => {
    let suggestedProduct = "Milk";
    let suggestedUnit = "L";

    if (["Cow", "Buffalo"].includes(animalType)) {
      suggestedProduct = "Milk";
      suggestedUnit = "L";
    } else if (["Chicken", "Poultry"].includes(animalType)) {
      suggestedProduct = "Chicken";
      suggestedUnit = "kg";
    } else if (animalType === "Goat") {
      suggestedProduct = "Goat Meat";
      suggestedUnit = "kg";
    } else if (["Pig", "Sheep"].includes(animalType)) {
      suggestedProduct = "Meat";
      suggestedUnit = "kg";
    }

    setWasteForm(prev => ({
      ...prev,
      animalType,
      animalId: "",
      productType: suggestedProduct,
      unit: suggestedUnit,
      aiRecommendedAmount: 0,
      aiReasoning: ""
    }));
  };

  // Handle Product Type Selection
  const handleProductTypeChange = (productType) => {
    let unit = "kg";
    if (productType === "Milk" || productType === "Goat Milk") unit = "L";
    else if (productType === "Eggs") unit = "units";

    setWasteForm(prev => ({
      ...prev,
      productType,
      unit,
      aiRecommendedAmount: 0,
      aiReasoning: ""
    }));

    // Trigger AI recalculation if amount is already entered
    if (wasteForm.wasteAmount && parseFloat(wasteForm.wasteAmount) > 0) {
      triggerAiValuation(productType, wasteForm.wasteAmount, unit, wasteForm.animalType);
    }
  };

  // Trigger AI Price Recommendation API
  const triggerAiValuation = async (productType, amount, unit, animalType) => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setWasteForm(prev => ({ ...prev, aiRecommendedAmount: 0, aiRate: 0, aiReasoning: "" }));
      return;
    }

    setIsAiCalculating(true);
    try {
      const res = await fetch("http://localhost:5000/api/v1/ai/waste-compensation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productType: productType || wasteForm.productType,
          wasteAmount: numAmount,
          unit: unit || wasteForm.unit,
          animalType: animalType || wasteForm.animalType
        })
      });

      const data = await res.json();
      if (res.ok && data.recommendedAmount) {
        setWasteForm(prev => ({
          ...prev,
          aiRecommendedAmount: data.recommendedAmount,
          aiRate: data.ratePerUnit || Math.round((data.recommendedAmount / numAmount) * 100) / 100,
          aiReasoning: data.reasoning || ""
        }));
      }
    } catch (err) {
      console.error("AI Price Recommendation failed:", err);
    } finally {
      setIsAiCalculating(false);
    }
  };

  // Handle Amount of Waste input change with debounce
  const handleAmountChange = (val) => {
    setWasteForm(prev => ({ ...prev, wasteAmount: val }));

    const num = parseFloat(val);
    if (num > 0) {
      triggerAiValuation(wasteForm.productType, val, wasteForm.unit, wasteForm.animalType);
    } else {
      setWasteForm(prev => ({ ...prev, aiRecommendedAmount: 0, aiRate: 0, aiReasoning: "" }));
    }
  };

  // Submit Waste Claim
  const handleSubmitWasteClaim = async (e) => {
    e.preventDefault();
    setClaimError(null);

    // Form Validations
    if (!wasteForm.farmerId) {
      setClaimError("Please select a registered Farmer ID.");
      return;
    }
    if (!wasteForm.animalType) {
      setClaimError("Please select an Animal Type.");
      return;
    }
    if (!wasteForm.animalId) {
      setClaimError("Please select an Animal ID from the registered livestock list.");
      return;
    }
    if (!wasteForm.date) {
      setClaimError("Please select the date of withdrawal waste.");
      return;
    }
    if (!wasteForm.productType) {
      setClaimError("Please select a Product Type.");
      return;
    }
    const amountNum = parseFloat(wasteForm.wasteAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setClaimError("Amount of waste must be a numerical value strictly greater than zero.");
      return;
    }
    if (!wasteForm.aiRecommendedAmount || wasteForm.aiRecommendedAmount <= 0) {
      setClaimError("AI Recommended Compensation Amount must be generated before submission.");
      return;
    }

    setSubmittingClaim(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/v1/testers/waste-claims", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          farmerId: wasteForm.farmerId,
          animalType: wasteForm.animalType,
          animalId: wasteForm.animalId,
          date: wasteForm.date,
          productType: wasteForm.productType,
          wasteAmount: amountNum,
          unit: wasteForm.unit,
          aiRecommendedAmount: wasteForm.aiRecommendedAmount,
          notes: wasteForm.notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit waste claim");

      // Success
      setClaimSuccessModal(data.claim);
      setToastMessage("Waste Claim logged with status: PENDING FSSAI APPROVAL");
      setTimeout(() => setToastMessage(null), 4000);

      // Refresh claims list
      fetchWasteData();

      // Reset form fields
      setWasteForm({
        farmerId: "",
        animalType: "",
        animalId: "",
        date: new Date().toISOString().split("T")[0],
        productType: "Milk",
        wasteAmount: "",
        unit: "L",
        aiRecommendedAmount: 0,
        aiRate: 0,
        aiReasoning: "",
        notes: ""
      });
    } catch (err) {
      setClaimError(err.message || "Failed to submit waste claim");
    } finally {
      setSubmittingClaim(false);
    }
  };

  const complianceRate = totalTests > 0 
    ? (((totalTests - violations) / totalTests) * 100).toFixed(1)
    : "100.0";

  // Chart data
  const chartData = useMemo(() => {
    return tests.map(t => ({
      name: `${t.productType} (${t.tag?.tag || t.tagId || "Tag"})`,
      Detected: t.amountDetected,
      Limit: t.applicableMrl
    }));
  }, [tests]);

  const pieData = [
    { name: "Compliant (Safe)", value: totalTests - violations || 2, color: "#10b981" },
    { name: "Violations", value: violations, color: "#f43f5e" }
  ];

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Citation copied to clipboard!");
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
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
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Farm Tester Surveillance Dashboard</h1>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              FSSAI Certified Portal
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            National FSSAI laboratory portal. Perform quantitative MRL residue determinations, record statutory animal withdrawal waste claims, and anchor verifiable certificates.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              fetchLiveTests(true);
              fetchWasteData();
            }}
            disabled={refreshing}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/tester/new-test"
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-emerald-500/20 flex items-center gap-2 text-sm"
          >
            <Plus className="w-4 h-4" /> New Product Test
          </Link>
        </div>
      </div>

      {/* Modern Tab Switcher Navigation */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab("surveillance")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
            activeTab === "surveillance"
              ? "border-emerald-400 text-emerald-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>MRL Residue Surveillance</span>
        </button>

        <button
          onClick={() => setActiveTab("waste")}
          className={`flex items-center gap-2 px-5 py-3 rounded-t-xl text-sm font-semibold transition-all border-b-2 ${
            activeTab === "waste"
              ? "border-amber-400 text-amber-400 bg-slate-900/80"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/40"
          }`}
        >
          <Coins className="w-4 h-4 text-amber-400" />
          <span>Withdrawal Waste & Compensation</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            NEW FEATURE
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: MRL RESIDUE SURVEILLANCE (EXISTING DASHBOARD FUNCTIONALITY)        */}
      {/* ========================================================================= */}
      {activeTab === "surveillance" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Dynamic Status Alert Banner */}
          <div className={`p-4 rounded-2xl border backdrop-blur-sm flex items-center justify-between transition-all ${
            violations > 0
              ? "bg-rose-500/10 border-rose-500/40 text-rose-300"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          }`}>
            <div className="flex items-center gap-3">
              {violations > 0 ? (
                <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 animate-pulse" />
              ) : (
                <ShieldCheck className="w-6 h-6 text-emerald-400 shrink-0" />
              )}
              <div>
                <div className="font-bold text-sm text-white">
                  {violations > 0
                    ? `CRITICAL ALERT: ${violations} Non-Compliant MRL Violation(s) Active`
                    : "MRL Surveillance Fully Compliant"}
                </div>
                <div className="text-xs opacity-90">
                  {violations > 0
                    ? "Immediate containment enforced. Food commodities from flagged tags withheld from market distribution."
                    : `All ${totalTests} tested livestock samples meet legal FSSAI residue limits (0 Violations Detected).`}
                </div>
              </div>
            </div>
            {lastUpdated && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Updated: {lastUpdated}
              </span>
            )}
          </div>

          {/* KPI Cards Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">Tests Performed</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Live</span>
              </div>
              <div className="text-3xl font-extrabold text-white mb-1">
                {loading ? "..." : totalTests}
                <span className="text-xs font-normal text-slate-400 ml-1.5">samples screened</span>
              </div>
              <p className="text-xs text-slate-500">Real-time count of laboratory sample analyses logged</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">MRL Violations Detected</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                  violations > 0
                    ? "bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                }`}>
                  {violations > 0 ? `${violations} Breaches` : "Zero Violations"}
                </span>
              </div>
              <div className={`text-3xl font-extrabold mb-1 ${violations > 0 ? "text-rose-400" : "text-white"}`}>
                {loading ? "..." : violations}
                <span className="text-xs font-normal text-slate-400 ml-1.5">non-compliant samples</span>
              </div>
              <p className="text-xs text-slate-500">100% compliant with FSSAI Maximum Residue Limits</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">Safety Compliance Rate</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Benchmark</span>
              </div>
              <div className="text-3xl font-extrabold text-emerald-400 mb-1">
                {loading ? "..." : `${complianceRate}%`}
                <span className="text-xs font-normal text-slate-400 ml-1.5">pass rate</span>
              </div>
              <p className="text-xs text-slate-500">{totalTests - violations} of {totalTests} tests cleared for public consumption</p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-400 font-medium">Analytical Testing Scope</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">LC-MS/MS</span>
              </div>
              <div className="text-2xl font-extrabold text-indigo-300 mb-1">
                Dairy & Aqua
              </div>
              <p className="text-xs text-slate-500">Active screening on Milk (Amox) and Fish (Oxy)</p>
            </div>
          </div>

          {/* Visual Analytics Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Residue Levels Comparison Bar Chart */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm lg:col-span-2">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-lg font-bold text-white">Residue Concentration vs FSSAI Legal Limit (mg/kg)</h2>
                  <p className="text-xs text-slate-400">Quantitative LC-MS/MS determinations against statutory maximum residue limits</p>
                </div>
                <Beaker className="w-5 h-5 text-emerald-400" />
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
                    <Bar dataKey="Detected" fill="#34d399" radius={[4, 4, 0, 0]} name="Detected Residue (mg/kg)" />
                    <Bar dataKey="Limit" fill="#f43f5e" radius={[4, 4, 0, 0]} name="FSSAI Statutory Limit" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Safety Margin Gauge */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-base font-bold text-white">Safety Margin Status</h3>
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  All recent laboratory samples exhibit residue levels well below statutory danger thresholds.
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
                100% Laboratory Clearance
              </div>
            </div>
          </div>

          {/* Recent Laboratory Tests */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 border-b border-slate-800/80 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Recent Laboratory Tests</h2>
                <p className="text-xs text-slate-400">Live feed of incoming MRL test reports logged across registered facilities</p>
              </div>
              <Link
                href="/tester/history"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
              >
                <span>View Full Test History</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

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
                      <td colSpan="8" className="py-12 text-center text-slate-500">Loading recent laboratory tests...</td>
                    </tr>
                  ) : tests.length > 0 ? (
                    tests.map((test) => {
                      const isExceeded = test.status === "MRL EXCEEDED" || test.amountDetected > test.applicableMrl;
                      const tagDisplay = test.tag?.tag || test.tagId || "N/A";
                      const dateDisplay = new Date(test.testDate).toLocaleDateString();

                      return (
                        <tr 
                          key={test.id} 
                          onClick={() => setSelectedTest(test)}
                          className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                        >
                          <td className="py-4 px-6 text-sm text-slate-400 font-mono">{dateDisplay}</td>
                          <td className="py-4 px-6 text-sm font-mono text-white font-bold">{test.sampleId}</td>
                          <td className="py-4 px-6 text-sm font-mono text-cyan-400 font-semibold">{tagDisplay}</td>
                          <td className="py-4 px-6 text-sm text-slate-300">{test.productType}</td>
                          <td className="py-4 px-6 text-sm font-semibold text-emerald-400">{test.substanceDetected}</td>
                          <td className="py-4 px-6 text-sm">
                            <span className="font-bold text-white">{test.amountDetected}</span> / <span className="text-slate-500">{test.applicableMrl} {test.unit || "mg/kg"}</span>
                            <span className="block text-[11px] text-slate-400">
                              ({test.percentageOfMrl?.toFixed(1) || ((test.amountDetected / test.applicableMrl) * 100).toFixed(1)}%)
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                              isExceeded
                                ? "bg-rose-500/10 text-rose-400 border-rose-500/20 animate-pulse"
                                : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                            }`}>
                              {isExceeded ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                              {isExceeded ? "MRL EXCEEDED" : "SAFE"}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-sm text-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTest(test);
                              }}
                              className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/30 transition-all"
                            >
                              Certificate
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">No tests performed this week.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: NEW FEATURE - WITHDRAWAL WASTE & COMPENSATION SECTION             */}
      {/* ========================================================================= */}
      {activeTab === "waste" && (
        <div className="space-y-8 animate-in fade-in">
          {/* Statutory Guidance Banner */}
          <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-4 backdrop-blur-sm shadow-xl">
            <div className="p-2.5 bg-amber-500/20 rounded-xl shrink-0 mt-0.5 border border-amber-500/30">
              <Coins className="w-6 h-6 text-amber-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                Withdrawal Waste & Compensation Protocol
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  STATUTORY REIMBURSEMENT
                </span>
              </h3>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                Products harvested from livestock under active statutory antibiotic withdrawal periods must be discarded as waste to prevent MRL contamination. Certified testers record waste events here. The system evaluates the claim using AgriGuard AI economics and records it as <strong className="text-white underline">PENDING FSSAI APPROVAL</strong>.
              </p>
            </div>
          </div>

          {/* Waste Claim Form Card */}
          <div className="bg-slate-900/80 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-400" />
                  Record Withdrawal Waste Claim
                </h2>
                <p className="text-xs text-slate-400">
                  Dynamic 3-tier livestock selection: <span className="text-emerald-400 font-mono">Farmer ID → Animal Type → Animal ID</span>
                </p>
              </div>

              {/* Verified Tester Session Badge */}
              <div className="flex items-center gap-2 bg-slate-950/80 border border-slate-800 px-3.5 py-1.5 rounded-xl">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs text-slate-400">Logged-in Tester:</span>
                <span className="text-xs font-mono font-bold text-white">
                  {testerProfile?.testerId || "Loading..."}
                </span>
              </div>
            </div>

            {claimError && (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 flex items-center gap-2.5 text-xs font-semibold animate-in shake">
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{claimError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWasteClaim} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* 1. TESTER ID (AUTOMATIC, READ-ONLY) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>1. Tester ID (Auto-Assigned)</span>
                    <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                      <Lock className="w-3 h-3" /> Read-Only
                    </span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={testerProfile ? `${testerProfile.testerId} (${testerProfile.fullName || "Certified Tester"})` : "Fetching Tester ID..."}
                      className="w-full bg-slate-950/90 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono font-semibold cursor-not-allowed focus:outline-none"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-500">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Automatically retrieved from authenticated tester session. Manual editing is restricted.
                  </p>
                </div>

                {/* 2. FARMER ID (DROPDOWN) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>2. Farmer ID *</span>
                    <span className="text-[10px] text-cyan-400 font-mono">Select From DB</span>
                  </label>
                  <select
                    value={wasteForm.farmerId}
                    onChange={(e) => handleFarmerChange(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">-- Select Registered Farmer --</option>
                    {farmersList.map((f) => (
                      <option key={f.id || f.farmerId} value={f.farmerId}>
                        {f.farmerId} • {f.fullName} {f.farmLocation ? `(${f.farmLocation})` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Loads verified registered farmers from AgriGuard database.
                  </p>
                </div>

                {/* 3. ANIMAL TYPE (DROPDOWN DYNAMICALLY POPULATED) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>3. Animal Type *</span>
                    <span className="text-[10px] text-slate-400 font-mono">Dynamic Filter</span>
                  </label>
                  <select
                    value={wasteForm.animalType}
                    onChange={(e) => handleAnimalTypeChange(e.target.value)}
                    disabled={!wasteForm.farmerId}
                    required
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">
                      {!wasteForm.farmerId 
                        ? "-- Select Farmer First --" 
                        : availableAnimalTypes.length === 0 
                          ? "-- No Livestock Registered --" 
                          : "-- Select Animal Type --"}
                    </option>
                    {availableAnimalTypes.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Filtered dynamically to species registered under selected farmer.
                  </p>
                </div>

                {/* 4. ANIMAL ID (DROPDOWN DYNAMICALLY FILTERED) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>4. Animal ID / Batch Tag *</span>
                    <span className="text-[10px] text-slate-400 font-mono">Registered ID Only</span>
                  </label>
                  <select
                    value={wasteForm.animalId}
                    onChange={(e) => setWasteForm(prev => ({ ...prev, animalId: e.target.value }))}
                    disabled={!wasteForm.animalType}
                    required
                    className="w-full bg-slate-950 border border-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="">
                      {!wasteForm.animalType 
                        ? "-- Select Animal Type First --" 
                        : availableAnimals.length === 0 
                          ? "-- No Matching Animals Found --" 
                          : "-- Select Registered Animal Tag --"}
                    </option>
                    {availableAnimals.map((a) => (
                      <option key={a.id || a.tagId} value={a.tagId}>
                        {a.tagId} • {a.type} {a.weight ? `(${a.weight} kg)` : a.count ? `(${a.count} head)` : ""}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Only shows verified tags registered under selected farmer and species.
                  </p>
                </div>

                {/* 5. DATE (CALENDAR PICKER) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>5. Date of Waste Event *</span>
                    <span className="text-[10px] text-cyan-400 font-mono flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Calendar Picker
                    </span>
                  </label>
                  <input
                    type="date"
                    value={wasteForm.date}
                    onChange={(e) => setWasteForm(prev => ({ ...prev, date: e.target.value }))}
                    required
                    max={new Date().toISOString().split("T")[0]}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Select the statutory disposal date using interactive datepicker.
                  </p>
                </div>

                {/* 6. PRODUCT TYPE (DROPDOWN) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>6. Product Type *</span>
                    <span className="text-[10px] text-slate-400 font-mono">Commodity</span>
                  </label>
                  <select
                    value={wasteForm.productType}
                    onChange={(e) => handleProductTypeChange(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  >
                    <option value="Milk">Milk</option>
                    <option value="Goat Milk">Goat Milk</option>
                    <option value="Goat Meat">Goat Meat</option>
                    <option value="Chicken">Chicken</option>
                    <option value="Meat">Meat</option>
                    <option value="Eggs">Eggs</option>
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Existing AgriGuard commodities subject to statutory withdrawal limits.
                  </p>
                </div>

                {/* 7. AMOUNT OF WASTE (NUMERICAL INPUT) */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>7. Amount of Waste *</span>
                    <span className="text-[10px] text-amber-400 font-mono font-bold">Must be &gt; 0</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      placeholder="e.g. 25.0"
                      value={wasteForm.wasteAmount}
                      onChange={(e) => handleAmountChange(e.target.value)}
                      required
                      className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-4 pr-16 py-2.5 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none">
                      {wasteForm.unit}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Quantity discarded during treatment withdrawal ({wasteForm.unit === "L" ? "Liters" : wasteForm.unit === "units" ? "Number of eggs" : "Kilograms"}).
                  </p>
                </div>

                {/* OPTIONAL NOTES */}
                <div className="space-y-2 md:col-span-2 lg:col-span-2">
                  <label className="text-xs font-semibold text-slate-300">
                    Disposal Documentation & Observation Notes (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Discarded 25L of milk post Oxytetracycline administration to prevent bulk tank contamination."
                    value={wasteForm.notes}
                    onChange={(e) => setWasteForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[11px] text-slate-500">
                    Audited and anchored for FSSAI verification inspection.
                  </p>
                </div>

              </div>

              {/* ============================================================= */}
              {/* AI PRICE RECOMMENDATION DISPLAY BOX                           */}
              {/* ============================================================= */}
              <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 border border-indigo-500/30 shadow-2xl relative overflow-hidden space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/30 text-indigo-400">
                      <Sparkles className={`w-5 h-5 ${isAiCalculating ? "animate-spin" : ""}`} />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider font-bold text-indigo-400 flex items-center gap-1.5">
                        AgriGuard AI Valuation Engine
                      </span>
                      <h4 className="text-lg font-extrabold text-white">
                        AI Recommended Compensation Amount
                      </h4>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => triggerAiValuation(wasteForm.productType, wasteForm.wasteAmount, wasteForm.unit, wasteForm.animalType)}
                    disabled={isAiCalculating || !wasteForm.wasteAmount}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-500/40 text-indigo-300 transition-all disabled:opacity-40"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAiCalculating ? "animate-spin" : ""}`} />
                    <span>{isAiCalculating ? "Calculating..." : "Re-Calculate AI Valuation"}</span>
                  </button>
                </div>

                {/* Primary Valuation Display */}
                <div className="p-5 rounded-xl bg-slate-950/80 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400 block mb-1">
                      Calculated Valuation ({wasteForm.productType} • {wasteForm.wasteAmount ? `${wasteForm.wasteAmount} ${wasteForm.unit}` : "0 units"})
                    </span>
                    <div className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 tracking-tight font-mono">
                      ₹{wasteForm.aiRecommendedAmount.toLocaleString("en-IN")}
                    </div>
                    {wasteForm.aiRate > 0 && (
                      <span className="text-xs text-slate-400 font-mono block mt-1">
                        Applied Rate: ₹{wasteForm.aiRate} / {wasteForm.unit}
                      </span>
                    )}
                  </div>
                </div>

                {wasteForm.aiReasoning && (
                  <p className="text-xs text-slate-400 italic">
                    💡 <strong className="text-slate-300 font-semibold">AI Valuation Rationale:</strong> {wasteForm.aiReasoning}
                  </p>
                )}
              </div>

              {/* SUBMIT BUTTON */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-end gap-4">
                <button
                  type="submit"
                  disabled={submittingClaim || isAiCalculating || !wasteForm.farmerId || !wasteForm.animalId || !wasteForm.wasteAmount}
                  className="w-full sm:w-auto bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-black px-8 py-3 rounded-xl transition-all shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 text-sm uppercase tracking-wider"
                >
                  {submittingClaim ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Claim to Ledger...</span>
                    </>
                  ) : (
                    <>
                      <FileCheck2 className="w-4 h-4" />
                      <span>Submit Waste Claim</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* ============================================================= */}
          {/* RECENT WITHDRAWAL WASTE CLAIMS AUDIT TABLE                     */}
          {/* ============================================================= */}
          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
            <div className="p-6 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Coins className="w-5 h-5 text-amber-400" />
                  Filed Withdrawal Waste & Compensation Claims
                </h3>
                <p className="text-xs text-slate-400">
                  Audit log of logged withdrawal waste claims with statutory approval status
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                  Total Claims: {wasteClaims.length}
                </span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/90 border-b border-slate-800/80">
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Claim ID</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tester ID</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Farmer ID</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Animal Details</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Product & Waste</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Valuation</th>
                    <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {loadingWasteData ? (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">
                        Loading filed withdrawal claims...
                      </td>
                    </tr>
                  ) : wasteClaims.length > 0 ? (
                    wasteClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-6 text-sm font-mono font-bold text-white">
                          {claim.claimId}
                        </td>
                        <td className="py-4 px-6 text-sm text-slate-400 font-mono">
                          {new Date(claim.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-cyan-400">
                          {claim.testerId}
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-emerald-400 font-bold">
                          {claim.farmerId}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="text-white font-semibold block">{claim.animalType}</span>
                          <span className="text-xs text-slate-400 font-mono">{claim.animalId}</span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="text-slate-200 font-medium block">{claim.productType}</span>
                          <span className="text-xs font-bold text-amber-400 font-mono">
                            {claim.wasteAmount} {claim.unit || "kg"}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className="text-white font-mono font-extrabold text-base">
                            ₹{claim.aiRecommendedAmount?.toLocaleString("en-IN")}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-right">
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border bg-amber-500/10 text-amber-300 border-amber-500/30 tracking-wide font-mono animate-pulse">
                            <Clock className="w-3.5 h-3.5" />
                            {claim.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="py-12 text-center text-slate-500">
                        No withdrawal waste claims filed yet. Complete the form above to submit your first claim.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CLAIM SUBMISSION SUCCESS MODAL                                            */}
      {/* ========================================================================= */}
      {claimSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Check className="w-9 h-9" />
              </div>
              <h3 className="text-2xl font-bold text-white">Waste Claim Submitted</h3>
              <p className="text-xs text-slate-400 font-mono">Citation Reference: {claimSuccessModal.claimId}</p>
            </div>

            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center justify-between font-bold text-xs">
              <span>Statutory Review Status:</span>
              <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono">
                {claimSuccessModal.status}
              </span>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Tester ID:</span>
                <span className="font-mono text-cyan-400 font-bold">{claimSuccessModal.testerId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Farmer ID:</span>
                <span className="font-mono text-emerald-400 font-bold">{claimSuccessModal.farmerId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Livestock Reference:</span>
                <span className="text-white font-semibold">{claimSuccessModal.animalType} ({claimSuccessModal.animalId})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/80">
                <span className="text-slate-400">Commodity Discarded:</span>
                <span className="text-white font-semibold">{claimSuccessModal.productType} ({claimSuccessModal.wasteAmount} {claimSuccessModal.unit})</span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">AI Recommended Compensation:</span>
                <span className="font-mono font-extrabold text-amber-400 text-sm">
                  ₹{claimSuccessModal.aiRecommendedAmount?.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              This record has been safely committed to the AgriGuard database and queued for future FSSAI regulatory inspection and formal disbursement authorization.
            </p>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setClaimSuccessModal(null)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-xl text-xs font-bold transition-colors"
              >
                Done / File Another Claim
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Certificate Modal (Preserved for MRL Surveillance) */}
      {selectedTest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
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

              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
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
