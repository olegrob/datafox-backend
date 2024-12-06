'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { NextAuthProvider } from './providers';
import Header from './components/Header';
import { useEffect } from 'react';
import { CartProvider } from '@/lib/cartContext';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  useEffect(() => {
    // Any client-side initialization can go here
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <NextAuthProvider>
          <CartProvider>
            <Header />
            {children}
          </CartProvider>
        </NextAuthProvider>
      </body>
    </html>
  );
}