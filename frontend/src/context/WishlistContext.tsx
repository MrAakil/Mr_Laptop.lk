"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth, API_URL } from "./AuthContext";

interface WishlistContextType {
  wishlist: any[];
  toggleWishlist: (product: any) => Promise<void>;
  inWishlist: (productId: number) => boolean;
  fetchWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const { token, user } = useAuth();

  // Load wishlist on startup or auth change
  useEffect(() => {
    if (token && user) {
      fetchUserWishlist();
    } else {
      // Load guest wishlist
      const savedWishlist = localStorage.getItem("mr_laptop_wishlist");
      if (savedWishlist) {
        try {
          setWishlist(JSON.parse(savedWishlist));
        } catch (error) {
          console.error("Error parsing guest wishlist", error);
        }
      } else {
        setWishlist([]);
      }
    }
  }, [token, user]);

  const fetchUserWishlist = async () => {
    if (!token) return;
    try {
      const response = await fetch(`${API_URL}/products/wishlist`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setWishlist(data);
      }
    } catch (error) {
      console.error("Failed to fetch wishlist from DB", error);
    }
  };

  const toggleWishlist = async (product: any) => {
    const exists = wishlist.some((item) => item.id === product.id);
    let newWishlist = [];

    if (exists) {
      newWishlist = wishlist.filter((item) => item.id !== product.id);
    } else {
      newWishlist = [...wishlist, product];
    }

    setWishlist(newWishlist);

    if (token) {
      try {
        // Sync with API
        await fetch(`${API_URL}/products/wishlist/${product.id}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      } catch (error) {
        console.error("Failed to sync wishlist with server", error);
      }
    } else {
      // Sync local storage for guest
      localStorage.setItem("mr_laptop_wishlist", JSON.stringify(newWishlist));
    }
  };

  const inWishlist = (productId: number): boolean => {
    return wishlist.some((item) => item.id === productId);
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        toggleWishlist,
        inWishlist,
        fetchWishlist: fetchUserWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
