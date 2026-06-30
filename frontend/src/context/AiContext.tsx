"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";
import { API_URL } from "./AuthContext";

export interface ChatMessage {
  id?: number;
  role: "user" | "assistant";
  message: string;
  created_at?: string;
  matches?: Array<{
    id: number;
    name: string;
    brand: string;
    price: number;
    image_urls: string[];
    condition: string;
    compatibility: number;
    specs: {
      cpu: string;
      ram: string;
      storage: string;
      gpu: string;
      display: string;
      os: string;
    };
  }>;
}

interface SourcingRequestPayload {
  customer_name: string;
  email: string;
  phone: string;
  requested_laptop: string;
  budget: number;
  use_case?: string;
}

interface AiContextType {
  sessionId: string | null;
  messages: ChatMessage[];
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  isTyping: boolean;
  confidenceScore: number;
  preferences: any;
  sendMessage: (text: string) => Promise<void>;
  resetSession: () => void;
  submitSourcingRequest: (payload: SourcingRequestPayload) => Promise<boolean>;
  getComparisonSummary: (ids: number[]) => Promise<any>;
}

const AiContext = createContext<AiContextType | undefined>(undefined);

export function AiProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [confidenceScore, setConfidenceScore] = useState<number>(0);
  const [preferences, setPreferences] = useState<any>({});

  // Initialize session
  useEffect(() => {
    if (typeof window !== "undefined") {
      let activeSession = localStorage.getItem("mr_laptop_ai_session");
      if (!activeSession) {
        activeSession = Math.random().toString(36).substring(2, 15);
        localStorage.setItem("mr_laptop_ai_session", activeSession);
      }
      setSessionId(activeSession);
      loadSessionHistory(activeSession);
    }
  }, []);

  const loadSessionHistory = async (sessId: string) => {
    try {
      const res = await fetch(`${API_URL}/ai/chat/session/${sessId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.messages && data.messages.length > 0) {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Failed to load chat history:", err);
    }
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || !sessionId) return;

    // Append user message
    const userMsg: ChatMessage = { role: "user", message: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          role: "assistant",
          message: data.message,
          matches: data.matches,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setConfidenceScore(data.confidence_score);
        setPreferences(data.preferences);
      } else {
        throw new Error("Chat request failed");
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          message: "Oops! I encountered an error connecting to our system. Please check your connection and try again.",
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const resetSession = () => {
    const newSession = Math.random().toString(36).substring(2, 15);
    if (typeof window !== "undefined") {
      localStorage.setItem("mr_laptop_ai_session", newSession);
    }
    setSessionId(newSession);
    setConfidenceScore(0);
    setPreferences({});
    setMessages([
      {
        role: "assistant",
        message: "Hello! I am your AI Laptop Consultant. What is your **budget** in LKR? (e.g., 250,000 LKR or 350k LKR)",
      },
    ]);
  };

  const submitSourcingRequest = async (payload: SourcingRequestPayload): Promise<boolean> => {
    try {
      const res = await fetch(`${API_URL}/ai/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      return res.ok;
    } catch (err) {
      console.error("Failed to submit sourcing request:", err);
      return false;
    }
  };

  const getComparisonSummary = async (ids: number[]): Promise<any> => {
    try {
      const res = await fetch(`${API_URL}/ai/compare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_ids: ids }),
      });
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (err) {
      console.error("Failed to fetch compare data:", err);
      return null;
    }
  };

  return (
    <AiContext.Provider
      value={{
        sessionId,
        messages,
        isOpen,
        setIsOpen,
        isTyping,
        confidenceScore,
        preferences,
        sendMessage,
        resetSession,
        submitSourcingRequest,
        getComparisonSummary,
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

export function useAi() {
  const context = useContext(AiContext);
  if (context === undefined) {
    throw new Error("useAi must be used within an AiProvider");
  }
  return context;
}
