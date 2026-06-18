"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image_url: string;
  quantity: number;
  stock: number;
  brand: string;
  discount: number;
}

interface CartContextType {
  cart: CartItem[];
  couponCode: string | null;
  discount: number; // percentage
  addToCart: (product: any, quantity?: number) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  cartSubtotal: number;
  cartDiscountAmount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [discount, setDiscount] = useState<number>(0);

  // Load cart on startup
  useEffect(() => {
    const savedCart = localStorage.getItem("mr_laptop_cart");
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error("Error parsing cart storage", error);
      }
    }
    const savedCoupon = localStorage.getItem("mr_laptop_coupon");
    const savedDiscount = localStorage.getItem("mr_laptop_discount");
    if (savedCoupon && savedDiscount) {
      setCouponCode(savedCoupon);
      setDiscount(Number(savedDiscount));
    }
  }, []);

  // Sync cart to local storage
  const syncCart = (newCart: CartItem[]) => {
    setCart(newCart);
    localStorage.setItem("mr_laptop_cart", JSON.stringify(newCart));
  };

  const addToCart = (product: any, quantity: number = 1) => {
    const existingIndex = cart.findIndex((item) => item.id === product.id);
    const priceAfterDiscount = product.price * (1 - (product.discount || 0) / 100);

    if (existingIndex > -1) {
      const updatedCart = [...cart];
      const newQty = updatedCart[existingIndex].quantity + quantity;
      
      // Stock boundary check
      if (newQty <= product.stock) {
        updatedCart[existingIndex].quantity = newQty;
        syncCart(updatedCart);
      } else {
        updatedCart[existingIndex].quantity = product.stock;
        syncCart(updatedCart);
      }
    } else {
      const newItem: CartItem = {
        id: product.id,
        name: product.name,
        price: priceAfterDiscount,
        image_url: product.image_urls?.[0] || "/placeholder.jpg",
        quantity: Math.min(quantity, product.stock),
        stock: product.stock,
        brand: product.brand,
        discount: product.discount || 0
      };
      syncCart([...cart, newItem]);
    }
  };

  const removeFromCart = (productId: number) => {
    const updatedCart = cart.filter((item) => item.id !== productId);
    syncCart(updatedCart);
  };

  const updateQuantity = (productId: number, quantity: number) => {
    const item = cart.find((i) => i.id === productId);
    if (!item) return;

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    const finalQty = Math.min(quantity, item.stock);
    const updatedCart = cart.map((i) =>
      i.id === productId ? { ...i, quantity: finalQty } : i
    );
    syncCart(updatedCart);
  };

  const clearCart = () => {
    syncCart([]);
    removeCoupon();
  };

  const applyCoupon = (code: string): boolean => {
    const cleanedCode = code.trim().toUpperCase();
    // Valid coupons: MRLAPTOP10 (10% off), COLOMBO20 (20% off)
    if (cleanedCode === "MRLAPTOP10") {
      setCouponCode("MRLAPTOP10");
      setDiscount(10);
      localStorage.setItem("mr_laptop_coupon", "MRLAPTOP10");
      localStorage.setItem("mr_laptop_discount", "10");
      return true;
    } else if (cleanedCode === "COLOMBO20") {
      setCouponCode("COLOMBO20");
      setDiscount(20);
      localStorage.setItem("mr_laptop_coupon", "COLOMBO20");
      localStorage.setItem("mr_laptop_discount", "20");
      return true;
    }
    return false;
  };

  const removeCoupon = () => {
    setCouponCode(null);
    setDiscount(0);
    localStorage.removeItem("mr_laptop_coupon");
    localStorage.removeItem("mr_laptop_discount");
  };

  // Pricing calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartDiscountAmount = cartSubtotal * (discount / 100);
  const cartTotal = cartSubtotal - cartDiscountAmount;

  return (
    <CartContext.Provider
      value={{
        cart,
        couponCode,
        discount,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        applyCoupon,
        removeCoupon,
        cartSubtotal,
        cartDiscountAmount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
