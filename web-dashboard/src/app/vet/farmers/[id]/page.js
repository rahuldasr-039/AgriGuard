"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { User, MapPin, Activity, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FarmerDetails({ params }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [farmer, setFarmer] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || !token) {
      router.push("/login");
      return;
    }

    fetch(`http://localhost:5000/api/v1/farmers/${unwrappedParams.id}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    })
    .then(res => res.json())
    .then(data => {
      setFarmer(data);
      setLoading(false);
    })
    .catch(err => {
      console.error("Failed to fetch farmer details:", err);
      setLoading(false);
    });
  }, [unwrappedParams.id, router]);

  if (loading) return <div className="p-8 text-white">Loading details...</div>;
  if (!farmer || farmer.error) return <div className="p-8 text-rose-500">Farmer not found.</div>;

  return (
    <div className="p-8 pb-20">
      <div className="mb-6">
        <Link href="/vet/farmers" className="text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-2 mb-4 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Farmers
        </Link>
        <h1 className="text-3xl font-bold text-white mb-2">Farmer Profile</h1>
        <p className="text-slate-400 font-mono">ID: {farmer.farmerId || farmer.id}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-indigo-400" />
            Contact Information
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Full Name</p>
              <p className="text-slate-200">{farmer.fullName || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-slate-200">{farmer.user?.email || "Unknown"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Phone</p>
              <p className="text-slate-200">{farmer.mobileNumber || "Not Provided"}</p>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2 mb-6">
            <MapPin className="w-5 h-5 text-emerald-400" />
            Farm Details
          </h2>
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Location</p>
              <p className="text-slate-200">{farmer.farmLocation || farmer.fullAddress || "Not Provided"}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                farmer.approvalStatus === 'APPROVED' 
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}>
                {farmer.approvalStatus}
              </span>
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Animals</p>
              <p className="text-slate-200 font-semibold text-lg">
                {farmer.farms?.length > 0 ? farmer.farms.reduce((sum, farm) => {
                  const ind = farm.animals?.length || 0;
                  const bat = farm.batches?.reduce((bSum, b) => bSum + (b.count || 0), 0) || 0;
                  return sum + ind + bat;
                }, 0) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Animal Inventory */}
      <div className="mt-8 bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-semibold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400" />
            Registered Animals & Batches
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900/80 border-b border-slate-800">
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag ID</th>
                <th className="py-3.5 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Count / Weight</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {farmer.farms?.flatMap(farm => [
                ...(farm.animals || []).map(a => ({
                  id: a.id,
                  category: a.category,
                  type: "Individual",
                  tag: a.tag?.tag || "No Tag",
                  count: `1 (${a.weight || 400} kg)`
                })),
                ...(farm.batches || []).map(b => ({
                  id: b.id,
                  category: b.category,
                  type: "Batch",
                  tag: b.tag?.tag || "No Tag",
                  count: `${b.count} animals`
                }))
              ]).map(item => (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-6 text-sm text-white font-medium">{item.category}</td>
                  <td className="py-3.5 px-6 text-sm text-slate-300">
                    <span className={`px-2 py-0.5 rounded text-xs ${item.type === "Individual" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                      {item.type}
                    </span>
                  </td>
                  <td className="py-3.5 px-6 text-sm text-slate-400 font-mono">{item.tag}</td>
                  <td className="py-3.5 px-6 text-sm text-slate-300">{item.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
