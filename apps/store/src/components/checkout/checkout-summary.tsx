'use client';

import type { CheckoutResponse } from '@/lib/api';
import type { CartItemServer } from '@/lib/cart-store';
import { useMountedCart } from '@/lib/cart-store';

/**
 * ── CHECKOUT SUMMARY SIDEBAR ──
 * Shows cart items and totals. After order creation, shows order details.
 */
export function CheckoutSummary({
  orderData,
}: {
  orderData: CheckoutResponse | null;
}) {
  const cart = useMountedCart();

  // Use server items if available, otherwise fall back to optimistic items
  const items: CartItemServer[] = cart.serverItems.length > 0
    ? cart.serverItems
    : cart.items.map((item) => ({
      ...item,
      unitPrice: '0',
      totalPrice: '0',
      productName: 'Item',
      imageUrl: '',
      availableStock: 0,
      minOrderQty: 1,
    }));

  const subtotal = orderData?.subtotal ?? '0';
  const shipping = orderData?.shipping ?? '0';
  const tax = orderData?.tax ?? '0';
  const total = orderData?.total ?? '0';

  // Calculate estimated subtotal from cart (before order)
  const cartSubtotal = items.reduce((sum, item) => {
    const price = Number(item.unitPrice ?? 0);
    const qty = Number(item.quantity ?? 1);
    return sum + price * qty;
  }, 0);

  const displaySubtotal = orderData ? subtotal : cartSubtotal.toFixed(2);
  const displayShipping = orderData ? shipping : '0.00';
  const displayTax = orderData ? tax : (cartSubtotal * 0.15).toFixed(2); // 15% VAT estimate
  const displayTotal = orderData
    ? total
    : (
      Number(displaySubtotal) +
      Number(displayShipping) +
      Number(displayTax)
    ).toFixed(2);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 sticky top-24">
      <h2 className="text-lg font-bold text-gray-900 mb-4">
        {orderData ? 'Order Confirmed' : 'Order Summary'}
      </h2>

      {/* Items List */}
      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
        {items.map((item, index) => {
          const name = item.productName ?? 'Product';
          const imageUrl = item.imageUrl;

          return (
            <div key={index} className="flex items-center gap-3">
              <div className="relative h-12 w-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={name}
                    className="object-cover w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                    No img
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {name}
                </p>
                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="text-sm font-medium text-gray-900">
                {orderData
                  ? `${orderData.items[index]?.price ?? '0'} SAR`
                  : `${Number(item.unitPrice ?? 0).toFixed(2)} SAR`}
              </p>
            </div>
          );
        })}
      </div>

      {/* Totals */}
      <div className="border-t border-gray-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-medium">{displaySubtotal} SAR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Shipping</span>
          <span className="font-medium">{displayShipping} SAR</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Tax (VAT)</span>
          <span className="font-medium">{displayTax} SAR</span>
        </div>
        <div className="border-t border-gray-100 pt-2 flex justify-between">
          <span className="font-bold text-gray-900">Total</span>
          <span className="font-bold text-gray-900">{displayTotal} SAR</span>
        </div>
      </div>

      {/* Order Number (after placement) */}
      {orderData && (
        <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-medium text-green-800">
            Order #{orderData.orderNumber}
          </p>
          <p className="text-xs text-green-600 mt-1">
            Order ID: {orderData.orderId}
          </p>
        </div>
      )}
    </div>
  );
}
