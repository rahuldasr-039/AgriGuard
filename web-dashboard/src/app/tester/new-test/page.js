"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Beaker, ShieldCheck, AlertTriangle, CheckCircle2, Info, 
  FlaskConical, Sparkles, ArrowRight, RotateCcw, Copy, QrCode, FileText
} from "lucide-react";
import Link from "next/link";

export default function NewProductTest() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    tagId: "RJ-CW1",
    productType: "Milk",
    sampleId: `SMP-${Math.floor(100000 + Math.random() * 900000)}`,
    sampleCollectionDate: "2026-09-03",
    testingLocation: "National Food Safety Lab",
    substanceDetected: "Amoxicillin",
    amountDetected: "0.002",
    unit: "mg/kg",
    testMethod: "LC-MS/MS"
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "FARM_TESTER") {
      router.push("/login");
    }
  }, [router]);

  // Substance library for quick limits
  const substanceLibrary = {
    "Amoxicillin": { limit: 0.004, unit: "mg/kg", matrix: "Milk" },
    "Oxytetracycline": { limit: 0.1, unit: "mg/kg", matrix: "Milk" },
    "Florfenicol": { limit: 0.2, unit: "mg/kg", matrix: "Meat" },
    "Enrofloxacin": { limit: 0.1, unit: "mg/kg", matrix: "Meat" },
    "Ivermectin": { limit: 0.01, unit: "mg/kg", matrix: "Meat" },
    "Ciprofloxacin": { limit: 0.05, unit: "mg/kg", matrix: "Eggs" }
  };

  const currentLimit = substanceLibrary[formData.substanceDetected]?.limit || 0.004;
  const currentAmount = parseFloat(formData.amountDetected) || 0;
  const percentageOfLimit = currentLimit > 0 ? ((currentAmount / currentLimit) * 100).toFixed(1) : 0;
  const isViolation = currentAmount > currentLimit;

  // Preset tag picker
  const tagPresets = [
    { tag: "RJ-CW1", label: "🐄 Cow (RJ-CW1) • Milk", product: "Milk", substance: "Amoxicillin", defaultAmt: "0.002" },
    { tag: "RJ-CW2", label: "🐄 Cow (RJ-CW2) • Milk", product: "Milk", substance: "Amoxicillin", defaultAmt: "0.001" },
    { tag: "RJ-FS-B1", label: "🐟 Fish (RJ-FS-B1) • Aquaculture", product: "Fish", substance: "Oxytetracycline", defaultAmt: "0.05" },
    { tag: "RJ-CH-B1", label: "🐔 Poultry (RJ-CH-B1) • Meat", product: "Meat", substance: "Florfenicol", defaultAmt: "0.08" }
  ];

  const applyTagPreset = (p) => {
    setFormData(prev => ({
      ...prev,
      tagId: p.tag,
      productType: p.product,
      substanceDetected: p.substance,
      amountDetected: p.defaultAmt
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setResult(null);

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/v1/product-tests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          amountDetected: parseFloat(formData.amountDetected)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit test");

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyHash = (hash) => {
    navigator.clipboard.writeText(hash);
    setToastMessage("Transaction hash copied!");
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
      <div>
        <div className="flex items-center gap-3 mb-2">
          <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">New Product Sample MRL Test</h1>
          <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            FSSAI Certified Testing Lab
          </span>
        </div>
        <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
          Perform deterministic laboratory residue analysis, compare against statutory MRL limits, and anchor immutable blockchain credentials.
        </p>
      </div>

      {result ? (
        /* Post Submission Certificate Screen */
        <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 rounded-2xl p-8 backdrop-blur-md shadow-2xl space-y-6 animate-in zoom-in-95">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>
            <h2 className="text-2xl font-bold text-white">Laboratory MRL Test Certified</h2>
            <p className="text-xs text-slate-400 font-mono">Sample Citation ID: {result.testResult.sampleId}</p>
          </div>

          <div className={`p-4 rounded-xl border ${
            result.testResult.status === "SAFE"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
              : "bg-rose-500/10 border-rose-500/30 text-rose-300"
          }`}>
            <div className="flex items-center justify-between font-bold text-sm">
              <span>Compliance Determination</span>
              <span className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                result.testResult.status === "SAFE" ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
              }`}>
                {result.testResult.status}
              </span>
            </div>
          </div>

          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block mb-1">Animal / Batch Tag</span>
              <strong className="text-cyan-400 font-mono text-sm">{formData.tagId}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Matrix Tested</span>
              <strong className="text-white text-sm">{result.testResult.productType}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Active Substance</span>
              <strong className="text-emerald-400 text-sm">{result.testResult.substanceDetected}</strong>
            </div>
            <div>
              <span className="text-slate-500 block mb-1">Quantitative Residue</span>
              <strong className="text-white text-sm font-mono">{result.testResult.amountDetected} / {result.testResult.applicableMrl} mg/kg</strong>
            </div>
          </div>

          {result.blockchain && (
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span className="text-white font-semibold">Sepolia Smart Contract Anchored</span>
              </div>
              <button
                onClick={() => copyHash(result.blockchain.transactionHash)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-[11px] flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Copy Hash
              </button>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => {
                setResult(null);
                setFormData(prev => ({
                  ...prev,
                  sampleId: `SMP-${Math.floor(100000 + Math.random() * 900000)}`,
                  amountDetected: "0.002"
                }));
              }}
              className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Log Another Sample
            </button>
            <Link
              href="/tester"
              className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
            >
              Return to Dashboard <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        /* Split-Screen Interactive Form Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Form (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-800/80 pb-4">
              <div>
                <h2 className="text-lg font-bold text-white">Laboratory Sample Intake</h2>
                <p className="text-xs text-slate-400">Enter quantitative analytical test parameters</p>
              </div>
              <span className="font-mono text-xs text-cyan-400 font-bold bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                {formData.sampleId}
              </span>
            </div>

            {/* Quick Tag Selector Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Quick Livestock Presets
              </label>
              <div className="grid grid-cols-2 gap-2">
                {tagPresets.map((p) => (
                  <button
                    key={p.tag}
                    type="button"
                    onClick={() => applyTagPreset(p)}
                    className={`p-2 rounded-xl text-left text-xs transition-all border ${
                      formData.tagId === p.tag
                        ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300"
                        : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    <div className="font-bold text-white">{p.label}</div>
                    <div className="text-[10px] text-slate-500">{p.substance} ({p.defaultAmt} mg/kg)</div>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Animal / Batch Tag ID
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.tagId}
                    onChange={(e) => setFormData({ ...formData, tagId: e.target.value })}
                    placeholder="e.g. RJ-CW1"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Product Matrix
                  </label>
                  <select
                    value={formData.productType}
                    onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Milk">Milk (Dairy)</option>
                    <option value="Fish">Fish (Aquaculture)</option>
                    <option value="Meat">Meat (Bovine / Porcine / Poultry)</option>
                    <option value="Eggs">Eggs (Poultry)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Substance / Drug Detected
                  </label>
                  <select
                    value={formData.substanceDetected}
                    onChange={(e) => setFormData({ ...formData, substanceDetected: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Amoxicillin">Amoxicillin (MRL: 0.004 mg/kg)</option>
                    <option value="Oxytetracycline">Oxytetracycline (MRL: 0.1 mg/kg)</option>
                    <option value="Florfenicol">Florfenicol (MRL: 0.2 mg/kg)</option>
                    <option value="Enrofloxacin">Enrofloxacin (MRL: 0.1 mg/kg)</option>
                    <option value="Ivermectin">Ivermectin (MRL: 0.01 mg/kg)</option>
                    <option value="Ciprofloxacin">Ciprofloxacin (MRL: 0.05 mg/kg)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Quantitative Amount Detected (mg/kg)
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={formData.amountDetected}
                    onChange={(e) => setFormData({ ...formData, amountDetected: e.target.value })}
                    placeholder="e.g. 0.002"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Analytical Method
                  </label>
                  <select
                    value={formData.testMethod}
                    onChange={(e) => setFormData({ ...formData, testMethod: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="LC-MS/MS">LC-MS/MS (Liquid Chromatography)</option>
                    <option value="ELISA">ELISA Quantitative Immunoassay</option>
                    <option value="Rapid Strip">Rapid Receptor Strip Assay</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Testing Facility
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.testingLocation}
                    onChange={(e) => setFormData({ ...formData, testingLocation: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Beaker className="w-4 h-4" />
                {submitting ? "Analyzing & Generating Proof..." : "Submit Sample for MRL Verification"}
              </button>
            </form>
          </div>

          {/* Right Live MRL Radar (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <div className="flex items-center gap-2 text-white font-bold text-base border-b border-slate-800/80 pb-3">
              <FlaskConical className="w-5 h-5 text-cyan-400" />
              <span>Real-Time MRL Regulatory Radar</span>
            </div>

            {/* Dynamic Status Display */}
            <div className={`p-4 rounded-xl border ${
              isViolation
                ? "bg-rose-500/10 border-rose-500/30 text-rose-300 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
            }`}>
              <div className="flex items-center gap-2.5 mb-1 font-bold text-sm">
                {isViolation ? <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" /> : <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />}
                <span>{isViolation ? "CRITICAL MRL BREACH" : "STATUTORY COMPLIANCE: PASS"}</span>
              </div>
              <p className="text-[11px] opacity-90">
                {isViolation
                  ? `Residue exceeds legal FSSAI limit of ${currentLimit} mg/kg. Section 31 quarantine trigger active.`
                  : `Residue concentration is within permissible legal FSSAI limits (${percentageOfLimit}% of MRL).`}
              </p>
            </div>

            {/* Progress Gauge */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400">Residue Concentration Gauge</span>
                <span className={`font-mono font-bold ${isViolation ? "text-rose-400" : "text-emerald-400"}`}>
                  {percentageOfLimit}% of Legal MRL
                </span>
              </div>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div 
                  className={`h-full transition-all duration-500 ${
                    isViolation ? "bg-rose-500" : (percentageOfLimit > 70 ? "bg-amber-500" : "bg-emerald-500")
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, percentageOfLimit))}%` }}
                />
              </div>
            </div>

            {/* Analytical Metadata */}
            <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Legal Benchmark</span>
                <strong className="text-white font-mono">{currentLimit} mg/kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Detected Concentration</span>
                <strong className="text-cyan-400 font-mono">{currentAmount} mg/kg</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Regulatory Standard</span>
                <span className="text-slate-300">FSSAI Contaminants Ver 2024.1</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Target Species</span>
                <span className="text-slate-300">Livestock Holding</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Cryptographic analytical receipt will be anchored to Sepolia blockchain upon test submission.</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
