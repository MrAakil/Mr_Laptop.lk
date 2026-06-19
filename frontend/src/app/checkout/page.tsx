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
  const [district, setDistrict] = useState("Colombo");
  const [postalCode, setPostalCode] = useState("");
  const [notes, setNotes] = useState("");
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

    // Format to match backend Pydantic OrderItemCreate schema
    const itemsPayload = cart.map((item) => ({
      product_id: item.id,
      quantity: item.quantity,
    }));

    try {
      const response = await fetch(`${API_URL}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          customer_name: fullName,
          customer_email: email,
          customer_phone: phone,
          shipping_address: address,
          city,
          district,
          postal_code: postalCode,
          notes: notes || null,
          payment_method: paymentMethod,
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
    // Generate WhatsApp click-to-chat URL
    const productsText = successOrder.items
      .map((item: any) => `- ${item.product_name} x ${item.quantity}`)
      .join("\n");
      
    const waMessage = `NEW ORDER

Order Number:
${successOrder.order_number}

Customer:
${successOrder.customer_name}

Phone:
${successOrder.customer_phone}

Total:
Rs ${successOrder.total_amount.toLocaleString()}

Products:
${productsText}

Address:
${successOrder.shipping_address}, ${successOrder.city}, ${successOrder.district}, ${successOrder.postal_code}`;

    const waUrl = `https://wa.me/94789788848?text=${encodeURIComponent(waMessage)}`;

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
            <span className="font-bold text-foreground">#{successOrder.order_number}</span>.
          </p>
          
          <div className="p-4 rounded-xl border border-glass-border bg-secondary/35 text-xs text-left space-y-2 mb-6 w-full">
            <div><span className="font-bold text-muted-foreground">Shipping To:</span> {successOrder.customer_name}</div>
            <div><span className="font-bold text-muted-foreground">Delivery Address:</span> {successOrder.shipping_address}, {successOrder.city}, {successOrder.district}</div>
            <div><span className="font-bold text-muted-foreground">Payment Method:</span> {successOrder.payment_method}</div>
            <div><span className="font-bold text-muted-foreground">Total:</span> LKR {successOrder.total_amount.toLocaleString()}</div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-11 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-500/10"
            >
              <svg className="h-5 w-5 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.852.002-2.63-1.023-5.101-2.883-6.963C16.593 1.97 14.12 .946 11.49 .946c-5.444 0-9.873 4.42-9.877 9.855-.001 1.77.461 3.5 1.392 5.053l-1.01 3.687 3.784-.992zm11.23-7.587c-.301-.15-1.785-.881-2.062-.982-.278-.1-.48-.15-.68.15-.2.3-.775.982-.95 1.183-.175.2-.35.225-.65.075-.3-.15-1.265-.467-2.41-1.485-.89-.795-1.49-1.77-1.665-2.07-.175-.3-.02-.463.13-.613.135-.135.301-.35.451-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.68-1.637-.93-2.237-.243-.587-.49-.507-.68-.517-.174-.01-.375-.012-.575-.012-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.22 5.115 4.525.715.31 1.27.495 1.704.63.72.23 1.375.197 1.895.12.58-.087 1.785-.73 2.035-1.432.25-.703.25-1.303.175-1.433-.075-.13-.275-.205-.575-.355z" />
              </svg>
              <span>Notify Seller on WhatsApp</span>
            </a>
            
            <div className="flex gap-3">
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
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
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
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
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
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
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
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">City (Sri Lanka)</label>
                  <input
                    type="text"
                    required
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="e.g. Colombo / Jaffna"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground">District</label>
                  <input
                    type="text"
                    required
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    placeholder="e.g. Colombo / Puttalam"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-semibold"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Postal Code</label>
                  <input
                    type="text"
                    required
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    placeholder="e.g. 00300"
                    className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
                  />
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-bold text-muted-foreground">Order Notes (Optional)</label>
                  <textarea
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notes about your delivery, e.g. special instructions"
                    className="w-full p-3 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground"
                  />
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
                    <div className="font-bold flex items-center gap-1.5 text-foreground">
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
                    <div className="font-bold flex items-center gap-1.5 text-foreground">
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
                      <div className="font-bold truncate text-foreground">{item.name}</div>
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
                <span className="text-sm font-bold text-foreground">Grand Total</span>
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
                className="w-full h-12 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/95 shadow-lg shadow-primary/10 transition-all flex items-center justify-center text-xs cursor-pointer"
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
