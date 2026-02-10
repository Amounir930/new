/**
 * CartSummary Component
 *
 * Displays cart totals and checkout button.
 *
 * @module components/cart/CartSummary
 */

'use client';

import Link from 'next/link';
import { formatPrice } from '@/lib/formatters';

export interface CartSummaryProps {
  cart: {
    subtotal: number;
    discount: number;
    total: number;
    currency?: string;
  };
}

export function CartSummary({ cart }: CartSummaryProps) {
  const currency = cart.currency || 'USD';

  return (
    <div className="bg-gray-50 p-6 rounded-lg sticky top-4">
      <h2 className="text-xl font-bold mb-4">Order Summary</h2>

      <div className="space-y-3">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span className="font-medium">
            {formatPrice(cart.subtotal, currency)}
          </span>
        </div>

        {/* Discount */}
        {cart.discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span>-{formatPrice(cart.discount, currency)}</span>
          </div>
        )}

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-gray-600">Shipping</span>
          <span className="text-sm text-gray-500">Calculated at checkout</span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-300 my-3" />

        {/* Total */}
        <div className="flex justify-between text-lg font-bold">
          <span>Total</span>
          <span>{formatPrice(cart.total, currency)}</span>
        </div>
      </div>

      {/* Checkout Button */}
      <Link
        href="/checkout"
        className="mt-6 block w-full bg-primary text-white text-center py-3 px-6 rounded-md font-medium hover:bg-primary-600 transition-colors"
      >
        Proceed to Checkout
      </Link>

      {/* Continue Shopping */}
      <Link
        href="/products"
        className="mt-3 block w-full text-center text-primary py-2 hover:underline"
      >
        Continue Shopping
      </Link>

      {/* Coupon Code */}
      <div className="mt-6 pt-6 border-t border-gray-300">
        <label htmlFor="coupon" className="block text-sm font-medium mb-2">
          Coupon Code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            id="coupon"
            placeholder="Enter code"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-md font-medium"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
}
