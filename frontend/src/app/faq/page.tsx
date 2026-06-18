"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQS: FAQItem[] = [
  {
    question: "What is the difference between New, Used, and Refurbished laptops?",
    answer: "New laptops are factory-sealed with full manufacture warranties. Used laptops are pre-owned devices that undergo a strict 30-point hardware check at Mr_Laptop.lk. Refurbished laptops are system checked and upgraded with new parts (e.g. SSD, battery, RAM) inside our Colombo engineering lab, bringing them back to Grade-A performance status.",
  },
  {
    question: "How does the warranty work on Used and Refurbished devices?",
    answer: "Unlike other shops that only offer checking warranties, we stand behind our hardware. Refurbished and Used Grade-A laptops carry a solid 6-month store warranty. Should a motherboard, display, or RAM issue occur within this window, our micro-soldering laboratory resolves it free of charge.",
  },
  {
    question: "Do you deliver islandwide in Sri Lanka, and how much is shipping?",
    answer: "Yes, we offer fully insured delivery across all 9 provinces in Sri Lanka (including Colombo, Kandy, Galle, Gampaha, Kurunegala, Jaffna, Trincomalee, etc.). Shipping is FREE on all laptop purchases. Laptops are wrapped in heavy bubble casing and dual-boxed to prevent courier damage.",
  },
  {
    question: "What are the available payment options?",
    answer: "We offer Cash on Delivery (COD) allowing you to verify the package contents before making payment at your doorstep. We also support secure Bank Transfers. If you choose Bank Transfer, you will receive our Bank of Ceylon (BOC) or Commercial Bank account details, and we ship immediately upon confirmation of the receipt.",
  },
  {
    question: "How can I trade in my old laptop?",
    answer: "Bring your laptop to our Colombo 03 storefront or send its details via our Contact page. Our hardware technicians will evaluate its battery, thermals, display quality, and specs to offer you a fair valuation. This amount can be directly discounted against a purchase of any New, Refurbished, or Gaming laptop.",
  },
  {
    question: "Where is the Mr_Laptop.lk storefront located?",
    answer: "Our retail shop and engineering diagnostics lab is at 123 Galle Road, Colombo 03 (Colpetty), Sri Lanka. We are open from Monday through Saturday, from 9:00 AM to 7:00 PM.",
  },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-16">
        
        <div className="text-center mb-16 space-y-4">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
            <HelpCircle className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-foreground uppercase tracking-tight">
            Frequently Asked Questions
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Have questions about warranty coverage, diagnostic checks, trade-ins, or shipping in Sri Lanka? Check our quick answers.
          </p>
        </div>

        {/* FAQs list */}
        <div className="space-y-4">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-glass-border bg-card overflow-hidden transition-all duration-300"
              >
                <button
                  onClick={() => toggleFAQ(idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-foreground hover:bg-secondary/20 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"}`} />
                </button>
                
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs text-muted-foreground leading-relaxed animate-in slide-in-from-top-2 duration-300">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </main>

      <Footer />
    </div>
  );
}
