"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";
import { useAi } from "@/context/AiContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GitCompare, ShoppingCart, Trash2, ArrowLeft, Star, Cpu, Sliders, Battery, Monitor, Scale, Sparkles, Loader2 } from "lucide-react";

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const { getComparisonSummary } = useAi();
  
  const [aiCompare, setAiCompare] = useState<any>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (compareList.length >= 2) {
      const fetchAiCompare = async () => {
        setLoadingAi(true);
        try {
          const ids = compareList.map((p) => p.id);
          const data = await getComparisonSummary(ids);
          if (data) {
            setAiCompare(data);
          }
        } catch (err) {
          console.error("AI Compare failed:", err);
        } finally {
          setLoadingAi(false);
        }
      };
      fetchAiCompare();
    } else {
      setAiCompare(null);
    }
  }, [compareList]);

  // Performance calculation helpers
  const getCpuPerformance = (cpu: string) => {
    const text = cpu.toLowerCase();
    if (text.includes("i9") || text.includes("m3 max") || text.includes("ultra 9")) return { pct: 96, label: "Extreme Processing" };
    if (text.includes("i7") || text.includes("m3 pro") || text.includes("m2 pro") || text.includes("ryzen 7")) return { pct: 82, label: "High Performance" };
    if (text.includes("i5") || text.includes("m3") || text.includes("m2") || text.includes("ryzen 5")) return { pct: 65, label: "Balanced Creator" };
    return { pct: 45, label: "Daily Tasks Efficiency" };
  };

  const getRamPerformance = (ram: string) => {
    const text = ram.toLowerCase();
    if (text.includes("64gb")) return { pct: 98, label: "Extreme Multitasking" };
    if (text.includes("32gb")) return { pct: 88, label: "Pro Production" };
    if (text.includes("16gb")) return { pct: 70, label: "Standard Workloads" };
    return { pct: 45, label: "Basic Computing" };
  };

  const getGpuPerformance = (gpu: string) => {
    const text = gpu.toLowerCase();
    if (text.includes("rtx 4090") || text.includes("rtx 4080")) return { pct: 98, label: "Tier-1 Raytracing" };
    if (text.includes("rtx 4070") || text.includes("rtx 4060")) return { pct: 85, label: "High-FPS Gaming" };
    if (text.includes("rtx 4050") || text.includes("rtx 3050") || text.includes("arc")) return { pct: 68, label: "Rendering Ready" };
    if (text.includes("m3") || text.includes("m2") || text.includes("m1") || text.includes("intel") || text.includes("amd")) return { pct: 50, label: "Casual & Coding" };
    return { pct: 30, label: "Basic Output" };
  };

  const getStoragePerformance = (storage: string) => {
    const text = storage.toLowerCase();
    if (text.includes("2tb")) return { pct: 95, label: "Massive Library" };
    if (text.includes("1tb")) return { pct: 75, label: "Pro Capacity" };
    if (text.includes("512gb")) return { pct: 50, label: "Standard Setup" };
    return { pct: 30, label: "Compact Storage" };
  };

  const getBatteryPerformance = (brand: string, specs: any) => {
    const text = brand.toLowerCase();
    // MacBooks have extreme battery life
    if (text.includes("apple") || text.includes("macbook")) return { pct: 95, label: "Up to 18 Hours" };
    if (specs.cpu.toLowerCase().includes("hx") || specs.gpu.toLowerCase().includes("rtx 4080")) return { pct: 48, label: "Gaming Focus (4-6 Hours)" };
    return { pct: 72, label: "Standard (8-10 Hours)" };
  };

  const getWeightPerformance = (specs: any) => {
    const name = specs.display.toLowerCase();
    if (name.includes("13") || name.includes("14")) return { pct: 92, label: "Ultra Portable (< 1.4kg)" };
    if (name.includes("15")) return { pct: 75, label: "Standard (1.8kg)" };
    return { pct: 50, label: "Heavy Rig (> 2.3kg)" };
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-10">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <GitCompare className="h-8 w-8 text-primary glow-text-cyan animate-pulse" />
              <span>Futuristic Compare</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1.5">
              Inspect benchmark ratings, specifications, and capabilities side-by-side.
            </p>
          </div>
          
          {compareList.length > 0 && (
            <button
              onClick={clearCompare}
              className="self-start text-xs font-bold text-red-400 hover:text-red-500 transition-colors uppercase tracking-wider"
            >
              Clear Comparison List
            </button>
          )}
        </div>

        {compareList.length > 0 ? (
          <>
            <div className="overflow-x-auto rounded-3xl border border-glass-border glass shadow-2xl">
            <table className="w-full text-left text-xs border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border bg-secondary/20">
                  <th className="px-6 py-6 font-black text-muted-foreground/80 w-1/4 uppercase tracking-widest text-[10px]">Technical Metric</th>
                  {compareList.map((product) => (
                    <th key={product.id} className="px-6 py-6 font-black text-sm relative w-1/4 group/header">
                      <button
                        onClick={() => toggleCompare(product)}
                        className="absolute top-3 right-3 p-1.5 rounded-xl text-muted-foreground/80 hover:text-red-500 hover:bg-secondary/80 transition-all border border-border"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="h-28 flex items-center justify-center p-4 mb-4 bg-white/5 rounded-2xl border border-border/40 hover:border-primary/40 transition-colors">
                        <img
                          src={product.image_urls[0]}
                          alt={product.name}
                          className="h-full object-contain filter drop-shadow-[0_4px_10px_rgba(0,0,0,0.3)] group-hover/header:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="truncate max-w-[200px] text-foreground font-black text-xs uppercase tracking-tight">{product.name}</div>
                    </th>
                  ))}
                  {/* Fill empty column spaces */}
                  {[...Array(3 - compareList.length)].map((_, i) => (
                    <th key={i} className="px-6 py-6 text-center text-muted-foreground w-1/4">
                      <div className="h-36 flex flex-col items-center justify-center border border-dashed border-border rounded-3xl bg-secondary/5">
                        <GitCompare className="h-6 w-6 mb-2 text-border" />
                        <Link href="/catalog" className="text-[10px] font-black text-primary hover:underline uppercase tracking-widest">
                          + Add Laptop
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Brand */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">Brand</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-bold text-foreground">{p.brand}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Condition */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">Condition</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                        p.condition === "New" 
                          ? "bg-green-500/10 text-green-400" 
                          : p.condition === "Refurbished" 
                          ? "bg-blue-500/10 text-blue-400" 
                          : "bg-amber-500/10 text-amber-400"
                      }`}>
                        {p.condition}
                      </span>
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Price */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">Price (LKR)</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-black text-primary text-sm glow-text-cyan">
                      LKR {(p.price * (1 - p.discount / 100)).toLocaleString()}
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* CPU Processor + Benchmark */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">
                    <div className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-accent" /> CPU / Processor</div>
                  </td>
                  {compareList.map((p) => {
                    const perf = getCpuPerformance(p.specs.cpu);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{p.specs.cpu}</div>
                        {/* Gauge bar */}
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full glow-cyan" style={{ width: `${perf.pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-accent/80 mt-1 block uppercase tracking-wider">{perf.label}</span>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* RAM memory + Benchmark */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">
                    <div className="flex items-center gap-1.5"><Sliders className="h-3.5 w-3.5 text-accent" /> Memory (RAM)</div>
                  </td>
                  {compareList.map((p) => {
                    const perf = getRamPerformance(p.specs.ram);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{p.specs.ram}</div>
                        {/* Gauge bar */}
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full glow-cyan" style={{ width: `${perf.pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-accent/80 mt-1 block uppercase tracking-wider">{perf.label}</span>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Storage SSD + Benchmark */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">SSD Storage Capacity</td>
                  {compareList.map((p) => {
                    const perf = getStoragePerformance(p.specs.storage);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{p.specs.storage}</div>
                        {/* Gauge bar */}
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full glow-cyan" style={{ width: `${perf.pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-accent/80 mt-1 block uppercase tracking-wider">{perf.label}</span>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* GPU Graphics + Benchmark */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">GPU / Graphics</td>
                  {compareList.map((p) => {
                    const perf = getGpuPerformance(p.specs.gpu);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{p.specs.gpu}</div>
                        {/* Gauge bar */}
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full glow-cyan" style={{ width: `${perf.pct}%` }} />
                        </div>
                        <span className="text-[9px] font-bold text-accent/80 mt-1 block uppercase tracking-wider">{perf.label}</span>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Battery Capability */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">
                    <div className="flex items-center gap-1.5"><Battery className="h-3.5 w-3.5 text-accent" /> Battery Capacity</div>
                  </td>
                  {compareList.map((p) => {
                    const perf = getBatteryPerformance(p.brand, p.specs);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{perf.label}</div>
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-emerald-500 to-green-400 h-1 rounded-full" style={{ width: `${perf.pct}%` }} />
                        </div>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Display/Screen */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">
                    <div className="flex items-center gap-1.5"><Monitor className="h-3.5 w-3.5 text-accent" /> Display panel</div>
                  </td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-5 font-medium text-foreground">{p.specs.display}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Weight/Portability */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-5 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">
                    <div className="flex items-center gap-1.5"><Scale className="h-3.5 w-3.5 text-accent" /> Portability Index</div>
                  </td>
                  {compareList.map((p) => {
                    const perf = getWeightPerformance(p.specs);
                    return (
                      <td key={p.id} className="px-6 py-5">
                        <div className="font-semibold text-foreground">{perf.label}</div>
                        <div className="mt-2 w-full bg-secondary/60 rounded-full h-1 overflow-hidden">
                          <div className="bg-gradient-to-r from-primary to-accent h-1 rounded-full glow-cyan" style={{ width: `${perf.pct}%` }} />
                        </div>
                      </td>
                    );
                  })}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Rating */}
                <tr className="border-b border-border hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">Rating</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-bold flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current animate-spin-slow" />
                      <span>{p.rating.toFixed(1)}</span>
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Cart Action button */}
                <tr>
                  <td className="px-6 py-6 font-black text-muted-foreground uppercase tracking-wider text-[10px] bg-secondary/10">Purchase Action</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="px-6 py-6">
                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stock <= 0}
                        className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-black hover:bg-primary/95 text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>Add To Cart</span>
                      </button>
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>
              </tbody>
            </table>
          </div>

          {/* AI CONSULTANT EVALUATION & WORKLOAD METRICS PANEL */}
          {compareList.length >= 2 && (
            <div className="mt-12 space-y-8 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <h2 className="text-lg font-black text-foreground uppercase tracking-widest text-[11px] font-mono">
                  AI Consultant side-by-side analysis
                </h2>
              </div>

              {loadingAi ? (
                <div className="rounded-3xl border border-glass-border glass p-8 flex flex-col items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-cyan-400 mb-4" />
                  <p className="text-xs text-muted-foreground font-mono">
                    Generating model matrices and workloads comparisons...
                  </p>
                </div>
              ) : aiCompare ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Left Column: Natural Language Evaluation Summary */}
                  <div className="lg:col-span-2 rounded-3xl border border-glass-border glass p-6 backdrop-blur-xl bg-slate-950/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 to-blue-500"></div>
                    <h3 className="text-sm font-black text-cyan-400 uppercase tracking-widest text-[10px] font-mono mb-4 flex items-center gap-1.5">
                      <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Synthesis & Recommendation
                    </h3>
                    <div className="text-xs leading-relaxed text-slate-300 space-y-4 whitespace-pre-line font-sans">
                      {aiCompare.comparison_text}
                    </div>
                  </div>

                  {/* Right Column: Comparative Workload Scores */}
                  <div className="rounded-3xl border border-glass-border glass p-6 backdrop-blur-xl bg-slate-950/40 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 to-cyan-500"></div>
                    <h3 className="text-sm font-black text-purple-400 uppercase tracking-widest text-[10px] font-mono mb-6">
                      Workload Performance Indexes
                    </h3>
                    
                    <div className="space-y-6">
                      {compareList.map((product) => {
                        const prodScores = aiCompare.scores?.[product.id.toString()] || {
                          Gaming: 50,
                          Productivity: 50,
                          "AI/ML": 50,
                          Battery: 50,
                          Portability: 50,
                          "Value for Money": 50
                        };

                        return (
                          <div key={product.id} className="space-y-3 bg-secondary/10 p-4 rounded-2xl border border-white/5">
                            <h4 className="text-xs font-bold text-slate-200 truncate border-b border-white/5 pb-1.5">
                              {product.brand} {product.name}
                            </h4>
                            
                            <div className="space-y-2 text-[10px] font-mono">
                              {Object.entries(prodScores).map(([metric, val]) => (
                                <div key={metric} className="space-y-1">
                                  <div className="flex justify-between text-slate-400 text-[9px]">
                                    <span>{metric}</span>
                                    <span className="font-bold text-cyan-400">{(val as any)}/100</span>
                                  </div>
                                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full bg-gradient-to-r ${
                                        metric === "Gaming"
                                          ? "from-red-500 to-orange-400"
                                          : metric === "AI/ML"
                                          ? "from-purple-500 to-pink-500"
                                          : metric === "Battery"
                                          ? "from-emerald-500 to-green-400"
                                          : "from-cyan-500 to-blue-500"
                                      }`}
                                      style={{ width: `${(val as any)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
          </>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-3xl glass max-w-md mx-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
              <GitCompare className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">No laptops selected for comparison</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Navigate to our shop and click the compare icon on any listing.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center h-10 px-6 bg-primary text-primary-foreground font-bold text-xs rounded-full hover:bg-primary/95 hover:shadow-lg transition-all"
            >
              Browse Catalog
            </Link>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
