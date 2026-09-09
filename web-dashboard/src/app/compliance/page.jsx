"use client";

import { FileText, Award, ShieldCheck, TrendingUp, CheckCircle2 } from "lucide-react";

export default function CompliancePage() {
  const regions = [
    { name: "North Zone (Punjab / Haryana)", farms: 450, compliance: 96.4, status: "Grade A", violations: 4 },
    { name: "South Zone (Tamil Nadu / Karnataka)", farms: 380, compliance: 98.1, status: "Grade A+", violations: 1 },
    { name: "West Zone (Maharashtra / Gujarat)", farms: 520, compliance: 91.2, status: "Grade B", violations: 18 },
    { name: "East Zone (West Bengal / Odisha)", farms: 290, compliance: 94.8, status: "Grade A", violations: 7 },
  ];

  return (
    <div className="p-8 pb-20 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            FSSAI Regulatory Compliance Audits
          </h1>
          <p className="text-slate-400 mt-1">National AMR containment benchmarks and state-wise compliance scorecards.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <Award className="w-6 h-6" />
            <h3 className="text-slate-400 font-medium text-sm">National Compliance Score</h3>
          </div>
          <div className="text-3xl font-bold text-white">95.2%</div>
          <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +2.8% Improvement vs Q1
          </p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-cyan-400 mb-2">
            <ShieldCheck className="w-6 h-6" />
            <h3 className="text-slate-400 font-medium text-sm">Audited Livestock Facilities</h3>
          </div>
          <div className="text-3xl font-bold text-white">1,640</div>
          <p className="text-xs text-slate-400 mt-2">100% On-chain Verified</p>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-indigo-400 mb-2">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-slate-400 font-medium text-sm">MRL Pass Rate</h3>
          </div>
          <div className="text-3xl font-bold text-white">97.6%</div>
          <p className="text-xs text-emerald-400 mt-2">Complies with Codex Alimentarius</p>
        </div>
      </div>

      {/* Regional Table */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl backdrop-blur-sm overflow-hidden">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-lg font-semibold text-white">Regional Compliance Breakdown</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Region / Zone</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Registered Farms</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Active Violations</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Compliance Score</th>
                <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase">Rating</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {regions.map((r, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-4 px-6 text-sm font-medium text-white">{r.name}</td>
                  <td className="py-4 px-6 text-sm text-slate-300">{r.farms}</td>
                  <td className="py-4 px-6 text-sm text-rose-400 font-medium">{r.violations}</td>
                  <td className="py-4 px-6 text-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-800 rounded-full h-2">
                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${r.compliance}%` }}></div>
                      </div>
                      <span className="text-white font-medium">{r.compliance}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm">
                    <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
