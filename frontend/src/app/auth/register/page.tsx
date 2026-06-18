"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ApiRequestError, useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Laptop, Loader2, UserPlus, AlertCircle } from "lucide-react";

function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, user, isLoading: authLoading } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const redirectUrl = searchParams.get("redirect") || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.push(redirectUrl);
    }
  }, [user, authLoading, redirectUrl, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      const success = await register(email, fullName, password, phone, address);
      if (success) {
        router.push(redirectUrl);
      } else {
        setErrorMsg("Your account was created, but automatic sign-in failed. Please sign in from the login page.");
      }
    } catch (err) {
      if (err instanceof ApiRequestError) {
        console.error("Register form submission failed", err.toLog());
        const prefix = err.isNetworkError ? "Network error" : err.status ? `HTTP ${err.status}` : "Registration error";
        setErrorMsg(`${prefix}: ${err.message}`);
      } else {
        console.error("Unexpected register form error", err);
        setErrorMsg("Unexpected registration error. Check the console for details.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg p-8 rounded-3xl border border-glass-border bg-card shadow-xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-4">
          <Laptop className="h-7 w-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
          Create Account
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Join Mr_Laptop.lk for premium hardware deals in Sri Lanka
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-bold text-muted-foreground">Full Name</label>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Harsha Silva"
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

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            minLength={6}
            className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground">Confirm Password</label>
          <input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-bold text-muted-foreground">Phone Number (Optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +94 77 123 4567"
            className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
          />
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label className="text-xs font-bold text-muted-foreground">Delivery Address (Optional)</label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="Galle Road, Colombo 03"
            className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-semibold flex items-center gap-1.5 sm:col-span-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2 sm:col-span-2 mt-4"
        >
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <UserPlus className="h-4.5 w-4.5" />
              <span>Create Free Account</span>
            </>
          )}
        </button>

      </form>

      <div className="text-center mt-6 text-xs text-muted-foreground">
        Already have an account?{" "}
        <Link
          href={`/auth/login${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="font-bold text-primary hover:underline"
        >
          Sign in here
        </Link>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <Suspense fallback={
          <div className="w-full max-w-lg p-8 rounded-3xl border border-glass-border bg-card shadow-xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <RegisterForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
