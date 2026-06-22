"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/utils/api";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import { useCompare } from "@/context/CompareContext";
import { useTheme } from "@/context/ThemeContext";
import {
  Search,
  ShoppingCart,
  Heart,
  GitCompare,
  User,
  Sun,
  Moon,
  Menu,
  X,
  Laptop,
} from "lucide-react";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { compareList } = useCompare();
  const { theme, toggleTheme } = useTheme();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);

  // Total items in cart
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Close search suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch search suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }
    const delayDebounceFn = setTimeout(async () => {
      try {
        const res = await apiFetch(`/products?search=${searchQuery}&limit=5`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (err) {
        console.error("Suggestions fetch error", err);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setShowSuggestions(false);
      router.push(`/catalog?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSuggestionClick = (id: number) => {
    setShowSuggestions(false);
    setSearchQuery("");
    router.push(`/product/${id}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full transition-all duration-300 glass border-b border-glass-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-2 rounded-full border border-border/60 bg-secondary/50 px-3 py-2 text-foreground/80 transition-all hover:bg-secondary hover:text-primary hover:shadow-sm">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-background/70 text-foreground/80 transition-transform duration-200 group-hover:scale-105">
              <Laptop className="h-4.5 w-4.5" />
            </div>
            <span className="text-sm font-semibold tracking-wide text-foreground transition-colors group-hover:text-primary">
              Mr_Laptop<span className="text-primary">.lk</span>
            </span>
          </Link>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <Link href="/catalog" className="text-foreground/80 hover:text-primary transition-colors">Shop</Link>
            <Link href="/catalog?category=Gaming" className="text-foreground/80 hover:text-primary transition-colors">Gaming</Link>
            <Link href="/catalog?category=Business" className="text-foreground/80 hover:text-primary transition-colors">Business</Link>
            <Link href="/catalog?condition=Used" className="text-foreground/80 hover:text-primary transition-colors">Pre-Owned</Link>
            <Link href="/compare" className="text-foreground/80 hover:text-primary transition-colors">Compare</Link>
            <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">About</Link>
            <Link href="/contact" className="text-foreground/80 hover:text-primary transition-colors">Contact</Link>
          </nav>

          {/* Search Bar - Desktop */}
          <div ref={searchRef} className="hidden lg:block relative flex-1 max-w-md">
            <form onSubmit={handleSearchSubmit} className="relative">
              <input
                type="text"
                placeholder="Search laptops (e.g. MacBook, RTX)..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full h-10 px-4 pl-10 pr-4 rounded-full bg-secondary/50 border border-border text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
            </form>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-12 left-0 right-0 rounded-2xl border border-glass-border bg-card p-2 shadow-2xl backdrop-blur-xl max-h-96 overflow-y-auto">
                <div className="px-3 py-1.5 text-xs text-muted-foreground uppercase font-semibold">Suggested Products</div>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleSuggestionClick(item.id)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left hover:bg-secondary/60 transition-colors"
                  >
                    <img
                      src={item.image_urls[0]}
                      alt={item.name}
                      className="h-10 w-10 object-contain rounded bg-white p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold truncate text-foreground">{item.name}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {item.brand} • {item.condition} • LKR {item.price.toLocaleString()}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Icons & Controls */}
          <div className="flex items-center gap-2">
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-all"
              aria-label="Toggle Theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Compare Badge */}
            <Link
              href="/compare"
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-all relative"
              title="Compare Laptops"
            >
              <GitCompare className="h-5 w-5" />
              {compareList.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background animate-pulse">
                  {compareList.length}
                </span>
              )}
            </Link>

            {/* Wishlist Badge */}
            <Link
              href={user ? "/dashboard?tab=wishlist" : "/auth/login"}
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-all relative"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlist.length > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-background">
                  {wishlist.length}
                </span>
              )}
            </Link>

            {/* Cart Badge */}
            <Link
              href="/cart"
              className="p-2 rounded-full hover:bg-secondary text-foreground/80 hover:text-primary transition-all relative"
              title="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                  {cartItemCount}
                </span>
              )}
            </Link>

            {/* User Account / Admin Dashboard */}
            {user ? (
              <div className="relative group">
                <Link
                  href={user.role === "admin" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-1.5 p-2 rounded-full hover:bg-secondary text-foreground/85 hover:text-primary transition-all"
                >
                  <User className="h-5 w-5" />
                  <span className="hidden md:inline text-xs font-semibold max-w-[80px] truncate">
                    {user.full_name.split(" ")[0]}
                  </span>
                </Link>
                {/* Hover Dropdown */}
                <div className="absolute right-0 top-10 w-48 rounded-xl border border-glass-border bg-card p-1.5 shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                  <div className="px-3 py-1.5 text-xs text-muted-foreground border-b border-border/50 font-medium truncate">
                    {user.email}
                  </div>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      className="block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-secondary font-medium transition-colors"
                    >
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/dashboard"
                    className="block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-secondary font-medium transition-colors"
                  >
                    Customer Dashboard
                  </Link>
                  <button
                    onClick={logout}
                    className="block w-full text-left px-3 py-2 text-xs rounded-lg hover:bg-red-500/10 text-red-500 font-semibold transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="flex items-center gap-1 h-9 px-4 rounded-full bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/95 hover:shadow-lg transition-all"
              >
                <User className="h-3.5 w-3.5" />
                <span>Sign In</span>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-full hover:bg-secondary text-foreground md:hidden transition-all"
              aria-label="Toggle Menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden glass border-b border-glass-border py-4 px-6 flex flex-col gap-4 animate-in slide-in-from-top duration-300">
          
          {/* Search - Mobile */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              placeholder="Search laptops..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 px-4 pl-9 rounded-full bg-secondary border border-border text-sm focus:outline-none focus:border-primary"
            />
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          </form>

          {/* Links */}
          <div className="flex flex-col gap-3 font-semibold text-sm">
            <Link
              href="/catalog"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              Shop All Laptops
            </Link>
            <Link
              href="/catalog?category=Gaming"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              Gaming Laptops
            </Link>
            <Link
              href="/catalog?category=Business"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              Business Laptops
            </Link>
            <Link
              href="/catalog?condition=Used"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              Pre-Owned Laptops
            </Link>
            <Link
              href="/compare"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              Compare
            </Link>
            <Link
              href="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 border-b border-border/20 transition-colors"
            >
              About Us
            </Link>
            <Link
              href="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className="hover:text-primary py-1 transition-colors"
            >
              Contact
            </Link>
          </div>

          {/* Log Out for Mobile if user is authenticated */}
          {user && (
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="w-full text-center py-2 text-xs rounded-xl bg-red-500/10 text-red-500 font-bold"
            >
              Log Out
            </button>
          )}

        </div>
      )}
    </header>
  );
};
