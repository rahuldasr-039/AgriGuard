"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { 
  Activity, Search, Shield, BookOpen, AlertCircle, 
  Filter, LayoutGrid, Table as TableIcon, ChevronRight, 
  X, ExternalLink, CheckCircle2, Sparkles, Scale, Pill
} from "lucide-react";

export default function MRLAnalysis() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [viewMode, setViewMode] = useState("grid"); // grid | table
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role || role !== "FARM_TESTER") {
      router.push("/login");
    }
  }, [router]);

  const mrlDatabase = [
    { 
      id: "MRL-REF-01",
      substance: "Amoxicillin", 
      class: "Beta-lactam Penicillin",
      species: "Bovine (Cow / Buffalo)", 
      product: "Milk", 
      limit: 0.004, 
      unit: "mg/kg", 
      source: "FSSAI Food Safety Standards (Contaminants, Toxins and Residues)", 
      version: "2024.1 Gazette",
      adi: "0-0.002 mg/kg bw",
      method: "LC-MS/MS Electrospray Ionization",
      notes: "High risk of antimicrobial resistance. Strictly enforced under Section 31."
    },
    { 
      id: "MRL-REF-02",
      substance: "Amoxicillin", 
      class: "Beta-lactam Penicillin",
      species: "Bovine / Porcine", 
      product: "Meat", 
      limit: 0.05, 
      unit: "mg/kg", 
      source: "FSSAI Schedule 1 Statutory Limit", 
      version: "2024.1 Gazette",
      adi: "0-0.002 mg/kg bw",
      method: "Liquid Chromatography-Tandem Mass Spectrometry",
      notes: "Muscle tissue sampling benchmark for slaughtered livestock."
    },
    { 
      id: "MRL-REF-03",
      substance: "Oxytetracycline", 
      class: "Tetracycline Antimicrobial",
      species: "Bovine (Cow / Buffalo)", 
      product: "Milk", 
      limit: 0.1, 
      unit: "mg/kg", 
      source: "FSSAI Regulation 2.3.2 Residue Benchmark", 
      version: "2024.1 Gazette",
      adi: "0-0.03 mg/kg bw",
      method: "High-Performance Liquid Chromatography (HPLC)",
      notes: "Broad-spectrum bacteriostatic antibiotic with 7-day minimum withdrawal hold."
    },
    { 
      id: "MRL-REF-04",
      substance: "Oxytetracycline", 
      class: "Tetracycline Antimicrobial",
      species: "Aquaculture (Fish / Prawns)", 
      product: "Fish / Prawns", 
      limit: 0.1, 
      unit: "mg/kg", 
      source: "FSSAI Standards for Marine & Freshwater Products", 
      version: "2024.1 Gazette",
      adi: "0-0.03 mg/kg bw",
      method: "LC-MS/MS Confirmation",
      notes: "Mandatory export screening standard for commercial aquaculture farms."
    },
    { 
      id: "MRL-REF-05",
      substance: "Enrofloxacin", 
      class: "Fluoroquinolone",
      species: "Poultry (Broiler / Layer)", 
      product: "Meat", 
      limit: 0.1, 
      unit: "mg/kg", 
      source: "FSSAI Veterinary Drug Residue limits", 
      version: "2024.1 Gazette",
      adi: "0-0.006 mg/kg bw",
      method: "Fluorescence Detection HPLC",
      notes: "Critical priority human antimicrobial class. Regulated use only."
    },
    { 
      id: "MRL-REF-06",
      substance: "Ivermectin", 
      class: "Macrocyclic Lactone (Antiparasitic)",
      species: "Caprine (Goat / Sheep)", 
      product: "Meat", 
      limit: 0.01, 
      unit: "mg/kg", 
      source: "FSSAI / Codex Alimentarius MRL 42", 
      version: "2024.1 Gazette",
      adi: "0-0.01 mg/kg bw",
      method: "HPLC-Fluorescence derivatization",
      notes: "Lipophilic compound with extended clearance period in fat tissue."
    },
    { 
      id: "MRL-REF-07",
      substance: "Florfenicol", 
      class: "Amphenicol",
      species: "Porcine (Pig / Swine)", 
      product: "Meat (Pork)", 
      limit: 0.2, 
      unit: "mg/kg", 
      source: "FSSAI Regulation 2.3.2 Statutory Limits", 
      version: "2024.1 Gazette",
      adi: "0-0.01 mg/kg bw",
      method: "LC-MS/MS Florfenicol-Amine marker",
      notes: "Florfenicol-amine monitored as the marker residue in muscle tissue."
    },
    { 
      id: "MRL-REF-08",
      substance: "Ciprofloxacin", 
      class: "Fluoroquinolone",
      species: "Poultry (Chicken)", 
      product: "Eggs", 
      limit: 0.05, 
      unit: "mg/kg", 
      source: "FSSAI Schedule 1 Avian Residue Standard", 
      version: "2024.1 Gazette",
      adi: "0-0.005 mg/kg bw",
      method: "LC-MS/MS Confirmation",
      notes: "Zero tolerance for unregistered flocks. Egg distribution restricted."
    }
  ];

  const filtered = useMemo(() => {
    return mrlDatabase.filter(m => {
      const matchesSearch = 
        m.substance.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.product.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.species.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.class.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || m.product.toLowerCase().includes(selectedCategory.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="p-8 pb-24 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">Maximum Residue Limit (MRL) Library</h1>
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              FSSAI 2024.1 Gazette
            </span>
          </div>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl">
            Official statutory benchmark limits established by FSSAI and Codex Alimentarius for veterinary drugs and contaminants across animal food products.
          </p>
        </div>
      </div>

      {/* KPI Cards Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <span className="text-xs text-slate-400 font-medium block mb-1">Statutory Benchmarks</span>
          <div className="text-2xl font-bold text-white">8 Compounds</div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
          <span className="text-xs text-emerald-300 font-medium block mb-1">Monitored Matrices</span>
          <div className="text-2xl font-bold text-emerald-400">Milk, Meat, Aqua, Eggs</div>
        </div>

        <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
          <span className="text-xs text-cyan-300 font-medium block mb-1">Codex Alimentarius</span>
          <div className="text-2xl font-bold text-cyan-400">Harmonized</div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-sm">
          <span className="text-xs text-indigo-300 font-medium block mb-1">Regulatory Gazette</span>
          <div className="text-xl font-bold text-indigo-300">Ver 2024.1 Schedule</div>
        </div>
      </div>

      {/* Filter & View Controls */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search substance, chemical class, species, or product..."
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
              <span>Table</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-800/60">
          <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Matrix:
          </span>
          {[
            { id: "ALL", label: `All Compounds (${mrlDatabase.length})` },
            { id: "Milk", label: "🥛 Dairy (Milk)" },
            { id: "Meat", label: "🥩 Meat & Pork" },
            { id: "Fish", label: "🐟 Aquaculture (Fish)" },
            { id: "Eggs", label: "🥚 Eggs" }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedCategory === cat.id
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                  : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid View */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="group rounded-2xl border border-slate-800/80 bg-slate-900/60 hover:bg-slate-900/90 hover:border-cyan-500/40 p-6 backdrop-blur-sm cursor-pointer transition-all hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <Pill className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {item.substance}
                    </h3>
                    <span className="text-xs text-slate-400 font-medium">{item.class}</span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {item.limit} {item.unit}
                </span>
              </div>

              <div className="space-y-2 mb-4 text-xs text-slate-300">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Food Matrix</span>
                    <strong className="text-cyan-300">{item.product}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Target Species</span>
                    <span className="text-slate-300 font-medium">{item.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Gazette Section</span>
                    <span className="text-slate-400 truncate max-w-[170px]">{item.source}</span>
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                <span>Statutory Benchmark</span>
                <span className="text-cyan-400 flex items-center gap-0.5 font-medium group-hover:translate-x-1 transition-transform">
                  View Dossier <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/90 border-b border-slate-800/80">
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Substance / Chemical Class</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Species Applicability</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Food Product</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Legal MRL Limit</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider">Regulatory Reference</th>
                  <th className="py-4 px-6 text-xs font-semibold text-slate-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className="hover:bg-slate-800/40 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 text-sm">
                      <div className="text-white font-bold">{item.substance}</div>
                      <div className="text-xs text-slate-400">{item.class}</div>
                    </td>
                    <td className="py-4 px-6 text-sm text-slate-300">{item.species}</td>
                    <td className="py-4 px-6 text-sm text-cyan-400 font-medium">{item.product}</td>
                    <td className="py-4 px-6 text-sm font-mono text-emerald-400 font-bold">
                      {item.limit} {item.unit}
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 max-w-xs">
                      <div>{item.source}</div>
                      <span className="text-slate-500 font-mono">{item.version}</span>
                    </td>
                    <td className="py-4 px-6 text-sm text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        className="text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 px-3 py-1.5 rounded-lg border border-cyan-500/30 transition-all"
                      >
                        Dossier
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MRL Dossier Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative space-y-5">
            <div className="flex justify-between items-start border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                  <Scale className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedItem.substance}</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedItem.class} • MRL: {selectedItem.limit} {selectedItem.unit}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedItem(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl grid grid-cols-2 gap-3">
                <div>
                  <span className="text-slate-500 block mb-1">Target Commodity</span>
                  <strong className="text-cyan-300 text-sm">{selectedItem.product}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Species Scope</span>
                  <strong className="text-white text-sm">{selectedItem.species}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Legal MRL Limit</span>
                  <strong className="text-emerald-400 font-mono text-sm">{selectedItem.limit} {selectedItem.unit}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Toxicology ADI</span>
                  <strong className="text-slate-200 font-mono">{selectedItem.adi}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-500 block mb-1">Recommended Assay Method</span>
                  <span className="text-slate-300">{selectedItem.method}</span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 space-y-1">
                <span className="font-bold block text-white">Statutory Regulatory Reference</span>
                <p className="text-[11px] leading-relaxed opacity-90">{selectedItem.source} ({selectedItem.version})</p>
                <p className="text-[11px] text-slate-400 mt-1 italic">{selectedItem.notes}</p>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedItem(null)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
