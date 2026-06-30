"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAi } from "@/context/AiContext";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  RotateCcw,
  Layers,
  HelpCircle,
  Cpu,
  Bookmark,
  TrendingUp,
  Mail,
  User,
  Phone,
  DollarSign,
  Briefcase,
  ExternalLink,
  CheckCircle,
  Loader2
} from "lucide-react";
import Link from "next/link";

export default function AiConsultantWidget() {
  const {
    messages,
    isOpen,
    setIsOpen,
    isTyping,
    sendMessage,
    resetSession,
    confidenceScore,
    submitSourcingRequest
  } = useAi();

  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [showRequestModal, setShowRequestModal] = useState(false);
  
  // Sourcing request form state
  const [reqName, setReqName] = useState("");
  const [reqEmail, setReqEmail] = useState("");
  const [reqPhone, setReqPhone] = useState("");
  const [reqLaptop, setReqLaptop] = useState("");
  const [reqBudget, setReqBudget] = useState("");
  const [reqUseCase, setReqUseCase] = useState("");
  const [submittingReq, setSubmittingReq] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [reqError, setReqError] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping]);

  // Pre-fill form if user is logged in
  useEffect(() => {
    if (user) {
      setReqName(user.full_name || "");
      setReqEmail(user.email || "");
      setReqPhone(user.phone || "");
    }
  }, [user]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const txt = input;
    setInput("");
    await sendMessage(txt);
  };

  const handleOpenSourcingRequest = (prefilledLaptop = "") => {
    setReqLaptop(prefilledLaptop);
    setShowRequestModal(true);
    setReqSuccess(false);
    setReqError("");
  };

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reqName || !reqEmail || !reqPhone || !reqLaptop || !reqBudget) {
      setReqError("Please fill out all required fields.");
      return;
    }
    setSubmittingReq(true);
    setReqError("");
    try {
      const budgetVal = parseFloat(reqBudget.replace(/,/g, ""));
      if (isNaN(budgetVal)) {
        setReqError("Please specify a valid numeric budget.");
        setSubmittingReq(false);
        return;
      }

      const ok = await submitSourcingRequest({
        customer_name: reqName,
        email: reqEmail,
        phone: reqPhone,
        requested_laptop: reqLaptop,
        budget: budgetVal,
        use_case: reqUseCase
      });

      if (ok) {
        setReqSuccess(true);
        // Clear non-user fields
        setReqLaptop("");
        setReqBudget("");
        setReqUseCase("");
      } else {
        setReqError("Failed to submit request. Please try again.");
      }
    } catch (err) {
      setReqError("Something went wrong. Please check your inputs.");
    } finally {
      setSubmittingReq(false);
    }
  };

  return (
    <>
      {/* FLOATING ACTION BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.1, boxShadow: "0 0 20px rgba(6, 182, 212, 0.4)" }}
          whileTap={{ scale: 0.95 }}
          className="relative flex items-center justify-center h-14 w-14 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 text-white shadow-2xl shadow-cyan-500/20 cursor-pointer border border-cyan-400/30"
          aria-label="AI Consultant Chat"
        >
          {isOpen ? (
            <X className="h-6 w-6 transition-transform duration-300" />
          ) : (
            <MessageSquare className="h-6 w-6 transition-transform duration-300 animate-pulse" />
          )}
          
          {/* Glowing Ring Accent */}
          <span className="absolute -inset-1 rounded-full bg-cyan-400/20 blur-sm -z-10 animate-ping"></span>
        </motion.button>
      </div>

      {/* CHAT WINDOW CONTAINER */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-24 right-6 w-[92vw] sm:w-[420px] h-[600px] rounded-3xl border border-cyan-500/20 bg-slate-950/80 backdrop-blur-xl shadow-2xl z-50 overflow-hidden flex flex-col font-sans text-slate-100"
          >
            {/* Ambient Backlight Glow */}
            <div className="absolute top-0 left-1/4 right-1/4 h-24 bg-cyan-500/10 blur-3xl rounded-full -z-10"></div>
            <div className="absolute bottom-0 right-1/4 left-1/4 h-24 bg-blue-500/10 blur-3xl rounded-full -z-10"></div>

            {/* HEADER */}
            <div className="p-4 border-b border-white/5 bg-slate-900/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/10">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold tracking-wider bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent flex items-center gap-1">
                    AI Laptop Consultant
                  </h3>
                  <p className="text-[10px] text-cyan-400/70 font-mono tracking-widest flex items-center gap-1 uppercase">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={resetSession}
                  className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-white/5 rounded-lg transition-all"
                  title="Reset conversation"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-white/5 rounded-lg transition-all"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* PROFILE MATCH CONFIDENCE PROGRESS */}
            {confidenceScore > 0 && (
              <div className="px-4 py-2 bg-slate-900/60 border-b border-white/5 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-400 font-mono tracking-wider">Gathering Requirements:</span>
                <div className="flex items-center gap-2 w-1/2">
                  <div className="h-1.5 bg-white/5 rounded-full w-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${confidenceScore * 100}%` }}
                      className="h-full bg-gradient-to-r from-cyan-400 to-blue-500"
                    ></motion.div>
                  </div>
                  <span className="text-[10px] font-bold text-cyan-400 font-mono">{Math.round(confidenceScore * 100)}%</span>
                </div>
              </div>
            )}

            {/* MESSAGES VIEWPORT */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, i) => {
                const isUser = msg.role === "user";
                return (
                  <div key={i} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        isUser
                          ? "bg-gradient-to-tr from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-lg shadow-cyan-500/5"
                          : "bg-slate-900/60 border border-white/5 text-slate-200 rounded-tl-none"
                      }`}
                    >
                      {/* Message Content with simple formatting helper */}
                      <p className="whitespace-pre-line">
                        {msg.message}
                      </p>

                      {/* Embedded Sourcing Trigger if no inventory matches */}
                      {!isUser && msg.message.includes("Currently unavailable in our inventory") && (
                        <button
                          onClick={() => handleOpenSourcingRequest()}
                          className="mt-3 w-full py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/10 cursor-pointer"
                        >
                          <Bookmark className="h-3.5 w-3.5" />
                          Submit Sourcing Request
                        </button>
                      )}
                    </div>

                    {/* Render inventory match cards if present */}
                    {!isUser && msg.matches && msg.matches.length > 0 && (
                      <div className="w-full mt-3 overflow-x-auto py-1 flex gap-3 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10">
                        {msg.matches.map((item) => (
                          <div
                            key={item.id}
                            className="flex-shrink-0 w-64 rounded-2xl border border-white/5 bg-slate-900/90 p-3 flex flex-col justify-between hover:border-cyan-500/30 transition-all shadow-xl"
                          >
                            <div>
                              <div className="h-28 w-full bg-slate-950 rounded-xl overflow-hidden relative mb-2 flex items-center justify-center border border-white/5">
                                {item.image_urls && item.image_urls.length > 0 ? (
                                  <img
                                    src={item.image_urls[0]}
                                    alt={item.name}
                                    className="object-contain h-full w-full"
                                  />
                                ) : (
                                  <Cpu className="h-8 w-8 text-cyan-500/40" />
                                )}
                                <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-cyan-500/20 text-[9px] text-cyan-400 font-mono font-bold">
                                  {item.compatibility}% Match
                                </span>
                              </div>
                              <h4 className="text-xs font-semibold text-slate-100 truncate">
                                {item.brand} {item.name}
                              </h4>
                              <p className="text-[10px] text-cyan-400 font-mono font-bold mt-1">
                                LKR {item.price.toLocaleString()}
                              </p>
                              <div className="grid grid-cols-2 gap-1 text-[9px] text-slate-400 mt-2 bg-slate-950/40 p-1.5 rounded-lg border border-white/5 font-mono">
                                <span className="truncate">CPU: {item.specs?.cpu}</span>
                                <span className="truncate">RAM: {item.specs?.ram}</span>
                                <span className="truncate">GPU: {item.specs?.gpu}</span>
                                <span className="truncate">Cond: {item.condition}</span>
                              </div>
                            </div>
                            <div className="flex gap-1.5 mt-3">
                              <Link
                                href={`/product/${item.id}`}
                                className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-center rounded-lg text-[10px] font-bold border border-white/5 transition-all flex items-center justify-center gap-1"
                              >
                                View Details
                                <ExternalLink className="h-2.5 w-2.5" />
                              </Link>
                              <Link
                                href={`/compare?add=${item.id}`}
                                className="px-2 py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center"
                                title="Add to compare"
                              >
                                Compare
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Typing loader */}
              {isTyping && (
                <div className="flex items-center gap-1 text-slate-400 bg-slate-900/40 border border-white/5 px-4 py-2.5 rounded-2xl rounded-tl-none max-w-[80px] justify-center">
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></span>
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></span>
                  <span className="h-1.5 w-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* DIALOGUE INPUT BOX */}
            <form onSubmit={handleSend} className="p-3 border-t border-white/5 bg-slate-900/40 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about laptops..."
                className="flex-1 bg-slate-950/60 border border-white/5 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500/40 transition-all font-mono"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-500 text-white hover:brightness-110 cursor-pointer transition-all shadow-md shadow-cyan-500/10"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SOURCING REQUEST MODEL */}
      <AnimatePresence>
        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md rounded-3xl border border-cyan-500/20 bg-slate-900/90 p-6 shadow-2xl relative"
            >
              <button
                onClick={() => setShowRequestModal(false)}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-100"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <Bookmark className="h-5 w-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100">Submit Sourcing Request</h3>
                  <p className="text-xs text-slate-400">Can't find it in stock? We will find it for you!</p>
                </div>
              </div>

              {reqSuccess ? (
                <div className="py-6 text-center space-y-4">
                  <div className="h-16 w-16 mx-auto rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle className="h-8 w-8 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-100 text-base">Request Submitted!</h4>
                    <p className="text-xs text-slate-400 mt-2">
                      Our consultant team has been notified. We will scan our supplier network and contact you via WhatsApp / Email within 24 hours.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowRequestModal(false)}
                    className="w-full py-2.5 mt-4 bg-slate-800 text-slate-200 border border-white/5 hover:bg-slate-700 font-bold rounded-xl text-xs transition-all cursor-pointer"
                  >
                    Close Window
                  </button>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4 text-xs">
                  {reqError && (
                    <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs">
                      {reqError}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                      <User className="h-3 w-3 text-cyan-400" /> Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="e.g. Aakil Mohammed"
                      className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                        <Mail className="h-3 w-3 text-cyan-400" /> Email *
                      </label>
                      <input
                        type="email"
                        required
                        value={reqEmail}
                        onChange={(e) => setReqEmail(e.target.value)}
                        placeholder="yourname@gmail.com"
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                        <Phone className="h-3 w-3 text-cyan-400" /> Phone/WhatsApp *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqPhone}
                        onChange={(e) => setReqPhone(e.target.value)}
                        placeholder="e.g. +94 77 123 4567"
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                        <Cpu className="h-3 w-3 text-cyan-400" /> Requested Model *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqLaptop}
                        onChange={(e) => setReqLaptop(e.target.value)}
                        placeholder="e.g. MacBook Pro M3 or ASUS ROG"
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                        <DollarSign className="h-3 w-3 text-cyan-400" /> Target Budget (LKR) *
                      </label>
                      <input
                        type="text"
                        required
                        value={reqBudget}
                        onChange={(e) => setReqBudget(e.target.value)}
                        placeholder="e.g. 350,000"
                        className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] font-mono flex items-center gap-1">
                      <Briefcase className="h-3 w-3 text-cyan-400" /> Usage Purpose & Workload
                    </label>
                    <textarea
                      value={reqUseCase}
                      onChange={(e) => setReqUseCase(e.target.value)}
                      placeholder="Describe what software/games you will run..."
                      rows={3}
                      className="w-full bg-slate-950/80 border border-white/5 focus:border-cyan-500/40 focus:outline-none rounded-xl px-3 py-2 text-slate-100 resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReq}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/10 cursor-pointer flex items-center justify-center gap-2"
                  >
                    {submittingReq ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Submitting...
                      </>
                    ) : (
                      "Submit Sourcing Request"
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
