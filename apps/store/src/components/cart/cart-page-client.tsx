'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMountedAuth } from '@/lib/auth-store';
import { useMountedCart } from '@/lib/cart-store';

/**
 * ── CART PAGE CLIENT ──
 * Pure client component that reads from Zustand store.
 * Shows serverItems (validated) with fallback to optimistic items.
 * Provides quantity editing, removal, and checkout placeholder.
 */
export function CartPageClient() {
  const cart = useMountedCart();
  const { isAuthenticated, openLoginModal } = useMountedAuth();
  const [isHydrated, setIsHydrated] = useState(false);

  // Wait for hydration before rendering cart contents
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Use serverItems if available (price-validated), fall back to optimistic items
  const displayItems =
    cart.serverItems.length > 0 ? cart.serverItems : null;

  const optimisticItems = cart.items;

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="animate-pulse space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-6 rounded-2xl bg-white p-6 shadow-sm">
                <div className="h-28 w-28 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 w-3/4 rounded bg-gray-200" />
                  <div className="h-4 w-1/4 rounded bg-gray-200" />
                  <div className="h-8 w-32 rounded bg-gray-200" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const hasItems = displayItems
    ? displayItems.length > 0
    : optimisticItems.length > 0;

  if (!hasItems) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Empty cart</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Your bag is empty
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Looks like you haven&apos;t added anything to your cart yet.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-black px-8 py-3 text-sm font-bold text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <h1 className="mb-3 text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Shopping Bag
          {displayItems && (
            <span className="ml-3 text-lg font-medium text-gray-400">
              ({displayItems.length} item{displayItems.length !== 1 ? 's' : ''})
            </span>
          )}
        </h1>

        {!isAuthenticated && (
          <div className="mb-8 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50 px-5 py-3.5 dark:border-blue-800 dark:bg-blue-950/20">
            <p className="text-sm text-blue-700 dark:text-blue-400">
              <strong>Sign in</strong> to save your cart across devices.
            </p>
            <button
              type="button"
              onClick={() => openLoginModal()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-blue-700"
            >
              Sign In
            </button>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Cart Items */}
          <div className="space-y-4 lg:col-span-2">
            {displayItems
              ? displayItems.map((item) => (
                <CartItemCard
                  key={`${item.productId}-${item.variantId ?? 'novariant'}`}
                  item={item}
                  onRemove={() => cart.removeItem(item.productId, item.variantId)}
                  onUpdateQty={(qty) =>
                    cart.updateQuantity(item.productId, item.variantId, qty)
                  }
                />
              ))
              : optimisticItems.map((item) => (
                <CartOptimisticItem
                  key={`${item.productId}-${item.variantId ?? 'novariant'}`}
                  item={item}
                  onRemove={() =>
                    cart.removeItem(item.productId, item.variantId)
                  }
                  onUpdateQty={(qty) =>
                    cart.updateQuantity(item.productId, item.variantId, qty)
                  }
                />
              ))}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-gray-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">
                    ${displayItems ? cart.subtotal : '—'}
                  </span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span className="font-medium text-emerald-600">
                    Calculated at checkout
                  </span>
                </div>

                <div className="border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-base font-bold text-gray-900">
                    <span>Estimated Total</span>
                    <span>${displayItems ? cart.subtotal : '—'}</span>
                  </div>
                </div>
              </div>

              <Link
                href="/checkout"
                className="mt-6 block w-full rounded-xl bg-black px-6 py-4 text-center text-sm font-black uppercase tracking-widest text-white shadow-lg transition-all hover:bg-gray-800 hover:shadow-xl active:scale-[0.98]"
              >
                Proceed to Checkout
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                Secure checkout powered by Apex v2
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CART ITEM CARD (Server-validated)
// ═══════════════════════════════════════════════════════════════
interface CartItemCardProps {
  item: {
    productId: string;
    variantId: string | null;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    productName: string;
    imageUrl: string | null;
    availableStock: number;
    minOrderQty: number;
  };
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}

function CartItemCard({ item, onRemove, onUpdateQty }: CartItemCardProps) {
  return (
    <div className="flex gap-6 rounded-2xl bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-6">
      {/* Product Image */}
      <div className="relative h-28 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-32 sm:w-32">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.productName}
            fill
            className="object-cover"
            sizes="128px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <title>No image</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col justify-between">
        <div>
          <h3 className="text-base font-bold text-gray-900 line-clamp-2">
            {item.productName}
          </h3>
          <p className="mt-1 text-sm font-medium text-gray-500">
            ${item.unitPrice} each
          </p>
        </div>

        <div className="mt-4 flex items-center justify-between">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onUpdateQty(Math.max(item.minOrderQty, item.quantity - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              −
            </button>
            <span className="w-8 text-center text-sm font-bold text-gray-900">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() => {
                if (item.availableStock > 0 && item.quantity >= item.availableStock) return;
                onUpdateQty(item.quantity + 1);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              +
            </button>
          </div>

          {/* Price & Remove */}
          <div className="flex items-center gap-4">
            <span className="text-base font-black text-gray-900">
              ${item.totalPrice}
            </span>
            <button
              type="button"
              onClick={onRemove}
              className="text-sm font-medium text-gray-400 transition hover:text-red-500"
              aria-label={`Remove ${item.productName} from cart`}
            >
              Remove
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// CART ITEM CARD (Optimistic — before server sync)
// ═══════════════════════════════════════════════════════════════
interface CartOptimisticItemProps {
  item: {
    productId: string;
    variantId: string | null;
    quantity: number;
  };
  onRemove: () => void;
  onUpdateQty: (qty: number) => void;
}

function CartOptimisticItem({
  item,
  onRemove,
  onUpdateQty,
}: CartOptimisticItemProps) {
  return (
    <div className="flex items-center gap-6 rounded-2xl bg-white p-6 shadow-sm opacity-60">
      <div className="h-28 w-28 flex-shrink-0 rounded-xl bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-5 w-3/4 rounded bg-gray-200 animate-pulse" />
        <div className="h-4 w-1/4 rounded bg-gray-200 animate-pulse" />
        <p className="text-xs text-gray-400">Syncing with store…</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onUpdateQty(Math.max(1, item.quantity - 1))}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
        >
          −
        </button>
        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
        <button
          type="button"
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-sm font-bold transition hover:bg-gray-50"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={onRemove}
        className="text-sm font-medium text-gray-400 transition hover:text-red-500"
      >
        Remove
      </button>
    </div>
  );
}
