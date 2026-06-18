"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, API_URL } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  DollarSign,
  ShoppingBag,
  Users,
  Laptop,
  Plus,
  Trash2,
  Edit,
  TrendingUp,
  Loader2,
  CheckCircle,
  Truck,
  Clock,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";

const BRANDS = ["Apple", "Dell", "HP", "Lenovo", "Asus", "Acer", "MSI", "Razer"];
const CATEGORIES = ["Gaming", "Business", "Student", "Creator", "Used", "Accessories"];

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token, isLoading: authLoading } = useAuth();

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Active Management Tab
  const [adminTab, setAdminTab] = useState<"overview" | "products" | "orders">("overview");

  // Product CRUD states
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // New/Edit Product Form state
  const [prodName, setProdName] = useState("");
  const [prodBrand, setProdBrand] = useState("Apple");
  const [prodCondition, setProdCondition] = useState("New");
  const [prodPrice, setProdPrice] = useState("");
  const [prodDiscount, setProdDiscount] = useState("0");
  const [prodCpu, setProdCpu] = useState("");
  const [prodRam, setProdRam] = useState("16GB DDR5");
  const [prodStorage, setProdStorage] = useState("512GB NVMe SSD");
  const [prodGpu, setProdGpu] = useState("Intel Arc");
  const [prodDisplay, setProdDisplay] = useState('14" Display');
  const [prodOs, setProdOs] = useState("Windows 11 Home");
  const [prodDescription, setProdDescription] = useState("");
  const [prodCategory, setProdCategory] = useState("Gaming");
  const [prodStock, setProdStock] = useState("5");
  const [prodImageUrl, setProdImageUrl] = useState("");

  const [crudError, setCrudError] = useState("");
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/login?redirect=/admin");
      } else if (user.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [user, authLoading, router]);

  // Set tab from query parameter on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab");
      if (tab === "overview" || tab === "products" || tab === "orders") {
        setAdminTab(tab);
      }
    }
  }, []);


  // Fetch stats on load
  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAnalytics();
      loadAllProducts();
    }
  }, [user, token]);

  const fetchAnalytics = async () => {
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/admin/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  const loadAllProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_URL}/products?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setProductsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingProducts(false);
    }
  };

  if (authLoading || !user || user.role !== "admin") {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <span>Verifying administrator privileges...</span>
        </div>
        <Footer />
      </div>
    );
  }

  // Handle Order Status Mutation
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        fetchAnalytics(); // refresh stats & recent orders
      }
    } catch (err) {
      console.error("Order status update failed", err);
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setEditingProduct(null);
    setProdName("");
    setProdBrand("Apple");
    setProdCondition("New");
    setProdPrice("");
    setProdDiscount("0");
    setProdCpu("");
    setProdRam("16GB DDR5");
    setProdStorage("512GB NVMe SSD");
    setProdGpu("Intel Arc");
    setProdDisplay('14" Display');
    setProdOs("Windows 11 Home");
    setProdDescription("");
    setProdCategory("Gaming");
    setProdStock("5");
    setProdImageUrl("https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop");
    setCrudError("");
    setShowProductModal(true);
  };

  // Open Edit Modal
  const openEditModal = (product: any) => {
    setEditingProduct(product);
    setProdName(product.name);
    setProdBrand(product.brand);
    setProdCondition(product.condition);
    setProdPrice(product.price.toString());
    setProdDiscount(product.discount.toString());
    setProdCpu(product.specs.cpu);
    setProdRam(product.specs.ram);
    setProdStorage(product.specs.storage);
    setProdGpu(product.specs.gpu);
    setProdDisplay(product.specs.display);
    setProdOs(product.specs.os);
    setProdDescription(product.description || "");
    setProdCategory(product.category);
    setProdStock(product.stock.toString());
    setProdImageUrl(product.image_urls[0] || "");
    setCrudError("");
    setShowProductModal(true);
  };

  // Submit Product Form (Create / Update)
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCrudError("");
    setSubmittingProduct(true);

    const payload = {
      name: prodName,
      brand: prodBrand,
      condition: prodCondition,
      price: parseFloat(prodPrice),
      discount: parseFloat(prodDiscount),
      specs: {
        cpu: prodCpu,
        ram: prodRam,
        storage: prodStorage,
        gpu: prodGpu,
        display: prodDisplay,
        os: prodOs,
      },
      description: prodDescription,
      image_urls: [prodImageUrl || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600&auto=format&fit=crop"],
      category: prodCategory,
      stock: parseInt(prodStock),
    };

    try {
      const url = editingProduct ? `${API_URL}/products/${editingProduct.id}` : `${API_URL}/products`;
      const method = editingProduct ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setShowProductModal(false);
        loadAllProducts();
        fetchAnalytics();
      } else {
        const data = await res.json();
        setCrudError(data.detail || "Failed to save product details.");
      }
    } catch (err) {
      console.error(err);
      setCrudError("An error occurred during submission.");
    } finally {
      setSubmittingProduct(false);
    }
  };

  // Handle Product Deletion
  const handleDeleteProduct = async (id: number) => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadAllProducts();
        fetchAnalytics();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Dashboard Title & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Mr_Laptop.lk Store Operations Control Portal
            </p>
          </div>

          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider">
            <button
              onClick={() => setAdminTab("overview")}
              className={`px-4 h-10 rounded-xl transition-all ${
                adminTab === "overview" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              Overview & Analytics
            </button>
            <button
              onClick={() => setAdminTab("products")}
              className={`px-4 h-10 rounded-xl transition-all ${
                adminTab === "products" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              Product Inventory
            </button>
            <button
              onClick={() => setAdminTab("orders")}
              className={`px-4 h-10 rounded-xl transition-all ${
                adminTab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              Order Manager
            </button>
            <button
              onClick={() => router.push("/admin/users")}
              className="px-4 h-10 rounded-xl transition-all hover:bg-secondary text-muted-foreground"
            >
              User Management
            </button>
          </div>
        </div>

        {/* LOADING STATE */}
        {loadingStats && adminTab === "overview" ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* OVERVIEW TAB */}
            {adminTab === "overview" && stats && (
              <div className="space-y-10">
                {/* 1. Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                    <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                      <span>Total Revenue</span>
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black">LKR {stats.revenue.toLocaleString()}</div>
                  </div>

                  <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                    <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                      <span>Customer Orders</span>
                      <ShoppingBag className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black">{stats.orders_count} Orders</div>
                  </div>

                  <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                    <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                      <span>Products Stocked</span>
                      <Laptop className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black">{stats.products_count} Items</div>
                  </div>

                  <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                    <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                      <span>Customers registered</span>
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                    <div className="text-xl sm:text-2xl font-black">{stats.customers_count} Users</div>
                  </div>
                </div>

                {/* 2. Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  {/* Monthly Sales: 7 cols */}
                  <div className="lg:col-span-7 p-6 rounded-3xl border border-glass-border bg-card">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
                      <TrendingUp className="h-4.5 w-4.5 text-primary" />
                      <span>Monthly Revenue Trend</span>
                    </h3>
                    
                    {/* SVG Bar Chart */}
                    <div className="h-64 flex items-end justify-between gap-4 pt-4 px-2 border-b border-border/40">
                      {stats.monthly_sales.map((item: any, index: number) => {
                        // Max sales calculation
                        const maxVal = Math.max(...stats.monthly_sales.map((m: any) => m.sales), 1);
                        const percentHeight = (item.sales / maxVal) * 80 + 5; // scaled 5% to 85%
                        return (
                          <div key={index} className="flex-1 flex flex-col items-center gap-2 group">
                            <span className="text-[9px] font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              {(item.sales / 1000).toFixed(0)}k
                            </span>
                            <div
                              className="w-full max-w-[40px] rounded-t-lg bg-primary/20 hover:bg-primary border-t border-primary/40 shadow-inner hover:shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all duration-300 cursor-pointer"
                              style={{ height: `${percentHeight}%` }}
                            />
                            <span className="text-[10px] font-bold text-foreground mt-1">{item.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Sales by Category: 5 cols */}
                  <div className="lg:col-span-5 p-6 rounded-3xl border border-glass-border bg-card">
                    <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Sales by Product Category</h3>
                    <div className="space-y-4 pt-2">
                      {Object.entries(stats.sales_by_category).map(([cat, amount]: any, idx) => {
                        const total = Object.values(stats.sales_by_category).reduce((a: any, b: any) => a + b, 0) as number;
                        const percentage = total > 0 ? (amount / total) * 100 : 0;
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs font-bold">
                              <span>{cat} Laptops</span>
                              <span className="text-muted-foreground">{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full" style={{ width: `${percentage}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 3. Recent Orders Table */}
                <div className="p-6 rounded-3xl border border-glass-border bg-card">
                  <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Recent Customer Orders</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold">
                          <th className="pb-3 pr-4">Order ID</th>
                          <th className="pb-3 pr-4">Customer Email</th>
                          <th className="pb-3 pr-4">Items Count</th>
                          <th className="pb-3 pr-4">Total Price</th>
                          <th className="pb-3 pr-4">Payment</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_orders.map((o: any) => (
                          <tr key={o.id} className="border-b border-border/40 last:border-0">
                            <td className="py-3 pr-4 font-bold text-foreground">#{o.id}</td>
                            <td className="py-3 pr-4 font-semibold">{o.email}</td>
                            <td className="py-3 pr-4">{o.items.length} units</td>
                            <td className="py-3 pr-4 font-bold text-primary">LKR {o.total_price.toLocaleString()}</td>
                            <td className="py-3 pr-4">{o.payment_method}</td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                o.status === "Delivered" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="bg-secondary/60 text-xs px-2 py-1 rounded border focus:outline-none"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* PRODUCTS TAB */}
            {adminTab === "products" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black uppercase tracking-wider text-foreground">Active Catalog Listings</h2>
                  <button
                    onClick={openCreateModal}
                    className="h-10 px-4 rounded-xl bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 shadow-md flex items-center gap-1.5"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Create Laptop Listing</span>
                  </button>
                </div>

                {loadingProducts ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-7 w-7 animate-spin text-primary" />
                  </div>
                ) : (
                  <div className="p-6 rounded-3xl border border-glass-border bg-card">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold">
                            <th className="pb-3 pr-4">Image</th>
                            <th className="pb-3 pr-4">Product Name</th>
                            <th className="pb-3 pr-4">Brand</th>
                            <th className="pb-3 pr-4">Condition</th>
                            <th className="pb-3 pr-4">Price</th>
                            <th className="pb-3 pr-4">Stock</th>
                            <th className="pb-3 pr-4">Rating</th>
                            <th className="pb-3 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {productsList.map((p) => (
                            <tr key={p.id} className="border-b border-border/40 last:border-0">
                              <td className="py-3 pr-4">
                                <div className="h-10 w-10 bg-white rounded border p-1 flex items-center justify-center">
                                  <img src={p.image_urls[0]} alt="" className="h-full w-full object-contain" />
                                </div>
                              </td>
                              <td className="py-3 pr-4 font-bold text-foreground truncate max-w-xs">{p.name}</td>
                              <td className="py-3 pr-4 font-semibold">{p.brand}</td>
                              <td className="py-3 pr-4">{p.condition}</td>
                              <td className="py-3 pr-4 font-bold text-primary">LKR {p.price.toLocaleString()}</td>
                              <td className="py-3 pr-4 font-bold">{p.stock} units</td>
                              <td className="py-3 pr-4">{p.rating.toFixed(1)} ★</td>
                              <td className="py-3 text-right flex justify-end gap-2">
                                <button
                                  onClick={() => openEditModal(p)}
                                  className="p-2 rounded bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                  title="Edit"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteProduct(p.id)}
                                  className="p-2 rounded bg-secondary hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-all"
                                  title="Delete"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ORDERS TAB */}
            {adminTab === "orders" && stats && (
              <div className="space-y-6">
                <h2 className="text-base font-black uppercase tracking-wider text-foreground">All Customer Transactions</h2>
                
                <div className="p-6 rounded-3xl border border-glass-border bg-card">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold">
                          <th className="pb-3 pr-4">ID</th>
                          <th className="pb-3 pr-4">Placed On</th>
                          <th className="pb-3 pr-4">Delivery Address</th>
                          <th className="pb-3 pr-4">Phone</th>
                          <th className="pb-3 pr-4">LKR Total</th>
                          <th className="pb-3 pr-4">Payment</th>
                          <th className="pb-3 pr-4">Status</th>
                          <th className="pb-3 text-right">Update Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recent_orders.map((o: any) => (
                          <tr key={o.id} className="border-b border-border/40 last:border-0">
                            <td className="py-3 pr-4 font-bold text-foreground">#{o.id}</td>
                            <td className="py-3 pr-4">{new Date(o.created_at).toLocaleDateString()}</td>
                            <td className="py-3 pr-4 truncate max-w-[150px]">{o.shipping_address}</td>
                            <td className="py-3 pr-4 font-semibold">{o.phone}</td>
                            <td className="py-3 pr-4 font-bold text-primary">LKR {o.total_price.toLocaleString()}</td>
                            <td className="py-3 pr-4">{o.payment_method}</td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                o.status === "Delivered" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                              }`}>
                                {o.status}
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <select
                                value={o.status}
                                onChange={(e) => handleUpdateOrderStatus(o.id, e.target.value)}
                                className="bg-secondary/60 text-xs px-2 py-1 rounded border focus:outline-none font-semibold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* CRUD Product Modal Overlay */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-card rounded-3xl border border-glass-border shadow-2xl p-6 md:p-8 max-h-[90vh] overflow-y-auto flex flex-col gap-6 animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <h3 className="text-base font-black uppercase tracking-wider text-foreground">
                {editingProduct ? `Edit Laptop: ${editingProduct.name}` : "Create Laptop Listing"}
              </h3>
              <button
                onClick={() => setShowProductModal(false)}
                className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Product Name */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  placeholder="e.g. MacBook Pro M3 Pro (16-Inch)"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Brand and Category */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Brand</label>
                <select
                  value={prodBrand}
                  onChange={(e) => setProdBrand(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary font-semibold"
                >
                  {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Category</label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary font-semibold"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Condition & Stock */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Condition</label>
                <select
                  value={prodCondition}
                  onChange={(e) => setProdCondition(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary font-semibold"
                >
                  <option value="New">New</option>
                  <option value="Used">Used</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Stock Units</label>
                <input
                  type="number"
                  required
                  value={prodStock}
                  onChange={(e) => setProdStock(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Price and Discount */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Price (LKR)</label>
                <input
                  type="number"
                  required
                  value={prodPrice}
                  onChange={(e) => setProdPrice(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Discount (%)</label>
                <input
                  type="number"
                  required
                  value={prodDiscount}
                  onChange={(e) => setProdDiscount(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Specs Header */}
              <div className="sm:col-span-2 pt-2 border-t border-border/40">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Technical Specifications</h4>
              </div>

              {/* CPU & RAM */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">CPU Processor</label>
                <input
                  type="text"
                  required
                  value={prodCpu}
                  onChange={(e) => setProdCpu(e.target.value)}
                  placeholder="e.g. Intel Core i7-14700H"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">RAM Memory</label>
                <input
                  type="text"
                  required
                  value={prodRam}
                  onChange={(e) => setProdRam(e.target.value)}
                  placeholder="e.g. 16GB DDR5"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Storage & GPU */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Storage</label>
                <input
                  type="text"
                  required
                  value={prodStorage}
                  onChange={(e) => setProdStorage(e.target.value)}
                  placeholder="e.g. 512GB NVMe SSD"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">GPU Graphics</label>
                <input
                  type="text"
                  required
                  value={prodGpu}
                  onChange={(e) => setProdGpu(e.target.value)}
                  placeholder="e.g. NVIDIA RTX 4060"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Display & OS */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Display Details</label>
                <input
                  type="text"
                  required
                  value={prodDisplay}
                  onChange={(e) => setProdDisplay(e.target.value)}
                  placeholder='e.g. 15.6" FHD 144Hz'
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Operating System</label>
                <input
                  type="text"
                  required
                  value={prodOs}
                  onChange={(e) => setProdOs(e.target.value)}
                  placeholder="e.g. Windows 11 Home"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Image URL & Description */}
              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground">Image URL</label>
                <input
                  type="text"
                  required
                  value={prodImageUrl}
                  onChange={(e) => setProdImageUrl(e.target.value)}
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <label className="text-xs font-bold text-muted-foreground">Description</label>
                <textarea
                  rows={3}
                  value={prodDescription}
                  onChange={(e) => setProdDescription(e.target.value)}
                  placeholder="Tell customers about the condition, accessories, testing process..."
                  className="w-full p-3 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {crudError && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-semibold sm:col-span-2">
                  {crudError}
                </div>
              )}

              <button
                type="submit"
                disabled={submittingProduct}
                className="w-full sm:col-span-2 h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-1.5 mt-4"
              >
                {submittingProduct ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <span>{editingProduct ? "Save Changes" : "Create Listing"}</span>
                )}
              </button>

            </form>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
