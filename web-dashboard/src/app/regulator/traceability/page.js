"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, Search, ShieldCheck, Link as LinkIcon, 
  CheckCircle2, AlertTriangle, Activity, Pill, Syringe, Beaker, MapPin, User 
} from "lucide-react";

export default function RegulatorTraceability() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [traces, setTraces] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTrace, setSelectedTrace] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || role !== "REGULATOR" || !token) {
      router.push("/login");
      return;
    }

    fetch("http://localhost:5000/api/v1/dashboard/traceability")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setTraces(data);
          if (data.length > 0) setSelectedTrace(data[0]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Failed to fetch traceability:", err);
        setLoading(false);
      });
  }, [router]);

  const filteredTraces = traces.filter(t => 
    t.tagId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.farmerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.farmName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.latestHash.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 pb-20">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Food Safety & Blockchain Traceability</h1>
          <p className="text-slate-400">End-to-end immutable audit trail: Farm Origin &rarr; AMU Treatment &rarr; Withdrawal Clearance &rarr; MRL Laboratory Test.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Tag Search and List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search tag (e.g. RJ-CW1), farmer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
          </div>

          <div className="space-y-3 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-6 text-center text-slate-500">Loading trace records...</div>
            ) : filteredTraces.length > 0 ? (
              filteredTraces.map((item) => {
                const isSelected = selectedTrace?.tagId === item.tagId;
                return (
                  <div
                    key={item.tagId}
                    onClick={() => setSelectedTrace(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
                        : "bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/50"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                        {item.tagId}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                        item.overallSafety === 'SAFE / COMPLIANT'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {item.overallSafety}
                      </span>
                    </div>
                    <p className="text-white font-semibold text-sm mb-1">{item.category} ({item.type})</p>
                    <div className="text-xs text-slate-400 flex items-center justify-between">
                      <span>{item.farmerName} • {item.farmName}</span>
                      <span className="text-slate-500">{item.treatmentsCount} treatments</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-6 text-center text-slate-500">No trace records found.</div>
            )}
          </div>
        </div>

        {/* Right Side: Detailed Timeline Audit Trail */}
        <div className="lg:col-span-2">
          {selectedTrace ? (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 backdrop-blur-sm space-y-8">
              {/* Header Info */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-white">{selectedTrace.category}</h2>
                    <span className="font-mono text-sm px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      TAG: {selectedTrace.tagId}
                    </span>
                  </div>
                  <p className="text-sm text-slate-400 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    {selectedTrace.farmName} • {selectedTrace.farmLocation}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Blockchain Hash (Sepolia)</p>
                  <p className="font-mono text-xs text-cyan-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 max-w-xs truncate">
                    {selectedTrace.latestHash}
                  </p>
                </div>
              </div>

              {/* Timeline Steps */}
              <div className="space-y-6">
                {/* Step 1: Farm Origin */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                  </div>
                  <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">Stage 1: Farm Origin & Animal Registration</h3>
                      <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">VERIFIED</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs text-slate-300 mt-3">
                      <div>
                        <span className="text-slate-500 block mb-0.5">Farmer Name</span>
                        <strong className="text-white text-sm">{selectedTrace.farmerName}</strong>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Contact Email</span>
                        <span className="text-slate-300">{selectedTrace.farmerEmail}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block mb-0.5">Assigned Veterinarian</span>
                        <span className="text-indigo-400 font-medium">{selectedTrace.assignedVet}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Step 2: Veterinary Treatments & AMU */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                      <Pill className="w-5 h-5" />
                    </div>
                    <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                  </div>
                  <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-semibold text-white">Stage 2: AMU Administered & Withdrawal Tracking</h3>
                      <span className="text-xs text-slate-400">{selectedTrace.treatments.length} Record(s)</span>
                    </div>
                    {selectedTrace.treatments.length > 0 ? (
                      <div className="space-y-3">
                        {selectedTrace.treatments.map((t, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs flex flex-wrap justify-between items-center gap-3">
                            <div>
                              <strong className="text-cyan-400 text-sm">{t.medicine}</strong>
                              <span className="text-slate-500 ml-2">by {t.vet} on {new Date(t.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-slate-400">Withdrawal: <strong>{t.withdrawalPeriod}</strong></span>
                              <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.status === 'SAFE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {t.status === 'SAFE' ? 'SAFE TO HARVEST' : 'WITHDRAWAL ACTIVE'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500">No antimicrobial drugs administered to this animal.</p>
                    )}
                  </div>
                </div>

                {/* Step 3: Vaccinations */}
                {selectedTrace.vaccinations.length > 0 && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Syringe className="w-5 h-5" />
                      </div>
                      <div className="w-0.5 h-full bg-slate-800 my-2"></div>
                    </div>
                    <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-semibold text-white">Stage 3: Preventative Vaccinations</h3>
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400">0 Days Withdrawal</span>
                      </div>
                      <div className="space-y-2">
                        {selectedTrace.vaccinations.map((v, idx) => (
                          <div key={idx} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-xs flex justify-between items-center">
                            <div>
                              <strong className="text-white text-sm">{v.vaccine}</strong>
                              <span className="text-slate-500 ml-2">Administered {new Date(v.date).toLocaleDateString()} by {v.vet}</span>
                            </div>
                            <span className="text-emerald-400 font-medium">Completed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Step 4: Blockchain Proof */}
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 bg-slate-950/60 border border-slate-800 rounded-xl p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-white">Stage 4: Blockchain Ledger & MRL Compliance</h3>
                      <span className="text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">ETHEREUM SEPOLIA</span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      This food product is verified against the centralized FSSAI MRL standards and timestamped with an immutable cryptographic hash.
                    </p>
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-xs text-slate-400 break-all">
                      Transaction Hash: <span className="text-cyan-400">{selectedTrace.latestHash}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500 bg-slate-900/30 border border-slate-800 rounded-xl">
              Select an animal tag from the left to inspect its complete traceability audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
