"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, AlertTriangle, XCircle, CheckCircle2, 
  Award, Building2, Calendar, Sparkles, QrCode, 
  ArrowUpRight, ExternalLink, RefreshCw, Check, Lock
} from "lucide-react";
import Link from "next/link";

const API_BASE = typeof window !== "undefined"
  ? (process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:5000/api/v1`)
  : "http://localhost:5000/api/v1";

export default function PublicVerifyPage() {
  const params = useParams();
  const verificationId = params?.verificationId;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!verificationId) return;

    const verifyCode = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${API_BASE}/certificates/verify/${verificationId}`);
        const json = await res.json();
        if (res.status === 404 || json.notFound) {
          setNotFound(true);
        } else {
          setData(json);
        }
      } catch (err) {
        console.error("Verification fetch error:", err);
        setError("Unable to connect to verification authority. Ensure backend network is online.");
      } finally {
        setLoading(false);
      }
    };

    verifyCode();
  }, [verificationId]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-emerald-500 selection:text-black">
      {/* Top Banner */}
      <header className="max-w-3xl mx-auto w-full flex items-center justify-between border-b border-slate-800/80 pb-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-400 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
          <div>
            <h1 className="font-black text-lg text-white tracking-tight">AgriGuard</h1>
            <p className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider">Public Verification Ledger</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>FSSAI National Registry</span>
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-xl mx-auto w-full my-auto">
        {loading ? (
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-10 text-center space-y-4 shadow-2xl">
            <RefreshCw className="w-10 h-10 animate-spin mx-auto text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Verifying Certificate Credentials...</h2>
            <p className="text-xs text-slate-400 font-mono">Querying ID: {verificationId}</p>
          </div>
        ) : notFound ? (
          <div className="bg-slate-900/90 border-2 border-rose-500/40 rounded-3xl p-8 sm:p-10 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
              <XCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <span className="text-[11px] font-black uppercase tracking-widest text-rose-400">Security Warning</span>
              <h2 className="text-2xl font-black text-white">INVALID CERTIFICATE</h2>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No official FSSAI certification record corresponds to verification ID <span className="font-mono text-rose-300 font-bold">{verificationId}</span>.
              </p>
            </div>
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400">
              This code could be counterfeit or expired. Do not accept produce under this label without official verification.
            </div>
          </div>
        ) : error ? (
          <div className="bg-slate-900 border border-amber-500/30 rounded-3xl p-8 text-center space-y-3">
            <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="text-base font-bold text-white">Connection Error</h3>
            <p className="text-xs text-slate-400">{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 1. VALID & SAFE CERTIFICATE */}
            {data.valid && data.status === "SAFE" && (
              <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-emerald-950/40 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
                {/* Header Badge */}
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
                    <ShieldCheck className="w-9 h-9" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    ✓ VERIFIED MRL SAFE
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                    VALID DIGITAL CERTIFICATE
                  </h2>
                  <p className="text-xs text-slate-400">
                    Officially inspected and authenticated under FSSAI statutory standards
                  </p>
                </div>

                {/* Verified Details Grid */}
                <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800/80 divide-y divide-slate-800/60 text-xs space-y-3">
                  <div className="flex justify-between items-center pb-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Certificate ID</span>
                    <span className="font-mono font-bold text-white text-sm">{data.certificateId}</span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Certified Farmer</span>
                    <div className="text-right">
                      <p className="font-bold text-white text-sm">{data.farmerName}</p>
                      <p className="font-mono text-emerald-400 text-xs">{data.farmerId}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Farm / Facility</span>
                    <div className="text-right">
                      <p className="font-semibold text-slate-200">{data.farmName}</p>
                      <p className="text-slate-500 text-[11px]">{data.farmLocation || "Cluster Verified"}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Regulatory Status</span>
                    <span className="inline-flex items-center gap-1.5 font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                      <Check className="w-3.5 h-3.5" /> APPROVED (MRL SAFE)
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Validity Window</span>
                    <span className="font-semibold text-white">
                      {new Date(data.validFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      {" "}to{" "}
                      {new Date(data.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                    </span>
                  </div>

                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Approving Authority</span>
                    <span className="font-semibold text-slate-200">{data.approvedBy}</span>
                  </div>

                  <div className="flex justify-between items-center pt-2">
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Premium Market Eligible</span>
                    <span className="font-black text-emerald-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      <span>YES — VERIFIED PREMIUM</span>
                    </span>
                  </div>
                </div>

                {/* Blockchain Proof Footnote */}
                {data.blockchainHash && (
                  <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 text-[10px] space-y-1">
                    <span className="text-slate-500 uppercase font-bold tracking-wider">Blockchain Audit Proof (Keccak-256)</span>
                    <p className="font-mono text-slate-400 truncate">{data.blockchainHash}</p>
                  </div>
                )}

                <div className="text-center pt-2">
                  <span className="text-[11px] text-slate-500">
                    Digitally anchored to the AgriGuard Food Safety & Traceability Network.
                  </span>
                </div>
              </div>
            )}

            {/* 2. EXPIRED CERTIFICATE */}
            {data.status === "EXPIRED" && (
              <div className="bg-slate-900/90 border-2 border-slate-700 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                    ⚪ CERTIFICATE EXPIRED
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">Validity Window Concluded</h2>
                  <p className="text-xs text-slate-400 max-w-md mx-auto">
                    {data.message}
                  </p>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Producer:</span>
                    <span className="font-bold text-white">{data.farmerName} ({data.farmerId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Expired On:</span>
                    <span className="font-semibold text-slate-300">{new Date(data.validUntil).toLocaleDateString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current MRL Status:</span>
                    <span className="font-bold text-slate-400">EXPIRED / NOT SET</span>
                  </div>
                </div>

                <p className="text-[11px] text-slate-500">
                  Please ask the producer for their current weekly certificate or scan their refreshed QR code.
                </p>
              </div>
            )}

            {/* 3. UNSAFE CERTIFICATE */}
            {data.status === "UNSAFE" && (
              <div className="bg-gradient-to-b from-slate-900 to-rose-950/50 border-2 border-rose-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
                <div className="w-16 h-16 rounded-3xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto shadow-lg shadow-rose-950/60">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    ⚠ NOT SAFE FOR CONSUMPTION
                  </span>
                  <h2 className="text-2xl font-black text-white mt-2">MRL NOT SAFE</h2>
                  <p className="text-xs text-rose-300 max-w-md mx-auto">
                    {data.message}
                  </p>
                </div>

                <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Producer:</span>
                    <span className="font-bold text-white">{data.farmerName} ({data.farmerId})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-rose-400">🔴 MRL NOT SAFE</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Commercial Premium:</span>
                    <span className="font-bold text-rose-400">DISQUALIFIED</span>
                  </div>
                </div>

                <p className="text-[11px] text-rose-400/80">
                  Do not procure or consume products from this producer during this weekly withholding window.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="max-w-3xl mx-auto w-full text-center text-xs text-slate-500 pt-8 border-t border-slate-800/80 mt-6">
        <p>© 2026 AgriGuard — SIH25007 | Digital Farm Management & AMU/MRL Verification Protocol</p>
      </footer>
    </div>
  );
}
