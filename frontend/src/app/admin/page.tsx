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
  XCircle,
  Download,
  Search,
  Filter,
  FileText,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
  const [adminTab, setAdminTab] = useState<"overview" | "products" | "orders" | "requests">("overview");

  // Sourcing Requests States
  const [requestsList, setRequestsList] = useState<any[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestsFilter, setRequestsFilter] = useState("");


  // Product CRUD states
  const [productsList, setProductsList] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showProductModal, setShowProductModal] = useState(false);

  // Orders Management States
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersPage, setOrdersPage] = useState(1);
  const [ordersPerPage, setOrdersPerPage] = useState(10);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersSearch, setOrdersSearch] = useState("");
  const [ordersStatusFilter, setOrdersStatusFilter] = useState("");
  const [ordersPaymentFilter, setOrdersPaymentFilter] = useState("");
  const [ordersSortBy, setOrdersSortBy] = useState("created_at");
  const [ordersSortDir, setOrdersSortDir] = useState("desc");

  // Order stats
  const [orderStats, setOrderStats] = useState<any>(null);
  const [loadingOrderStats, setLoadingOrderStats] = useState(false);

  // Detail side-drawer states
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderDrawer, setShowOrderDrawer] = useState(false);
  const [updatingFieldId, setUpdatingFieldId] = useState<number | null>(null);

  // Fetch Order Manager list from GET /api/admin/orders
  const loadOrderManagerData = async () => {
    setLoadingOrders(true);
    try {
      const queryParams = new URLSearchParams({
        page: ordersPage.toString(),
        per_page: ordersPerPage.toString(),
        sort_by: ordersSortBy,
        sort_dir: ordersSortDir,
      });
      if (ordersSearch) queryParams.append("search", ordersSearch);
      if (ordersStatusFilter) queryParams.append("order_status", ordersStatusFilter);
      if (ordersPaymentFilter) queryParams.append("payment_status", ordersPaymentFilter);

      const res = await fetch(`${API_URL}/admin/orders?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders);
        setOrdersTotalPages(data.total_pages);
        setTotalOrders(data.total);
      }
    } catch (err) {
      console.error("Failed to load admin orders", err);
    } finally {
      setLoadingOrders(false);
    }
  };

  // Fetch Order Stats from GET /api/admin/orders/stats
  const loadOrderStats = async () => {
    setLoadingOrderStats(true);
    try {
      const res = await fetch(`${API_URL}/admin/orders/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrderStats(data);
      }
    } catch (err) {
      console.error("Failed to load admin order stats", err);
    } finally {
      setLoadingOrderStats(false);
    }
  };

  // Trigger loading order details and stats when admin tab matches
  useEffect(() => {
    if (user?.role === "admin" && token && adminTab === "orders") {
      loadOrderManagerData();
    }
  }, [adminTab, ordersPage, ordersSearch, ordersStatusFilter, ordersPaymentFilter, token, user]);

  useEffect(() => {
    if (user?.role === "admin" && token && adminTab === "orders") {
      loadOrderStats();
    }
  }, [adminTab, token, user]);

  // Color classes for order status badges
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
      if (tab === "overview" || tab === "products" || tab === "orders" || tab === "requests") {
        setAdminTab(tab);
      }
    }
  }, []);

  const loadRequestsData = async () => {
    setLoadingRequests(true);
    try {
      const url = `${API_URL}/ai/requests${requestsFilter ? `?status=${requestsFilter}` : ""}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRequestsList(data);
      }
    } catch (err) {
      console.error("Failed to load sourcing requests", err);
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleUpdateRequestStatus = async (id: number, newStatus: string) => {
    try {
      const res = await fetch(`${API_URL}/ai/request/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        loadRequestsData();
      }
    } catch (err) {
      console.error("Failed to update sourcing request status", err);
    }
  };

  // Fetch stats on load
  useEffect(() => {
    if (user?.role === "admin" && token) {
      fetchAnalytics();
      loadAllProducts();
    }
  }, [user, token]);

  // Load requests data when requests tab matches
  useEffect(() => {
    if (user?.role === "admin" && token && adminTab === "requests") {
      loadRequestsData();
    }
  }, [adminTab, requestsFilter, token, user]);

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

  // Download PDF Invoice as Admin
  const handleDownloadInvoice = async (orderId: number, orderNumber: string) => {
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
    }
  };

  // Update order status/tracking/notes
  const handleAdminUpdateOrder = async (
    orderId: number,
    payload: {
      order_status?: string;
      payment_status?: string;
      tracking_number?: string | null;
      notes?: string | null;
    }
  ) => {
    setUpdatingFieldId(orderId);
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const updatedOrder = await res.json();
        // Update local orders list state
        setOrders((prev) => prev.map((o) => (o.id === orderId ? updatedOrder : o)));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(updatedOrder);
        }
        loadOrderStats();
        fetchAnalytics();
      } else {
        const data = await res.json();
        alert(data.detail || "Failed to update order details.");
      }
    } catch (err) {
      console.error("Order status update failed", err);
    } finally {
      setUpdatingFieldId(null);
    }
  };

  // Soft delete order
  const handleAdminDeleteOrder = async (orderId: number) => {
    if (!confirm("Are you sure you want to soft-delete this order?")) return;
    try {
      const res = await fetch(`${API_URL}/admin/orders/${orderId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o.id !== orderId));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
          setShowOrderDrawer(false);
        }
        loadOrderStats();
        fetchAnalytics();
      } else {
        alert("Failed to delete order");
      }
    } catch (err) {
      console.error("Delete order failed", err);
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
              onClick={() => setAdminTab("requests")}
              className={`px-4 h-10 rounded-xl transition-all ${
                adminTab === "requests" ? "bg-primary text-primary-foreground" : "hover:bg-secondary text-muted-foreground"
              }`}
            >
              AI Sourcing Requests
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
                          <tr key={o.id} className="border-b border-border/40 last:border-0 hover:bg-secondary/20">
                            <td className="py-3 pr-4 font-bold text-foreground font-mono">#{o.order_number}</td>
                            <td className="py-3 pr-4 font-semibold">{o.customer_email}</td>
                            <td className="py-3 pr-4">{o.items.length} units</td>
                            <td className="py-3 pr-4 font-bold text-primary">LKR {o.total_amount.toLocaleString()}</td>
                            <td className="py-3 pr-4">{o.payment_method}</td>
                            <td className="py-3 pr-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClass(o.order_status)}`}>
                                <span>{o.order_status}</span>
                              </span>
                            </td>
                            <td className="py-3 text-right">
                              <select
                                value={o.order_status}
                                onChange={(e) => handleAdminUpdateOrder(o.id, { order_status: e.target.value })}
                                className="bg-secondary/60 text-xs px-2 py-1 rounded border border-border focus:outline-none font-bold"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
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
            {adminTab === "orders" && (
              <div className="space-y-8">
                {/* A. Aggregate Order Stats Cards */}
                {loadingOrderStats ? (
                  <div className="flex justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : orderStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Total Sales Revenue</span>
                      <span className="text-xl sm:text-2xl font-black text-primary">LKR {orderStats.revenue.toLocaleString()}</span>
                    </div>
                    <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">All Orders Count</span>
                      <span className="text-xl sm:text-2xl font-black text-foreground">{orderStats.total_orders} Orders</span>
                    </div>
                    <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Active Deliveries</span>
                      <span className="text-xl sm:text-2xl font-black text-indigo-500">
                        {orderStats.shipped_orders + orderStats.processing_orders + orderStats.pending_orders} Active
                      </span>
                    </div>
                    <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Average Ticket (AOV)</span>
                      <span className="text-xl sm:text-2xl font-black text-emerald-500">LKR {Math.round(orderStats.average_order_value).toLocaleString()}</span>
                    </div>
                  </div>
                ) : null}

                {/* B. Order List Control Bar (Search, Status Filter, Payment Filter) */}
                <div className="p-6 rounded-3xl border border-glass-border bg-card space-y-4">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    
                    {/* Search Field */}
                    <div className="relative w-full md:max-w-md">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        placeholder="Search by order number, customer name, email or phone..."
                        value={ordersSearch}
                        onChange={(e) => {
                          setOrdersSearch(e.target.value);
                          setOrdersPage(1);
                        }}
                        className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary text-foreground"
                      />
                    </div>

                    {/* Filter Dropdowns */}
                    <div className="flex flex-wrap gap-3 w-full md:w-auto">
                      <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border/80 text-xs text-foreground font-bold">
                        <Filter className="h-3.5 w-3.5 text-primary" />
                        <select
                          value={ordersStatusFilter}
                          onChange={(e) => {
                            setOrdersStatusFilter(e.target.value);
                            setOrdersPage(1);
                          }}
                          className="bg-transparent focus:outline-none"
                        >
                          <option value="">All Statuses</option>
                          <option value="Pending">Pending</option>
                          <option value="Confirmed">Confirmed</option>
                          <option value="Processing">Processing</option>
                          <option value="Shipped">Shipped</option>
                          <option value="Delivered">Delivered</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border/80 text-xs text-foreground font-bold">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <select
                          value={ordersPaymentFilter}
                          onChange={(e) => {
                            setOrdersPaymentFilter(e.target.value);
                            setOrdersPage(1);
                          }}
                          className="bg-transparent focus:outline-none"
                        >
                          <option value="">All Payments</option>
                          <option value="Pending">Pending</option>
                          <option value="Paid">Paid</option>
                          <option value="Failed">Failed</option>
                          <option value="Refunded">Refunded</option>
                        </select>
                      </div>

                      <button
                        onClick={() => {
                          setOrdersSearch("");
                          setOrdersStatusFilter("");
                          setOrdersPaymentFilter("");
                          setOrdersPage(1);
                        }}
                        className="px-4 h-9.5 rounded-xl border bg-secondary/50 hover:bg-secondary text-xs font-bold text-foreground transition-all"
                      >
                        Reset Filters
                      </button>
                    </div>

                  </div>

                  {/* C. Orders Datatable */}
                  {loadingOrders ? (
                    <div className="flex justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-border/40 text-muted-foreground uppercase font-black tracking-wider pb-3 font-semibold">
                              <th className="pb-3 pr-4">Order Number</th>
                              <th className="pb-3 pr-4">Placed Date</th>
                              <th className="pb-3 pr-4">Customer Name</th>
                              <th className="pb-3 pr-4">Total Amount</th>
                              <th className="pb-3 pr-4">Payment</th>
                              <th className="pb-3 pr-4">Status</th>
                              <th className="pb-3 text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {orders.map((o) => (
                              <tr
                                key={o.id}
                                className="border-b border-border/40 last:border-0 hover:bg-secondary/15 transition-colors cursor-pointer group"
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setShowOrderDrawer(true);
                                }}
                              >
                                <td className="py-3.5 pr-4 font-bold text-foreground font-mono group-hover:text-primary transition-colors">
                                  #{o.order_number}
                                </td>
                                <td className="py-3.5 pr-4 text-muted-foreground font-medium">
                                  {new Date(o.created_at).toLocaleString()}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="font-semibold text-foreground">{o.customer_name}</div>
                                  <div className="text-[10px] text-muted-foreground">{o.customer_email}</div>
                                </td>
                                <td className="py-3.5 pr-4 font-black text-primary">
                                  LKR {o.total_amount.toLocaleString()}
                                </td>
                                <td className="py-3.5 pr-4">
                                  <div className="font-medium text-foreground">{o.payment_method}</div>
                                  <div className="text-[10px] text-muted-foreground font-semibold">{o.payment_status}</div>
                                </td>
                                <td className="py-3.5 pr-4" onClick={(e) => e.stopPropagation()}>
                                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${getStatusBadgeClass(o.order_status)}`}>
                                    <span>{o.order_status}</span>
                                  </span>
                                </td>
                                <td className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                                  <div className="flex justify-end items-center gap-2">
                                    <button
                                      onClick={() => {
                                        setSelectedOrder(o);
                                        setShowOrderDrawer(true);
                                      }}
                                      className="h-7 px-3 bg-secondary hover:bg-primary/10 text-foreground hover:text-primary text-[10px] font-black rounded-lg transition-all"
                                    >
                                      Edit / View
                                    </button>
                                    <button
                                      onClick={() => handleDownloadInvoice(o.id, o.order_number)}
                                      className="p-1.5 rounded-lg bg-secondary hover:bg-primary/10 text-muted-foreground hover:text-primary transition-all"
                                      title="Download Invoice"
                                    >
                                      <Download className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination Controls */}
                      {ordersTotalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-border/40 pt-4 text-xs font-bold text-muted-foreground">
                          <div>
                            Showing page <span className="text-foreground">{ordersPage}</span> of <span className="text-foreground">{ordersTotalPages}</span> ({totalOrders} total orders)
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setOrdersPage((prev) => Math.max(prev - 1, 1))}
                              disabled={ordersPage === 1}
                              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setOrdersPage((prev) => Math.min(prev + 1, ordersTotalPages))}
                              disabled={ordersPage === ordersTotalPages}
                              className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-secondary hover:text-foreground disabled:opacity-40 transition-all cursor-pointer"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground text-xs font-semibold">
                      No customer orders found matching the filter criteria.
                    </div>
                  )}

                </div>

                {/* D. Slide-Over Side Drawer detail panel */}
                {showOrderDrawer && selectedOrder && (
                  <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm p-0 animate-in fade-in duration-200">
                    {/* Click outside to close */}
                    <div className="absolute inset-0" onClick={() => setShowOrderDrawer(false)} />
                    
                    <div className="relative w-full max-w-xl bg-card border-l border-glass-border h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
                      
                      {/* Drawer Header */}
                      <div className="p-6 border-b border-border/40 flex items-center justify-between">
                        <div className="space-y-1">
                          <h3 className="text-sm font-black uppercase tracking-wider text-muted-foreground">Order Operations</h3>
                          <div className="text-lg font-black text-foreground font-mono">#{selectedOrder.order_number}</div>
                        </div>
                        <button
                          onClick={() => setShowOrderDrawer(false)}
                          className="h-8 w-8 rounded-full hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>

                      {/* Drawer Content Area */}
                      <div className="flex-grow overflow-y-auto p-6 space-y-6">
                        
                        {/* Status management block */}
                        <div className="p-4 rounded-2xl border border-glass-border bg-secondary/15 space-y-4">
                          <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Operations Control</h4>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Order Status</label>
                              <select
                                value={selectedOrder.order_status}
                                onChange={(e) => handleAdminUpdateOrder(selectedOrder.id, { order_status: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary font-bold text-foreground"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Confirmed">Confirmed</option>
                                <option value="Processing">Processing</option>
                                <option value="Shipped">Shipped</option>
                                <option value="Delivered">Delivered</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-muted-foreground">Payment Status</label>
                              <select
                                value={selectedOrder.payment_status}
                                onChange={(e) => handleAdminUpdateOrder(selectedOrder.id, { payment_status: e.target.value })}
                                className="w-full h-9 px-3 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary font-bold text-foreground"
                              >
                                <option value="Pending">Pending</option>
                                <option value="Paid">Paid</option>
                                <option value="Failed">Failed</option>
                                <option value="Refunded">Refunded</option>
                              </select>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-muted-foreground">Courier tracking number (Lanka/International)</label>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Enter tracking number"
                                defaultValue={selectedOrder.tracking_number || ""}
                                onBlur={(e) => handleAdminUpdateOrder(selectedOrder.id, { tracking_number: e.target.value || null })}
                                className="flex-grow h-9 px-3 rounded-lg bg-card border border-border text-xs focus:outline-none focus:border-primary text-foreground font-mono font-bold"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Customer Info profile */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Customer Profile</h4>
                          <div className="p-4 rounded-2xl border border-border/40 text-xs space-y-2.5">
                            <div className="flex justify-between"><span className="text-muted-foreground font-bold">FullName:</span> <span className="font-semibold text-foreground">{selectedOrder.customer_name}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground font-bold">Email Address:</span> <span className="font-semibold text-foreground">{selectedOrder.customer_email}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground font-bold">Phone Number:</span> <span className="font-semibold text-foreground">{selectedOrder.customer_phone}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground font-bold">Shipping Address:</span> <span className="font-semibold text-foreground text-right">{selectedOrder.shipping_address}, {selectedOrder.city}, {selectedOrder.district}, {selectedOrder.postal_code}</span></div>
                            {selectedOrder.notes && (
                              <div className="pt-2 border-t border-border/40"><span className="text-muted-foreground font-bold block mb-1">Customer notes:</span> <span className="text-foreground block italic bg-secondary/35 p-2 rounded-lg">"{selectedOrder.notes}"</span></div>
                            )}
                          </div>
                        </div>

                        {/* Ordered Laptop items list specifications */}
                        <div className="space-y-3">
                          <h4 className="text-[10px] uppercase font-black text-muted-foreground tracking-wider">Purchased Laptop Specifications</h4>
                          <div className="space-y-2">
                            {selectedOrder.items.map((item: any, idx: number) => (
                              <div key={idx} className="flex gap-4 p-3 rounded-2xl border border-border/30 bg-card items-center text-xs">
                                <div className="h-10 w-10 bg-white rounded border border-border/20 p-1 flex items-center justify-center shrink-0">
                                  <img src={item.product_image || "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=200"} alt="" className="h-full w-full object-contain" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold truncate text-foreground">{item.product_name}</div>
                                  <div className="text-[10px] text-muted-foreground">Qty: {item.quantity} • Unit Price: LKR {item.unit_price.toLocaleString()}</div>
                                </div>
                                <div className="font-black text-foreground shrink-0">LKR {item.total_price.toLocaleString()}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Financial Subtotals */}
                        <div className="p-4 rounded-2xl border border-border/40 text-xs space-y-2 bg-secondary/5">
                          <div className="flex justify-between text-muted-foreground"><span>Subtotal amount</span> <span>LKR {selectedOrder.subtotal.toLocaleString()}</span></div>
                          <div className="flex justify-between text-muted-foreground"><span>Shipping fee</span> <span className="text-green-500 font-bold">LKR {selectedOrder.shipping_fee.toLocaleString()} (FREE)</span></div>
                          <div className="flex justify-between text-muted-foreground"><span>Discount applied</span> <span>LKR {selectedOrder.discount.toLocaleString()}</span></div>
                          <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border/40"><span>Grand Total</span> <span className="text-primary">LKR {selectedOrder.total_amount.toLocaleString()}</span></div>
                        </div>

                      </div>

                    </div>
                  </div>
                )}

              </div>
            )}

            {/* AI PRODUCT REQUESTS TAB */}
            {adminTab === "requests" && (
              <div className="space-y-8 animate-fade-in">
                {/* A. Sourcing Requests Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">New Requests</span>
                    <span className="text-xl sm:text-2xl font-black text-cyan-400">
                      {requestsList.filter((r) => r.status === "New" || r.status === "new").length} New
                    </span>
                  </div>
                  <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Pending Requests</span>
                    <span className="text-xl sm:text-2xl font-black text-amber-500">
                      {requestsList.filter((r) => r.status === "Pending").length} Pending
                    </span>
                  </div>
                  <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Fulfilled</span>
                    <span className="text-xl sm:text-2xl font-black text-emerald-500">
                      {requestsList.filter((r) => r.status === "Fulfilled").length} Sourced
                    </span>
                  </div>
                  <div className="p-6 rounded-3xl border border-glass-border bg-card/65 backdrop-blur-md">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground block mb-1">Total Sourcing Requests</span>
                    <span className="text-xl sm:text-2xl font-black text-foreground">
                      {requestsList.length} Leads
                    </span>
                  </div>
                </div>

                {/* B. Sourcing Requests Table */}
                <div className="rounded-3xl border border-glass-border glass overflow-hidden bg-card/40">
                  <div className="p-6 border-b border-border/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-black uppercase tracking-wider text-slate-100">AI Customer Requests</h3>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Manage customer custom sourcing requests for out-of-stock devices.</p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={requestsFilter}
                        onChange={(e) => setRequestsFilter(e.target.value)}
                        className="h-9 px-3 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-cyan-400"
                      >
                        <option value="">All Statuses</option>
                        <option value="New">New</option>
                        <option value="Pending">Pending</option>
                        <option value="Fulfilled">Fulfilled</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  {loadingRequests ? (
                    <div className="flex justify-center py-20">
                      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                    </div>
                  ) : requestsList.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground text-xs font-mono">
                      No sourcing requests found in database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-border/40 bg-secondary/10">
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Date</th>
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Customer Info</th>
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Laptop & Use-Case</th>
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Target Budget</th>
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Status</th>
                            <th className="px-6 py-4 font-bold text-muted-foreground uppercase text-[9px] tracking-wider font-mono">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {requestsList.map((req) => (
                            <tr key={req.id} className="border-b border-border/20 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 font-mono text-[10px] text-slate-400">
                                {new Date(req.created_at).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-slate-200">{req.customer_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{req.email}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{req.phone}</div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="font-bold text-cyan-400">{req.requested_laptop}</div>
                                {req.use_case && (
                                  <div className="text-[10px] text-slate-400 mt-1 max-w-xs italic truncate" title={req.use_case}>
                                    "{req.use_case}"
                                  </div>
                                )}
                              </td>
                              <td className="px-6 py-4 font-bold text-slate-200 font-mono">
                                LKR {req.budget.toLocaleString()}
                              </td>
                              <td className="px-6 py-4">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold font-mono ${
                                  req.status === "New" || req.status === "new"
                                    ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
                                    : req.status === "Pending"
                                    ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                    : req.status === "Fulfilled"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-red-500/10 text-red-400 border border-red-500/20"
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 flex gap-1.5 items-center">
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "Pending")}
                                  className="px-2 py-1 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 rounded-lg text-[9px] font-bold border border-amber-500/20 transition-all cursor-pointer"
                                >
                                  Process
                                </button>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "Fulfilled")}
                                  className="px-2 py-1 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-[9px] font-bold border border-emerald-500/20 transition-all cursor-pointer"
                                >
                                  Fulfill
                                </button>
                                <button
                                  onClick={() => handleUpdateRequestStatus(req.id, "Cancelled")}
                                  className="px-2 py-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg text-[9px] font-bold border border-red-500/20 transition-all cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
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
