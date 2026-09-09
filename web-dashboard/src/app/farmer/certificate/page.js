"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  Award, ShieldCheck, AlertTriangle, CheckCircle2, XCircle, 
  QrCode, RefreshCw, Calendar, ArrowRight, ExternalLink, 
  Coins, Download, Share2, Sparkles, Building2, User, Clock,
  FileCheck2, ShieldAlert, Check, ChevronRight
} from "lucide-react";
import Link from "next/link";
import QRCode from "qrcode";

const API_BASE = "http://localhost:5000/api/v1";

export default function FarmerCertificatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [farmer, setFarmer] = useState(null);
  const [activeCert, setActiveCert] = useState(null);
  const [history, setHistory] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [requestingReview, setRequestingReview] = useState(false);
  const [notification, setNotification] = useState(null);

  const fetchCertificateData = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch certificate");
      const json = await res.json();
      setFarmer(json.farmer);
      setActiveCert(json.activeCertificate);
      setHistory(json.history || []);

      // Generate high-contrast QR Data URL
      if (json.activeCertificate?.qrPayload) {
        const fullVerifyUrl = `${window.location.origin}${json.activeCertificate.qrPayload}`;
        const url = await QRCode.toDataURL(fullVerifyUrl, {
          errorCorrectionLevel: "H",
          width: 240,
          margin: 1.5,
          color: { dark: "#090d16", light: "#ffffff" }
        });
        setQrDataUrl(url);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!token || role !== "FARMER") {
      router.push("/login");
      return;
    }
    fetchCertificateData();
  }, []);

  const handleRequestReview = async () => {
    setRequestingReview(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/certificates/initiate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ notes: "Farmer requested regular weekly review" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate review");
      setNotification("Weekly review requested successfully! Awaiting FSSAI regulator approval.");
      await fetchCertificateData();
    } catch (e) {
      setNotification("Error: " + e.message);
    } finally {
      setRequestingReview(false);
    }
  };

  const isSafe = activeCert?.approvalStatus === "APPROVED" && activeCert?.mrlStatus === "SAFE" && !activeCert?.isExpired;
  const isUnsafe = activeCert?.approvalStatus === "APPROVED" && activeCert?.mrlStatus === "UNSAFE";
  const isPending = !activeCert || activeCert?.approvalStatus === "PENDING";
  const isExpired = activeCert?.isExpired || activeCert?.approvalStatus === "EXPIRED";

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div className="bg-emerald-500/90 text-white px-5 py-3 rounded-xl shadow-xl flex items-center justify-between border border-emerald-400/40">
          <span className="text-sm font-semibold">{notification}</span>
          <button onClick={() => setNotification(null)} className="text-xs underline ml-4">Dismiss</button>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Award className="w-6 h-6" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">Digital Compliance & Premium Markets</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            My MRL Certificate <span className="text-slate-500 font-light">& Premium Verification</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Produce verified within statutory Maximum Residue Limits receives an immutable digital seal unlocking high-value market premiums.
          </p>
        </div>

        <button
          onClick={() => { setRefreshing(true); fetchCertificateData(); }}
          disabled={refreshing}
          className="self-start sm:self-auto flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 rounded-xl text-sm font-medium text-slate-200 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-emerald-400" : "text-slate-400"}`} />
          <span>Refresh Status</span>
        </button>
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-emerald-400" />
          <p className="text-sm">Loading your digital certificate and market access status...</p>
        </div>
      ) : (
        <>
          {/* STATE 1: PENDING */}
          {isPending && (
            <div className="bg-slate-900/80 border border-amber-500/30 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>
              <div className="space-y-1">
                <span className="text-xs font-black tracking-widest uppercase text-amber-400">Current Status</span>
                <h2 className="text-2xl font-black text-white">MRL CERTIFICATE — ⏳ PENDING</h2>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  Your weekly farm certification is currently awaiting FSSAI regulator review. Supporting evidence (AMU records, test assays) has been transmitted.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 max-w-md mx-auto text-left space-y-1.5">
                <div className="flex justify-between">
                  <span>Producer:</span>
                  <span className="font-bold text-slate-200">{farmer?.fullName} ({farmer?.farmerId})</span>
                </div>
                <div className="flex justify-between">
                  <span>Review Window:</span>
                  <span className="text-slate-300">Weekly Regulatory Cycle</span>
                </div>
                <div className="flex justify-between">
                  <span>QR Verification:</span>
                  <span className="text-amber-400 font-semibold">NOT YET ACTIVE</span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRequestReview}
                  disabled={requestingReview}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
                >
                  {requestingReview ? "Transmitting..." : "Re-trigger FSSAI Notification"}
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: APPROVED + SAFE (STUNNING OFFICIAL CERTIFICATE CARD) */}
          {isSafe && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Certificate Card (Left / Main) */}
              <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-slate-900/95 to-emerald-950/40 border-2 border-emerald-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                {/* Subtle Background Watermark */}
                <div className="absolute -right-16 -bottom-16 opacity-5 pointer-events-none text-emerald-400">
                  <ShieldCheck className="w-96 h-96" />
                </div>

                {/* Certificate Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Award className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] uppercase tracking-widest font-black text-emerald-400">
                        Official Regulatory Record
                      </span>
                      <h2 className="text-xl font-black text-white tracking-wide">
                        AGRIGUARD MRL DIGITAL CERTIFICATE
                      </h2>
                      <p className="text-xs text-slate-400">
                        Food Safety and Standards Authority of India (FSSAI) Compliance Bridge
                      </p>
                    </div>
                  </div>

                  {/* Prominent Badge */}
                  <div className="self-start sm:self-auto px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 rounded-2xl font-black text-sm tracking-wider flex items-center gap-2 shadow-lg shadow-emerald-950/60">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>🟢 MRL SAFE</span>
                  </div>
                </div>

                {/* Certificate Main Body */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 my-6 text-xs">
                  <div className="space-y-3">
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Certified Producer</span>
                      <p className="font-bold text-white text-base mt-0.5">{farmer?.fullName}</p>
                      <p className="text-emerald-400 font-mono text-xs">{farmer?.farmerId}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Farm Name & Cluster</span>
                      <p className="text-slate-200 font-semibold mt-0.5">{farmer?.farmName}</p>
                      <p className="text-slate-400">{farmer?.farmLocation}</p>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Certificate Serial & Verification ID</span>
                      <p className="font-mono text-white text-xs mt-0.5">{activeCert?.certificateId}</p>
                      <p className="font-mono text-emerald-400 text-xs font-bold">{activeCert?.verificationId}</p>
                    </div>
                  </div>

                  <div className="space-y-3 sm:border-l sm:border-slate-800/80 sm:pl-6">
                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Validity Period</span>
                      <p className="font-bold text-white text-xs mt-0.5">
                        {new Date(activeCert?.validFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        {" "}to{" "}
                        {new Date(activeCert?.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                      <span className="inline-block mt-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-semibold border border-emerald-500/20">
                        Active Weekly Cycle
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Approving Authority</span>
                      <p className="text-slate-200 font-semibold mt-0.5">{activeCert?.approvedBy || "FSSAI Central Regulator"}</p>
                      <p className="text-slate-500 text-[11px]">Authorized Regulatory Officer</p>
                    </div>

                    <div>
                      <span className="text-slate-500 uppercase font-bold text-[10px]">Blockchain Proof (Keccak-256)</span>
                      <p className="font-mono text-slate-400 text-[10px] truncate max-w-xs mt-0.5">
                        {activeCert?.blockchainHash || "0x7e0bcbb1d3ddd1..."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* QR Section and Verification Seal */}
                <div className="p-5 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    {/* QR Code Container */}
                    <div className="p-2.5 bg-white rounded-2xl shadow-xl shrink-0">
                      {qrDataUrl ? (
                        <img 
                          src={qrDataUrl} 
                          alt="MRL Verification QR Code" 
                          className="w-28 h-28 object-contain"
                        />
                      ) : (
                        <div className="w-28 h-28 flex items-center justify-center bg-slate-100 text-slate-800">
                          <QrCode className="w-10 h-10" />
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                        Scan for Instant Verification
                      </span>
                      <h3 className="font-bold text-white text-sm">Consumer & Buyer Trust QR</h3>
                      <p className="text-[11px] text-slate-400 max-w-xs">
                        Buyers scan this code with any camera to verify FSSAI compliance and zero residue exceedance in real time.
                      </p>
                      <Link
                        href={`/certify/verify/${activeCert?.verificationId}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold pt-1"
                      >
                        <span>Open Public Verification Link</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>

                  {/* Trust Pillars */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 w-full sm:w-auto">
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>FSSAI Approved</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>MRL Safe</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Digitally Verifiable</span>
                    </div>
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Blockchain Anchored</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Market Status & Premium Pricing Card (Right Column) */}
              <div className="lg:col-span-4 space-y-4">
                <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                    <h3 className="font-black text-white text-base">MRL-Safe Market Status</h3>
                  </div>

                  <p className="text-xs text-slate-400">
                    Compliance creates economic value. Your verified MRL-safe certificate qualifies your livestock harvest for premium off-take pricing.
                  </p>

                  <div className="space-y-3 bg-slate-950/90 rounded-2xl p-4 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Certificate Status:</span>
                      <span className="font-bold text-emerald-400">ACTIVE</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">MRL Compliance:</span>
                      <span className="font-bold text-emerald-400">🟢 SAFE</span>
                    </div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Premium Eligibility:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                        YES (ELIGIBLE)
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Buyer Verification:</span>
                      <span className="font-bold text-slate-200">ENABLED</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 space-y-1.5">
                    <p className="font-bold">✨ Premium Market Incentive Active</p>
                    <p className="text-[11px] text-emerald-300/80">
                      Show your QR code to milk dairies, poultry processors, or institutional procurement officers to claim verified safety price margins (8% - 15% estimated market premium).
                    </p>
                  </div>

                  <button
                    onClick={() => window.print()}
                    className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 border border-slate-700 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download / Print Certificate PDF</span>
                  </button>
                </div>

                {/* Notice Card on DBT Distinction */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-1">
                  <span className="font-bold text-slate-300">Statutory Waste vs. Premium Pricing</span>
                  <p className="text-[11px]">
                    Note: Premium pricing is a commercial incentive from buyers. Discarded produce during active withholding periods remains separately compensable under FSSAI DBT Subsidies.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STATE 3: APPROVED + UNSAFE */}
          {isUnsafe && (
            <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-rose-950/40 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 space-y-4 max-w-3xl mx-auto shadow-2xl">
              <div className="flex items-center gap-3 border-b border-slate-800 pb-4 text-rose-400">
                <ShieldAlert className="w-7 h-7" />
                <div>
                  <h2 className="text-xl font-black text-white">🔴 MRL NOT SAFE — CERTIFICATION ALERT</h2>
                  <p className="text-xs text-rose-300">
                    Active antimicrobial residues detected or statutory withdrawal period unelapsed
                  </p>
                </div>
              </div>

              <div className="bg-slate-950/80 rounded-2xl p-5 border border-slate-800 text-xs space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Producer:</span>
                  <span className="font-bold text-white">{farmer?.fullName} ({farmer?.farmerId})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Certificate ID:</span>
                  <span className="font-mono text-white">{activeCert?.certificateId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Status:</span>
                  <span className="font-bold text-rose-400">🔴 MRL NOT SAFE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Premium Market Eligibility:</span>
                  <span className="font-bold text-rose-400">SUSPENDED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Regulatory Advisory:</span>
                  <span className="text-slate-300 text-right max-w-xs">{activeCert?.notes || "Do not harvest or sell produce until withdrawal period completes."}</span>
                </div>
              </div>

              <p className="text-xs text-slate-400">
                Produce harvested during this cycle must NOT be sold for human consumption. File a withdrawal waste claim with your local Farm Tester to receive statutory DBT compensation.
              </p>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/farmer/withdrawals"
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition-colors"
                >
                  View Withdrawal Calendar
                </Link>
                <Link
                  href="/farmer/subsidies"
                  className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-colors"
                >
                  View Waste Subsidies & DBT
                </Link>
              </div>
            </div>
          )}

          {/* STATE 4: EXPIRED */}
          {isExpired && !isPending && !isSafe && !isUnsafe && (
            <div className="bg-slate-900/80 border border-slate-700 rounded-3xl p-6 sm:p-8 text-center space-y-4 max-w-2xl mx-auto shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-white">⚪ CERTIFICATE EXPIRED</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Your certificate for the previous weekly cycle has concluded. Initiate this week&apos;s certification review below.
                </p>
              </div>

              <button
                onClick={handleRequestReview}
                disabled={requestingReview}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950/40"
              >
                {requestingReview ? "Initiating..." : "Request Weekly Certification Review"}
              </button>
            </div>
          )}

          {/* Certification History Ledger */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Certification History Ledger</h3>
                <p className="text-xs text-slate-400">Weekly compliance track record and audit history</p>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {history.length} Record{history.length !== 1 ? "s" : ""} on File
              </span>
            </div>

            {history.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No past certificates on record.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-3">Certificate ID</th>
                      <th className="px-4 py-3">Week / Validity</th>
                      <th className="px-4 py-3">Approval</th>
                      <th className="px-4 py-3">MRL Status</th>
                      <th className="px-4 py-3">Approved By</th>
                      <th className="px-4 py-3 text-right">Verification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {history.map((h, i) => (
                      <tr key={h.id || i} className="hover:bg-slate-800/40">
                        <td className="px-4 py-3 font-mono font-bold text-white">{h.certificateId}</td>
                        <td className="px-4 py-3 text-slate-400">
                          {new Date(h.validFrom).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                          {" — "}
                          {new Date(h.validUntil).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded font-bold text-[10px] ${
                            h.approvalStatus === "APPROVED" ? "bg-emerald-500/10 text-emerald-400" :
                            h.approvalStatus === "EXPIRED" ? "bg-slate-500/10 text-slate-400" : "bg-amber-500/10 text-amber-400"
                          }`}>
                            {h.approvalStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold">
                          {h.mrlStatus === "SAFE" ? (
                            <span className="text-emerald-400">🟢 SAFE</span>
                          ) : h.mrlStatus === "UNSAFE" ? (
                            <span className="text-rose-400">🔴 UNSAFE</span>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{h.approvedBy || "FSSAI"}</td>
                        <td className="px-4 py-3 text-right">
                          <Link
                            href={`/certify/verify/${h.verificationId}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            <span>Verify</span>
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
