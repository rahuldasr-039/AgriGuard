"use client";

import { usePathname, useRouter } from "next/navigation";
import { 
  Bell, Search, User, Shield, Stethoscope, Wheat, FlaskConical, 
  LogOut, Check, Sparkles, Globe, ChevronDown, Sun, Moon 
} from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);
  const langRef = useRef(null);
  const { language, setLanguage, languages, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userRole");
    localStorage.removeItem("user");
    setShowDropdown(false);
    router.push("/login");
  };

  const switchRole = async (targetRole) => {
    setSwitching(true);
    let email = "fssaigovt@gmail.com";
    let password = "Fssai@123";
    let targetPath = "/regulator/waste-subsidy";

    if (targetRole === "VETERINARIAN") {
      email = "vet1@example.com";
      password = "Password@123";
      targetPath = "/vet/medicine";
    } else if (targetRole === "FARMER") {
      email = "farmer1@gmail.com";
      password = "Password@123";
      targetPath = "/farmer";
    } else if (targetRole === "FARM_TESTER") {
      email = "tester1@example.com";
      password = "Password@123";
      targetPath = "/tester?tab=waste";
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
        setRole(data.user.role);
        setShowDropdown(false);
        window.location.href = targetPath;
      }
    } catch (e) {
      console.error("Role switch error:", e);
      window.location.href = targetPath;
    } finally {
      setSwitching(false);
    }
  };

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "REGULATOR");
  }, [pathname]);

  // Click outside to close language dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (langRef.current && !langRef.current.contains(e.target)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login" || pathname?.startsWith("/certify/verify")) return null;

  const currentLangObj = languages.find(l => l.code === language) || languages[0];

  return (
    <header className="min-h-16 py-2 border-b border-gray-200 bg-white flex flex-wrap items-center justify-between px-4 lg:px-8 sticky top-0 z-30 gap-3 shadow-xs">
      <div className="flex items-center gap-3 flex-wrap flex-1">
        {/* Universal Search Input */}
        <div className="relative w-52 sm:w-72">
          <Search className="w-4 h-4 text-emerald-700/60 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            title="Search by Farmer ID, Animal Tag, Treatment, or Certificate"
            className="w-full bg-white border border-gray-300 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all shadow-xs"
          />
        </div>

        {/* Quick Role Switcher Buttons - Clean White & Soft Green */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-l border-gray-200 pl-2 sm:pl-3 flex-wrap">
          <button
            onClick={() => switchRole("REGULATOR")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs ${
              role === "REGULATOR" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-500 font-bold" 
                : "bg-white text-slate-600 hover:text-emerald-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
            title="Switch to FSSAI Payment Area"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">🛡️ {t("fssaiPaymentShort", "FSSAI")}</span>
            {role === "REGULATOR" && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          <button
            onClick={() => switchRole("VETERINARIAN")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs ${
              role === "VETERINARIAN" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-500 font-bold" 
                : "bg-white text-slate-600 hover:text-emerald-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
            title={t("vetMedicine", "Switch to Veterinarian Medicine Area")}
          >
            <Stethoscope className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">🩺 {t("vetMedicineShort", "Vet")}</span>
            {role === "VETERINARIAN" && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          <button
            onClick={() => switchRole("FARMER")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-xs ${
              role === "FARMER" 
                ? "bg-emerald-50 text-emerald-800 border-emerald-500 font-bold" 
                : "bg-white text-slate-600 hover:text-emerald-800 border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40"
            }`}
            title={t("farmerDashboard", "Switch to Farmer Dashboard")}
          >
            <Wheat className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="whitespace-nowrap">🌾 {t("farmerDashboardShort", "Farmer")}</span>
            {role === "FARMER" && <Check className="w-3 h-3 text-emerald-600" />}
          </button>

          {/* Direct Gen AI Hub Shortcut */}
          <button
            onClick={() => router.push("/ai-assistant")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100/80 transition-all flex items-center gap-1.5 shadow-xs"
            title={t("aiCommandCenter", "Open AgriGuard Gen AI Command Center")}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span className="whitespace-nowrap">✨ {t("genAi", "Gen AI")}</span>
          </button>
        </div>
      </div>

      {/* Right Controls: ☀️/🌙 Theme Toggle + 🔔 Notifications + 🌐 Language Selector + 👤 Account */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* ☀️ / 🌙 Dual Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          id="theme-toggle-btn"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-slate-700 hover:bg-emerald-50/60 shadow-xs transition-all cursor-pointer"
          title={theme === "dark" ? `Switch to ${t("themeLight", "Light")} (☀️)` : `Switch to ${t("themeDark", "Dark")} (🌙)`}
          aria-label="Toggle Light/Dark Theme"
        >
          {theme === "dark" ? (
            <>
              <Sun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="font-semibold text-amber-400">☀️ {t("themeLight", "Light")}</span>
            </>
          ) : (
            <>
              <Moon className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="font-semibold text-slate-700">🌙 {t("themeDark", "Dark")}</span>
            </>
          )}
        </button>

        {/* 🔔 Notifications */}
        <button 
          onClick={() => router.push("/alerts")}
          className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50/60 rounded-lg transition-colors border border-gray-200 shadow-xs"
          title={t("notifications")}
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-emerald-500 rounded-full"></span>
        </button>

        {/* 🌐 Language Selector Dropdown (Requirement 6) */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-emerald-50/50 hover:border-emerald-300 text-xs font-semibold text-slate-700 shadow-xs transition-all"
            title={t("chooseLanguage", "Select Language")}
          >
            <Globe className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="font-medium text-slate-800">{currentLangObj.native}</span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {showLangDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 z-50 animate-in fade-in max-h-80 overflow-y-auto">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-gray-100">
                {t("chooseLanguage", "Choose Language (12 Indian Languages)")}
              </div>
              <div className="py-1">
                {languages.map((l) => {
                  const isSelected = l.code === language;
                  return (
                    <button
                      key={l.code}
                      onClick={() => {
                        setLanguage(l.code);
                        setShowLangDropdown(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors ${
                        isSelected 
                          ? "bg-emerald-50 text-emerald-800 font-bold" 
                          : "text-slate-700 hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <span>{l.flag}</span>
                        <span>{l.native}</span>
                        <span className="text-[10px] text-slate-400 font-normal">({l.name})</span>
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 👤 User Account Profile */}
        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2.5 pl-3 border-l border-gray-200 hover:opacity-90 transition-opacity focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <User className="w-4 h-4" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-800 leading-tight">{t("myAccount", "My Account")}</p>
              <p className="text-[10px] text-emerald-700 font-semibold uppercase">{t(role || "REGULATOR")}</p>
            </div>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden p-2 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-gray-100 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">{t("currentRole", "Current Role")}</span>
                <span className="text-xs font-bold text-emerald-800 uppercase">{t(role || "REGULATOR")}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold px-3 pt-1 block">
                  {t("switchPortal", "Switch Portal")}
                </span>

                <button
                  onClick={() => switchRole("REGULATOR")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    role === "REGULATOR" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    {t("fssaiPayment", "FSSAI Payment Area")}
                  </span>
                  {role === "REGULATOR" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => switchRole("VETERINARIAN")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    role === "VETERINARIAN" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-emerald-600" />
                    {t("vetMedicine", "Vet Medicine Area")}
                  </span>
                  {role === "VETERINARIAN" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => switchRole("FARMER")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    role === "FARMER" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-emerald-600" />
                    {t("farmerDashboard", "Farmer Dashboard")}
                  </span>
                  {role === "FARMER" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>

                <button
                  onClick={() => switchRole("FARM_TESTER")}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                    role === "FARM_TESTER" ? "bg-emerald-50 text-emerald-800 font-bold" : "text-slate-700 hover:bg-gray-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-emerald-600" />
                    {t("testerDashboard", "Tester Dashboard")}
                  </span>
                  {role === "FARM_TESTER" && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                </button>
              </div>

              <div className="border-t border-gray-100 mt-2 pt-1">
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  {t("signOut", "Sign Out")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
