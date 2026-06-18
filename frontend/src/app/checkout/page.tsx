"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth, API_URL } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  CreditCard,
  Building,
  CheckCircle2,
  AlertCircle,
  Truck,
  Loader2,
  Lock,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, cartTotal, clearCart } = useCart();
  const { user, token, isLoading: authLoading } = useAuth();

  // Shipping Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Colombo");
  const [paymentMethod, setPaymentMethod] = useState("Cash on Delivery");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successOrder, setSuccessOrder] = useState<any>(null);

  // Authenticate user before checkout
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login?redirect=/checkout");
    } else if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user, authLoading, router]);

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Authenticating checkout...</span>
        </div>
        <Footer />
      </div>
    );
  }

  if (cart.length === 0 && !successOrder) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-8 max-w-sm mx-auto text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h2 className="text-lg font-bold">Your cart is empty</h2>
          <p className="text-xs text-muted-foreground mt-2 mb-6">
            You cannot check out without items in your cart.
          </p>
          <button
            onClick={() => router.push("/catalog")}
            className="px-6 h-10 rounded-full bg-primary text-primary-foreground font-bold text-xs"
          >
            Go to Catalog
          </button>
        </div>
        <Footer />
      </div>
    );
  }

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setIsSubmitting(true);

    const itemsPayload = cart.map((item) => ({
      product_id: item.id,
      name: item.name,
      quantity: item.quantity,
      price: item.price,
    }));

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          payment_method: paymentMethod,
          shipping_address: `${address}, ${city}`,
          phone,
          email,
          items: itemsPayload,
        }),
      });

      if (response.ok) {
        const orderData = await response.json();
        setSuccessOrder(orderData);
        clearCart(); // clear cart on success
      } else {
        const errorData = await response.json();
        setErrorMsg(errorData.detail || "Failed to place order. Check product stock levels.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order was successfully completed
  if (successOrder) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow max-w-md mx-auto w-full px-4 py-20 flex flex-col items-center justify-center text-center">
          <div className="h-16 w-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center mb-6">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground uppercase tracking-tight mb-2">
            Order Placed!
          </h1>
          <p className="text-sm text-muted-foreground mb-4">
            Thank you for shopping with Mr_Laptop.lk. Your order ID is{" "}
            <span className="font-bold text-foreground">#{successOrder.id}</span>.
          </p>
          <div className="p-4 rounded-xl border border-glass-border bg-secondary/35 text-xs text-left space-y-2 mb-8 w-full">
            <div><span className="font-bold text-muted-foreground">Shipping To:</span> {fullName}</div>
            <div><span className="font-bold text-muted-foreground">Delivery Address:</span> {successOrder.shipping_address}</div>
            <div><span className="font-bold text-muted-foreground">Payment Method:</span> {successOrder.payment_method}</div>
            <div><span className="font-bold text-muted-foreground">Total Paid:</span> LKR {successOrder.total_price.toLocaleString()}</div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <button
              onClick={() => router.push("/dashboard?tab=orders")}
              className="flex-1 h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all"
            >
              Track Order
            </button>
            <button
              onClick={() => router.push("/catalog")}
              className="flex-1 h-11 bg-secondary border text-foreground font-bold rounded-xl text-xs hover:bg-secondary/80 transition-all"
            >
              Continue Shopping
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight mb-8">
          Checkout Details
        </h1>

        <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Shipping Form: 7 cols */}
          <div className="lg:col-span-7 space-y-6">
            <div className="p-6 rounded-3xl border border-glass-border bg-card">
              <h2 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                <Truck className="h-4.5 w-4.5 text-primary" />
                <span>1. Shipping Information</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">Phone Number</label>
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +94 77 123 4567"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Delivery Address</label>
                  <input
                    type="text"
                    required
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street, area and house number"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">City (Sri Lanka)</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary font-semibold"
                  >
                    <option value="Colombo">Colombo</option>
                    <option value="Kandy">Kandy</option>
                    <option value="Galle">Galle</option>
                    <option value="Gampaha">Gampaha</option>
                    <option value="Negombo">Negombo</option>
                    <option value="Jaffna">Jaffna</option>
                    <option value="Kurunegala">Kurunegala</option>
                  </select>
                </div>

              </div>
            </div>

            {/* Payment options */}
            <div className="p-6 rounded-3xl border border-glass-border bg-card">
              <h2 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
                <Lock className="h-4.5 w-4.5 text-primary" />
                <span>2. Payment Option</span>
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "Cash on Delivery"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Cash on Delivery"
                    checked={paymentMethod === "Cash on Delivery"}
                    onChange={() => setPaymentMethod("Cash on Delivery")}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <Truck className="h-4 w-4 text-primary" />
                      <span>Cash On Delivery (COD)</span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      Pay in cash when our courier delivers the box to your home.
                    </div>
                  </div>
                </label>

                <label className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                  paymentMethod === "Bank Transfer"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-border/80"
                }`}>
                  <input
                    type="radio"
                    name="payment"
                    value="Bank Transfer"
                    checked={paymentMethod === "Bank Transfer"}
                    onChange={() => setPaymentMethod("Bank Transfer")}
                    className="mt-1"
                  />
                  <div className="text-xs">
                    <div className="font-bold flex items-center gap-1.5">
                      <Building className="h-4 w-4 text-primary" />
                      <span>Bank Transfer</span>
                    </div>
                    <div className="text-muted-foreground mt-1">
                      Transfer money to our bank account. Instructions sent via email.
                    </div>
                  </div>
                </label>

              </div>
            </div>

          </div>

          {/* Order Summary details: 5 cols */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-3xl border border-glass-border bg-card">
              <h3 className="text-sm font-black uppercase tracking-wider mb-4">Items Summary</h3>
              
              <div className="space-y-3 max-h-60 overflow-y-auto pr-2 mb-6 border-b border-border/40 pb-4">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center text-xs">
                    <div className="h-10 w-10 bg-white rounded border border-border/40 p-1 shrink-0 flex items-center justify-center">
                      <img src={item.image_url} alt="" className="h-full w-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{item.name}</div>
                      <div className="text-[10px] text-muted-foreground">Qty: {item.quantity}</div>
                    </div>
                    <div className="font-black text-foreground shrink-0">
                      LKR {(item.price * item.quantity).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 text-sm border-b border-border/40 pb-4 mb-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping Fee</span>
                  <span className="text-green-500 font-bold">FREE Delivery</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-sm font-bold">Grand Total</span>
                <span className="text-xl font-black text-primary">
                  LKR {cartTotal.toLocaleString()}
                </span>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-semibold mb-4">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all flex items-center justify-center text-xs"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : `Place Order (LKR ${cartTotal.toLocaleString()})`}
              </button>

            </div>
          </div>

        </form>
      </main>

      <Footer />
    </div>
  );
}
