"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight, Globe, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    notificationEmail: "",
    address: "",
    role: "FARMER"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      setSuccess(t("registrationSuccess", "Registration successful! Your application is pending verification."));
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const activeLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative">
      {/* Top Bar Language Selector */}
      <div className="absolute top-6 right-6 z-20">
        <div className="relative">
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-200 transition-all shadow-lg"
          >
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{activeLang.flag} {activeLang.native}</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-1.5 z-50 animate-in fade-in max-h-80 overflow-y-auto">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 mb-1">
                {t("chooseLanguage", "Choose Language (12 Indian Languages)")}
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    setLanguage(lang.code);
                    setShowLangDropdown(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                    language === lang.code
                      ? "bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.native}</span>
                    <span className="text-[10px] text-slate-500">({lang.name})</span>
                  </div>
                  {language === lang.code && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {t("createAccount", "Create Account")}
        </h1>
        <p className="text-slate-400 text-center mb-6 text-sm">
          {t("joinPlatformSubtitle", "Join the SIH25007 Food Safety Platform")}
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {success} {t("redirectingToLogin", "Redirecting to login...")}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              {t("fullName", "Full Name")}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              {t("emailAddress", "Email Address")}
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                {formData.role === "FARMER" ? t("registeredMobile", "Registered Mobile") : t("phone", "Phone")}
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="e.g. 8610528491"
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">
                {t("role", "Role")}
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="FARMER">{t("roleFarmer", "Farmer")}</option>
                <option value="VETERINARIAN">{t("roleVet", "Veterinarian")}</option>
                <option value="FARM_TESTER">{t("roleTester", "Farm Tester")}</option>
              </select>
            </div>
          </div>

          {formData.role === "FARMER" && (
            <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                  {t("emailNotificationChannel", "Email Notification Channel")}
                </label>
                <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30">
                  Active
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t("notificationChannelDesc", "Treatment records, withdrawal alerts, MRL lab results, and FSSAI certifications will be automatically delivered to your registered email address.")}
              </p>
            </div>
          )}
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              {t("locationAddress", "Location / Address")}
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">
              {t("password", "Password")}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading || success !== ""}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-semibold rounded-lg px-4 py-3 transition-colors mt-4 flex items-center justify-center gap-2"
          >
            {loading ? t("registering", "Registering...") : t("createAccount", "Create Account")} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <p className="text-slate-400 text-sm text-center mt-6">
          {t("alreadyHaveAccount", "Already have an account?")} <Link href="/login" className="text-emerald-400 hover:underline">{t("signIn", "Sign In")}</Link>
        </p>
      </div>
    </div>
  );
}
