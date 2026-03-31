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
  disabled?: boolean;
  className?: string;
}

/**
 * ── ADD TO CART BUTTON (OPTIMISTIC UI) ──
 *
 * Features:
 * 1. Pre-click stock verification (on-demand, not polling)
 * 2. Optimistic UI update (instant feedback)
 * 3. Debounced background sync
 * 4. Error recovery (revert on failure)
 * 5. Loading states
 */
export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  minOrderQty = 1,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const cart = useMountedCart();
  const [isChecking, setIsChecking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleClick = useCallback(async () => {
    // Prevent double-clicks
    if (isAdding || isChecking) return;

    setIsChecking(true);

    try {
      // ── STEP 1: PRE-CLICK STOCK VERIFICATION ──
      const tenantId = await extractTenantFromHost();

      const stockResult = await checkStock(tenantId, [
        { productId, variantId, quantity },
      ]);

      const stockInfo = stockResult.items?.[0];

      if (!stockInfo?.available) {
        const available = stockInfo?.quantityAvailable || 0;
        toast.error(
          available > 0
            ? `Only ${available} units available`
            : 'Sorry, this item is out of stock'
        );
        setIsChecking(false);
        return;
      }

      // Validate against minOrderQty
      if (quantity < minOrderQty) {
        toast.error(`Minimum order quantity is ${minOrderQty}`);
        setIsChecking(false);
        return;
      }

      setIsChecking(false);
      setIsAdding(true);

      // ── STEP 2: OPTIMISTIC ADD TO CART ──
      // The cart store handles optimistic update immediately
      await cart.addItem(productId, variantId, quantity);

      // ── STEP 3: SUCCESS FEEDBACK ──
      toast.success('Added to cart!', {
        duration: 2000,
        icon: '🛒',
      });

      // Open cart drawer
      if (!cart.isOpen) {
        cart.toggleCart();
      }
    } catch (error) {
      // ── STEP 4: ERROR RECOVERY ──
      const message =
        error instanceof Error ? error.message : 'Failed to add to cart';
      toast.error(message);

      // The cart store automatically reverts on sync failure
    } finally {
      setIsChecking(false);
      setIsAdding(false);
    }
  }, [productId, variantId, quantity, minOrderQty, cart, isAdding, isChecking]);

  // ── BUTTON STATES ──
  const isDisabled = disabled || isChecking || isAdding;

  let buttonContent = 'Add to Cart';
  if (isChecking) {
    buttonContent = 'Checking...';
  } else if (isAdding) {
    buttonContent = 'Adding...';
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        flex-1 rounded-2xl px-8 py-5 text-base font-black shadow-2xl 
        transition-all duration-200
        ${
          isDisabled
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-black text-white hover:bg-gray-800 hover:scale-[1.02] active:scale-95'
        }
        ${className}
      `}
    >
      <span className="flex items-center justify-center gap-2">
        {isAdding && (
          <svg
            className="animate-spin h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
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
        )}
        {buttonContent}
      </span>
    </button>
  );
}

/**
 * ── STOCK BADGE COMPONENT ──
 * Displays stock status (In Stock / Low Stock / Out of Stock)
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
  if (!trackInventory || availableStock === undefined) {
    return null;
  }

  let badgeColor = 'bg-green-100 text-green-700';
  let badgeText = 'In Stock';

  if (availableStock === 0) {
    badgeColor = 'bg-red-100 text-red-700';
    badgeText = 'Out of Stock';
  } else if (availableStock <= 5) {
    badgeColor = 'bg-amber-100 text-amber-700';
    badgeText = `Only ${availableStock} left`;
  } else if (availableStock <= 20) {
    badgeColor = 'bg-yellow-100 text-yellow-700';
    badgeText = 'Low Stock';
  }

  return (
    <span
      className={`
        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${badgeColor}
        ${className}
      `}
    >
      {badgeText}
    </span>
  );
}
