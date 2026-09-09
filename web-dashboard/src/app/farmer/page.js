"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Activity, AlertTriangle, ShieldCheck, 
  Calendar, ArrowRight, Sparkles, Clock, CheckCircle2,
  Syringe, Pill, RefreshCw, BarChart3, ChevronRight, FileText,
  Shield, Check, Coins, ExternalLink
} from "lucide-react";
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from "recharts";

export default function FarmerDashboard() {
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [treatments, setTreatments] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [wasteClaims, setWasteClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [switching, setSwitching] = useState(false);

  const goToPortal = async (targetRole, targetPath) => {
    setSwitching(true);
    let email = "fssaigovt@gmail.com";
    let password = "Fssai@123";
    if (targetRole === "VETERINARIAN") {
      email = "vet1@example.com";
      password = "Password@123";
    } else if (targetRole === "FARM_TESTER") {
      email = "tester1@example.com";
      password = "Password@123";
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", data.user.role);
        if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
        window.location.href = targetPath;
      }
    } catch (e) {
      console.error(e);
      window.location.href = targetPath;
    } finally {
      setSwitching(false);
    }
  };

  const loadData = () => {
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

    Promise.all([
      fetch("http://localhost:5000/api/v1/farmers/my-profile", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
      fetch("http://localhost:5000/api/v1/treatments/my-treatments", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
      fetch("http://localhost:5000/api/v1/treatments/my-withdrawals", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
      fetch("http://localhost:5000/api/v1/testers/waste-claims").then(r => r.json()).catch(() => [])
    ])
    .then(([profData, treatData, withData, claimsData]) => {
      setProfile(profData);
      setTreatments(Array.isArray(treatData) ? treatData : []);
      setWithdrawals(Array.isArray(withData) ? withData : []);
      setWasteClaims(Array.isArray(claimsData) ? claimsData : []);
      setLastRefreshed(new Date());
      setLoading(false);
    })
    .catch((err) => {
      console.error("Failed to load dashboard data:", err);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [router]);

  // Aggregate Stats
  const { totalLivestock, animalList, categoryCounts } = useMemo(() => {
    let total = 0;
    const list = [];
    const counts = {};

    if (profile && profile.farms) {
      profile.farms.forEach(farm => {
        if (farm.animals) {
          farm.animals.forEach(a => {
            total += 1;
            list.push({ ...a, count: 1, isBatch: false });
            counts[a.category] = (counts[a.category] || 0) + 1;
          });
        }
        if (farm.batches) {
          farm.batches.forEach(b => {
            total += (b.count || 0);
            list.push({ ...b, isBatch: true });
            counts[b.category] = (counts[b.category] || 0) + (b.count || 0);
          });
        }
      });
    }

    return { totalLivestock: total, animalList: list, categoryCounts: counts };
  }, [profile]);

  // Animals currently under withdrawal
  const quarantinedAnimals = useMemo(() => {
    return animalList.filter(a => a.status === "WITHDRAWAL");
  }, [animalList]);

  const activeWithdrawalCount = withdrawals.filter(w => w.status === "WAIT").length;
  const safeCount = Math.max(0, totalLivestock - quarantinedAnimals.reduce((acc, a) => acc + (a.count || 1), 0));

  // Pie chart data
  const pieData = useMemo(() => {
    const palette = ["#06b6d4", "#eab308", "#10b981", "#8b5cf6", "#f97316", "#ec4899", "#3b82f6"];
    return Object.keys(categoryCounts).map((cat, i) => ({
      name: cat,
      value: categoryCounts[cat],
      color: palette[i % palette.length]
    }));
  }, [categoryCounts]);

  // Bar chart data for Health / Safety
  const barData = useMemo(() => {
    const categories = Object.keys(categoryCounts);
    return categories.map(cat => {
      const inCat = animalList.filter(a => a.category === cat);
      const underW = inCat.filter(a => a.status === "WITHDRAWAL").reduce((sum, a) => sum + (a.count || 1), 0);
      const safe = inCat.filter(a => a.status !== "WITHDRAWAL").reduce((sum, a) => sum + (a.count || 1), 0);
      return {
        category: cat,
        "Market Safe": safe,
        "In Withdrawal": underW
      };
    });
  }, [categoryCounts, animalList]);

  // Farmer's DBT Waste & Subsidy Claims
  const myWasteClaims = useMemo(() => {
    const fId = profile?.farmerId || "FR10293";
    return wasteClaims.filter(c => c.farmerId === fId || !c.farmerId);
  }, [wasteClaims, profile]);

  const totalDbtReceived = useMemo(() => {
    return myWasteClaims
      .filter(c => c.status === "DISBURSED (PAID)")
      .reduce((sum, c) => sum + (c.aiRecommendedAmount || 0), 0);
  }, [myWasteClaims]);

  const totalDbtPending = useMemo(() => {
    return myWasteClaims
      .filter(c => c.status !== "DISBURSED (PAID)")
      .reduce((sum, c) => sum + (c.aiRecommendedAmount || 0), 0);
  }, [myWasteClaims]);

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-slate-800 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Live Farm Telemetry
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                FSSAI Reg: {profile?.farmerId || "FR10293"}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                Sepolia Smart Contract Synced
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">{profile?.fullName || "Rajesh Kumar"}</span>! 🌾
            </h1>
            <p className="text-slate-400 mt-2 text-sm sm:text-base max-w-2xl">
              Farm 3 overview: Real-time livestock herd inventory, AMU prescription monitoring, and statutory withdrawal period tracking.
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
              <span>🩺 Designated Vet: <strong className="text-slate-200">{profile?.assignedVet?.fullName || "Dr. Suresh Kumar"} ({profile?.assignedVet?.vetId || "VT92A7K1"})</strong></span>
              <span>📍 {profile?.farmLocation || "District 1, State"}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-all flex items-center gap-2 text-xs font-medium"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4 text-cyan-400" />
              <span>Sync</span>
            </button>
            <Link
              href="/farmer/animals"
              className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-5 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-emerald-500/20 text-sm flex items-center gap-2"
            >
              <Users className="w-4 h-4" /> Manage Herd
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Launch Banner to Updated Modules */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-emerald-500/30 rounded-2xl p-5 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Direct Module Shortcuts</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                LIVE & UPDATED
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Jump directly to the newly enhanced FSSAI Payment Monitoring Area or Veterinarian Medicine Module
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => goToPortal("REGULATOR", "/regulator/waste-subsidy")}
            disabled={switching}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-500 text-emerald-300 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/5"
          >
            <span>🛡️ Open FSSAI Payment Area</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => goToPortal("VETERINARIAN", "/vet/medicine")}
            disabled={switching}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 hover:border-cyan-500 text-cyan-300 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/5"
          >
            <span>🩺 Open Vet Medicine Area</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Animals */}
        <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 backdrop-blur-sm transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded">All Stock</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Total Animals Managed</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{loading ? "..." : totalLivestock}</span>
            <span className="text-xs text-slate-500">head</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            {profile?.farms?.[0]?.animals?.length || 9} Individual + {totalLivestock - (profile?.farms?.[0]?.animals?.length || 9)} Batch (Fish & Poultry)
          </p>
        </div>

        {/* Quarantined Animals in Active Withdrawal */}
        <div className={`border rounded-2xl p-6 backdrop-blur-sm transition-all ${
          quarantinedAnimals.length > 0 
            ? "bg-amber-500/5 border-amber-500/40 shadow-lg shadow-amber-500/5" 
            : "bg-slate-900/60 border-slate-800/80"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded font-bold animate-pulse">
              Restricted
            </span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Under Active Withdrawal</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-400">{loading ? "..." : quarantinedAnimals.length}</span>
            <span className="text-xs text-amber-300/80">animals quarantined</span>
          </div>
          <p className="text-xs text-amber-300/90 mt-2 font-medium">
            {quarantinedAnimals.length > 0 
              ? `Tags: ${quarantinedAnimals.map(a => a.tag?.tag || a.tag).join(", ")} (Milk/Meat Hold)` 
              : "All animals currently clear"}
          </p>
        </div>

        {/* Market Ready Animals */}
        <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 backdrop-blur-sm transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded">FSSAI Safe</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Market Ready (Safe)</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400">{loading ? "..." : safeCount}</span>
            <span className="text-xs text-slate-500">compliant stock</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Food products (milk, eggs, meat, fish) safe for harvest & sale
          </p>
        </div>

        {/* Active Treatments */}
        <div className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-6 backdrop-blur-sm transition-all group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <Activity className="w-6 h-6" />
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-400/10 px-2 py-0.5 rounded">Rx Active</span>
          </div>
          <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">Active Prescriptions</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{loading ? "..." : treatments.filter(t => t.status === "Active").length}</span>
            <span className="text-xs text-slate-500">courses</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">
            Prescribed and monitored by Dr. Suresh Kumar
          </p>
        </div>
      </div>

      {/* Critical Withdrawal Alert Banner if any quarantined */}
      {quarantinedAnimals.length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-6 shadow-xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-1">
                <AlertTriangle className="w-7 h-7 animate-bounce" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">
                    Statutory Food Safety Quarantine in Effect
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {activeWithdrawalCount} Active Regimens
                  </span>
                </div>
                <p className="text-sm text-slate-300">
                  <strong className="text-amber-300">{quarantinedAnimals.map(a => `${a.category} (${a.tag?.tag || a.tag})`).join(", ")}</strong> are currently under statutory veterinary withdrawal. Do not sell or consume milk or meat from these animals until certified safe.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Earliest Clearance: <strong className="text-emerald-400 ml-1">08/09/2026</strong> (Amoxicillin)
                  </span>
                  <span className="text-slate-400 flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-lg border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    Full Clearance: <strong className="text-emerald-400 ml-1">09/09/2026</strong> (Oxytetracycline)
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/farmer/withdrawals"
              className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 shadow-lg shadow-amber-500/20"
            >
              <span>View Withdrawal Calendar</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}

      {/* Visual Charts & Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Livestock Species Distribution */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Herd Breakdown by Species</h2>
              <p className="text-xs text-slate-400">Total volume of individual livestock and managed batches</p>
            </div>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
            <div className="h-56 w-full flex items-center justify-center">
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
                    formatter={(val) => [`${val} animals`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300 font-medium">{item.name}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{item.value} head</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Compliance Status Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">Food Safety Clearance Status</h2>
              <p className="text-xs text-slate-400">Market-safe versus restricted animals per category</p>
            </div>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.75rem', color: '#f8fafc' }}
                />
                <Bar dataKey="Market Safe" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="In Withdrawal" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
              <span className="text-slate-300">Market Safe to Sell</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">In Withdrawal (Do Not Sell)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link 
          href="/farmer/animals"
          className="group p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-emerald-300 transition-colors">Animal & Batch Roster</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Register new animals, view individual RFID tags, and inspect medical quarantine states.
          </p>
        </Link>

        <Link 
          href="/farmer/withdrawals"
          className="group p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <Calendar className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-amber-300 transition-colors">Withdrawal Calendar</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Monitor daily countdowns for milk, meat, and egg clearance to avoid regulatory penalties.
          </p>
        </Link>

        <Link 
          href="/farmer/treatments"
          className="group p-6 rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:shadow-xl hover:shadow-cyan-500/5 transition-all"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
              <Pill className="w-6 h-6" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1 group-hover:text-cyan-300 transition-colors">Veterinary Treatments</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            Complete audit trail of antimicrobial doses, vaccines, and veterinarian prescription notes.
          </p>
        </Link>
      </div>

      {/* Direct Benefit Transfer (DBT) & Waste Subsidy Compensation - Strict 6 Columns */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="p-6 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white">Direct Benefit Transfer (DBT) & Waste Subsidies</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                FSSAI Regulated
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Statutory compensation claims for discards under veterinary withdrawal periods (Goat Meat, Milk, Chicken)
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Total Paid to Account</span>
              <span className="text-base font-extrabold text-emerald-400 font-mono">₹{totalDbtReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right border-l border-slate-800 pl-4">
              <span className="text-[11px] uppercase tracking-wider text-slate-400 block font-semibold">Pending Approval</span>
              <span className="text-base font-extrabold text-amber-400 font-mono">₹{totalDbtPending.toLocaleString('en-IN')}</span>
            </div>
            <Link
              href="/farmer/subsidies"
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-emerald-500/20"
            >
              <Coins className="w-4 h-4" />
              <span>Full Subsidy Ledger & Receipts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/80 border-b border-slate-800 text-xs font-bold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-6">Farmer ID</th>
                <th className="py-3 px-6">Date Produced</th>
                <th className="py-3 px-6">Product & Tag</th>
                <th className="py-3 px-6">Amount Produced</th>
                <th className="py-3 px-6">Subsidy Amount</th>
                <th className="py-3 px-6">Payment Process</th>
                <th className="py-3 px-6">Amount Received</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">Loading subsidy records...</td>
                </tr>
              ) : myWasteClaims.length > 0 ? (
                myWasteClaims.map((claim) => {
                  const isPaid = claim.status === "DISBURSED (PAID)";
                  const formattedDate = claim.date 
                    ? new Date(claim.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "09 Sep 2026";
                  return (
                    <tr key={claim.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* 1. Farmer ID */}
                      <td className="py-3.5 px-6 font-mono font-medium text-slate-200">
                        {claim.farmerId || profile?.farmerId || "FR10293"}
                      </td>
                      {/* 2. Date Produced */}
                      <td className="py-3.5 px-6 text-slate-300 text-xs font-medium">
                        {formattedDate}
                      </td>
                      {/* 3. Product & Tag */}
                      <td className="py-3.5 px-6">
                        <div className="font-semibold text-white">{claim.productType || claim.animalType}</div>
                        <div className="text-xs text-slate-400 font-mono">
                          {claim.animalType} ({claim.animalId})
                        </div>
                      </td>
                      {/* 4. Amount Produced */}
                      <td className="py-3.5 px-6 text-slate-200 font-mono font-bold">
                        {claim.wasteAmount} {claim.unit || "kg"}
                      </td>
                      {/* 5. Subsidy Amount */}
                      <td className="py-3.5 px-6 font-mono font-bold text-amber-300">
                        ₹{(claim.aiRecommendedAmount || 0).toLocaleString('en-IN')}
                      </td>
                      {/* 6. Payment Process */}
                      <td className="py-3.5 px-6">
                        {isPaid ? (
                          <div>
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-400" />
                              DISBURSED (PAID)
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-400" />
                            PENDING FSSAI APPROVAL
                          </span>
                        )}
                      </td>
                      {/* 7. Amount Received */}
                      <td className="py-3.5 px-6 font-mono font-extrabold text-emerald-400">
                        {isPaid ? `₹${(claim.aiRecommendedAmount || 0).toLocaleString('en-IN')}` : "₹0 (Pending)"}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">No waste claims submitted yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Veterinary Interventions Feed */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">Recent Veterinary Treatments & Injections</h2>
            <p className="text-xs text-slate-400 mt-0.5">Administered by certified veterinarians and anchored on blockchain</p>
          </div>
          <Link
            href="/farmer/treatments"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            View All History &rarr;
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Date</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Target Animal / Tag</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Medicine / Vaccine</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Veterinarian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">Loading recent records...</td>
                </tr>
              ) : treatments.length > 0 ? (
                treatments.slice(0, 5).map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 text-sm text-slate-400">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-6 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        {t.type === "Medicine" ? <Pill className="w-3.5 h-3.5 text-cyan-400" /> : <Syringe className="w-3.5 h-3.5 text-emerald-400" />}
                        {t.type}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-sm">
                      <div className="text-white font-medium">{t.animal}</div>
                      <div className="text-xs text-slate-500 font-mono">{t.tag}</div>
                    </td>
                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-200">{t.medicine}</td>
                    <td className="py-3.5 px-6 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        t.status === 'Active' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {t.status === 'Active' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">{t.vet}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">No treatments recorded recently.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
