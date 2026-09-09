"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, Activity, AlertTriangle, Settings, FileText, 
  Beaker, Bot, Users, Syringe, ClipboardList, Pill, Coins, Award, ShieldCheck 
} from "lucide-react";
import { useEffect, useState } from "react";

export default function Sidebar() {
  const pathname = usePathname();
  const [role, setRole] = useState(null);
  const [switching, setSwitching] = useState(false);

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
          { name: "My Farm", href: "/farmer", icon: LayoutDashboard },
          { name: "My Animals", href: "/farmer/animals", icon: Users },
          { name: "Treatments", href: "/farmer/treatments", icon: Activity },
          { name: "Withdrawal Calendar", href: "/farmer/withdrawals", icon: AlertTriangle },
          { name: "My MRL Certificate", href: "/farmer/certificate", icon: Award },
          { name: "Subsidies & DBT", href: "/farmer/subsidies", icon: Coins },
          { name: "AgriGuard Gen AI", href: "/ai-assistant", icon: Bot },
        ];
      case "VETERINARIAN":
        return [
          { name: "Vet Dashboard", href: "/vet", icon: LayoutDashboard },
          { name: "My Farmers", href: "/vet/farmers", icon: Users },
          { name: "Vaccinate", href: "/vet/vaccinate", icon: Syringe },
          { name: "Give Medicine", href: "/vet/medicine", icon: Pill },
          { name: "AMU Tracking", href: "/vet/amu", icon: Activity },
          { name: "AgriGuard Gen AI", href: "/ai-assistant", icon: Bot },
        ];
      case "FARM_TESTER":
        return [
          { name: "Tester Dashboard", href: "/tester", icon: LayoutDashboard },
          { name: "Waste & Compensation", href: "/tester?tab=waste", icon: Coins },
          { name: "New Product Test", href: "/tester/new-test", icon: Beaker },
          { name: "Test History", href: "/tester/history", icon: ClipboardList },
          { name: "MRL Analysis", href: "/tester/mrl", icon: Activity },
          { name: "AgriGuard Gen AI", href: "/ai-assistant", icon: Bot },
        ];
      case "REGULATOR":
      default:
        return [
          { name: "Regulator Dashboard", href: "/", icon: LayoutDashboard },
          { name: "MRL Certification", href: "/regulator/certify", icon: Award },
          { name: "Waste & Subsidy", href: "/regulator/waste-subsidy", icon: Coins },
          { name: "Farmers", href: "/regulator/farmers", icon: Users },
          { name: "Veterinarians", href: "/regulator/vets", icon: Users },
          { name: "Farm Testers", href: "/regulator/testers", icon: Users },
          { name: "Traceability", href: "/regulator/traceability", icon: FileText },
          { name: "MRL Reports", href: "/mrl-reports", icon: Beaker },
          { name: "AMU Analytics", href: "/amu-logs", icon: Activity },
          { name: "Alerts", href: "/alerts", icon: AlertTriangle },
          { name: "AgriGuard Gen AI", href: "/ai-assistant", icon: Bot },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <aside className="w-64 h-screen flex flex-col bg-slate-900 border-r border-slate-800 text-slate-300">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          AgriGuard
        </h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group ${
                    isActive ? "bg-emerald-500/10 text-emerald-400" : "hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-colors ${
                    isActive ? "text-emerald-400" : "text-slate-500 group-hover:text-emerald-400"
                  }`} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Direct Portal Shortcuts for instant access */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-2 px-1">Portals & Modules</p>
        <div className="space-y-1">
          <button
            onClick={() => switchPortal("REGULATOR", "/regulator/waste-subsidy")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              role === "REGULATOR"
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-emerald-400">🛡️</span>
              <span className="truncate">FSSAI Payment Area</span>
            </span>
            {role === "REGULATOR" && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0"></span>}
          </button>

          <button
            onClick={() => switchPortal("VETERINARIAN", "/vet/medicine")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              role === "VETERINARIAN"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-cyan-400">🩺</span>
              <span className="truncate">Vet Medicine Area</span>
            </span>
            {role === "VETERINARIAN" && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0"></span>}
          </button>

          <button
            onClick={() => switchPortal("FARMER", "/farmer")}
            disabled={switching}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
              role === "FARMER"
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                : "text-slate-400 hover:text-white hover:bg-slate-800/60"
            }`}
          >
            <span className="flex items-center gap-2 truncate">
              <span className="text-amber-400">🌾</span>
              <span className="truncate">Farmer Dashboard</span>
            </span>
            {role === "FARMER" && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0"></span>}
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800 rounded-lg p-4">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Network Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></div>
            <span className="text-sm font-medium text-slate-200">Sepolia Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
