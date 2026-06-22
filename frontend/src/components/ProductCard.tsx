"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { ShoppingCart, Heart, GitCompare, Star, Check, Cpu } from "lucide-react";

interface ProductCardProps {
  product: {
    id: number;
    name: string;
    brand: string;
    condition: string;
    price: number;
    discount: number;
    specs: {
      cpu: string;
      ram: string;
      storage: string;
      gpu: string;
      display: string;
    };
    image_urls: string[];
    category: string;
    stock: number;
    rating: number;
  };
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart, cart } = useCart();
  const { toggleWishlist, inWishlist } = useWishlist();
  const { toggleCompare, inCompare } = useCompare();

  const isAlreadyInCart = cart.some((item) => item.id === product.id);
  const isWishlisted = inWishlist(product.id);
  const isCompared = inCompare(product.id);

  // Price calculations
  const originalPrice = product.price;
  const discountedPrice = originalPrice * (1 - product.discount / 100);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const success = toggleCompare(product);
    if (!success) {
      alert("You can compare a maximum of 3 laptops at a time.");
    }
  };

  const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    await toggleWishlist(product);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.stock > 0) {
      addToCart(product, 1);
    }
  };

  return (
    <div className="group relative flex flex-col w-full rounded-2xl glass-card overflow-hidden hover:-translate-y-1.5 transition-all duration-300">
      
      {/* Product Image and badges with 3D depth */}
      <Link 
        href={`/product/${product.id}`} 
        className="relative block aspect-video w-full overflow-hidden bg-gradient-to-br from-secondary/40 to-background/20 p-6 border-b border-border/20"
      >
        <img
          src={product.image_urls[0]}
          alt={product.name}
          className="h-full w-full object-contain filter drop-shadow-[0_10px_15px_rgba(0,0,0,0.15)] group-hover:drop-shadow-[0_20px_25px_rgba(6,182,212,0.25)] group-hover:-translate-y-2 group-hover:scale-105 transition-all duration-500"
          loading="lazy"
        />

        {/* Floating Spec Chips (shows on image viewport) */}
        <div className="absolute bottom-2 left-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="px-2 py-0.5 rounded bg-secondary/80 text-[8px] font-black text-accent border border-accent/20 uppercase tracking-widest backdrop-blur-sm">
            {product.specs.cpu.split(" ")[0]}
          </span>
          {product.specs.gpu !== "N/A" && (
            <span className="px-2 py-0.5 rounded bg-secondary/80 text-[8px] font-black text-primary border border-primary/20 uppercase tracking-widest backdrop-blur-sm">
              {product.specs.gpu.split(" ")[0]}
            </span>
          )}
        </div>

        {/* Condition Badge */}
        <span className={`absolute top-3 left-3 px-2.5 py-1 text-[9px] font-black uppercase rounded-lg tracking-wider backdrop-blur-sm ${
          product.condition === "New" 
            ? "bg-green-500/10 text-green-400 border border-green-500/20"
            : product.condition === "Refurbished"
            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {product.condition}
        </span>

        {/* Discount Badge */}
        {product.discount > 0 && (
          <span className="absolute top-3 right-3 px-2.5 py-1 text-[9px] font-black bg-red-500 text-white rounded-lg uppercase tracking-wider glow-red">
            {product.discount}% OFF
          </span>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex flex-col flex-1 p-5">
        
        {/* Brand and Rating */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/80">
            {product.brand}
          </span>
          <div className="flex items-center gap-1 text-xs text-amber-500 font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span>{product.rating.toFixed(1)}</span>
          </div>
        </div>

        {/* Name */}
        <Link href={`/product/${product.id}`} className="mb-3">
          <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {product.name}
          </h3>
        </Link>

        {/* Specs highlights */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1.5 mb-4 text-[10px] text-muted-foreground border-y border-border/20 py-3">
          <div className="truncate flex items-center gap-1"><Cpu className="h-3 w-3 text-accent/80" /> {product.specs.cpu}</div>
          <div className="truncate">RAM: {product.specs.ram}</div>
          <div className="truncate">GPU: {product.specs.gpu}</div>
          <div className="truncate">SSD: {product.specs.storage}</div>
        </div>

        {/* Pricing & Cart Button */}
        <div className="mt-auto flex items-center justify-between gap-2">
          
          <div className="flex flex-col">
            {product.discount > 0 && (
              <span className="text-[10px] text-muted-foreground line-through">
                LKR {originalPrice.toLocaleString()}
              </span>
            )}
            <span className="text-sm font-black text-foreground">
              LKR {discountedPrice.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1">
            
            {/* Compare Control */}
            <button
              onClick={handleCompareToggle}
              className={`p-2 rounded-xl border text-muted-foreground hover:text-primary transition-all duration-200 ${
                isCompared 
                  ? "border-primary/40 text-primary bg-primary/10 glow-blue" 
                  : "border-border/60 hover:border-primary/30"
              }`}
              title="Compare"
            >
              <GitCompare className="h-4 w-4" />
            </button>

            {/* Wishlist Control */}
            <button
              onClick={handleWishlistToggle}
              className={`p-2 rounded-xl border text-muted-foreground hover:text-red-500 transition-all duration-200 ${
                isWishlisted 
                  ? "border-red-500/40 text-red-500 bg-red-500/10" 
                  : "border-border/60 hover:border-red-500/30"
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`h-4 w-4 ${isWishlisted ? "fill-current" : ""}`} />
            </button>

            {/* Quick Add to Cart */}
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className={`p-2 rounded-xl font-bold transition-all duration-200 ${
                product.stock <= 0
                  ? "bg-secondary text-muted-foreground cursor-not-allowed"
                  : isAlreadyInCart
                  ? "bg-green-500 text-white"
                  : "bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5"
              }`}
              title={product.stock <= 0 ? "Out of Stock" : isAlreadyInCart ? "Added to Cart" : "Add to Cart"}
            >
              {isAlreadyInCart ? <Check className="h-4 w-4" /> : <ShoppingCart className="h-4 w-4" />}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};
