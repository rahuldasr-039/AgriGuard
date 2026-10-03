"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, ShieldCheck, TrendingUp, Users, Coins, CreditCard, CheckCircle2 } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useLanguage } from "@/context/LanguageContext";

export default function Dashboard() {
  const { t, translateStatus } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      window.location.href = "/login";
      return;
    }
    
    if (role === "FARMER") window.location.href = "/farmer";
    if (role === "VETERINARIAN") window.location.href = "/vet";
    if (role === "FARM_TESTER") window.location.href = "/tester";

    fetch("http://localhost:5000/api/v1/dashboard")
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch dashboard data:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-white">Loading dashboard data...</div>;
  }

  if (!data) {
    return <div className="p-8 text-rose-500">Failed to load dashboard data. Ensure backend is running.</div>;
  }

  const mrlColors = {
    "Compliant": "#10b981", // Emerald 500
    "Violation": "#f43f5e", // Rose 500
  };
  
  const mrlComplianceData = data.mrlCompliance.map(item => ({
    ...item,
    color: mrlColors[item.name] || "#f59e0b"
  }));

  return (
    <div className="p-8 pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">{t("fssaiRegulatorOverview")}</h1>
          <p className="text-slate-400">{t("fssaiOverviewDesc")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/regulator/waste-subsidy"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2 rounded-xl transition-all shadow-lg shadow-emerald-500/20 text-sm"
          >
            <Coins className="w-4 h-4" />
            <span>{t("wasteSubsidyPaymentsLink")}</span>
          </Link>
          <button className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl font-medium transition-colors">
            {t("generateReport")}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title={t("farmsMonitored")} value={data.summary.totalFarms} change="+12%" icon={Users} color="emerald" />
        <StatCard title={t("totalAmuKg")} value={data.summary.totalAmu} change="-5%" icon={Activity} color="cyan" />
        <StatCard title={t("complianceRate")} value={`${data.summary.complianceRate}%`} change="+1.4%" icon={ShieldCheck} color="indigo" />
        <StatCard title={t("criticalAlerts")} value={data.recentAlerts.length} change="Live" icon={AlertTriangle} color="rose" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* AMU Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white">{t("amuTrend6Months")}</h2>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400"><TrendingUp className="w-4 h-4" /> {t("usageTracking")}</span>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.amuTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsage" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#34d399" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis stroke="#64748b" tick={{ fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#34d399' }}
                />
                <Area type="monotone" dataKey="AMU" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorUsage)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MRL Compliance Donut */}
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <h2 className="text-xl font-semibold text-white mb-6">{t("mrlCompliance")}</h2>
          <div className="h-64 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={mrlComplianceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  stroke="none"
                >
                  {mrlComplianceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '0.5rem', color: '#f8fafc' }}
                  itemStyle={{ color: '#f8fafc' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-3xl font-bold text-white">{data.summary.complianceRate}%</span>
              <span className="text-xs text-slate-400">{t("compliant")}</span>
            </div>
          </div>
          <div className="flex flex-col gap-3 mt-4">
            {mrlComplianceData.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-sm text-slate-300">
                    {item.name === "Compliant" ? t("compliant") : item.name === "Violation" ? t("violation") : item.name}
                  </span>
                </div>
                <span className="text-sm font-medium text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Alerts Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">{t("recentAmrAlerts")}</h2>
          <Link href="/alerts" className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors">{t("viewAllAlerts")}</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("citationId") || "Alert ID"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("farmHolding") || "Farm Name"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("severity") || "Violation Type"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("medicineAdministered") || "Substance"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("status") || "Status"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.recentAlerts.map((alert, idx) => (
                <tr key={alert.id || `alert-${idx}`} className="hover:bg-slate-800/50 transition-colors cursor-pointer group">
                  <td className="py-4 px-6 text-sm text-slate-300 font-medium group-hover:text-emerald-400 transition-colors font-mono notranslate" translate="no">{alert.displayId || alert.id}</td>
                  <td className="py-4 px-6 text-sm text-white notranslate" translate="no">{alert.farm}</td>
                  <td className="py-4 px-6 text-sm text-slate-300">{alert.violation}</td>
                  <td className="py-4 px-6 text-sm text-slate-400">{alert.drug}</td>
                  <td className="py-4 px-6 text-sm">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      alert.severity === 'critical' 
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {translateStatus(alert.severity) || alert.severity.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waste & Subsidy Section */}
      <div id="waste-subsidy" className="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm overflow-hidden mb-8">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-white">{t("auditedDbtSubsidies")}</h2>
            <p className="text-xs text-slate-400 mt-1">{t("subsidySubtitle") || "Tester-submitted withdrawal waste and compensation records"}</p>
          </div>
          <Link 
            href="/regulator/waste-subsidy"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition-colors bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20"
          >
            {t("manageTreasuryDisbursal")}
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("tagId") || "Farmer ID"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("productSpecies") || "Product"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t("amountProduced") || "Waste Amount"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t("assessedSubsidy") || "Subsidy Amount"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("paymentProcess") || "Payment Process"}</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">{t("amountReceived") || "Amount Received"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {data.wasteClaims && data.wasteClaims.length > 0 ? (
                data.wasteClaims.map((claim, idx) => {
                  const isPaid = claim.status === "DISBURSED (PAID)" || claim.paymentProcess === "Paid";
                  return (
                    <tr key={claim.id || `claim-${idx}`} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-mono text-white font-bold notranslate" translate="no">{claim.farmerId}</td>
                      <td className="py-4 px-6 text-sm text-slate-200">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800 text-xs text-slate-300">
                          {claim.product || claim.productType}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-amber-400 font-medium font-mono text-right">{claim.wasteAmount || claim.amount}</td>
                      <td className="py-4 px-6 text-sm font-semibold text-emerald-400 font-mono text-right">{claim.subsidyAmount || claim.subsidy}</td>
                      <td className="py-4 px-6 text-sm">
                        {isPaid ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                            <CheckCircle2 className="w-3.5 h-3.5" /> {translateStatus("disbursed") || "Paid"}
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center text-xs font-medium text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 font-mono">
                              {translateStatus("pending") || "Pending"}
                            </span>
                            <Link 
                              href="/regulator/waste-subsidy"
                              className="inline-flex items-center gap-1 text-xs font-bold text-slate-950 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 px-2.5 py-1 rounded-lg transition-all shadow-sm"
                            >
                              <CreditCard className="w-3 h-3" /> {t("directAccountCredit") || "Pay Subsidy"}
                            </Link>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6 text-sm font-mono font-bold text-right">
                        {isPaid ? (
                          <span className="text-emerald-400">{claim.amountReceived || claim.subsidyAmount || claim.subsidy}</span>
                        ) : (
                          <span className="text-slate-500">₹0</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500 text-sm">
                    {t("noClaimsMatch") || "No waste & subsidy records submitted yet."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, change, icon: Icon, color }) {
  const colorMap = {
    emerald: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    cyan: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    indigo: "text-indigo-400 bg-indigo-400/10 border-indigo-400/20",
    rose: "text-rose-400 bg-rose-400/10 border-rose-400/20",
  };

  const isPositive = change.startsWith("+");
  const changeColor = isPositive && color !== 'rose' ? "text-emerald-400" : (color === 'rose' && isPositive ? "text-rose-400" : "text-emerald-400"); // simplstic coloring

  return (
    <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm relative overflow-hidden group">
      <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform translate-x-4 -translate-y-4`}>
        <Icon className={`w-24 h-24 ${colorMap[color].split(' ')[0]}`} />
      </div>
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className={`p-3 rounded-lg border ${colorMap[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <div className="relative z-10">
        <h3 className="text-slate-400 text-sm font-medium mb-1">{title}</h3>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-white">{value}</span>
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-slate-800 ${
            change.startsWith("+") && color === 'rose' ? 'text-rose-400' :
            change.startsWith("-") && color === 'cyan' ? 'text-emerald-400' :
            change.startsWith("+") ? 'text-emerald-400' : 'text-rose-400'
          }`}>
            {change}
          </span>
        </div>
      </div>
    </div>
  );
}
