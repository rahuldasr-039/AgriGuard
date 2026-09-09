"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, Search, Plus, Filter, LayoutGrid, Table as TableIcon,
  AlertTriangle, CheckCircle2, Clock, ShieldCheck, X, Copy,
  ExternalLink, Sparkles, RefreshCw, ChevronRight, Info,
  MinusCircle, TrendingDown, ArrowDownRight, Tag, HelpCircle, FileText
} from "lucide-react";

export default function MyAnimals() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [animals, setAnimals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL"); // ALL | WITHDRAWAL | SAFE
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  
  // Add Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    category: "Cow",
    tag: "",
    species: "Bovine",
    breed: "Holstein Friesian",
    gender: "Female",
    count: 1,
    weight: 420,
    isBatch: false,
    healthStatus: "SAFE",
    notes: ""
  });
  const [submitting, setSubmitting] = useState(false);

  // Reduce / Deregister Modal State
  const [animalToReduce, setAnimalToReduce] = useState(null);
  const [reduceForm, setReduceForm] = useState({
    reductionCount: 1,
    reason: "Commercial Market Sale",
    destination: "",
    notes: ""
  });
  const [reducing, setReducing] = useState(false);

  // Detail Passport Modal
  const [selectedAnimal, setSelectedAnimal] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const fetchAnimals = async () => {
    const role = localStorage.getItem("userRole");
    const token = localStorage.getItem("token");
    if (!role || !token) {
      router.push("/login");
      return;
    }
    if (role !== "FARMER") {
      router.push("/");
      return;
    }

    try {
      const res = await fetch("http://localhost:5000/api/v1/farmers/my-profile", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      const realAnimals = [];
      const now = new Date();

      if (data && data.farms) {
        data.farms.forEach(farm => {
          if (farm.animals) {
            farm.animals.forEach(a => {
              const activeTreatments = a.tag?.treatments?.filter(t => 
                t.withdrawal && new Date(t.withdrawal.safeFromDate) > now
              ) || [];
              const hasActiveWithdrawal = a.status === "WITHDRAWAL" || activeTreatments.length > 0;
              
              realAnimals.push({
                id: a.id,
                animal: a.category,
                category: a.category,
                species: a.species || a.category,
                count: 1,
                weight: a.weight || 350,
                tag: a.tag?.tag || "No Tag",
                tagObj: a.tag,
                status: hasActiveWithdrawal ? "Withdrawal" : "Safe",
                isBatch: false,
                treatments: a.tag?.treatments || [],
                activeTreatments
              });
            });
          }
          if (farm.batches) {
            farm.batches.forEach(b => {
              const activeTreatments = b.tag?.treatments?.filter(t => 
                t.withdrawal && new Date(t.withdrawal.safeFromDate) > now
              ) || [];
              const hasActiveWithdrawal = b.status === "WITHDRAWAL" || activeTreatments.length > 0;

              realAnimals.push({
                id: b.id,
                animal: `${b.category} (Batch)`,
                category: b.category,
                species: b.species || b.category,
                count: b.count,
                tag: b.tag?.tag || "No Tag",
                tagObj: b.tag,
                status: hasActiveWithdrawal ? "Withdrawal" : "Safe",
                isBatch: true,
                treatments: b.tag?.treatments || [],
                activeTreatments
              });
            });
          }
        });
      }

      setAnimals(realAnimals);
    } catch (err) {
      console.error("Failed to fetch animals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnimals();
  }, [router]);

  // Species mapping
  const getCategoryAvatar = (category) => {
    const c = (category || "").toLowerCase();
    if (c.includes("cow") || c.includes("cattle") || c.includes("bovine")) return { emoji: "🐄", bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" };
    if (c.includes("buffalo")) return { emoji: "🐃", bg: "bg-blue-500/10 border-blue-500/30 text-blue-300" };
    if (c.includes("goat") || c.includes("sheep")) return { emoji: "🐐", bg: "bg-amber-500/10 border-amber-500/30 text-amber-300" };
    if (c.includes("pig")) return { emoji: "🐖", bg: "bg-rose-500/10 border-rose-500/30 text-rose-300" };
    if (c.includes("fish")) return { emoji: "🐟", bg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300" };
    if (c.includes("chicken") || c.includes("poultry")) return { emoji: "🐔", bg: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300" };
    return { emoji: "🐾", bg: "bg-slate-500/10 border-slate-500/30 text-slate-300" };
  };

  // Filtered Animals
  const filteredAnimals = useMemo(() => {
    return animals.filter(a => {
      const matchesSearch = 
        a.animal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.tag.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.category.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = 
        statusFilter === "ALL" || 
        (statusFilter === "WITHDRAWAL" && a.status === "Withdrawal") ||
        (statusFilter === "SAFE" && a.status === "Safe");

      const matchesCategory = 
        categoryFilter === "ALL" || a.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [animals, searchTerm, statusFilter, categoryFilter]);

  // Counts
  const withdrawalCount = animals.filter(a => a.status === "Withdrawal").length;
  const safeCount = animals.filter(a => a.status === "Safe").length;
  const totalCount = animals.reduce((sum, a) => sum + (a.count || 1), 0);

  // Handle Add Animal
  const handleAddAnimal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/v1/farmers/my-animals", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(addForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to register animal");

      setShowAddModal(false);
      setToastMessage(data.message || `Animal tag ${addForm.tag || "new"} registered successfully!`);
      setTimeout(() => setToastMessage(null), 4000);
      setAddForm({
        category: "Cow",
        tag: "",
        species: "Bovine",
        breed: "Holstein Friesian",
        gender: "Female",
        count: 1,
        weight: 420,
        isBatch: false,
        healthStatus: "SAFE",
        notes: ""
      });
      fetchAnimals();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Reduce / Deregister Animal
  const handleReduceAnimal = async (e) => {
    e.preventDefault();
    if (!animalToReduce) return;
    setReducing(true);
    const token = localStorage.getItem("token");

    try {
      const res = await fetch("http://localhost:5000/api/v1/farmers/my-animals/reduce", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          animalId: animalToReduce.id,
          isBatch: animalToReduce.isBatch,
          reductionCount: animalToReduce.isBatch ? parseInt(reduceForm.reductionCount) : 1,
          reason: reduceForm.reason,
          notes: `${reduceForm.notes}${reduceForm.destination ? " | Destination: " + reduceForm.destination : ""}`
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reduce animal count");

      setToastMessage(data.message || "Livestock inventory updated successfully!");
      setTimeout(() => setToastMessage(null), 4000);
      setAnimalToReduce(null);
      if (selectedAnimal?.id === animalToReduce.id) {
        setSelectedAnimal(null);
      }
      fetchAnimals();
    } catch (err) {
      alert(err.message);
    } finally {
      setReducing(false);
    }
  };

  const copyTag = (tag) => {
    navigator.clipboard.writeText(tag);
    setToastMessage(`Tag ${tag} copied to clipboard!`);
    setTimeout(() => setToastMessage(null), 2500);
  };

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-sm font-semibold animate-in fade-in slide-in-from-bottom-5">
          <CheckCircle2 className="w-5 h-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Livestock & Herd Registry</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              {totalCount} Total Head
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Register new animals, monitor statutory food safety clearance, or record stock reductions with mandatory compliance reasons.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => fetchAnimals()}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Register Animal / Batch</span>
          </button>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Total Head Count</span>
          <div className="text-2xl font-bold text-white">{loading ? "..." : totalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-amber-300 font-medium">Under Active Hold</span>
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
          </div>
          <div className="text-2xl font-bold text-amber-400">{loading ? "..." : withdrawalCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Market Ready & Safe</span>
          <div className="text-2xl font-bold text-emerald-400">{loading ? "..." : safeCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs text-indigo-300 font-medium block mb-1">Registered Batches</span>
          <div className="text-2xl font-bold text-indigo-400">
            {loading ? "..." : animals.filter(a => a.isBatch).length}
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by animal category, species, or tag (e.g. RJ-CW1)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("grid")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "grid" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Card Grid</span>
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                viewMode === "table" ? "bg-slate-800 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Detailed Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>
          {[
            { id: "ALL", label: `All Stock (${animals.length})` },
            { id: "SAFE", label: `✅ Safe to Harvest (${safeCount})` },
            { id: "WITHDRAWAL", label: `⚠️ In Quarantine (${withdrawalCount})`, highlight: "text-amber-400 border-amber-500/30 bg-amber-500/10" }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                statusFilter === f.id
                  ? (f.highlight || "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40")
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full py-16 text-center text-slate-500">Loading livestock records...</div>
          ) : filteredAnimals.length > 0 ? (
            filteredAnimals.map((item) => {
              const avatar = getCategoryAvatar(item.category);
              const inWithdrawal = item.status === "Withdrawal";

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedAnimal(item)}
                  className={`group rounded-2xl border p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02] relative ${
                    inWithdrawal
                      ? "bg-slate-900/80 border-amber-500/40 hover:border-amber-500/70 shadow-lg shadow-amber-500/5"
                      : "bg-slate-900/60 border-slate-800/80 hover:border-cyan-500/40 hover:bg-slate-900/80"
                  }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${avatar.bg}`}>
                        {avatar.emoji}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {item.animal}
                        </h3>
                        <span className="text-xs text-slate-400">{item.species}</span>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      inWithdrawal
                        ? "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse"
                        : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                      {inWithdrawal ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                      {item.status}
                    </span>
                  </div>

                  <div className="space-y-2 mb-4 text-xs text-slate-300">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">Official Tag / RFID</span>
                      <strong className="font-mono text-cyan-400 flex items-center gap-1">
                        {item.tag}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800/80">
                      <span className="text-slate-500">{item.isBatch ? "Batch Head Count" : "Registered Weight"}</span>
                      <strong className="text-white font-mono text-sm">
                        {item.isBatch ? `${item.count} head` : `${item.weight} kg`}
                      </strong>
                    </div>
                  </div>

                  {/* Card Bottom Actions */}
                  <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between gap-2 text-xs">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnimal(item);
                      }}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors flex items-center justify-center gap-1"
                    >
                      Passport <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Reduce / Deregister Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setAnimalToReduce(item);
                        setReduceForm({
                          reductionCount: item.isBatch ? Math.min(10, item.count) : 1,
                          reason: "Commercial Market Sale",
                          destination: "",
                          notes: ""
                        });
                      }}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 hover:border-rose-500/40 transition-colors flex items-center gap-1 font-semibold text-xs"
                      title="Reduce count or deregister livestock"
                    >
                      <MinusCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Reduce</span>
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-16 text-center text-slate-500">No animals found matching filters.</div>
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Animal / Batch</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Tag ID</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Count / Weight</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">Loading animals...</td>
                  </tr>
                ) : filteredAnimals.length > 0 ? (
                  filteredAnimals.map((item) => {
                    const avatar = getCategoryAvatar(item.category);
                    const inWithdrawal = item.status === "Withdrawal";

                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setSelectedAnimal(item)}
                        className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                      >
                        <td className="py-4 px-6 text-sm font-bold text-white flex items-center gap-3">
                          <span className="text-xl">{avatar.emoji}</span>
                          <div>
                            <div>{item.animal}</div>
                            <div className="text-xs text-slate-500 font-normal">{item.species}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm font-mono text-cyan-400 font-semibold">{item.tag}</td>
                        <td className="py-4 px-6 text-sm text-slate-300">{item.category}</td>
                        <td className="py-4 px-6 text-sm font-mono text-slate-200">
                          {item.isBatch ? `${item.count} head` : `${item.weight} kg`}
                        </td>
                        <td className="py-4 px-6 text-sm">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                            inWithdrawal
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          }`}>
                            {inWithdrawal ? <Clock className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                            {item.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-sm text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAnimal(item);
                              }}
                              className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                            >
                              Passport
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setAnimalToReduce(item);
                                setReduceForm({
                                  reductionCount: item.isBatch ? Math.min(10, item.count) : 1,
                                  reason: "Commercial Market Sale",
                                  destination: "",
                                  notes: ""
                                });
                              }}
                              className="text-xs font-semibold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 px-2.5 py-1.5 rounded-lg border border-rose-500/20 transition-all flex items-center gap-1"
                              title="Reduce or deregister"
                            >
                              <MinusCircle className="w-3.5 h-3.5" />
                              <span>Reduce</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-slate-500">No animals found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Register Animal / Batch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Register Livestock Holding</h3>
                  <p className="text-xs text-slate-400">Complete all required registration details for official FSSAI tracking</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddAnimal} className="space-y-4">
              {/* Type Switcher */}
              <div className="grid grid-cols-2 gap-3 p-1.5 rounded-xl bg-slate-950 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setAddForm({ ...addForm, isBatch: false, count: 1 })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    !addForm.isBatch ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🐄 Individual Animal
                </button>
                <button
                  type="button"
                  onClick={() => setAddForm({ ...addForm, isBatch: true, count: 100, category: "Chicken" })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all ${
                    addForm.isBatch ? "bg-cyan-500 text-white shadow-md shadow-cyan-500/20" : "text-slate-400 hover:text-white"
                  }`}
                >
                  🐔 Flock / Pond Batch
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Category
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) => {
                      const cat = e.target.value;
                      let spec = "Bovine";
                      if (cat === "Buffalo") spec = "Bovine";
                      if (cat === "Goat" || cat === "Sheep") spec = "Caprine";
                      if (cat === "Pig") spec = "Porcine";
                      if (cat === "Chicken" || cat === "Poultry") spec = "Poultry";
                      if (cat === "Fish") spec = "Aquaculture";
                      setAddForm({ ...addForm, category: cat, species: spec });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="Cow">Cow</option>
                    <option value="Buffalo">Buffalo</option>
                    <option value="Goat">Goat</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Pig">Pig</option>
                    <option value="Chicken">Chicken (Poultry)</option>
                    <option value="Fish">Fish (Aquaculture)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Species Classification
                  </label>
                  <input
                    type="text"
                    value={addForm.species}
                    onChange={(e) => setAddForm({ ...addForm, species: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Official Tag ID / RFID (Optional)
                  </label>
                  <input
                    type="text"
                    value={addForm.tag}
                    onChange={(e) => setAddForm({ ...addForm, tag: e.target.value.toUpperCase() })}
                    placeholder="Leave empty to auto-generate"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Breed / Variety
                  </label>
                  <input
                    type="text"
                    value={addForm.breed}
                    onChange={(e) => setAddForm({ ...addForm, breed: e.target.value })}
                    placeholder="e.g. Holstein Friesian, Murrah"
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {addForm.isBatch ? (
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Batch Head Count
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={addForm.count}
                      onChange={(e) => setAddForm({ ...addForm, count: parseInt(e.target.value) || 1 })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="1"
                      required
                      value={addForm.weight}
                      onChange={(e) => setAddForm({ ...addForm, weight: parseFloat(e.target.value) || 350 })}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:border-cyan-500/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                    Initial Health Status
                  </label>
                  <select
                    value={addForm.healthStatus}
                    onChange={(e) => setAddForm({ ...addForm, healthStatus: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="SAFE">Safe & Healthy (Market Ready)</option>
                    <option value="WITHDRAWAL">Under Active Withdrawal Hold</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Registration Notes & Source
                </label>
                <textarea
                  rows={2}
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  placeholder="e.g. Acquired from registered cooperative; vaccinated for FMD"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-cyan-500/50 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/5 border border-cyan-500/20 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Newly registered livestock tags automatically sync across Veterinary and Regulator surveillance dashboards.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  {submitting ? "Registering Tag..." : "Complete Registration"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reduce / Deregister Livestock Modal */}
      {animalToReduce && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <TrendingDown className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    {animalToReduce.isBatch ? "Reduce Batch Inventory" : "Deregister Livestock"}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono">
                    Target: {animalToReduce.animal} • Tag: {animalToReduce.tag}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAnimalToReduce(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReduceAnimal} className="space-y-4">
              {/* Batch Count Reduction Controls */}
              {animalToReduce.isBatch && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Current Holding:</span>
                    <strong className="text-white font-mono text-sm">{animalToReduce.count} head</strong>
                  </div>

                  <div>
                    <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                      Number of Head to Deduct
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max={animalToReduce.count}
                        required
                        value={reduceForm.reductionCount}
                        onChange={(e) => setReduceForm({ 
                          ...reduceForm, 
                          reductionCount: Math.min(animalToReduce.count, Math.max(1, parseInt(e.target.value) || 1)) 
                        })}
                        className="flex-1 bg-slate-900 border border-slate-800 text-white rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-rose-500/50"
                      />
                      <button
                        type="button"
                        onClick={() => setReduceForm({ ...reduceForm, reductionCount: animalToReduce.count })}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-bold transition-colors"
                      >
                        Remove Entire Batch ({animalToReduce.count})
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Remaining Inventory After Update:</span>
                    <strong className="text-emerald-400 font-mono text-sm">
                      {Math.max(0, animalToReduce.count - reduceForm.reductionCount)} head
                    </strong>
                  </div>
                </div>
              )}

              {/* Mandatory Reason */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5 flex items-center justify-between">
                  <span>Mandatory Statutory Reason</span>
                  <span className="text-rose-400 text-[10px]">* Required</span>
                </label>
                <select
                  required
                  value={reduceForm.reason}
                  onChange={(e) => setReduceForm({ ...reduceForm, reason: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/50"
                >
                  <option value="Commercial Market Sale">Commercial Market Sale (Sold to buyer / market)</option>
                  <option value="Local Harvest / Slaughter">Slaughter / Meat Harvesting for Consumer Supply</option>
                  <option value="Natural Mortality Loss">Natural Mortality / Illness</option>
                  <option value="Disease Culling / Quarantine Control">Disease Culling / Biosecurity Deficit</option>
                  <option value="Transferred to Another Holding">Transferred to Another Farm Premises</option>
                  <option value="Other / Herd Rationalization">Other Herd Rationalization</option>
                </select>
              </div>

              {/* Destination / Buyer */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Destination / Buyer / Facility (Optional)
                </label>
                <input
                  type="text"
                  value={reduceForm.destination}
                  onChange={(e) => setReduceForm({ ...reduceForm, destination: e.target.value })}
                  placeholder="e.g. City Central Livestock Market, Buyer #9102"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-rose-500/50"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-slate-300 text-xs font-semibold uppercase tracking-wider mb-1.5">
                  Official Remarks & Documentation
                </label>
                <textarea
                  rows={2}
                  value={reduceForm.notes}
                  onChange={(e) => setReduceForm({ ...reduceForm, notes: e.target.value })}
                  placeholder="Additional context for practice records and FSSAI regulatory audit"
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-rose-500/50 resize-none"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[11px] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                <span>This reduction will immediately update livestock counts across your Farmer Dashboard, Veterinary Practice, and Regulator audits.</span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setAnimalToReduce(null)}
                  className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-400 hover:text-white text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={reducing}
                  className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 flex items-center gap-2"
                >
                  <TrendingDown className="w-4 h-4" />
                  {reducing ? "Updating Records..." : "Confirm Reduction & Update Records"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Animal Medical Passport Modal */}
      {selectedAnimal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl border ${getCategoryAvatar(selectedAnimal.category).bg}`}>
                  {getCategoryAvatar(selectedAnimal.category).emoji}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedAnimal.animal}</h3>
                  <p className="text-xs text-slate-400 font-mono">Tag ID: {selectedAnimal.tag}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedAnimal(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Species</span>
                  <strong className="text-white text-sm">{selectedAnimal.species}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">{selectedAnimal.isBatch ? "Batch Head Count" : "Weight"}</span>
                  <strong className="text-white text-sm">{selectedAnimal.isBatch ? `${selectedAnimal.count} head` : `${selectedAnimal.weight} kg`}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Food Safety Status</span>
                  <span className={`font-bold text-sm ${
                    selectedAnimal.status === "Safe" ? "text-emerald-400" : "text-amber-400"
                  }`}>
                    {selectedAnimal.status}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Active Regimens</span>
                  <strong className="text-cyan-400 text-sm">{selectedAnimal.activeTreatments.length} Active</strong>
                </div>
              </div>

              {selectedAnimal.activeTreatments.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>Active Withdrawal Regimen</span>
                  </div>
                  {selectedAnimal.activeTreatments.map((t, idx) => (
                    <div key={idx} className="text-[11px] bg-slate-900/80 p-2.5 rounded-lg border border-amber-500/20 space-y-1">
                      <div className="flex justify-between font-semibold text-white">
                        <span>{t.medicineName}</span>
                        <span className="text-amber-400">{t.activeIngredient}</span>
                      </div>
                      <div className="text-slate-400 flex justify-between">
                        <span>Withdrawal Clearance:</span>
                        <strong className="text-white font-mono">{new Date(t.withdrawal?.safeFromDate).toLocaleDateString()}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 shrink-0" />
                  <span>No active withdrawal periods. Permitted for commercial milk/meat distribution.</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setAnimalToReduce(selectedAnimal);
                  setReduceForm({
                    reductionCount: selectedAnimal.isBatch ? Math.min(10, selectedAnimal.count) : 1,
                    reason: "Commercial Market Sale",
                    destination: "",
                    notes: ""
                  });
                }}
                className="text-rose-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-colors"
              >
                <MinusCircle className="w-3.5 h-3.5" />
                <span>{selectedAnimal.isBatch ? "Reduce Batch Count" : "Deregister Animal"}</span>
              </button>

              <button
                onClick={() => setSelectedAnimal(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Passport
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
