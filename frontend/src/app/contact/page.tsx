"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";

function ContactForm() {
  const searchParams = useSearchParams();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [service, setService] = useState(searchParams.get("service") || "general");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const defaultService = searchParams.get("service");
    if (defaultService) {
      setService(defaultService);
    }
  }, [searchParams]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setTimeout(() => setSuccess(false), 5000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
      
      {/* 1. Contact Form: 7 cols */}
      <div className="lg:col-span-7">
        <div className="p-6 sm:p-8 rounded-3xl border border-glass-border bg-card shadow-lg">
          <h2 className="text-sm font-black uppercase tracking-wider mb-6 flex items-center gap-2">
            <MessageSquare className="h-4.5 w-4.5 text-primary" />
            <span>Send Us a Message</span>
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Harsha Silva"
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
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
                  className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

            </div>

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
              <label className="text-xs font-bold text-muted-foreground">Inquiry Category</label>
              <select
                value={service}
                onChange={(e) => setService(e.target.value)}
                className="w-full h-10 px-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary font-semibold"
              >
                <option value="general">General Inquiry</option>
                <option value="repairs">Laptop Hardware Repairs</option>
                <option value="tradeins">Laptop Trade-In & Valuation</option>
                <option value="sales">Wholesale / Special Order</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-muted-foreground">Your Message</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your hardware questions, required specifications, or repair concerns here..."
                className="w-full p-4 rounded-xl bg-secondary border border-border text-xs focus:outline-none focus:border-primary"
              />
            </div>

            <button
              type="submit"
              className="w-full h-11 bg-primary text-primary-foreground font-bold rounded-xl text-xs hover:bg-primary/95 transition-all flex items-center justify-center gap-2 shadow-md shadow-primary/10 hover:shadow-lg"
            >
              <Send className="h-4 w-4" />
              <span>Submit Inquiry</span>
            </button>

            {success && (
              <div className="p-3.5 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-500 font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Thank you! Your message has been received. Our team will contact you shortly.</span>
              </div>
            )}

          </form>
        </div>
      </div>

      {/* 2. Store details: 5 cols */}
      <div className="lg:col-span-5 space-y-6">
        
        {/* Support Card */}
        <div className="p-6 rounded-3xl border border-glass-border bg-card">
          <h3 className="text-sm font-bold uppercase tracking-wider mb-6">Contact Channels</h3>
          
          <ul className="space-y-5">
            <li className="flex items-start gap-3.5 text-sm">
              <MapPin className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Visit Retail Store</div>
                <div className="text-xs text-muted-foreground mt-0.5">123 Galle Road, Colombo 03, Sri Lanka</div>
              </div>
            </li>

            <li className="flex items-start gap-3.5 text-sm">
              <Phone className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Phone Support Lines</div>
                <div className="text-xs text-muted-foreground mt-0.5">+94 77 123 4567 (Sales/Repairs)</div>
              </div>
            </li>

            <li className="flex items-start gap-3.5 text-sm">
              <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Support Email</div>
                <div className="text-xs text-muted-foreground mt-0.5">sales@mrlaptop.lk</div>
              </div>
            </li>

            <li className="flex items-start gap-3.5 text-sm">
              <Clock className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-foreground">Working Hours</div>
                <div className="text-xs text-muted-foreground mt-0.5">
                  Monday - Saturday: 9:00 AM - 7:00 PM <br />
                  Sunday: Closed
                </div>
              </div>
            </li>
          </ul>
        </div>

        {/* Map mockup */}
        <div className="p-1 rounded-3xl border border-glass-border bg-card overflow-hidden h-48 relative flex items-center justify-center">
          <div className="absolute inset-0 bg-cover bg-center opacity-30 blur-xs" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=400')` }} />
          <div className="relative z-10 text-center space-y-1">
            <MapPin className="h-7 w-7 text-primary mx-auto mb-2 animate-bounce" />
            <div className="text-xs font-black text-foreground">Mr_Laptop.lk Store Location</div>
            <div className="text-[10px] text-muted-foreground">Colombo 03 (Colpetty), Sri Lanka</div>
          </div>
        </div>

      </div>

    </div>
  );
}

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="max-w-3xl mx-auto text-center mb-16 space-y-4">
          <h1 className="text-3xl sm:text-5xl font-black text-foreground uppercase tracking-tight">
            Contact Mr_Laptop.lk
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Have questions about pricing, warranty coverage, trade-in valuations, or laptop repairs? Reach out to our Colombo team.
          </p>
        </div>

        <Suspense fallback={
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <ContactForm />
        </Suspense>

      </main>

      <Footer />
    </div>
  );
}
