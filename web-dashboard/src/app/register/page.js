"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    address: "",
    role: "FARMER"
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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

      setSuccess("Registration successful! Your application is pending verification.");
      setTimeout(() => {
        router.push("/login");
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="bg-emerald-500/20 p-4 rounded-full border border-emerald-500/30">
            <ShieldCheck className="w-10 h-10 text-emerald-500" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-white text-center mb-2">Create Account</h1>
        <p className="text-slate-400 text-center mb-6 text-sm">Join the SIH25007 Food Safety Platform</p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-3 rounded-lg mb-6 text-sm font-medium">
            {success} Redirecting to login...
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Full Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              required
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Email Address</label>
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
              <label className="block text-slate-300 text-sm font-medium mb-1">Phone</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-1">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({...formData, role: e.target.value})}
                className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="FARMER">Farmer</option>
                <option value="VETERINARIAN">Veterinarian</option>
                <option value="FARM_TESTER">Farm Tester</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Location / Address</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({...formData, address: e.target.value})}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
          <div>
            <label className="block text-slate-300 text-sm font-medium mb-1">Password</label>
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
            {loading ? "Registering..." : "Create Account"} <ArrowRight className="w-4 h-4" />
          </button>
        </form>
        
        <p className="text-slate-400 text-sm text-center mt-6">
          Already have an account? <Link href="/login" className="text-emerald-400 hover:underline">Sign In</Link>
        </p>
      </div>
    </div>
  );
}
