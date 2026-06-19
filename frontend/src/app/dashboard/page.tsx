"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, API_URL } from "@/context/AuthContext";
import { useWishlist } from "@/context/WishlistContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ProductCard } from "@/components/ProductCard";
import {
  ShoppingBag,
  Heart,
  User,
  MapPin,
  Phone,
  Mail,
  Truck,
  CheckCircle2,
  Clock,
  Compass,
  Save,
  Loader2,
  LogOut,
  Calendar,
  XCircle,
  Download,
  FileText,
} from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, token, logout, updateProfile, isLoading: authLoading } = useAuth();
  const { wishlist } = useWishlist();

  // Active Tab
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "orders");

  // Orders State
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [cancellingOrderId, setCancellingOrderId] = useState<number | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<number | null>(null);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  // Download PDF Invoice
  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
    setDownloadingInvoiceId(orderId);
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Invoice-${orderNumber}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        alert("Failed to download invoice.");
      }
    } catch (err) {
      console.error("Error downloading invoice", err);
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  // Cancel order (only if status is Pending)
  const handleCancelOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrderId(orderId);
    try {
      const response = await fetch(`${API_URL}/orders/${orderId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        // Update local state status
        const updatedOrders = orders.map((o) => {
          if (o.id === orderId) {
            return { ...o, order_status: "Cancelled", payment_status: "Failed" };
          }
          return o;
        });
        setOrders(updatedOrders);
      } else {
        const data = await response.json();
        alert(data.detail || "Failed to cancel order.");
      }
    } catch (err) {
      console.error("Error cancelling order", err);
    } finally {
      setCancellingOrderId(null);
    }
  };

  // Auto tab adjustment on search params changes
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  // Load user profile details
  useEffect(() => {
    if (user) {
      setFullName(user.full_name);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Load orders if Tab is orders
  useEffect(() => {
    if (!token || !user) return;
    
    async function loadOrders() {
      setOrdersLoading(true);
      try {
        const response = await fetch(`${API_URL}/orders`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setOrders(data);
        }
      } catch (err) {
        console.error("Error fetching customer orders", err);
      } finally {
        setOrdersLoading(false);
      }
    }
    
    if (activeTab === "orders") {
      loadOrders();
    }
  }, [activeTab, token, user]);

  // Redirect to login if user is not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/login");
    }
  }, [user, authLoading, router]);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage("");
    setSavingProfile(true);

    try {
      const success = await updateProfile({
        full_name: fullName,
        phone,
        address,
      });
      if (success) {
        setProfileMessage("Profile updated successfully!");
      } else {
        setProfileMessage("Failed to update profile details.");
      }
    } catch (err) {
      console.error(err);
      setProfileMessage("An error occurred saving details.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Pending":
        return <Clock className="h-4 w-4 text-amber-500" />;
      case "Confirmed":
        return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case "Processing":
        return <Compass className="h-4 w-4 text-blue-500" />;
      case "Shipped":
        return <Truck className="h-4 w-4 text-indigo-500" />;
      case "Delivered":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "Cancelled":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-500/10 text-amber-500 border border-amber-500/20";
      case "Confirmed":
        return "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
      case "Processing":
        return "bg-blue-500/10 text-blue-500 border border-blue-500/20";
      case "Shipped":
        return "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20";
      case "Delivered":
        return "bg-green-500/10 text-green-500 border border-green-500/20";
      case "Cancelled":
        return "bg-red-500/10 text-red-500 border border-red-500/20";
      default:
        return "bg-secondary text-muted-foreground border border-border";
    }
  };

  const renderOrderProgress = (status: string) => {
    const statuses = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered"];
    const activeIndex = statuses.indexOf(status);

    if (status === "Cancelled") {
      return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20 max-w-sm mt-4">
          <XCircle className="h-4 w-4 shrink-0" />
          <span>This order has been cancelled and stock was restored.</span>
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4 pt-4 border-t border-border/40">
        <div className="text-[10px] uppercase font-black tracking-wider text-muted-foreground shrink-0">Tracking Status</div>
        <div className="flex items-center gap-2 flex-grow max-w-xl overflow-x-auto pb-2 sm:pb-0 scrollbar-none">
          {statuses.map((s, idx) => {
            const isCompleted = idx <= activeIndex;
            return (
              <React.Fragment key={s}>
                {/* Step ball */}
                <div className="flex flex-col items-center shrink-0 min-w-[56px]">
                  <div
                    className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
                      isCompleted
                        ? "bg-primary text-white border-primary shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                        : "bg-secondary text-muted-foreground border-border"
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-foreground/80">{s}</span>
                </div>
                {/* Step Connector bar */}
                {idx < statuses.length - 1 && (
                  <div
                    className={`h-[2px] min-w-[20px] flex-grow transition-all duration-500 ${
                      idx < activeIndex ? "bg-primary" : "bg-border"
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  if (authLoading || !user) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Welcome Banner */}
        <div className="p-8 rounded-3xl border border-glass-border bg-gradient-to-r from-secondary/40 via-secondary/10 to-background mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black text-foreground">
              Ayubowan, {user.full_name}!
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your profile, monitor hardware orders, and view saved items.
            </p>
          </div>
          <button
            onClick={logout}
            className="self-start md:self-center h-10 px-6 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Sidebar Menu: 3 cols */}
          <aside className="lg:col-span-3 flex flex-row lg:flex-col gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 border-b lg:border-0 border-border/40 mb-6 lg:mb-0">
            <button
              onClick={() => {
                setActiveTab("orders");
                router.push("/dashboard?tab=orders");
              }}
              className={`flex items-center gap-2 px-4 h-11 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                activeTab === "orders" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <ShoppingBag className="h-4.5 w-4.5" />
              <span>Orders & Tracking</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("wishlist");
                router.push("/dashboard?tab=wishlist");
              }}
              className={`flex items-center gap-2 px-4 h-11 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                activeTab === "wishlist" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <Heart className="h-4.5 w-4.5" />
              <span>My Wishlist</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("profile");
                router.push("/dashboard?tab=profile");
              }}
              className={`flex items-center gap-2 px-4 h-11 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 transition-all ${
                activeTab === "profile" ? "bg-primary text-primary-foreground shadow-lg shadow-primary/10" : "hover:bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <User className="h-4.5 w-4.5" />
              <span>Profile Settings</span>
            </button>
          </aside>

          {/* Core Content Area: 9 cols */}
          <section className="lg:col-span-9">
            
            {/* TAB 1: Orders and Tracking */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">Your Order History</h2>

                {ordersLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : orders.length > 0 ? (
                  <div className="space-y-6">
                    {orders.map((o) => (
                      <div
                        key={o.id}
                        className="p-6 rounded-2xl border border-glass-border bg-card/45 backdrop-blur-sm space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                          <div className="space-y-0.5">
                            <div className="text-sm font-black text-foreground">Order #{o.order_number}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Placed: {new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] text-muted-foreground font-semibold">Grand Total</div>
                              <div className="text-sm font-black text-primary">LKR {o.total_amount.toLocaleString()}</div>
                            </div>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusBadgeClass(o.order_status)}`}>
                              {getStatusIcon(o.order_status)}
                              <span>{o.order_status}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items list */}
                        <div className="space-y-3">
                          {o.items.map((item: any, index: number) => (
                            <div key={index} className="flex gap-4 items-center text-xs">
                              <div className="h-10 w-10 bg-white rounded border border-border/30 p-1 shrink-0 flex items-center justify-center">
                                <img src={item.product_image || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=200"} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-foreground">{item.product_name}</div>
                                <div className="text-[10px] text-muted-foreground">Qty: {item.quantity} • Price: LKR {item.unit_price.toLocaleString()}</div>
                              </div>
                              <div className="font-black text-foreground text-xs">
                                LKR {item.total_price.toLocaleString()}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Shipping and Payment Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-xl border border-border/30 bg-secondary/15 text-xs text-foreground">
                          <div>
                            <span className="font-black text-muted-foreground text-[10px] uppercase block mb-1">Shipping Details</span>
                            <span className="font-medium">{o.customer_name}</span>
                            <span className="text-muted-foreground block text-[11px] mt-0.5">{o.shipping_address}, {o.city}, {o.district}, {o.postal_code}</span>
                          </div>
                          <div>
                            <span className="font-black text-muted-foreground text-[10px] uppercase block mb-1">Payment Information</span>
                            <span className="font-medium block">{o.payment_method}</span>
                            <span className="text-muted-foreground block text-[11px] mt-0.5">Status: <span className="font-bold text-foreground">{o.payment_status}</span></span>
                          </div>
                          <div>
                            <span className="font-black text-muted-foreground text-[10px] uppercase block mb-1">Tracking & Notes</span>
                            <span className="text-[11px] block">
                              Tracking No: {o.tracking_number ? <span className="font-mono bg-secondary border border-border/40 px-1.5 py-0.5 rounded text-foreground font-bold">{o.tracking_number}</span> : <span className="text-muted-foreground">Not shipped yet</span>}
                            </span>
                            {o.notes && <span className="text-muted-foreground italic mt-1.5 block text-[11px]">"{o.notes}"</span>}
                          </div>
                        </div>

                        {/* Order Progress Visualizer */}
                        {renderOrderProgress(o.order_status)}

                        {/* Order Actions */}
                        <div className="flex flex-wrap gap-3 pt-2">
                          <button
                            onClick={() => handleDownloadInvoice(o.id, o.order_number)}
                            disabled={downloadingInvoiceId === o.id}
                            className="h-9 px-4 rounded-xl border border-glass-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            {downloadingInvoiceId === o.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Download className="h-3.5 w-3.5" />
                            )}
                            <span>Download Invoice (PDF)</span>
                          </button>

                          {o.order_status === "Pending" && (
                            <button
                              onClick={() => handleCancelOrder(o.id)}
                              disabled={cancellingOrderId === o.id}
                              className="h-9 px-4 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 ml-auto"
                            >
                              {cancellingOrderId === o.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5" />
                              )}
                              <span>Cancel Order</span>
                            </button>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-secondary/10">
                    <p className="text-xs text-muted-foreground mb-4">You have not placed any orders yet.</p>
                    <button
                      onClick={() => router.push("/catalog")}
                      className="px-6 h-9 rounded-full bg-primary text-primary-foreground font-bold text-xs"
                    >
                      Start Shopping
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: Wishlist Grid */}
            {activeTab === "wishlist" && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">Saved Wishlist ({wishlist.length})</h2>

                {wishlist.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlist.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 border border-dashed border-border rounded-2xl bg-secondary/10">
                    <p className="text-xs text-muted-foreground mb-4 font-semibold">Your wishlist is currently empty.</p>
                    <button
                      onClick={() => router.push("/catalog")}
                      className="px-6 h-9 rounded-full bg-primary text-primary-foreground font-bold text-xs"
                    >
                      Find Laptops
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: Profile Form */}
            {activeTab === "profile" && (
              <div className="space-y-6 max-w-xl">
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">Personal Information</h2>
                
                <form onSubmit={handleProfileSave} className="p-6 rounded-3xl border border-glass-border bg-card space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <User className="h-3.5 w-3.5 text-primary" />
                      <span>Full Name</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5 text-primary" />
                      <span>Email (Read Only)</span>
                    </label>
                    <input
                      type="email"
                      disabled
                      value={user.email}
                      className="w-full h-10 px-4 rounded-xl bg-secondary border border-border/50 text-xs text-muted-foreground cursor-not-allowed"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      <span>Phone Number</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+94 77 123 4567"
                      className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" />
                      <span>Default Delivery Address</span>
                    </label>
                    <textarea
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Galle Road, Colombo 03"
                      className="w-full p-3 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="w-full sm:w-auto px-6 h-10 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5"
                  >
                    {savingProfile ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        <span>Save Changes</span>
                      </>
                    )}
                  </button>

                  {profileMessage && (
                    <p className={`text-xs font-bold ${profileMessage.includes("successfully") ? "text-green-500" : "text-red-500"}`}>
                      {profileMessage}
                    </p>
                  )}

                </form>
              </div>
            )}

          </section>

        </div>

      </main>

      <Footer />
    </div>
  );
}

export default function Dashboard() {
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
      <DashboardContent />
    </Suspense>
  );
}
