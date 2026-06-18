"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Laptop, Loader2, LogIn, AlertCircle } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, user, isLoading: authLoading } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    setLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        router.push(redirectUrl);
      } else {
        setErrorMsg("Incorrect email or password. Please try again.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-8 rounded-3xl border border-glass-border bg-card shadow-xl">
      <div className="flex flex-col items-center mb-8 text-center">
        <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-4">
          <Laptop className="h-7 w-7" />
        </div>
        <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-foreground">
          Sign In
        </h2>
        <p className="text-xs text-muted-foreground mt-1">
          Access your orders, wishlist, and profile on Mr_Laptop.lk
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
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
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-muted-foreground">Password</label>
            <Link
              href="/auth/forgot-password"
              className="text-[10px] font-bold text-primary hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
          />
        </div>

        {errorMsg && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-500 font-semibold flex items-center gap-1.5">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4.5 w-4.5 animate-spin" />
          ) : (
            <>
              <LogIn className="h-4.5 w-4.5" />
              <span>Login to Account</span>
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-6 text-xs text-muted-foreground">
        Don't have an account?{" "}
        <Link
          href={`/auth/register${searchParams.toString() ? `?${searchParams.toString()}` : ""}`}
          className="font-bold text-primary hover:underline"
        >
          Register here
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow flex items-center justify-center py-16 px-4">
        <Suspense fallback={
          <div className="w-full max-w-md p-8 rounded-3xl border border-glass-border bg-card shadow-xl flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <LoginForm />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
