"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Activity, AlertTriangle, Settings, FileText, 
  Beaker, Bot, Users, Syringe, ClipboardList, Pill, Coins, Award, ShieldCheck 
} from "lucide-react";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [switching, setSwitching] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    const userRole = localStorage.getItem("userRole");
    setRole(userRole || "REGULATOR"); // fallback
  }, [pathname]);

  const switchPortal = async (targetRole, targetPath) => {
    setSwitching(true);
    let email = "fssaigovt@gmail.com";
    let password = "Fssai@123";
    if (targetRole === "VETERINARIAN") {
      email = "vet1@example.com";
      password = "Password@123";
    } else if (targetRole === "FARMER") {
      email = "farmer1@gmail.com";
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
      console.error("Portal switch error:", e);
      window.location.href = targetPath;
    } finally {
      setSwitching(false);
    }
  };

  if (pathname === "/login" || pathname?.startsWith("/certify/verify")) return null;

  const getNavItems = () => {
    switch (role) {
      case "FARMER":
        return [
          { name: t("myFarmAndCert"), emoji: "👨‍🌾", href: "/farmer", icon: LayoutDashboard },
          { name: t("myAnimals"), emoji: "🐄", href: "/farmer/animals", icon: Users },
          { name: t("treatmentAndWithdrawal"), emoji: "💊", href: "/farmer/treatments", icon: Activity },
          { name: t("subsidiesAndDbt"), emoji: "💰", href: "/farmer/subsidies", icon: Coins },
          { name: t("aiAssistant"), emoji: "🤖", href: "/ai-assistant", icon: Bot },
        ];
      case "VETERINARIAN":
        return [
          { name: t("vetDashboard"), emoji: "👨‍⚕️", href: "/vet", icon: LayoutDashboard },
          { name: t("myFarmers", "My Farmers"), emoji: "👥", href: "/vet/farmers", icon: Users },
          { name: t("vaccinationPassport", "Vaccination Passport"), emoji: "💉", href: "/vet/vaccinate", icon: Syringe },
          { name: t("prescribeMedicine", "Prescribe Medicine"), emoji: "💊", href: "/vet/medicine", icon: Pill },
          { name: t("amuTracking", "AMU Tracking"), emoji: "📊", href: "/vet/amu", icon: Activity },
          { name: t("aiAssistant"), emoji: "🤖", href: "/ai-assistant", icon: Bot },
        ];
      case "FARM_TESTER":
        return [
          { name: t("testerDashboard"), emoji: "🧑‍🔬", href: "/tester", icon: LayoutDashboard },
          { name: t("wasteCompensation", "Waste & Compensation"), emoji: "💰", href: "/tester?tab=waste", icon: Coins },
          { name: t("newLabAssay", "New Lab Assay"), emoji: "🧪", href: "/tester/new-test", icon: Beaker },
          { name: t("testHistory", "Test History"), emoji: "📋", href: "/tester/history", icon: ClipboardList },
          { name: t("mrlAnalysis", "MRL Analysis"), emoji: "🔬", href: "/tester/mrl", icon: Activity },
          { name: t("aiAssistant"), emoji: "🤖", href: "/ai-assistant", icon: Bot },
        ];
      case "REGULATOR":
      default:
        return [
          { name: t("regulatorDashboard"), emoji: "🏛️", href: "/", icon: LayoutDashboard },
          { name: t("mrlCertification", "MRL Certification"), emoji: "📜", href: "/regulator/certify", icon: Award },
          { name: t("wasteSubsidy", "Waste & Subsidy"), emoji: "💰", href: "/regulator/waste-subsidy", icon: Coins },
          { name: t("farmers", "Farmers"), emoji: "🌾", href: "/regulator/farmers", icon: Users },
          { name: t("veterinarians", "Veterinarians"), emoji: "🩺", href: "/regulator/vets", icon: Users },
          { name: t("farmTesters", "Farm Testers"), emoji: "🔬", href: "/regulator/testers", icon: Users },
          { name: t("traceability", "Traceability"), emoji: "🔗", href: "/regulator/traceability", icon: FileText },
          { name: t("mrlReports", "MRL Reports"), emoji: "🧪", href: "/mrl-reports", icon: Beaker },
          { name: t("amuAnalytics", "AMU Analytics"), emoji: "📈", href: "/amu-logs", icon: Activity },
          { name: t("alerts", "Alerts"), emoji: "🔔", href: "/alerts", icon: AlertTriangle },
          { name: t("aiAssistant"), emoji: "🤖", href: "/ai-assistant", icon: Bot },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 h-screen flex flex-col bg-white border-r border-gray-200 text-slate-700 shadow-xs">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-5 border-b border-gray-200 bg-white">
        <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-300 flex items-center justify-center text-xl shrink-0 shadow-xs">
          🛡️
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">
            AgriGuard
          </h1>
          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mt-0.5">AMU & MRL Safety</p>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href === "/farmer" && pathname === "/farmer/certificate") || (item.href === "/farmer/treatments" && pathname === "/farmer/withdrawals");
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-xs font-semibold ${
                    isActive 
                      ? "bg-emerald-50 text-emerald-900 border border-emerald-400/80 shadow-xs" 
                      : "text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-800"
                  }`}
                >
                  <span className="text-sm shrink-0">{item.emoji}</span>
                  <span className="truncate">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Direct Portal Shortcuts for instant access */}
      <div className="p-3 border-t border-gray-200 bg-gray-50/70">
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 px-1">{t("switchRolePortal", "Switch Role Portal")}</p>
        <div className="space-y-1">
          <button
            onClick={() => switchPortal("REGULATOR", "/regulator/waste-subsidy")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
              role === "REGULATOR"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-400 shadow-xs"
                : "text-slate-600 hover:text-emerald-900 hover:bg-white"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span>🛡️</span>
              <span className="truncate">{t("fssaiPaymentShort", "FSSAI Payment")}</span>
            </span>
            {role === "REGULATOR" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
          </button>

          <button
            onClick={() => switchPortal("VETERINARIAN", "/vet/medicine")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
              role === "VETERINARIAN"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-400 shadow-xs"
                : "text-slate-600 hover:text-emerald-900 hover:bg-white"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span>🩺</span>
              <span className="truncate">{t("vetMedicineShort", "Vet Medicine")}</span>
            </span>
            {role === "VETERINARIAN" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
          </button>

          <button
            onClick={() => switchPortal("FARMER", "/farmer")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all text-left ${
              role === "FARMER"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-400 shadow-xs"
                : "text-slate-600 hover:text-emerald-900 hover:bg-white"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span>🌾</span>
              <span className="truncate">{t("farmerDashboardShort", "Farmer Dashboard")}</span>
            </span>
            {role === "FARMER" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>}
          </button>
        </div>
      </div>

      {/* Network Status */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-2.5">
          <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-1">🔗 {t("blockchainAudit", "Blockchain Audit")}</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span className="text-xs font-semibold text-emerald-900">{t("sepoliaConnected", "Sepolia Connected")}</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
