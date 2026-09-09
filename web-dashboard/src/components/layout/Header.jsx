"use client";

import { usePathname, useRouter } from "next/navigation";
import { Bell, Search, User, Shield, Stethoscope, Wheat, FlaskConical, LogOut, Check, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [switching, setSwitching] = useState(false);

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

  if (pathname === "/login" || pathname?.startsWith("/certify/verify")) return null;

  return (
    <header className="min-h-16 py-2 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md flex flex-wrap items-center justify-between px-4 lg:px-8 sticky top-0 z-30 gap-3">
      <div className="flex items-center gap-3 flex-wrap flex-1">
        <div className="relative w-48 sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search tags, farms, or alerts..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs sm:text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        {/* Quick Role Switcher Buttons - Visible Everywhere */}
        <div className="flex items-center gap-1.5 sm:gap-2 border-l border-slate-800/80 pl-2 sm:pl-3 flex-wrap">
          <button
            onClick={() => switchRole("REGULATOR")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
              role === "REGULATOR" 
                ? "bg-emerald-500/25 text-emerald-300 border-emerald-500 shadow-emerald-500/10" 
                : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-emerald-500/40"
            }`}
            title="Switch to FSSAI Payment Area"
          >
            <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="whitespace-nowrap">🛡️ FSSAI Payment</span>
            {role === "REGULATOR" && <Check className="w-3 h-3 text-emerald-400" />}
          </button>

          <button
            onClick={() => switchRole("VETERINARIAN")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
              role === "VETERINARIAN" 
                ? "bg-cyan-500/25 text-cyan-300 border-cyan-500 shadow-cyan-500/10" 
                : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-cyan-500/40"
            }`}
            title="Switch to Veterinarian Medicine Area"
          >
            <Stethoscope className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">🩺 Vet Medicine</span>
            {role === "VETERINARIAN" && <Check className="w-3 h-3 text-cyan-400" />}
          </button>

          <button
            onClick={() => switchRole("FARMER")}
            disabled={switching}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 shadow-sm ${
              role === "FARMER" 
                ? "bg-amber-500/25 text-amber-300 border-amber-500 shadow-amber-500/10" 
                : "bg-slate-950 text-slate-300 hover:text-white border-slate-800 hover:border-amber-500/40"
            }`}
            title="Switch to Farmer Dashboard"
          >
            <Wheat className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="whitespace-nowrap">🌾 Farmer</span>
            {role === "FARMER" && <Check className="w-3 h-3 text-amber-400" />}
          </button>

          {/* Direct Gen AI Hub Shortcut */}
          <button
            onClick={() => router.push("/ai-assistant")}
            className="px-2.5 py-1.5 rounded-lg text-xs font-bold border border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-cyan-500/20 text-emerald-300 hover:text-white hover:border-emerald-400 transition-all flex items-center gap-1.5 shadow-sm shadow-emerald-500/20 group"
            title="Open AgriGuard Gen AI Command Center"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform shrink-0" />
            <span className="whitespace-nowrap">✨ Gen AI Hub</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-slate-900"></span>
        </button>

        <div className="relative">
          <button 
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-3 pl-4 border-l border-slate-800 hover:opacity-80 transition-opacity focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-slate-200">My Account</p>
              <p className="text-xs text-emerald-400 font-semibold uppercase">{role || "Loading..."}</p>
            </div>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-3 w-60 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-2 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-slate-800 mb-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Current Role</span>
                <span className="text-xs font-bold text-white uppercase">{role}</span>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold px-3 pt-1 block">
                  Switch Module Portal
                </span>

                <button
                  onClick={() => switchRole("REGULATOR")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    role === "REGULATOR" ? "bg-emerald-500/20 text-emerald-300 font-bold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    FSSAI Payment Area
                  </span>
                  {role === "REGULATOR" && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>

                <button
                  onClick={() => switchRole("VETERINARIAN")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    role === "VETERINARIAN" ? "bg-cyan-500/20 text-cyan-300 font-bold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Stethoscope className="w-4 h-4 text-cyan-400" />
                    Vet Medicine Area
                  </span>
                  {role === "VETERINARIAN" && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                </button>

                <button
                  onClick={() => switchRole("FARMER")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    role === "FARMER" ? "bg-amber-500/20 text-amber-300 font-bold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Wheat className="w-4 h-4 text-amber-400" />
                    Farmer Dashboard
                  </span>
                  {role === "FARMER" && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </button>

                <button
                  onClick={() => switchRole("FARM_TESTER")}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                    role === "FARM_TESTER" ? "bg-purple-500/20 text-purple-300 font-bold" : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <FlaskConical className="w-4 h-4 text-purple-400" />
                    Tester Dashboard
                  </span>
                  {role === "FARM_TESTER" && <Check className="w-3.5 h-3.5 text-purple-400" />}
                </button>
              </div>

              <div className="border-t border-slate-800 mt-2 pt-1">
                <button 
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors flex items-center gap-2 font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
