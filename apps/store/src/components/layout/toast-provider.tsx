'use client';

import { Toaster } from 'react-hot-toast';
import Link from 'next/link';
import { useCartItemCount } from '@/lib/cart-store';

/**
 * ── TOAST PROVIDER ──
 * Client component wrapper for react-hot-toast
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
          },
          success: {
            duration: 2500,
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      {children}
    </>
  );
}

/**
 * ── CART BUTTON ──
 * Client component with live item count, links to /cart page.
 */
export function CartButton() {
  const itemCount = useCartItemCount();

  return (
    <Link
      href="/cart"
      className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <title>Cart</title>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>
      {itemCount > 0 && (
        <span className="absolute top-0 right-0 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center rounded-full">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
