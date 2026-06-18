"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth, API_URL } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  ArrowUpDown,
  Loader2,
  Sparkles,
  X,
  Calendar,
  Mail,
  Phone,
  MapPin,
  Clock,
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Heart,
  Ban,
  Trash2,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function AdminUsersDashboard() {
  const router = useRouter();
  const { user: currentUser, token, isLoading: authLoading } = useAuth();

  // Stats State
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Users List State
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(15);
  const [totalPages, setTotalPages] = useState(1);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState(""); // "" (All), "admin", "customer"
  const [statusFilter, setStatusFilter] = useState(""); // "" (All), "active", "suspended"
  const [sortBy, setSortBy] = useState("created_at");
  const [sortDir, setSortDir] = useState("desc"); // "asc", "desc"

  // Selected User Drawer State
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // UI Banner Notifications
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null); // tracks user ID being updated

  // Redirect if not admin
  useEffect(() => {
    if (!authLoading) {
      if (!currentUser) {
        router.push("/auth/login?redirect=/admin/users");
      } else if (currentUser.role !== "admin") {
        router.push("/dashboard");
      }
    }
  }, [currentUser, authLoading, router]);

  // Fetch stats count
  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoadingStats(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch user stats", err);
    } finally {
      setLoadingStats(false);
    }
  }, [token]);

  // Fetch users list
  const fetchUsers = useCallback(async () => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        per_page: perPage.toString(),
        sort_by: sortBy,
        sort_dir: sortDir,
      });

      if (searchQuery.trim()) queryParams.append("search", searchQuery.trim());
      if (roleFilter) queryParams.append("role", roleFilter);
      if (statusFilter) queryParams.append("status", statusFilter);

      const res = await fetch(`${API_URL}/admin/users?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setUsersList(data.users);
        setTotalUsers(data.total);
        setTotalPages(data.total_pages);
      } else {
        const errorData = await res.json();
        showNotification(errorData.detail || "Failed to load users list.", "error");
      }
    } catch (err) {
      console.error("Failed to fetch users list", err);
      showNotification("Network error. Failed to load users list.", "error");
    } finally {
      setLoadingUsers(false);
    }
  }, [page, perPage, sortBy, sortDir, searchQuery, roleFilter, statusFilter, token]);

  // Fetch users & stats on mount/change
  useEffect(() => {
    if (currentUser?.role === "admin" && token) {
      fetchStats();
    }
  }, [currentUser, token, fetchStats]);

  useEffect(() => {
    if (currentUser?.role === "admin" && token) {
      fetchUsers();
    }
  }, [currentUser, token, fetchUsers]);

  // Alert Notifications Handler
  const showNotification = (message: string, type: "success" | "error") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // Fetch Single User Details
  const fetchSingleUserDetails = async (userId: number) => {
    if (!token) return;
    setLoadingDetails(true);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUserDetails(data);
      } else {
        showNotification("Failed to fetch user profile details.", "error");
        setIsDrawerOpen(false);
      }
    } catch (err) {
      console.error(err);
      showNotification("Network error. Failed to fetch user details.", "error");
      setIsDrawerOpen(false);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Toggle user role (PUT)
  const handleToggleRole = async (userId: number, currentRole: string) => {
    if (!token) return;
    if (userId === currentUser?.id) {
      showNotification("You cannot demote your own admin account.", "error");
      return;
    }

    const nextRole = currentRole === "admin" ? "customer" : "admin";
    const confirmMsg = `Are you sure you want to change this user's role to ${nextRole.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    setActionInProgress(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ role: nextRole }),
      });

      if (res.ok) {
        showNotification(`User role updated successfully to ${nextRole}.`, "success");
        fetchUsers();
        fetchStats();
        // Update details if currently viewing
        if (selectedUserId === userId) {
          fetchSingleUserDetails(userId);
        }
      } else {
        const data = await res.json();
        showNotification(data.detail || "Failed to update user role.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An error occurred during updating user role.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle user status (PUT)
  const handleToggleStatus = async (userId: number, currentStatus: string) => {
    if (!token) return;
    if (userId === currentUser?.id) {
      showNotification("You cannot suspend your own admin account.", "error");
      return;
    }

    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    const confirmMsg = `Are you sure you want to ${nextStatus === "suspended" ? "SUSPEND" : "ACTIVATE"} this user account?`;
    if (!confirm(confirmMsg)) return;

    setActionInProgress(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ account_status: nextStatus }),
      });

      if (res.ok) {
        showNotification(`User account is now ${nextStatus}.`, "success");
        fetchUsers();
        fetchStats();
        // Update details if currently viewing
        if (selectedUserId === userId) {
          fetchSingleUserDetails(userId);
        }
      } else {
        const data = await res.json();
        showNotification(data.detail || "Failed to update user status.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An error occurred during updating user status.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Soft Delete User (DELETE)
  const handleDeleteUser = async (userId: number, userName: string) => {
    if (!token) return;
    if (userId === currentUser?.id) {
      showNotification("You cannot delete your own admin account.", "error");
      return;
    }

    const confirmMsg = `⚠️ WARNING: Are you sure you want to delete ${userName}?\n\nThis will soft-delete their profile and they will no longer appear in active tables.`;
    if (!confirm(confirmMsg)) return;

    setActionInProgress(userId);
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        showNotification(`User ${userName} has been successfully deleted.`, "success");
        fetchUsers();
        fetchStats();
        if (isDrawerOpen && selectedUserId === userId) {
          setIsDrawerOpen(false);
          setSelectedUserId(null);
        }
      } else {
        const data = await res.json();
        showNotification(data.detail || "Failed to delete user.", "error");
      }
    } catch (err) {
      console.error(err);
      showNotification("An error occurred during user deletion.", "error");
    } finally {
      setActionInProgress(null);
    }
  };

  // Toggle Sorting
  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortDir("desc");
    }
    setPage(1);
  };

  // Drawer Opener
  const handleOpenDrawer = (userId: number) => {
    setSelectedUserId(userId);
    setUserDetails(null);
    setIsDrawerOpen(true);
    fetchSingleUserDetails(userId);
  };

  // Helper for formatting initials
  const getInitials = (name: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  if (authLoading || !currentUser || currentUser.role !== "admin") {
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

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative">
        {/* Floating Notification Banner */}
        {notification && (
          <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border animate-in fade-in slide-in-from-top-4 duration-300 ${
            notification.type === "success" 
              ? "bg-green-500/10 border-green-500/25 text-green-500 backdrop-blur-md" 
              : "bg-red-500/10 border-red-500/25 text-red-500 backdrop-blur-md"
          }`}>
            {notification.type === "success" ? <CheckCircle className="h-4 w-4 flex-shrink-0" /> : <AlertCircle className="h-4 w-4 flex-shrink-0" />}
            <span className="text-xs font-bold">{notification.message}</span>
          </div>
        )}

        {/* Dashboard Title & Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-border/40 pb-6">
          <div>
            <h1 className="text-2xl sm:text-4xl font-black text-foreground uppercase tracking-tight flex items-center gap-2">
              <Sparkles className="h-7 w-7 text-primary animate-pulse" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Mr_Laptop.lk Store Operations Control Portal
            </p>
          </div>

          {/* Core admin tabs matching main admin panel */}
          <div className="flex gap-2 text-xs font-bold uppercase tracking-wider overflow-x-auto pb-2 md:pb-0">
            <button
              onClick={() => router.push("/admin?tab=overview")}
              className="px-4 h-10 rounded-xl transition-all hover:bg-secondary text-muted-foreground whitespace-nowrap"
            >
              Overview & Analytics
            </button>
            <button
              onClick={() => router.push("/admin?tab=products")}
              className="px-4 h-10 rounded-xl transition-all hover:bg-secondary text-muted-foreground whitespace-nowrap"
            >
              Product Inventory
            </button>
            <button
              onClick={() => router.push("/admin?tab=orders")}
              className="px-4 h-10 rounded-xl transition-all hover:bg-secondary text-muted-foreground whitespace-nowrap"
            >
              Order Manager
            </button>
            <button
              className="px-4 h-10 rounded-xl transition-all bg-primary text-primary-foreground whitespace-nowrap"
            >
              User Management
            </button>
          </div>
        </div>

        {/* 1. Header Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {loadingStats ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <div key={idx} className="h-24 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md animate-pulse" />
            ))
          ) : stats ? (
            <>
              <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                  <span>Total Users</span>
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{stats.total_users}</div>
              </div>

              <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                  <span>Active Users</span>
                  <UserCheck className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-green-500">{stats.active_users}</div>
              </div>

              <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                  <span>Administrators</span>
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <div className="text-xl sm:text-2xl font-black">{stats.admin_users}</div>
              </div>

              <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md">
                <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                  <span>Suspended</span>
                  <UserX className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-red-500">{stats.suspended_users}</div>
              </div>

              <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md col-span-2 lg:col-span-1">
                <div className="text-muted-foreground text-xs font-semibold uppercase flex items-center justify-between mb-2">
                  <span>New This Month</span>
                  <Sparkles className="h-4 w-4 text-amber-500" />
                </div>
                <div className="text-xl sm:text-2xl font-black text-amber-500">{stats.new_users_this_month}</div>
              </div>
            </>
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-muted-foreground">Stats unavailable.</div>
          )}
        </div>

        {/* 2. Filters & Actions Panel */}
        <div className="p-6 rounded-3xl border border-glass-border bg-card/60 backdrop-blur-md mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
          {/* Search */}
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search user by name, email, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full h-10 pl-10 pr-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/25 transition-all text-foreground"
            />
          </div>

          {/* Select Dropdown Filters */}
          <div className="flex flex-wrap gap-3 w-full md:w-auto justify-end">
            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">All Roles</option>
                <option value="customer">Customers</option>
                <option value="admin">Administrators</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5 bg-secondary px-3 py-1.5 rounded-xl border border-border">
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Clear filter triggers if active */}
            {(searchQuery || roleFilter || statusFilter) && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setRoleFilter("");
                  setStatusFilter("");
                  setPage(1);
                }}
                className="h-9 px-3 rounded-xl border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all flex items-center gap-1"
              >
                <X className="h-3.5 w-3.5" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* 3. User Accounts Data Table */}
        <div className="p-6 rounded-3xl border border-glass-border bg-card overflow-hidden">
          {loadingUsers ? (
            <div className="flex flex-col items-center justify-center py-24 gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-xs text-muted-foreground">Retrieving accounts database...</span>
            </div>
          ) : usersList.length === 0 ? (
            <div className="text-center py-24">
              <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
              <h3 className="font-bold text-foreground text-sm uppercase tracking-wider">No User Profiles Found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                No user accounts match the selected parameters or query terms. Adjust filters and retry.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-border/40 text-muted-foreground uppercase font-bold select-none">
                    <th className="pb-3 pr-4">User</th>
                    <th 
                      onClick={() => handleSort("email")}
                      className="pb-3 pr-4 cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Email</span>
                        <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th className="pb-3 pr-4">Phone</th>
                    <th 
                      onClick={() => handleSort("role")}
                      className="pb-3 pr-4 cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center gap-1">
                        <span>Role</span>
                        <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th className="pb-3 pr-4">Status</th>
                    <th className="pb-3 pr-4 text-center">Orders</th>
                    <th className="pb-3 pr-4 text-right">Total Spent</th>
                    <th 
                      onClick={() => handleSort("created_at")}
                      className="pb-3 pr-4 cursor-pointer hover:text-foreground transition-colors group"
                    >
                      <div className="flex items-center gap-1 justify-end">
                        <span>Registered On</span>
                        <ArrowUpDown className="h-3 w-3 opacity-30 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.map((u) => (
                    <tr 
                      key={u.id} 
                      className="border-b border-border/20 last:border-0 hover:bg-muted/30 transition-colors group"
                    >
                      {/* User Avatar & Name */}
                      <td className="py-3.5 pr-4 font-bold text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/10 to-primary/30 text-primary flex items-center justify-center font-black text-[10px] border border-primary/20">
                            {getInitials(u.full_name)}
                          </div>
                          <div>
                            <span 
                              onClick={() => handleOpenDrawer(u.id)}
                              className="font-bold text-foreground hover:text-primary hover:underline cursor-pointer transition-colors"
                            >
                              {u.full_name}
                            </span>
                            {currentUser?.id === u.id && (
                              <span className="ml-1.5 px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[9px] font-black uppercase">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="py-3.5 pr-4 text-muted-foreground select-all">{u.email}</td>

                      {/* Phone */}
                      <td className="py-3.5 pr-4 text-muted-foreground">{u.phone || "—"}</td>

                      {/* Role */}
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase border ${
                          u.role === "admin" 
                            ? "bg-purple-500/10 border-purple-500/20 text-purple-500" 
                            : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                        }`}>
                          {u.role}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
                          u.account_status === "active" 
                            ? "bg-green-500/10 text-green-500" 
                            : "bg-red-500/10 text-red-500 animate-pulse"
                        }`}>
                          {u.account_status}
                        </span>
                      </td>

                      {/* Orders Count */}
                      <td className="py-3.5 pr-4 text-center font-bold text-foreground">{u.total_orders}</td>

                      {/* Total Spent */}
                      <td className="py-3.5 pr-4 text-right font-black text-primary select-all">
                        LKR {u.total_spent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      {/* Registered Date */}
                      <td className="py-3.5 pr-4 text-right text-muted-foreground">
                        {new Date(u.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>

                      {/* Actions Buttons */}
                      <td className="py-3.5 text-right whitespace-nowrap">
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenDrawer(u.id)}
                            className="px-2 h-7 rounded bg-secondary hover:bg-primary hover:text-primary-foreground font-bold transition-all text-[10px]"
                            title="View Profile Details"
                          >
                            Details
                          </button>
                          
                          {/* Role Flip */}
                          <button
                            disabled={currentUser?.id === u.id || actionInProgress === u.id}
                            onClick={() => handleToggleRole(u.id, u.role)}
                            className="px-2 h-7 rounded border border-border hover:bg-purple-500/10 hover:border-purple-500/25 text-muted-foreground hover:text-purple-500 disabled:opacity-30 disabled:pointer-events-none transition-all text-[10px] font-bold"
                            title="Promote/Demote Access Level"
                          >
                            Role
                          </button>

                          {/* Status Flip */}
                          <button
                            disabled={currentUser?.id === u.id || actionInProgress === u.id}
                            onClick={() => handleToggleStatus(u.id, u.account_status)}
                            className={`px-2 h-7 rounded border border-border transition-all text-[10px] font-bold disabled:opacity-30 disabled:pointer-events-none ${
                              u.account_status === "active" 
                                ? "hover:bg-red-500/10 hover:border-red-500/25 text-muted-foreground hover:text-red-500"
                                : "hover:bg-green-500/10 hover:border-green-500/25 text-muted-foreground hover:text-green-500"
                            }`}
                            title={u.account_status === "active" ? "Suspend Account" : "Activate Account"}
                          >
                            {u.account_status === "active" ? "Suspend" : "Activate"}
                          </button>

                          {/* Soft Delete */}
                          <button
                            disabled={currentUser?.id === u.id || actionInProgress === u.id}
                            onClick={() => handleDeleteUser(u.id, u.full_name)}
                            className="px-2 h-7 rounded border border-border hover:bg-red-600/10 hover:border-red-600/25 text-muted-foreground hover:text-red-600 disabled:opacity-30 disabled:pointer-events-none transition-all"
                            title="Soft Delete User"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Table Pagination bar */}
          {!loadingUsers && totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-6 border-t border-border/40 text-xs">
              <div className="text-muted-foreground">
                Showing page <span className="font-bold text-foreground">{page}</span> of{" "}
                <span className="font-bold text-foreground">{totalPages}</span> ({totalUsers} total users)
              </div>

              <div className="flex gap-1.5 items-center">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-2 rounded-xl bg-secondary border border-border text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-border/60 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => {
                  const pNum = idx + 1;
                  return (
                    <button
                      key={pNum}
                      onClick={() => setPage(pNum)}
                      className={`h-8 w-8 rounded-xl font-bold transition-all ${
                        page === pNum
                          ? "bg-primary text-primary-foreground shadow-md"
                          : "bg-secondary border border-border text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {pNum}
                    </button>
                  );
                })}

                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-2 rounded-xl bg-secondary border border-border text-foreground disabled:opacity-30 disabled:cursor-not-allowed hover:bg-border/60 transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* User Details Sliding Side-Drawer Panel */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden animate-in fade-in duration-200">
          {/* Backdrop blur clickoff */}
          <div 
            onClick={() => setIsDrawerOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />

          <div className="absolute inset-y-0 right-0 max-w-full pl-10 flex">
            <div className="w-screen max-w-lg bg-card border-l border-glass-border shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300 ease-in-out slide-in-from-right h-full">
              
              {/* Drawer Title Header */}
              <div className="px-6 py-6 border-b border-border/40 flex items-center justify-between bg-secondary/30">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  <span>Customer Profile Details</span>
                </h3>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Inner Scroll Body */}
              <div className="flex-grow p-6 overflow-y-auto space-y-8">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <span className="text-xs text-muted-foreground">Pulling user records...</span>
                  </div>
                ) : userDetails ? (
                  <>
                    {/* A. Hero User Profile Info */}
                    <div className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/40 border border-border/40">
                      <div className="h-14 w-14 rounded-full bg-gradient-to-br from-primary/20 to-primary/40 text-primary flex items-center justify-center font-black text-xl border border-primary/20 shadow-md">
                        {getInitials(userDetails.full_name)}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-bold text-foreground text-base leading-none">{userDetails.full_name}</h4>
                        <div className="flex flex-wrap gap-1.5 items-center pt-0.5">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                            userDetails.role === "admin" 
                              ? "bg-purple-500/10 border-purple-500/20 text-purple-500" 
                              : "bg-blue-500/10 border-blue-500/20 text-blue-500"
                          }`}>
                            {userDetails.role}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                            userDetails.account_status === "active" 
                              ? "bg-green-500/10 text-green-500" 
                              : "bg-red-500/10 text-red-500"
                          }`}>
                            {userDetails.account_status}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* B. Core Contact Details Fields */}
                    <div className="space-y-4">
                      <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/40 pb-1.5">
                        Account Information
                      </h5>

                      <div className="grid grid-cols-1 gap-3.5 text-xs">
                        <div className="flex items-center gap-2.5">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground w-16">Email:</span>
                          <span className="text-foreground font-semibold select-all">{userDetails.email}</span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Phone className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground w-16">Phone:</span>
                          <span className="text-foreground font-semibold">{userDetails.phone || "Not provided"}</span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                          <span className="font-semibold text-muted-foreground w-16">Address:</span>
                          <span className="text-foreground font-semibold flex-1">
                            {userDetails.address || "No shipping address saved"}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground w-16">Joined:</span>
                          <span className="text-foreground font-semibold">
                            {new Date(userDetails.created_at).toLocaleString(undefined, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-muted-foreground w-16">Last Login:</span>
                          <span className="text-foreground font-semibold">
                            {userDetails.last_login 
                              ? new Date(userDetails.last_login).toLocaleString(undefined, {
                                  dateStyle: "medium",
                                  timeStyle: "short",
                                })
                              : "Never logged in"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* C. Purchase Stats Cards */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 text-center">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Purchases</div>
                        <div className="text-lg font-black text-foreground">{userDetails.total_orders} Orders</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-secondary/30 border border-border/40 text-center">
                        <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Expenditure</div>
                        <div className="text-lg font-black text-primary">
                          LKR {userDetails.total_spent.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </div>
                      </div>
                    </div>

                    {/* D. Full Order History Section */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/40 pb-1.5">
                        Purchase History
                      </h5>
                      {userDetails.orders.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-xl border border-dashed border-border/40">
                          No order transactions recorded.
                        </div>
                      ) : (
                        <div className="space-y-3.5">
                          {userDetails.orders.map((order: any) => (
                            <div key={order.id} className="p-4 rounded-2xl border border-border/40 bg-secondary/20 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-foreground">Order #{order.id}</span>
                                <span className="text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              
                              {/* Order items lists */}
                              <div className="text-xs text-muted-foreground space-y-1">
                                {order.items.map((item: any, itemIdx: number) => (
                                  <div key={itemIdx} className="flex justify-between font-semibold">
                                    <span className="truncate max-w-[200px]">{item.name} (x{item.quantity})</span>
                                    <span>LKR {(item.price * item.quantity).toLocaleString()}</span>
                                  </div>
                                ))}
                              </div>

                              <div className="flex items-center justify-between text-xs pt-2 border-t border-border/20">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                  order.status === "Delivered" 
                                    ? "bg-green-500/10 text-green-500" 
                                    : order.status === "Cancelled" 
                                    ? "bg-red-500/10 text-red-500"
                                    : "bg-amber-500/10 text-amber-500"
                                }`}>
                                  {order.status}
                                </span>
                                <span className="font-black text-primary">
                                  Total: LKR {order.total_price.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* E. Customer Wishlist Section */}
                    <div className="space-y-3">
                      <h5 className="text-[10px] font-black uppercase text-muted-foreground tracking-widest border-b border-border/40 pb-1.5">
                        Customer Wishlist
                      </h5>
                      {userDetails.wishlist_products.length === 0 ? (
                        <div className="text-center py-6 text-muted-foreground text-xs bg-muted/20 rounded-xl border border-dashed border-border/40">
                          Wishlist is empty.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          {userDetails.wishlist_products.map((p: any) => (
                            <div 
                              key={p.id} 
                              className="p-3 rounded-2xl border border-border/40 bg-secondary/10 hover:bg-secondary/35 transition-all flex items-center gap-2.5 cursor-pointer"
                              onClick={() => router.push(`/product/${p.id}`)}
                            >
                              <div className="h-10 w-10 bg-white rounded-lg border border-border/40 p-1 flex-shrink-0 flex items-center justify-center">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="h-full w-full object-contain" />
                                ) : (
                                  <Heart className="h-4 w-4 text-muted-foreground/30" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-foreground truncate">{p.name}</div>
                                <div className="text-[10px] text-muted-foreground">{p.brand}</div>
                                <div className="text-xs font-black text-primary mt-0.5">LKR {p.price.toLocaleString()}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center py-20 text-xs text-muted-foreground">User details loading failed.</div>
                )}
              </div>

              {/* Drawer Action Bar */}
              {userDetails && (
                <div className="px-6 py-4 border-t border-border/40 bg-secondary/30 flex gap-2.5">
                  <button
                    disabled={currentUser?.id === userDetails.id || actionInProgress === userDetails.id}
                    onClick={() => handleToggleRole(userDetails.id, userDetails.role)}
                    className="flex-1 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 hover:bg-purple-500/15 hover:border-purple-500/35 text-purple-500 font-bold transition-all text-xs disabled:opacity-30 disabled:pointer-events-none"
                  >
                    Toggle Admin Role
                  </button>

                  <button
                    disabled={currentUser?.id === userDetails.id || actionInProgress === userDetails.id}
                    onClick={() => handleToggleStatus(userDetails.id, userDetails.account_status)}
                    className={`flex-1 h-10 rounded-xl font-bold transition-all text-xs border disabled:opacity-30 disabled:pointer-events-none ${
                      userDetails.account_status === "active"
                        ? "bg-red-500/10 border-red-500/25 hover:bg-red-500/15 text-red-500"
                        : "bg-green-500/10 border-green-500/25 hover:bg-green-500/15 text-green-500"
                    }`}
                  >
                    {userDetails.account_status === "active" ? "Suspend Account" : "Activate Account"}
                  </button>

                  <button
                    disabled={currentUser?.id === userDetails.id || actionInProgress === userDetails.id}
                    onClick={() => handleDeleteUser(userDetails.id, userDetails.full_name)}
                    className="w-12 h-10 rounded-xl border border-red-600/25 bg-red-600/5 hover:bg-red-600/10 text-red-600 flex items-center justify-center transition-all disabled:opacity-30 disabled:pointer-events-none"
                    title="Soft Delete User"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
