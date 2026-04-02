'use client';

import { useCallback, useState } from 'react';
import toast from 'react-hot-toast';
import { checkStock, extractTenantFromHost } from '@/lib/api';
import { useMountedCart } from '@/lib/cart-store';

interface AddToCartButtonProps {
  productId: string;
  variantId?: string | null;
  quantity?: number;
  minOrderQty?: number;
  isSelectionComplete?: boolean;
  onDisabledClick?: () => void;
  className?: string;
}

/**
 * 🛒 THE OPTIMISTIC "ADD TO BAG" ENGINE
 *
 * Features:
 * 1. Validation Guard: Block if variants not selected.
 * 2. Pre-flight Check: Verify stock before opening cart.
 * 3. Optimistic UI: Micro-animations and loaders.
 */
export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  isSelectionComplete = true,
  onDisabledClick,
  className = '',
}: AddToCartButtonProps) {
  const cart = useMountedCart();
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = useCallback(async () => {
    // ⚔️ Validation Guard (Protocol Delta Requirements)
    if (!isSelectionComplete) {
      if (onDisabledClick) onDisabledClick();
      else toast.error('Please select all product options!');
      return;
    }

    if (isAdding) return;
    setIsAdding(true);

    try {
      const tenantId = await extractTenantFromHost();
      if (!tenantId) {
        toast.error('Could not identify store context.');
        setIsAdding(false);
        return;
      }

      // Stock Pre-flight
      const stockResult = await checkStock(tenantId, [
        { productId, variantId, quantity },
      ]);
      const status = stockResult.items?.[0];

      if (!status?.available) {
        toast.error('Product is currently out of stock.');
        setIsAdding(false);
        return;
      }

      // Optimistic Cart Sync
      await cart.addItem(productId, variantId, quantity);

      toast.success('Successfully added to your bag!');

      // Dynamic Cart Feedback
      if (!cart.isOpen) {
        setTimeout(() => cart.toggleCart(), 300);
      }
    } catch (error) {
      console.warn(`[AddToCartButton] Error adding item:`, error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAdding(false);
    }
  }, [
    productId,
    variantId,
    quantity,
    isSelectionComplete,
    isAdding,
    cart,
    onDisabledClick,
  ]);

  return (
    <button
      type="button"
      onClick={handleAdd}
      disabled={isAdding}
      className={`
        relative overflow-hidden flex items-center justify-center
        h-14 md:h-16 rounded-2xl md:rounded-3xl
        text-base font-black tracking-widest uppercase
        transition-all duration-300 shadow-xl
        active:scale-95
        ${
          !isSelectionComplete
            ? 'bg-gray-100 text-gray-400 cursor-pointer border border-gray-200'
            : 'bg-black text-white hover:bg-gray-800 hover:shadow-black/20 hover:-translate-y-1'
        }
        ${isAdding ? 'pointer-events-none' : ''}
        ${className}
      `}
    >
      {/* Premium Loader Overlay */}
      {isAdding && (
        <span className="absolute inset-0 flex items-center justify-center bg-black/10 backdrop-blur-[2px]">
          <svg
            aria-hidden="true"
            className="animate-spin h-6 w-6 text-white"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </span>
      )}

      <span
        className={`flex items-center gap-3 ${isAdding ? 'opacity-0' : 'opacity-100'}`}
      >
        {!isSelectionComplete ? 'Complete Selection' : 'Add to Bag'}
        <svg
          aria-hidden="true"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2.5"
        >
          <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
      </span>
    </button>
  );
}

/**
 * ── STOCK BADGE ──
 */
interface StockBadgeProps {
  availableStock?: number;
  trackInventory?: boolean;
  className?: string;
}

export function StockBadge({
  availableStock,
  trackInventory = true,
  className = '',
}: StockBadgeProps) {
  if (!trackInventory || availableStock === undefined) return null;

  const isLow = availableStock > 0 && availableStock < 10;
  const isOut = availableStock === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className={`flex h-2 w-2 rounded-full ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-400' : 'bg-emerald-500'}`}
      />
      <span
        className={`text-xs font-black uppercase tracking-tighter ${isOut ? 'text-red-500' : isLow ? 'text-amber-600' : 'text-emerald-600'}`}
      >
        {isOut
          ? 'Sold Out'
          : isLow
            ? `Only ${availableStock} Left`
            : 'Available to ship'}
      </span>
    </div>
  );
}
