"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Users, Activity, AlertTriangle, ShieldCheck, 
  Calendar, ArrowRight, Sparkles, Clock, CheckCircle2,
  Syringe, Pill, RefreshCw, BarChart3, ChevronRight, FileText,
  Shield, Check, Coins, ExternalLink, Mail, X, Info,
  Award, QrCode, Download, Share2, FileCheck2, Building2
} from "lucide-react";
import QRCode from "qrcode";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();

  // Combined MRL Certificate State (Requirement 3)
  const [activeCert, setActiveCert] = useState(null);
  const [certHistory, setCertHistory] = useState([]);
  const [qrDataUrl, setQrDataUrl] = useState(null);
  const [requestingReview, setRequestingReview] = useState(false);
  const [certNotification, setCertNotification] = useState(null);

  // Dedicated Notification Email State
  const [notificationEmail, setNotificationEmail] = useState("");
  const [emailNotificationsEnabled, setEmailNotificationsEnabled] = useState(true);
  const [savedNotificationEmail, setSavedNotificationEmail] = useState("");
  const [emailSaving, setEmailSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [hasUserEditedEmail, setHasUserEditedEmail] = useState(false);

  const handleSendTestNotification = async () => {
    const targetEmail = notificationEmail.trim() || savedNotificationEmail;
    if (!targetEmail) {
      setEmailFeedback({
        type: "error",
        text: "Please enter an email address first before sending a test notification."
      });
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(targetEmail)) {
      setEmailFeedback({
        type: "error",
        text: "Invalid email format. Please enter a valid email (e.g. yourname@gmail.com)."
      });
      return;
    }

    setTestSending(true);
    setEmailFeedback(null);

    try {
      const res = await fetch("http://localhost:5000/api/v1/notifications/email/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customEmail: targetEmail,
          testMessage: `Hello from AgriGuard! This is an instant test notification verifying delivery to your personal email address (${targetEmail}).`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEmailFeedback({
          type: "success",
          text: `Test email dispatched to ${targetEmail}! Check your inbox (or terminal logs in simulated demo mode).`
        });
      } else {
        setEmailFeedback({
          type: "error",
          text: data.errorMessage || "Failed to send test email. Please check your network or SMTP credentials."
        });
      }
    } catch (err) {
      setEmailFeedback({
        type: "error",
        text: "Network error sending test email. Ensure the backend server is running."
      });
    } finally {
      setTestSending(false);
    }
  };

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

  const fetchNotificationSettings = () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch("http://localhost:5000/api/v1/farmers/notification-email", {
      headers: { "Authorization": `Bearer ${token}` }
    })
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) {
          const emailVal = data.notificationEmail || "";
          setSavedNotificationEmail(emailVal);
          setNotificationEmail(emailVal);
          setEmailNotificationsEnabled(data.emailNotificationsEnabled !== false);
        }
      })
      .catch(err => console.error("Failed to fetch notification settings:", err));
  };

  const loadData = async () => {
    let token = localStorage.getItem("token");

    if (!token) {
      try {
        const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "farmer1@gmail.com", password: "Password@123" })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          token = loginData.token;
          localStorage.setItem("token", token);
          localStorage.setItem("userRole", "FARMER");
          if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));
        }
      } catch (e) {
        console.error("Auto-login error:", e);
      }
    }

    try {
      let [profData, treatData, withData, claimsData] = await Promise.all([
        fetch("http://localhost:5000/api/v1/farmers/my-profile", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()).catch(() => null),
        fetch("http://localhost:5000/api/v1/treatments/my-treatments", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/v1/treatments/my-withdrawals", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()).catch(() => []),
        fetch("http://localhost:5000/api/v1/testers/waste-claims").then(r => r.json()).catch(() => [])
      ]);

      if (profData?.error || !Array.isArray(treatData)) {
        // Re-authenticate and retry
        const loginRes = await fetch("http://localhost:5000/api/v1/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "farmer1@gmail.com", password: "Password@123" })
        });
        const loginData = await loginRes.json();
        if (loginData.token) {
          token = loginData.token;
          localStorage.setItem("token", token);
          localStorage.setItem("userRole", "FARMER");
          if (loginData.user) localStorage.setItem("user", JSON.stringify(loginData.user));
          [profData, treatData, withData] = await Promise.all([
            fetch("http://localhost:5000/api/v1/farmers/my-profile", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
            fetch("http://localhost:5000/api/v1/treatments/my-treatments", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json()),
            fetch("http://localhost:5000/api/v1/treatments/my-withdrawals", { headers: { "Authorization": `Bearer ${token}` } }).then(r => r.json())
          ]);
        }
      }

      setProfile(profData || {});
      setTreatments(Array.isArray(treatData) ? treatData : []);
      setWithdrawals(Array.isArray(withData) ? withData : []);
      setWasteClaims(Array.isArray(claimsData) ? claimsData : []);

      // Fetch MRL Certificate data
      try {
        const certRes = await fetch("http://localhost:5000/api/v1/certificates/my", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (certRes.ok) {
          const certJson = await certRes.json();
          setActiveCert(certJson.activeCertificate);
          setCertHistory(certJson.history || []);
          if (certJson.activeCertificate?.qrPayload) {
            const fullVerifyUrl = `${window.location.origin}${certJson.activeCertificate.qrPayload}`;
            const url = await QRCode.toDataURL(fullVerifyUrl, {
              errorCorrectionLevel: "H",
              width: 220,
              margin: 1.5,
              color: { dark: "#0f172a", light: "#ffffff" }
            });
            setQrDataUrl(url);
          }
        }
      } catch (certErr) {
        console.warn("Cert load error:", certErr.message);
      }

      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestReview = async () => {
    setRequestingReview(true);
    setCertNotification(null);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/v1/certificates/initiate", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ notes: "Farmer requested regular weekly review" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to initiate review");
      setCertNotification("✅ Weekly review requested successfully! Awaiting FSSAI regulator approval.");
      await loadData();
    } catch (e) {
      setCertNotification("⚠️ " + e.message);
    } finally {
      setRequestingReview(false);
    }
  };

  const handleSaveNotificationEmail = async (e) => {
    e?.preventDefault();
    setEmailSaving(true);
    setEmailFeedback(null);

    const cleanEmail = notificationEmail.trim().toLowerCase();

    if (cleanEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailFeedback({
          type: "error",
          text: "Invalid email address format. Please enter a valid email (e.g. yourname@gmail.com)."
        });
        setEmailSaving(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:5000/api/v1/farmers/notification-email", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          notificationEmail: cleanEmail || null,
          emailNotificationsEnabled
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setEmailFeedback({
          type: "error",
          text: data.error || "Failed to update notification email settings."
        });
      } else {
        const savedVal = data.notificationEmail || "";
        setSavedNotificationEmail(savedVal);
        setNotificationEmail(savedVal);
        setEmailNotificationsEnabled(data.emailNotificationsEnabled !== false);
        setEmailFeedback({
          type: "success",
          text: savedVal
            ? `Saved successfully! All AgriGuard notifications will now be sent to: ${savedVal}`
            : "Notification email removed. Add an email address anytime to receive alerts."
        });
      }
    } catch (err) {
      setEmailFeedback({
        type: "error",
        text: "Network error saving notification preferences. Please try again."
      });
    } finally {
      setEmailSaving(false);
    }
  };

  useEffect(() => {
    fetchNotificationSettings();
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
      <div className="relative overflow-hidden rounded-2xl bg-white border border-gray-200 p-8 shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-50 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                {t("liveTelemetry")}
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-50 border border-emerald-200 text-emerald-700">
                {t("fssaiReg")} <span className="notranslate" translate="no">{profile?.farmerId || "FR10293"}</span>
              </span>
              <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-blue-50 border border-blue-200 text-blue-700">
                {t("contractSynced")}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight sm:text-4xl">
              {t("welcomeBack")} <span className="text-emerald-600 notranslate" translate="no">{profile?.fullName || "Rajesh Kumar"}</span>! 🌾
            </h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base max-w-2xl">
              {t("farmOverviewDesc")}
            </p>
            <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
              <span>🩺 {t("designatedVet")} <strong className="text-gray-800 notranslate" translate="no">{profile?.assignedVet?.fullName || "Dr. Suresh Kumar"} ({profile?.assignedVet?.vetId || "VT92A7K1"})</strong></span>
              <span>📍 <span className="notranslate" translate="no">{profile?.farmLocation || "District 1, State"}</span></span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={loadData}
              className="p-2.5 rounded-xl bg-gray-50 hover:bg-emerald-50 text-gray-700 border border-gray-200 transition-all flex items-center gap-2 text-xs font-semibold shadow-xs"
              title={t("refresh")}
            >
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              <span>🔄 {t("sync")}</span>
            </button>
            <Link
              href="/farmer/animals"
              className="bg-[#4CAF50] hover:bg-[#388E3C] text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm text-sm flex items-center gap-2"
            >
              <span className="text-base">🐄</span>
              <span>{t("manageHerd")}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Launch Banner to Updated Modules */}
      <div className="bg-[#F1F8F3] border border-emerald-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-700 shrink-0">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-gray-900">⚡ {t("directShortcuts")}</h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                {t("liveUpdated")}
              </span>
            </div>
            <p className="text-xs text-gray-600 mt-0.5">
              {t("shortcutsDesc")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto shrink-0">
          <button
            onClick={() => goToPortal("REGULATOR", "/regulator/waste-subsidy")}
            disabled={switching}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🏛️ {t("openFssaiPayment")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          
          <button
            onClick={() => goToPortal("VETERINARIAN", "/vet/medicine")}
            disabled={switching}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <span>🩺 {t("openVetMedicine")}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Total Animals */}
        <div className="bg-white border border-gray-200 hover:border-emerald-400 rounded-2xl p-6 transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xl">
              🐄
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              📦 {t("allStock")}
            </span>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">
            🐄 {t("totalAnimalsManaged")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 notranslate" translate="no">{loading ? "..." : totalLivestock}</span>
            <span className="text-xs text-gray-500">{t("head")}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            🐄 <span className="notranslate font-semibold" translate="no">{profile?.farms?.[0]?.animals?.length || 9}</span> Individual + 🐟 <span className="notranslate font-semibold" translate="no">{totalLivestock - (profile?.farms?.[0]?.animals?.length || 9)}</span> Batch
          </p>
        </div>

        {/* Quarantined Animals in Active Withdrawal */}
        <div className={`border rounded-2xl p-6 transition-all shadow-xs ${
          quarantinedAnimals.length > 0 
            ? "bg-amber-50/70 border-amber-300 shadow-sm" 
            : "bg-white border-gray-200"
        }`}>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-100 border border-amber-300 text-amber-700 text-xl">
              ⚠️
            </div>
            <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-full animate-pulse">
              🚫 {t("restricted")}
            </span>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">
            ⏳ {t("underActiveWithdrawal")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 notranslate" translate="no">{loading ? "..." : quarantinedAnimals.length}</span>
            <span className="text-xs text-amber-800 font-medium">{t("animalsQuarantined")}</span>
          </div>
          <p className="text-xs text-amber-800 mt-2 font-medium">
            {quarantinedAnimals.length > 0 
              ? `🏷️ Tags: ${quarantinedAnimals.map(a => a.tag?.tag || a.tag).join(", ")} (🥛 Milk & Meat Hold)` 
              : `✅ ${t("allAnimalsClear")}`}
          </p>
        </div>

        {/* Market Ready Animals */}
        <div className="bg-white border border-gray-200 hover:border-emerald-400 rounded-2xl p-6 transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 text-xl">
              ✅
            </div>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
              🛡️ {t("fssaiSafe")}
            </span>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">
            ✅ {t("marketReadySafe")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 notranslate" translate="no">{loading ? "..." : safeCount}</span>
            <span className="text-xs text-gray-500">{t("compliantStock")}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            🥛 {t("foodProductsSafe")}
          </p>
        </div>

        {/* Active Treatments */}
        <div className="bg-white border border-gray-200 hover:border-emerald-400 rounded-2xl p-6 transition-all shadow-xs group">
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 text-xl">
              💊
            </div>
            <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
              📋 {t("rxActive")}
            </span>
          </div>
          <h3 className="text-gray-600 text-xs font-semibold uppercase tracking-wider mb-1">
            💊 {t("activePrescriptions")}
          </h3>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-gray-900 notranslate" translate="no">{loading ? "..." : treatments.filter(t => t.status === "Active").length}</span>
            <span className="text-xs text-gray-500">{t("courses")}</span>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            👨‍⚕️ {t("prescribedAndMonitored")} <span className="notranslate font-semibold" translate="no">{profile?.assignedVet?.fullName || "Dr. Suresh Kumar"}</span>
          </p>
        </div>
      </div>

      {/* ========================================================
          COMBINED SECTION: MRL FOOD SAFETY CERTIFICATE & QR
          (Requirement 3: Unified My Farm + MRL Certificate)
          ======================================================== */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        {certNotification && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-semibold flex items-center justify-between">
            <span>{certNotification}</span>
            <button onClick={() => setCertNotification(null)} className="text-emerald-700 hover:text-emerald-900 font-bold">&times;</button>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 flex items-center justify-center text-2xl shadow-xs shrink-0">
              📜
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t("mrlCertQr")}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                  activeCert?.mrlStatus === "SAFE" && !activeCert?.isExpired
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : activeCert?.mrlStatus === "UNSAFE"
                    ? "bg-rose-50 text-rose-800 border-rose-300"
                    : "bg-amber-50 text-amber-800 border-amber-300"
                }`}>
                  {activeCert?.mrlStatus === "SAFE" && !activeCert?.isExpired ? `🟢 ${t("mrlSafe")}` : activeCert?.mrlStatus === "UNSAFE" ? `🔴 ${t("status.mrlNotSafe")}` : `🟡 ${t("status.pendingReview")}`}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {t("mrlBadgeDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRequestReview}
              disabled={requestingReview}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${requestingReview ? "animate-spin" : ""}`} />
              <span>🔄 {requestingReview ? t("common.requesting") : t("requestReview")}</span>
            </button>
            {activeCert?.qrPayload && (
              <a
                href={activeCert.qrPayload}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-2 rounded-xl bg-white border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 text-xs font-semibold transition-all flex items-center gap-1.5 shadow-xs"
              >
                <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                <span>📱 {t("verifyPublicly")}</span>
              </a>
            )}
          </div>
        </div>

        {/* Certificate Card Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Details: Status & Validity */}
          <div className="lg:col-span-8 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🆔 {t("certificateId")}</span>
                <span className="text-sm font-bold text-slate-800 font-mono mt-1 block notranslate" translate="no">
                  {activeCert?.certificateNumber || "CERT-FR10293-SAFE"}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">📅 {t("validityWindow")}</span>
                <span className="text-xs font-semibold text-slate-700 mt-1 block">
                  {activeCert?.validFrom ? new Date(activeCert.validFrom).toLocaleDateString() : t("activeCycle")} &rarr; {activeCert?.validUntil ? new Date(activeCert.validUntil).toLocaleDateString() : t("nextAudit")}
                </span>
              </div>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">🛡️ {t("fssaiStatus")}</span>
                <span className="text-xs font-bold text-emerald-700 mt-1 block">
                  {activeCert?.approvalStatus === "APPROVED" ? `✅ ${t("fssaiApprovedBadge")}` : `⏳ ${t("reviewInProgressBadge")}`}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 text-xs text-slate-700 space-y-1.5">
              <div className="font-semibold text-emerald-900 flex items-center gap-1.5">
                <span>🔗</span>
                <span>{t("cryptoProof")}</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed font-mono truncate notranslate" translate="no">
                TxHash: {activeCert?.blockchainTxHash || "0x8f2c3d4e5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2"}
              </p>
              <p className="text-[11px] text-emerald-800 font-medium">
                ✅ {t("certifiedSafeDesc")}
              </p>
            </div>
          </div>

          {/* Right Column: High-Contrast QR Code */}
          <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 bg-gray-50/80 border border-gray-200 rounded-2xl text-center">
            {qrDataUrl ? (
              <div className="p-2.5 bg-white rounded-xl border border-gray-200 shadow-xs inline-block">
                <img src={qrDataUrl} alt="AgriGuard MRL Verification QR" className="w-36 h-36 mx-auto" />
              </div>
            ) : (
              <div className="w-36 h-36 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-slate-400 text-xs">
                {t("qrProcessing")}
              </div>
            )}
            <p className="text-[11px] font-bold text-slate-700 mt-2">📱 {t("publicConsumerQr")}</p>
            <p className="text-[10px] text-slate-500">{t("scanWithSmartphone")}</p>
          </div>
        </div>
      </div>

      {/* Critical Withdrawal Alert Banner if any quarantined */}
      {quarantinedAnimals.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-6 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 border border-amber-300 shrink-0 mt-1 text-2xl">
                ⚠️
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-amber-950">
                    ⚠️ {t("statutoryQuarantineAlert")}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                    ⏳ {activeWithdrawalCount} {t("activeRegimens")}
                  </span>
                </div>
                <p className="text-sm text-amber-900">
                  <strong className="text-amber-950 notranslate" translate="no">{quarantinedAnimals.map(a => `${a.category} (${a.tag?.tag || a.tag})`).join(", ")}</strong> {t("quarantineWarningDesc")}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <span className="text-amber-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                    <span>⏳ {t("earliestClearance")}</span> <strong className="text-emerald-700 ml-1">08/09/2026</strong> (Amoxicillin)
                  </span>
                  <span className="text-amber-900 flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-amber-200 font-medium">
                    <span>⏳ {t("fullClearance")}</span> <strong className="text-emerald-700 ml-1">09/09/2026</strong> (Oxytetracycline)
                  </span>
                </div>
              </div>
            </div>

            <Link
              href="/farmer/withdrawals"
              className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-all shrink-0 shadow-sm"
            >
              <span>📅 ⏳ {t("viewWithdrawalCalendar")}</span>
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
              <h2 className="text-lg font-bold text-white">{t("herdBreakdown")}</h2>
              <p className="text-xs text-slate-400">{t("herdBreakdownDesc")}</p>
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
                    formatter={(val) => [`${val} ${t("animalsUnit")}`, t("countLabel")]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg hover:bg-slate-800/40">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                    <span className="text-slate-300 font-medium">{t(item.name)}</span>
                  </div>
                  <span className="font-bold text-white font-mono">{item.value} {t("head")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety & Compliance Status Chart */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-bold text-white">{t("foodSafetyStatus")}</h2>
              <p className="text-xs text-slate-400">{t("foodSafetyStatusDesc")}</p>
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
              <span className="text-slate-300">{t("marketSafeToSell")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <span className="text-slate-300">{t("inWithdrawalDoNotSell")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Action Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Link 
          href="/farmer/animals"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:scale-110 transition-transform text-2xl">
              🐄
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
            🐄 {t("animalBatchRoster")} 🏷️
          </h3>
          <p className="text-gray-600 text-xs leading-relaxed">
            {t("animalBatchDesc")}
          </p>
        </Link>

        <Link 
          href="/farmer/withdrawals"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform text-2xl">
              📅
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-amber-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-amber-600 transition-colors">
            📅 {t("withdrawalCalendar")} ⏳
          </h3>
          <p className="text-gray-600 text-xs leading-relaxed">
            {t("withdrawalCalendarDesc")}
          </p>
        </Link>

        <Link 
          href="/farmer/treatments"
          className="group p-6 rounded-2xl bg-white border border-gray-200 hover:border-emerald-500 hover:shadow-md transition-all shadow-sm"
        >
          <div className="flex justify-between items-start mb-4">
            <div className="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-110 transition-transform text-2xl">
              💊
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
            💊 {t("veterinaryTreatments")} 🩺
          </h3>
          <p className="text-gray-600 text-xs leading-relaxed">
            {t("veterinaryTreatmentsDesc")}
          </p>
        </Link>
      </div>

      {/* Direct Benefit Transfer (DBT) & Waste Subsidy Compensation - Strict 6 Columns */}
      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-6 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xl">
                💰
              </div>
              <h2 className="text-lg font-bold text-gray-900">💰 {t("dbtAndWasteSubsidies")}</h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-300">
                🏛️ {t("fssaiRegulated")}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              🥛 {t("wasteClaimsDesc")}
            </p>
          </div>

          <div className="flex items-center gap-4 flex-wrap">
            <div className="text-right">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 block font-semibold">{t("totalPaidToAccount")}</span>
              <span className="text-base font-extrabold text-emerald-600 font-mono">₹{totalDbtReceived.toLocaleString('en-IN')}</span>
            </div>
            <div className="text-right border-l border-gray-200 pl-4">
              <span className="text-[11px] uppercase tracking-wider text-gray-500 block font-semibold">{t("pendingApproval")}</span>
              <span className="text-base font-extrabold text-amber-600 font-mono">₹{totalDbtPending.toLocaleString('en-IN')}</span>
            </div>
            <Link
              href="/farmer/subsidies"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Coins className="w-4 h-4" />
              <span>📑 {t("fullSubsidyLedger")}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase tracking-wider text-gray-600">
                <th className="py-3 px-6">🆔 {t("farmerIdCol")}</th>
                <th className="py-3 px-6">📅 {t("dateProducedCol")}</th>
                <th className="py-3 px-6">🥩 {t("productTagCol")}</th>
                <th className="py-3 px-6">⚖️ {t("amountProducedCol")}</th>
                <th className="py-3 px-6">💵 {t("subsidyAmountCol")}</th>
                <th className="py-3 px-6">🏦 {t("paymentProcessCol")}</th>
                <th className="py-3 px-6">{t("amountReceivedCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">{t("loadingSubsidyRecords")}</td>
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
                        <div className="font-semibold text-white">{t(claim.productType) || claim.productType || claim.animalType}</div>
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
                              {t("disbursedPaid")}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {t("pendingFssaiApproval")}
                          </span>
                        )}
                      </td>
                      {/* 7. Amount Received */}
                      <td className="py-3.5 px-6 font-mono font-extrabold text-emerald-400">
                        {isPaid ? `₹${(claim.aiRecommendedAmount || 0).toLocaleString('en-IN')}` : `₹0 (${t("pending")})`}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-slate-500">{t("noWasteClaims")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Email Notifications Configuration Card */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide uppercase">{t("emailNotifications")}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {t("emailNotificationsDesc")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">{t("notifications")}:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
              emailNotificationsEnabled && savedNotificationEmail
                ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                : !savedNotificationEmail
                ? "bg-amber-500/15 text-amber-300 border-amber-500/30"
                : "bg-rose-500/15 text-rose-400 border-rose-500/30"
            }`}>
              {emailNotificationsEnabled && savedNotificationEmail
                ? t("active")
                : !savedNotificationEmail
                ? t("status.notConfigured")
                : t("status.paused")}
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveNotificationEmail} className="mt-5 space-y-5">
          {/* Notification Email Input */}
          <div>
            <div className="flex items-center justify-between max-w-xl mb-1.5">
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                {t("notificationRecipientEmail")}
              </label>
              {notificationEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setNotificationEmail("");
                    setHasUserEditedEmail(true);
                  }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
                >
                  <X className="w-3 h-3" /> {t("clearInput")}
                </button>
              )}
            </div>

            <div className="relative max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4 h-4" />
              </div>
              <input
                type="email"
                value={notificationEmail}
                onChange={(e) => {
                  setNotificationEmail(e.target.value);
                  setHasUserEditedEmail(true);
                }}
                placeholder={t("typePersonalEmail")}
                className="w-full bg-slate-950/80 border border-slate-700/80 text-white rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500"
              />
              {notificationEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setNotificationEmail("");
                    setHasUserEditedEmail(true);
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                  title={t("clearInput")}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-xl">
              💡 {t("emailGuidanceNote")}
            </p>
          </div>

          {/* Currently Saved Status */}
          <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 max-w-xl">
            <div className="flex items-start justify-between gap-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                {savedNotificationEmail ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="text-slate-300">
                      {t("activeAlertRecipient")} <strong className="text-cyan-400 font-mono text-sm">{savedNotificationEmail}</strong>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-amber-300">
                      {t("noEmailConfiguredYet")}
                    </div>
                  </>
                )}
              </div>

              {savedNotificationEmail && (
                <button
                  type="button"
                  onClick={async () => {
                    setNotificationEmail("");
                    setSavedNotificationEmail("");
                    try {
                      const token = localStorage.getItem("token");
                      await fetch("http://localhost:5000/api/v1/farmers/notification-email", {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                        body: JSON.stringify({ notificationEmail: null })
                      });
                      setEmailFeedback({ type: "success", text: "Notification email removed successfully." });
                    } catch (e) {
                      console.error(e);
                    }
                  }}
                  className="text-xs text-slate-400 hover:text-rose-400 underline shrink-0"
                >
                  {t("remove")}
                </button>
              )}
            </div>
          </div>

          {/* ON / OFF Switch & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 max-w-xl">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-300">{t("emailNotifications")}</span>
              <button
                type="button"
                onClick={() => setEmailNotificationsEnabled(!emailNotificationsEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                  emailNotificationsEnabled ? "bg-emerald-500" : "bg-slate-700"
                }`}
                role="switch"
                aria-checked={emailNotificationsEnabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    emailNotificationsEnabled ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
              <span className="text-xs font-bold font-mono text-slate-300">
                {emailNotificationsEnabled ? t("status.on") : t("status.off")}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSendTestNotification}
                disabled={testSending || emailSaving || (!notificationEmail && !savedNotificationEmail)}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-cyan-300 border border-cyan-500/30 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-md"
                title={t("sendTestAlert")}
              >
                {testSending ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("sendingTest")}</span>
                  </>
                ) : (
                  <>
                    <Mail className="w-3.5 h-3.5" />
                    <span>{t("sendTestAlert")}</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={emailSaving}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md shadow-emerald-500/20"
              >
                {emailSaving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{t("common.saving")}</span>
                  </>
                ) : (
                  <span>{t("saveChanges")}</span>
                )}
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {emailFeedback && (
            <div className={`p-3 rounded-xl border text-xs font-medium max-w-xl ${
              emailFeedback.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}>
              {emailFeedback.text}
            </div>
          )}

          {/* Delivery Configuration Guidance */}
          <div className="p-3 bg-slate-900/40 border border-slate-800 rounded-xl text-xs text-slate-400 max-w-xl flex items-start gap-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-slate-300 font-semibold">{t("realInboxNote")} </span>
              {t("realInboxDesc")}
            </div>
          </div>
        </form>
      </div>

      {/* Recent Veterinary Interventions Feed */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-white">{t("recentTreatmentsTitle")}</h2>
            <p className="text-xs text-slate-400 mt-0.5">{t("recentTreatmentsDesc")}</p>
          </div>
          <Link
            href="/farmer/treatments"
            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            {t("viewAllHistoryLink")}
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/90 border-b border-slate-800/80">
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("dateCol")}</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("typeCol")}</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("targetAnimalCol")}</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("medicineVaccineCol")}</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("statusCol")}</th>
                <th className="py-3 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">{t("vetCol")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">{t("loadingRecentRecords")}</td>
                </tr>
              ) : treatments.length > 0 ? (
                treatments.slice(0, 5).map((tr) => (
                  <tr key={tr.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-6 text-sm text-slate-400">{new Date(tr.date).toLocaleDateString()}</td>
                    <td className="py-3.5 px-6 text-sm">
                      <span className="flex items-center gap-1.5 text-slate-300">
                        {tr.type === "Medicine" ? <Pill className="w-3.5 h-3.5 text-cyan-400" /> : <Syringe className="w-3.5 h-3.5 text-emerald-400" />}
                        {t(tr.type)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-sm">
                      <div className="text-white font-medium">{tr.animal}</div>
                      <div className="text-xs text-slate-500 font-mono">{tr.tag}</div>
                    </td>
                    <td className="py-3.5 px-6 text-sm font-semibold text-slate-200">{tr.medicine}</td>
                    <td className="py-3.5 px-6 text-sm">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        tr.status === 'Active' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      }`}>
                        {tr.status === 'Active' ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                        {t(tr.status)}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-xs text-slate-400 font-mono">{tr.vet}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">{t("noTreatmentsRecorded")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
