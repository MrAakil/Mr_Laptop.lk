"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompareContextType {
  compareList: any[];
  toggleCompare: (product: any) => boolean; // returns true if added/removed, false if list is full (max 3)
  inCompare: (productId: number) => boolean;
  clearCompare: () => void;
}

const CompareContext = createContext<CompareContextType | undefined>(undefined);

export const CompareProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compareList, setCompareList] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("mr_laptop_compare");
    if (saved) {
      try {
        setCompareList(JSON.parse(saved));
      } catch (error) {
        console.error("Error parsing compare storage", error);
      }
    }
  }, []);

  const syncCompare = (list: any[]) => {
    setCompareList(list);
    localStorage.setItem("mr_laptop_compare", JSON.stringify(list));
  };

  const toggleCompare = (product: any): boolean => {
    const exists = compareList.some((item) => item.id === product.id);

    if (exists) {
      const newList = compareList.filter((item) => item.id !== product.id);
      syncCompare(newList);
      return true;
    } else {
      if (compareList.length >= 3) {
        // Limit comparison to 3 items
        return false;
      }
      const newList = [...compareList, product];
      syncCompare(newList);
      return true;
    }
  };

  const inCompare = (productId: number): boolean => {
    return compareList.some((item) => item.id === productId);
  };

  const clearCompare = () => {
    syncCompare([]);
  };

  return (
    <CompareContext.Provider
      value={{
        compareList,
        toggleCompare,
        inCompare,
        clearCompare,
      }}
    >
      {children}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (context === undefined) {
    throw new Error("useCompare must be used within a CompareProvider");
  }
  return context;
};
