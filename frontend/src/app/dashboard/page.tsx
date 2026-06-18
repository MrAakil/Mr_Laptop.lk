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

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

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
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "Processing":
        return <Compass className="h-5 w-5 text-blue-500" />;
      case "Shipped":
        return <Truck className="h-5 w-5 text-indigo-500" />;
      case "Delivered":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const renderOrderProgress = (status: string) => {
    const statuses = ["Pending", "Processing", "Shipped", "Delivered"];
    const activeIndex = statuses.indexOf(status);

    if (status === "Cancelled") {
      return (
        <div className="p-3 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold inline-block border border-red-500/20">
          Order Cancelled
        </div>
      );
    }

    return (
      <div className="flex flex-col sm:flex-row sm:items-center gap-6 mt-4 pt-4 border-t border-border/40">
        <div className="text-[10px] uppercase font-bold text-muted-foreground">Tracking Progress</div>
        <div className="flex items-center gap-2 flex-grow max-w-lg">
          {statuses.map((s, idx) => {
            const isCompleted = idx <= activeIndex;
            return (
              <React.Fragment key={s}>
                {/* Step ball */}
                <div className="flex flex-col items-center shrink-0">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-black border transition-all ${
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
                    className={`h-[2px] flex-grow transition-all duration-500 ${
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

  if (authLoading) {
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

  if (!user) {
    router.push("/auth/login");
    return null;
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
                        className="p-6 rounded-2xl border border-glass-border bg-card/40 backdrop-blur-sm space-y-4"
                      >
                        {/* Order Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                          <div className="space-y-0.5">
                            <div className="text-sm font-black text-foreground">Order #{o.id}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              <span>Placed: {new Date(o.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="text-[10px] text-muted-foreground">Total Price</div>
                              <div className="text-sm font-black text-primary">LKR {o.total_price.toLocaleString()}</div>
                            </div>
                            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary text-xs font-bold">
                              {getStatusIcon(o.status)}
                              <span>{o.status}</span>
                            </div>
                          </div>
                        </div>

                        {/* Order Items list */}
                        <div className="space-y-3">
                          {o.items.map((item: any, index: number) => (
                            <div key={index} className="flex gap-4 items-center text-xs">
                              <div className="h-10 w-10 bg-white rounded border border-border/30 p-1 shrink-0 flex items-center justify-center">
                                <img src={item.image_url || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=200"} alt="" className="h-full w-full object-contain" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-foreground">{item.name}</div>
                                <div className="text-[10px] text-muted-foreground">Qty: {item.quantity} • Price: LKR {item.price.toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Progress Visualizer */}
                        {renderOrderProgress(o.status)}

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
