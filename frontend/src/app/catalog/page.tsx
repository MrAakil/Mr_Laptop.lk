"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { Search, SlidersHorizontal, ArrowUpDown, X, Loader2 } from "lucide-react";

const BRANDS = ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer"];
const CATEGORIES = ["Gaming", "Business", "Student", "Creator", "Used", "Accessories"];
const CONDITIONS = ["New", "Used", "Refurbished"];
const RAM_OPTIONS = ["8GB", "16GB", "32GB", "48GB"];
const STORAGE_OPTIONS = ["256GB", "512GB", "1TB", "2TB"];
const CPU_OPTIONS = ["M3", "i5", "i7", "i9", "Ryzen"];

function CatalogContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Filters State (initialized from URL params if present)
  const [searchVal, setSearchVal] = useState(searchParams.get("search") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("brand") || "");
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get("condition") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "");
  const [priceMin, setPriceMin] = useState(searchParams.get("price_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("price_max") || "");
  const [selectedRam, setSelectedRam] = useState(searchParams.get("ram") || "");
  const [selectedStorage, setSelectedStorage] = useState(searchParams.get("storage") || "");
  const [selectedCpu, setSelectedCpu] = useState(searchParams.get("processor") || "");
  const [sortOption, setSortOption] = useState(searchParams.get("sort") || "newest");

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFilterSidebarOpen, setIsFilterSidebarOpen] = useState(false);

  // Read URL updates
  useEffect(() => {
    setSearchVal(searchParams.get("search") || "");
    setSelectedBrand(searchParams.get("brand") || "");
    setSelectedCondition(searchParams.get("condition") || "");
    setSelectedCategory(searchParams.get("category") || "");
    setPriceMin(searchParams.get("price_min") || "");
    setPriceMax(searchParams.get("price_max") || "");
    setSelectedRam(searchParams.get("ram") || "");
    setSelectedStorage(searchParams.get("storage") || "");
    setSelectedCpu(searchParams.get("processor") || "");
    setSortOption(searchParams.get("sort") || "newest");
  }, [searchParams]);

  // Fetch products when filters change
  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (searchVal) queryParams.append("search", searchVal);
        if (selectedBrand) queryParams.append("brand", selectedBrand);
        if (selectedCondition) queryParams.append("condition", selectedCondition);
        if (selectedCategory) queryParams.append("category", selectedCategory);
        if (priceMin) queryParams.append("price_min", priceMin);
        if (priceMax) queryParams.append("price_max", priceMax);
        if (selectedRam) queryParams.append("ram", selectedRam);
        if (selectedStorage) queryParams.append("storage", selectedStorage);
        if (selectedCpu) queryParams.append("processor", selectedCpu);
        queryParams.append("sort", sortOption);

        const res = await fetch(`http://localhost:8000/api/products?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Failed to load catalog products", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFilteredProducts();
  }, [
    searchVal,
    selectedBrand,
    selectedCondition,
    selectedCategory,
    priceMin,
    priceMax,
    selectedRam,
    selectedStorage,
    selectedCpu,
    sortOption,
  ]);

  // Update URL search parameters
  const updateUrlParam = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/catalog?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchVal("");
    setSelectedBrand("");
    setSelectedCondition("");
    setSelectedCategory("");
    setPriceMin("");
    setPriceMax("");
    setSelectedRam("");
    setSelectedStorage("");
    setSelectedCpu("");
    setSortOption("newest");
    router.push("/catalog");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <div className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Breadcrumb & Title */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight">Laptop Catalog</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Showing {products.length} premium systems available in Sri Lanka
            </p>
          </div>
          <button
            onClick={handleClearFilters}
            className="self-start text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-1"
          >
            Reset All Filters
          </button>
        </div>

        {/* Catalog Control Header */}
        <div className="h-14 px-4 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md flex items-center justify-between gap-4 mb-8">
          <button
            onClick={() => setIsFilterSidebarOpen(true)}
            className="flex items-center gap-2 text-sm font-bold text-foreground hover:text-primary md:hidden transition-colors"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
            <span>Filters</span>
          </button>
          
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
            <SlidersHorizontal className="h-4 w-4" />
            <span>Refine search with filters</span>
          </div>

          <div className="flex items-center gap-3">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <select
              value={sortOption}
              onChange={(e) => updateUrlParam("sort", e.target.value)}
              className="bg-transparent text-sm font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              <option value="newest">Latest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Top Rated</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* 1. Sidebar Filters - Desktop */}
          <aside className="hidden md:block space-y-8 pr-4">
            
            {/* Search Input */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Search Catalog</h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Keyword search..."
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="w-full h-10 px-4 pl-10 pr-4 rounded-xl bg-secondary/50 border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                />
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              </div>
            </div>

            {/* Price Filter */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Price Range (LKR)</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => updateUrlParam("price_min", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary/50 border border-border text-xs focus:outline-none"
                />
                <span className="text-xs text-muted-foreground">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => updateUrlParam("price_max", e.target.value)}
                  className="w-full h-9 px-3 rounded-lg bg-secondary/50 border border-border text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Brand Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Brand</h3>
              <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto pr-2">
                <button
                  onClick={() => updateUrlParam("brand", "")}
                  className={`text-left text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                    !selectedBrand ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  All Brands
                </button>
                {BRANDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => updateUrlParam("brand", b)}
                    className={`text-left text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                      selectedBrand === b ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Condition</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateUrlParam("condition", "")}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                    !selectedCondition
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All
                </button>
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateUrlParam("condition", c)}
                    className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                      selectedCondition === c
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Category</h3>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => updateUrlParam("category", "")}
                  className={`text-left text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                    !selectedCategory ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
                  }`}
                >
                  All Categories
                </button>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateUrlParam("category", cat)}
                    className={`text-left text-xs py-1 px-2 rounded-lg font-medium transition-colors ${
                      selectedCategory === cat ? "bg-primary/10 text-primary" : "hover:bg-secondary text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Processor Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Processor (CPU)</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateUrlParam("processor", "")}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                    !selectedCpu
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All
                </button>
                {CPU_OPTIONS.map((cpu) => (
                  <button
                    key={cpu}
                    onClick={() => updateUrlParam("processor", cpu)}
                    className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                      selectedCpu === cpu
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {cpu}
                  </button>
                ))}
              </div>
            </div>

            {/* RAM Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">RAM Size</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateUrlParam("ram", "")}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                    !selectedRam
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All
                </button>
                {RAM_OPTIONS.map((ram) => (
                  <button
                    key={ram}
                    onClick={() => updateUrlParam("ram", ram)}
                    className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                      selectedRam === ram
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {ram}
                  </button>
                ))}
              </div>
            </div>

            {/* Storage Filter */}
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wider text-foreground">Storage Size</h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => updateUrlParam("storage", "")}
                  className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                    !selectedStorage
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  All
                </button>
                {STORAGE_OPTIONS.map((st) => (
                  <button
                    key={st}
                    onClick={() => updateUrlParam("storage", st)}
                    className={`text-xs py-1 px-2.5 rounded-lg border font-semibold transition-all ${
                      selectedStorage === st
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:bg-secondary"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

          </aside>

          {/* 2. Products Grid */}
          <section className="md:col-span-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="text-sm font-semibold">Updating catalog...</span>
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((item) => (
                  <ProductCard key={item.id} product={item} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-secondary/10">
                <h3 className="text-base font-bold text-foreground mb-2">No laptops match your filters</h3>
                <p className="text-xs text-muted-foreground mb-6">
                  Try adjusting filters or clear all parameters to start fresh.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 h-10 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </section>

        </div>

      </div>

      {/* Mobile Filters Overlay */}
      {isFilterSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-80 bg-card p-6 h-full overflow-y-auto shadow-2xl flex flex-col gap-6 animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-border/60 pb-3">
              <h2 className="text-base font-bold text-foreground">Filters</h2>
              <button
                onClick={() => setIsFilterSidebarOpen(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Keyword Search */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Keyword Search</h3>
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search..."
                className="w-full h-9 px-3 rounded-lg bg-secondary border border-border text-xs focus:outline-none"
              />
            </div>

            {/* Price range */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Price Range</h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceMin}
                  onChange={(e) => updateUrlParam("price_min", e.target.value)}
                  className="w-full h-8 px-2 rounded bg-secondary border border-border text-xs focus:outline-none"
                />
                <span className="text-xs">-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceMax}
                  onChange={(e) => updateUrlParam("price_max", e.target.value)}
                  className="w-full h-8 px-2 rounded bg-secondary border border-border text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Brand */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</h3>
              <div className="flex flex-wrap gap-1">
                {BRANDS.map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      updateUrlParam("brand", selectedBrand === b ? "" : b);
                    }}
                    className={`text-[10px] font-bold py-1 px-2.5 rounded-full border transition-all ${
                      selectedBrand === b ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Condition */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Condition</h3>
              <div className="flex gap-1.5">
                {CONDITIONS.map((c) => (
                  <button
                    key={c}
                    onClick={() => updateUrlParam("condition", selectedCondition === c ? "" : c)}
                    className={`text-xs py-1 px-3 rounded-lg border font-semibold transition-all ${
                      selectedCondition === c ? "border-primary bg-primary/15 text-primary" : "border-border"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Category */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Category</h3>
              <div className="flex flex-wrap gap-1">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => updateUrlParam("category", selectedCategory === cat ? "" : cat)}
                    className={`text-[10px] font-bold py-1 px-2.5 rounded-full border transition-all ${
                      selectedCategory === cat ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsFilterSidebarOpen(false)}
              className="mt-auto h-11 w-full bg-primary text-primary-foreground font-bold rounded-xl text-xs"
            >
              Apply Filter Settings
            </button>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Catalog() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}
