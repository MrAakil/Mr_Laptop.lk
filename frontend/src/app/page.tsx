"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import { CategoryCard } from "@/components/CategoryCard";
import {
  Gamepad2,
  Briefcase,
  GraduationCap,
  PenTool,
  RotateCw,
  Cpu,
  ArrowRight,
  ShieldCheck,
  Truck,
  HelpCircle,
  TrendingUp,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const CATEGORIES = [
  {
    title: "Gaming Laptops",
    description: "Equipped with high refresh rates and NVIDIA RTX graphics for maximum frame rates.",
    icon: Gamepad2,
    href: "/catalog?category=Gaming",
    gradient: "from-purple-500/10 to-red-500/10 hover:from-purple-500/20 hover:to-red-500/20",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Business Laptops",
    description: "Aerospace-grade durability, enterprise security, and long-lasting battery life.",
    icon: Briefcase,
    href: "/catalog?category=Business",
    gradient: "from-blue-500/10 to-cyan-500/10 hover:from-blue-500/20 hover:to-cyan-500/20",
    image: "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Student Laptops",
    description: "Lightweight, silent, and highly portable. Ideal for university projects.",
    icon: GraduationCap,
    href: "/catalog?category=Student",
    gradient: "from-green-500/10 to-teal-500/10 hover:from-green-500/20 hover:to-teal-500/20",
    image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Creator Laptops",
    description: "Wide color gamut, high color-accuracy, and heavy processing capacity.",
    icon: PenTool,
    href: "/catalog?category=Creator",
    gradient: "from-pink-500/10 to-rose-500/10 hover:from-pink-500/20 hover:to-rose-500/20",
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Used Laptops",
    description: "Thoroughly quality-tested and certified by experts. Premium hardware at low budgets.",
    icon: RotateCw,
    href: "/catalog?condition=Used",
    gradient: "from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20",
    image: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=400&auto=format&fit=crop",
  },
  {
    title: "Accessories",
    description: "Expand your productivity. Docks, keyboards, mouse pads, and adaptors.",
    icon: Cpu,
    href: "/catalog?category=Accessories",
    gradient: "from-gray-500/10 to-slate-500/10 hover:from-gray-500/20 hover:to-slate-500/20",
    image: "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?q=80&w=400&auto=format&fit=crop",
  },
];

const BRANDS = ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer"];

const TESTIMONIALS = [
  {
    name: "Dineth Perera",
    role: "Software Developer",
    avatar: "DP",
    comment: "I bought a refurbished ThinkPad X1 Carbon. The device looks brand new and works flawlessly. Excellent service, highly recommended!",
    rating: 5,
  },
  {
    name: "Sanduni Silva",
    role: "Undergraduate student",
    avatar: "SS",
    comment: "Excellent prices for MacBooks in Sri Lanka. Got my M3 Air with islandwide delivery in less than 24 hours. The packaging was top-notch.",
    rating: 5,
  },
  {
    name: "Ruwan Wickramasinghe",
    role: "Gaming Enthusiast",
    avatar: "RW",
    comment: "Finally, a reliable shop for Razer laptops in Colombo. The staff was super helpful in guiding me on the warranty details. 10/10.",
    rating: 5,
  },
];

export default function Home() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const res = await fetch("http://localhost:8000/api/products?limit=8");
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (err) {
        console.error("Error fetching featured products", err);
      } finally {
        setLoading(false);
      }
    }
    fetchFeatured();
  }, []);

  const scrollCarousel = (direction: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden py-20 lg:py-32 bg-gradient-to-b from-background via-secondary/10 to-background">
          {/* Subtle geometric glowing grid elements in background */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px] pointer-events-none dark:block hidden" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              
              <div className="lg:col-span-7 text-center lg:text-left">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold uppercase tracking-wider mb-6 animate-pulse">
                  <TrendingUp className="h-3.5 w-3.5" />
                  <span>Sri Lanka's Premium Laptop Store</span>
                </div>
                <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground leading-[1.05] mb-6">
                  Find Your <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">
                    Perfect Laptop
                  </span>
                </h1>
                <p className="text-base sm:text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed mx-auto lg:mx-0">
                  Buy Genuine New, Used, and Refurbished Laptops at the Best Prices in Sri Lanka. Checked and certified by experts with warranty support.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                  <Link
                    href="/catalog"
                    className="w-full sm:w-auto h-12 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                  >
                    <span>Shop Laptops Now</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/contact?service=tradeins"
                    className="w-full sm:w-auto h-12 px-8 rounded-full bg-secondary text-foreground border border-border font-bold hover:bg-secondary/80 transition-all flex items-center justify-center"
                  >
                    Sell Your Laptop
                  </Link>
                </div>
              </div>

              {/* Showcase laptop image */}
              <div className="lg:col-span-5 relative flex justify-center">
                <div className="relative w-full max-w-sm sm:max-w-md animate-float">
                  <img
                    src="https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop"
                    alt="Premium Laptop Showcase"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(59,130,246,0.3)] dark:drop-shadow-[0_20px_50px_rgba(59,130,246,0.15)]"
                  />
                  {/* Floating floating indicators */}
                  <div className="absolute top-10 -left-6 rounded-2xl glass p-3 border border-white/20 shadow-xl flex items-center gap-2">
                    <CheckCircle2 className="text-green-500 h-5 w-5" />
                    <span className="text-xs font-bold">100% Tested</span>
                  </div>
                  <div className="absolute bottom-10 -right-6 rounded-2xl glass p-3 border border-white/20 shadow-xl flex items-center gap-2">
                    <ShieldCheck className="text-primary h-5 w-5" />
                    <span className="text-xs font-bold">Warranty Included</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* 2. Trust Badges Section */}
        <section className="py-6 border-y border-border/60 bg-card/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-xl sm:text-2xl font-black text-foreground">Genuine</div>
                <div className="text-xs text-muted-foreground">Original Brands Only</div>
              </div>
              <div className="border-l border-border/50">
                <div className="text-xl sm:text-2xl font-black text-foreground">Warranty</div>
                <div className="text-xs text-muted-foreground">Up to 2 Years Hardware</div>
              </div>
              <div className="border-l border-border/50">
                <div className="text-xl sm:text-2xl font-black text-foreground">Islandwide</div>
                <div className="text-xs text-muted-foreground">Cash On Delivery</div>
              </div>
              <div className="border-l border-border/50">
                <div className="text-xl sm:text-2xl font-black text-foreground">5-Star</div>
                <div className="text-xs text-muted-foreground">Hundreds of Reviews</div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Featured Categories */}
        <section className="py-16 sm:py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                Featured Categories
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Browse premium laptops customized for your exact workflows.
              </p>
            </div>
            <Link
              href="/catalog"
              className="text-xs font-bold text-primary flex items-center gap-1 hover:underline mt-4 md:mt-0 uppercase tracking-wider"
            >
              <span>View All Products</span>
              <ArrowRight className="h-4.5 w-4.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {CATEGORIES.map((cat, idx) => (
              <CategoryCard key={idx} category={cat} />
            ))}
          </div>
        </section>

        {/* 4. Featured Products Carousel */}
        <section className="py-16 sm:py-20 bg-secondary/10 border-y border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="flex items-end justify-between mb-12">
              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight mb-2">
                  Featured Products
                </h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Explore our latest stock at unbeatable prices.
                </p>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => scrollCarousel("left")}
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-secondary text-foreground hover:text-primary transition-all shadow-sm"
                  aria-label="Previous Products"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={() => scrollCarousel("right")}
                  className="p-2.5 rounded-full border border-border bg-card hover:bg-secondary text-foreground hover:text-primary transition-all shadow-sm"
                  aria-label="Next Products"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-80 w-full rounded-2xl bg-muted animate-pulse" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div
                ref={carouselRef}
                className="flex gap-6 overflow-x-auto scrollbar-none pb-8 snap-x snap-mandatory"
                style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
              >
                {products.map((product) => (
                  <div key={product.id} className="min-w-[280px] sm:min-w-[300px] max-w-[320px] snap-start">
                    <ProductCard product={product} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-sm text-muted-foreground">
                No products found. Please seed the database.
              </div>
            )}

          </div>
        </section>

        {/* 5. Why Choose Us */}
        <section className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-xl mx-auto mb-16">
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight mb-4">
              Why Sri Lankans Choose Mr_Laptop.lk
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground">
              We have established a status of reliability, strict quality check, and customer-first values.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            
            <div className="p-8 rounded-3xl border border-glass-border bg-card/30 backdrop-blur-md">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">100% Tested Devices</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Every laptop undergoes a strict 30-point diagnostics check covering battery health, pixel defects, ports, and thermals.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-glass-border bg-card/30 backdrop-blur-md">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <Truck className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Secure Islandwide Delivery</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We deliver directly to your doorstep in Colombo, Kandy, Galle, Jaffna, or anywhere else. Double-box bubble-wrap packaging guarantees safety.
              </p>
            </div>

            <div className="p-8 rounded-3xl border border-glass-border bg-card/30 backdrop-blur-md">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-6">
                <HelpCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-bold mb-3">Reliable After-Sales Warranty</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Get up to 2 years warranty on new models, and a solid 6-month warranty on used/refurbished devices. Dedicated repairs lab for fast solutions.
              </p>
            </div>

          </div>
        </section>

        {/* 6. Customer Reviews */}
        <section className="py-16 sm:py-20 bg-secondary/15 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl sm:text-3xl font-black text-center tracking-tight mb-12">
              Loved by Sri Lanka's Developers & Gamers
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, idx) => (
                <div key={idx} className="p-6 rounded-2xl border border-glass-border bg-card">
                  <div className="flex items-center gap-1 text-amber-500 mb-4">
                    {[...Array(t.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-foreground italic mb-6 leading-relaxed">
                    "{t.comment}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/20 text-primary font-bold text-xs flex items-center justify-center">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-foreground">{t.name}</div>
                      <div className="text-xs text-muted-foreground">{t.role}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. Brands Logos section */}
        <section className="py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-xs text-muted-foreground uppercase font-bold tracking-widest mb-8">Authorized Brand Stocks</div>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16 opacity-60">
            {BRANDS.map((brand, idx) => (
              <span key={idx} className="text-lg md:text-2xl font-black hover:text-primary transition-colors hover:scale-105 duration-200">
                {brand}
              </span>
            ))}
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
