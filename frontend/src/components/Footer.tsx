"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Laptop, Send, Phone, MapPin, Mail, ShieldCheck, Truck, RefreshCw, Clock } from "lucide-react";

export const Footer: React.FC = () => {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail("");
      setTimeout(() => setSubscribed(false), 5000);
    }
  };

  return (
    <footer className="w-full bg-secondary/30 border-t border-border mt-auto">
      {/* Trust Indicators Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 border-b border-border/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Genuine Laptops</div>
              <div className="text-xs text-muted-foreground">100% Quality Inspected</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Islandwide Delivery</div>
              <div className="text-xs text-muted-foreground">Fast, secure shipping</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Easy Trade-Ins</div>
              <div className="text-xs text-muted-foreground">Best value for old laptops</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-full bg-primary/10 text-primary">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold">Expert Repair Support</div>
              <div className="text-xs text-muted-foreground">Dedicated hardware lab</div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer links and newsletter */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">

          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:scale-110 transition-transform duration-200">
                <Laptop className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold tracking-tight">
                Mr_Laptop<span className="text-primary">.lk</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Sri Lanka's leading premium technology store for New, Used, and Refurbished laptops. We deliver quality with an iron-clad warranty.
            </p>

            {/* Newsletter Area */}
            <form onSubmit={handleSubscribe} className="relative max-w-sm">
              <input
                type="email"
                required
                placeholder="Subscribe for exclusive deals..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 pl-4 pr-12 rounded-lg bg-background border border-border text-sm focus:outline-none focus:border-primary transition-all"
              />
              <button
                type="submit"
                className="absolute right-1 top-1 h-8 w-8 flex items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/95 transition-all"
                aria-label="Subscribe"
              >
                <Send className="h-4 w-4" />
              </button>
              {subscribed && (
                <p className="text-xs text-green-500 font-medium mt-1.5 absolute">
                  Subscribed successfully! Thank you.
                </p>
              )}
            </form>
          </div>

          {/* Quick links: Categories */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Categories</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/catalog?category=Gaming" className="text-muted-foreground hover:text-primary transition-colors">Gaming Laptops</Link>
              </li>
              <li>
                <Link href="/catalog?category=Business" className="text-muted-foreground hover:text-primary transition-colors">Business Laptops</Link>
              </li>
              <li>
                <Link href="/catalog?category=Student" className="text-muted-foreground hover:text-primary transition-colors">Student Laptops</Link>
              </li>
              <li>
                <Link href="/catalog?category=Creator" className="text-muted-foreground hover:text-primary transition-colors">Creator Laptops</Link>
              </li>
              <li>
                <Link href="/catalog?condition=Used" className="text-muted-foreground hover:text-primary transition-colors">Used / Refurbished</Link>
              </li>
              <li>
                <Link href="/catalog?category=Accessories" className="text-muted-foreground hover:text-primary transition-colors">Laptop Accessories</Link>
              </li>
            </ul>
          </div>

          {/* Quick links: Company */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Support & Company</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-primary transition-colors">FAQs</Link>
              </li>
              <li>
                <Link href="/contact?service=repairs" className="text-muted-foreground hover:text-primary transition-colors">Laptop Repairs</Link>
              </li>
              <li>
                <Link href="/contact?service=tradeins" className="text-muted-foreground hover:text-primary transition-colors">Trade-In Program</Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider mb-4">Our Store</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary shrink-0" />
                <span>99/A, Kalpitiya Road, Thanneerkuda, Ettalai, Puttalam, Sri Lanka</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Phone className="h-4 w-4 text-primary shrink-0" />
                <span>+94 78 978 8848</span>
              </li>
              <li className="flex items-center gap-2.5 text-muted-foreground">
                <Mail className="h-4 w-4 text-primary shrink-0" />
                <span>aakilmohammed213@gmail.com</span>
              </li>
            </ul>
          </div>

        </div>
      </div>

      {/* Copyright */}
      <div className="bg-secondary/60 py-6 border-t border-border/50 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} Mr_Laptop.lk. All Rights Reserved. Designed for performance.</p>
          <div className="flex items-center gap-4 text-[10px] uppercase font-semibold">
            <span>Cash On Delivery</span>
            <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
            <span>Bank Transfer</span>
            <span className="h-1 w-1 bg-muted-foreground rounded-full"></span>
            <span>Visa / MasterCard</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
