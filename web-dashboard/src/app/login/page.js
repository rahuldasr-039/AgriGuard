"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Globe, ChevronDown, Check } from "lucide-react";
import Link from "next/link";
import { useLanguage, LANGUAGES } from "@/context/LanguageContext";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("http://localhost:5000/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("failedToLogin", "Failed to login"));
      }

      // Store token and redirect
      localStorage.setItem("token", data.token);
      localStorage.setItem("userRole", data.user.role);
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }
      
      if (data.user.role === "FARMER") {
        router.push("/farmer");
      } else if (data.user.role === "VETERINARIAN") {
        router.push("/vet");
      } else if (data.user.role === "FARM_TESTER") {
        router.push("/tester");
      } else {
        router.push("/");
      }
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
        <div className="flex justify-center mb-8">
          <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">
          {t("digitalFarmManagement", "Digital Farm Management")}
        </h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          {t("signInSubtitle", "Sign in to the SIH25007 Food Safety Platform")}
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              {t("emailAddress", "Email Address")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="e.g., fssaigovt@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">
              {t("password", "Password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-lg px-4 py-3 transition-colors mt-2"
          >
            {loading ? t("signingIn", "Signing in...") : t("signIn", "Sign In")}
          </button>
        </form>

        <div className="mt-6 text-center">
          <Link href="/register" className="text-xs text-slate-400 hover:text-emerald-400 transition-colors">
            {t("createAccount", "Create Account")} →
          </Link>
        </div>
      </div>
    </div>
  );
}
