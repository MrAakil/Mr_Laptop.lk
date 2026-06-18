"use client";

import React from "react";
import Link from "next/link";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Award, Compass, ShieldCheck, Heart } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Intro */}
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground uppercase tracking-tight">
            About Mr_Laptop.lk
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Founded in Colombo, Sri Lanka, Mr_Laptop.lk is the premium hardware destination for university students, software developers, graphic designers, office workers, and gaming enthusiasts. We bridge the gap between quality and affordability.
          </p>
        </div>

        {/* Story Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground uppercase tracking-tight mb-4">
              Our Mission & Journey
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Our journey started with a simple problem: finding genuine laptops in Sri Lanka with reliable warranties and trustworthy diagnostic testing. The market was flooded with unchecked used systems and gray-market units.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Mr_Laptop.lk was built to change that. We established a fully-fledged hardware diagnostics laboratory in Colombo, hiring expert certified micro-soldering and thermal engineers. Today, we inspect, clean, and certify every device before it leaves our storefront.
            </p>
          </div>
          <div>
            <img
              src="https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=800&auto=format&fit=crop"
              alt="Laptop Testing Laboratory"
              className="rounded-3xl border border-glass-border shadow-2xl w-full h-80 object-cover"
            />
          </div>
        </div>

        {/* Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-20 text-center">
          
          <div className="p-6 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Iron-Clad Warranties</h3>
            <p className="text-xs text-muted-foreground">
              Up to 2 years local agent warranty on brand new laptops, and a dedicated 6 months store warranty on all pre-owned inventory.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Award className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2">30-Point Testing</h3>
            <p className="text-xs text-muted-foreground">
              We diagnose battery discharge curves, screen pixels, keyboard keycaps, ports connectivity, and thermal load benchmarks.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Compass className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Islandwide Logistics</h3>
            <p className="text-xs text-muted-foreground">
              We ship to all 9 provinces in Sri Lanka securely bubble-boxed. Pay at your doorstep via Cash on Delivery or easy Bank Transfers.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md">
            <div className="mx-auto w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
              <Heart className="h-5 w-5" />
            </div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-2">Dedicated Support</h3>
            <p className="text-xs text-muted-foreground">
              Chat, phone, or walk into our retail location in Colombo 03 for instant hardware upgrades, OS installations, or component repair.
            </p>
          </div>

        </div>

      </main>

      <Footer />
    </div>
  );
}
