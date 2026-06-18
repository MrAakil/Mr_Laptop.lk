"use client";

import React from "react";
import Link from "next/link";
import { useCompare } from "@/context/CompareContext";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { GitCompare, ShoppingCart, Trash2, ArrowLeft, Star } from "lucide-react";

export default function ComparePage() {
  const { compareList, toggleCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight">Compare Laptops</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Compare up to 3 devices side-by-side to make the right choice
            </p>
          </div>
          
          {compareList.length > 0 && (
            <button
              onClick={clearCompare}
              className="self-start text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
            >
              Clear Comparison List
            </button>
          )}
        </div>

        {compareList.length > 0 ? (
          <div className="overflow-x-auto rounded-3xl border border-glass-border bg-card/40 backdrop-blur-md">
            <table className="w-full text-left text-xs border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/15">
                  <th className="px-6 py-5 font-bold text-muted-foreground w-1/4">Specification</th>
                  {compareList.map((product) => (
                    <th key={product.id} className="px-6 py-5 font-black text-sm relative w-1/4">
                      <button
                        onClick={() => toggleCompare(product)}
                        className="absolute top-2 right-2 p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-secondary transition-all"
                        title="Remove"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <div className="h-24 flex items-center justify-center p-2 mb-4 bg-white rounded-2xl border border-border/40">
                        <img
                          src={product.image_urls[0]}
                          alt={product.name}
                          className="h-full object-contain"
                        />
                      </div>
                      <div className="truncate max-w-[180px] text-foreground">{product.name}</div>
                    </th>
                  ))}
                  {/* Fill empty comparison columns to maintain 4 column layout */}
                  {[...Array(3 - compareList.length)].map((_, i) => (
                    <th key={i} className="px-6 py-5 text-center text-muted-foreground font-medium w-1/4">
                      <div className="h-32 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-secondary/5">
                        <GitCompare className="h-6 w-6 mb-2 text-border" />
                        <Link href="/catalog" className="text-[10px] font-bold text-primary hover:underline">
                          + Add Laptop
                        </Link>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Brand */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Brand</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-semibold">{p.brand}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Condition */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Condition</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-semibold uppercase text-xs">{p.condition}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Price */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Price (LKR)</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-bold text-primary">
                      LKR {(p.price * (1 - p.discount / 100)).toLocaleString()}
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* CPU */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">CPU Processor</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.cpu}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* RAM */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">RAM memory</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.ram}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Storage */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Storage SSD</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.storage}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* GPU */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Graphics (GPU)</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.gpu}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Display */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Display Details</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.display}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* OS */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Operating System</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4">{p.specs.os}</td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Rating */}
                <tr className="border-b border-border/40">
                  <td className="px-6 py-4 font-bold text-muted-foreground bg-secondary/20">Rating</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="px-6 py-4 font-bold flex items-center gap-1 text-amber-500">
                      <Star className="h-4 w-4 fill-current" />
                      <span>{p.rating.toFixed(1)}</span>
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>

                {/* Cart Action button */}
                <tr>
                  <td className="px-6 py-5 font-bold text-muted-foreground bg-secondary/20">Purchase</td>
                  {compareList.map((product) => (
                    <td key={product.id} className="px-6 py-5">
                      <button
                        onClick={() => addToCart(product, 1)}
                        disabled={product.stock <= 0}
                        className="w-full h-9 rounded-lg bg-primary text-primary-foreground font-bold hover:bg-primary/95 text-[10px] flex items-center justify-center gap-1 hover:shadow"
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        <span>Add To Cart</span>
                      </button>
                    </td>
                  ))}
                  {[...Array(3 - compareList.length)].map((_, i) => <td key={i} className="bg-secondary/5" />)}
                </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-secondary/15 max-w-md mx-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
              <GitCompare className="h-6 w-6" />
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
