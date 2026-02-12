'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { useSettings } from './SettingsProvider';

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: Product, quantity: number, variant: { [key: string]: string }) => void;
  removeFromCart: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const { toast } = useToast();
  const { language } = useSettings();

  const t = {
    en: {
        addedToCart: "Added to cart",
        addedToCartDesc: (productName: string) => `${productName} has been added to your cart.`,
        itemRemoved: "Item removed",
        itemRemovedDesc: "An item has been removed from your cart."
    },
    ar: {
        addedToCart: "أضيف إلى السلة",
        addedToCartDesc: (productName: string) => `تمت إضافة ${productName} إلى سلتك.`,
        itemRemoved: "تمت إزالة المنتج",
        itemRemovedDesc: "تمت إزالة منتج من سلتك."
    }
  }

  const addToCart = (product: Product, quantity: number, variant: { [key: string]: string }) => {
    const variantId = Object.entries(variant).sort().map(([k,v]) => `${k}-${v}`).join('_');
    const itemId = `${product.id}_${variantId}`;

    const existingItemIndex = cartItems.findIndex(item => item.id === itemId);

    let newCartItems;
    if (existingItemIndex > -1) {
      newCartItems = [...cartItems];
      newCartItems[existingItemIndex].quantity += quantity;
    } else {
      const newItem: CartItem = {
        id: itemId,
        product,
        quantity,
        variant
      };
      newCartItems = [...cartItems, newItem];
    }
    setCartItems(newCartItems);
    toast({
      title: t[language].addedToCart,
      description: t[language].addedToCartDesc(product.name),
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
    toast({
      title: t[language].itemRemoved,
      variant: "destructive",
      description: t[language].itemRemovedDesc,
    });
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
    } else {
      setCartItems(cartItems.map(item => item.id === itemId ? { ...item, quantity } : item));
    }
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.product.price * item.quantity, 0);
  };
  
  const getCartItemCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <CartContext.Provider value={{ cartItems, addToCart, removeFromCart, updateQuantity, clearCart, getCartTotal, getCartItemCount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
