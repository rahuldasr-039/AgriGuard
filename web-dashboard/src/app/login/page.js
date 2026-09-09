"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        throw new Error(data.error || "Failed to login");
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

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-8">
          <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-12 h-12 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Digital Farm Management</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">Sign in to the SIH25007 Food Safety Platform</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-2">Email Address</label>
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
            <label className="block text-slate-300 text-sm font-medium mb-2">Password</label>
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
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}
