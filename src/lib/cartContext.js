'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const { data: session } = useSession();
  const [cartItems, setCartItems] = useState([]);

  // Load cart from localStorage when session changes
  useEffect(() => {
    if (session?.user?.email) {
      const savedCart = localStorage.getItem(`cart_${session.user.email}`);
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    }
  }, [session]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (session?.user?.email) {
      localStorage.setItem(`cart_${session.user.email}`, JSON.stringify(cartItems));
    }
  }, [cartItems, session]);

  const addToCart = (product) => {
    setCartItems(prev => {
      const exists = prev.find(item => item.id === product.id);
      if (exists) {
        // Check if adding one more would exceed stock
        if (exists.quantity >= Number(product.stock)) {
          // Optionally show an error message
          alert(`Cannot add more. Only ${product.stock} available.`);
          return prev;
        }
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, Number(product.stock)) }
            : item
        );
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    setCartItems(prev =>
      prev.map(item => {
        if (item.id === productId) {
          // Ensure quantity doesn't exceed stock
          const newQuantity = Math.min(
            Math.max(1, quantity),
            Number(item.stock)
          );
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
} 