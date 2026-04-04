'use client';

import { useCallback, useEffect, useState } from 'react';
import { User, LogOut } from 'lucide-react';
import { logoutCustomer, getCustomerMe } from '@/lib/api';
import { useAuthStore, useMountedAuth } from '@/lib/auth-store';
import { useMountedCart } from '@/lib/cart-store';
import toast from 'react-hot-toast';

/**
 * ── USER MENU ──
 * Shows "Sign In" link when not authenticated.
 * Shows customer name/avatar dropdown when authenticated.
 */
export function UserMenu() {
  const { isAuthenticated, setAuthenticated, setUnauthenticated } =
    useMountedAuth();
  const cart = useMountedCart();
  const [isOpen, setIsOpen] = useState(false);
  const [userName, setUserName] = useState('');

  // Fetch customer profile on mount if cookie exists
  useEffect(() => {
    const hasAuthCookie =
      typeof window !== 'undefined' && document.cookie.includes('cst_tkn=');
    if (!hasAuthCookie) return;

    getCustomerMe().then((customer) => {
      if (customer) {
        setAuthenticated({
          id: customer.id,
          email: '',
          firstName: customer.firstName,
          lastName: customer.lastName,
          avatarUrl: customer.avatarUrl,
        });
        setUserName(`${customer.firstName} ${customer.lastName}`.trim());
      }
    });
  }, [setAuthenticated]);

  const handleLogout = useCallback(async () => {
    try {
      await logoutCustomer();
      setUnauthenticated();
      // Clear cart on logout
      cart.clearCart();
      toast.success('Signed out successfully');
      setIsOpen(false);
    } catch {
      toast.error('Failed to sign out');
    }
  }, [setUnauthenticated, cart]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-user-menu]')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [isOpen]);

  if (!isAuthenticated) {
    return (
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          const { openLoginModal } = useAuthStore.getState();
          openLoginModal();
        }}
        className="text-sm font-medium hover:text-blue-600 transition-colors"
      >
        Sign In
      </a>
    );
  }

  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="relative" data-user-menu>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-full p-1.5 hover:bg-gray-100 transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
          {initials || 'U'}
        </div>
        <span className="hidden sm:inline text-sm font-medium text-gray-700 max-w-24 truncate">
          {userName.split(' ')[0]}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white border border-gray-200 shadow-lg py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {userName}
            </p>
            <p className="text-xs text-gray-500 truncate">
              {useAuthStore.getState().user?.email}
            </p>
          </div>

          {/* Menu Items */}
          <div className="py-1">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                toast('My Orders coming soon!');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <User className="h-4 w-4" />
              My Orders
            </button>
          </div>

          <div className="border-t border-gray-100 py-1">
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
