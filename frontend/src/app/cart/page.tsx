"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Trash2,
  Minus,
  Plus,
  ArrowRight,
  ShoppingBag,
  Percent,
  Truck,
  ArrowLeft,
} from "lucide-react";

export default function CartPage() {
  const {
    cart,
    updateQuantity,
    removeFromCart,
    couponCode,
    discount,
    applyCoupon,
    removeCoupon,
    cartSubtotal,
    cartDiscountAmount,
    cartTotal,
  } = useCart();

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const success = applyCoupon(couponInput);
    if (success) {
      setCouponInput("");
    } else {
      setCouponError("Invalid coupon code. Try 'MRLAPTOP10' or 'COLOMBO20'.");
    }
  };

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight mb-8">
          Shopping Cart
        </h1>

        {cart.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Cart Items List: 8 cols */}
            <div className="lg:col-span-8 space-y-4">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-md"
                >
                  {/* Image */}
                  <div className="h-20 w-20 bg-white rounded-xl p-2 shrink-0 border border-border/40 flex items-center justify-center">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="h-full w-full object-contain"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-grow text-center sm:text-left min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {item.brand}
                    </span>
                    <h3 className="text-sm font-bold text-foreground truncate max-w-xs sm:max-w-md">
                      {item.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      LKR {item.price.toLocaleString()} each
                    </p>
                  </div>

                  {/* Quantity Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock}
                      className="p-1.5 rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground transition-all disabled:opacity-40"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* Item Total & Trash */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto shrink-0 border-t sm:border-0 border-border/20 pt-3 sm:pt-0">
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Total</div>
                      <div className="text-sm font-black text-foreground">
                        LKR {(item.price * item.quantity).toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove Item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                </div>
              ))}

              <div className="pt-4">
                <Link
                  href="/catalog"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  <span>Continue Shopping</span>
                </Link>
              </div>
            </div>

            {/* Cart Summary: 4 cols */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Promo code area */}
              <div className="p-6 rounded-3xl border border-glass-border bg-card">
                <h3 className="text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Percent className="h-4 w-4 text-primary" />
                  <span>Have a Promo Coupon?</span>
                </h3>
                
                {couponCode ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-500 font-bold">
                    <span>Applied: {couponCode} ({discount}% OFF)</span>
                    <button
                      onClick={removeCoupon}
                      className="text-[10px] text-red-500 hover:underline uppercase"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. MRLAPTOP10"
                        value={couponInput}
                        onChange={(e) => setCouponInput(e.target.value)}
                        className="flex-grow h-9 px-3 rounded-lg bg-secondary border border-border text-xs focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 transition-all"
                      >
                        Apply
                      </button>
                    </div>
                    {couponError && (
                      <p className="text-[10px] text-red-500 font-semibold">{couponError}</p>
                    )}
                  </form>
                )}
              </div>

              {/* Price calculations details */}
              <div className="p-6 rounded-3xl border border-glass-border bg-card">
                <h3 className="text-xs font-black uppercase tracking-wider mb-4">Pricing Summary</h3>
                
                <div className="space-y-3 border-b border-border/40 pb-4 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal ({totalQuantity} items)</span>
                    <span>LKR {cartSubtotal.toLocaleString()}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-500 font-bold">
                      <span>Promo Discount ({discount}%)</span>
                      <span>- LKR {cartDiscountAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="text-green-500 font-bold flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      <span>FREE Delivery</span>
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-baseline pt-4 mb-6">
                  <span className="text-sm font-bold">Estimated Total</span>
                  <span className="text-xl font-black text-primary">
                    LKR {cartTotal.toLocaleString()}
                  </span>
                </div>

                <Link
                  href="/checkout"
                  className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-lg shadow-primary/10 hover:shadow-xl transition-all flex items-center justify-center gap-2 text-xs"
                >
                  <span>Proceed To Checkout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

            </div>

          </div>
        ) : (
          <div className="text-center py-20 border border-dashed border-border rounded-3xl bg-secondary/15 max-w-md mx-auto">
            <div className="mx-auto w-12 h-12 rounded-full bg-secondary text-muted-foreground flex items-center justify-center mb-4">
              <ShoppingBag className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-foreground mb-1">Your cart is empty</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Browse our dynamic catalog and choose the best laptop.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center h-10 px-6 bg-primary text-primary-foreground font-bold text-xs rounded-full hover:bg-primary/95 hover:shadow-lg transition-all"
            >
              Start Shopping
            </Link>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
