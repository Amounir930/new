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
 * Validate stock info and return error message if invalid
 */
function validateStockInfo(
  stockInfo: unknown,
  minOrderQty: number,
  quantity: number
): string | null {
  const info = stockInfo as {
    available?: boolean;
    quantityAvailable?: number;
  } | null;

  if (!info?.available) {
    const available = info?.quantityAvailable || 0;
    return available > 0
      ? `Only ${available} units available`
      : 'Sorry, this item is out of stock';
  }

  if (quantity < minOrderQty) {
    return `Minimum order quantity is ${minOrderQty}`;
  }

  return null;
}

/**
 * Custom hook for add-to-cart logic
 */
function useAddToCart(
  productId: string,
  variantId: string | null,
  quantity: number
) {
  const cart = useMountedCart();
  const [isChecking, setIsChecking] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  const handleStockCheck = useCallback(
    async (tenantId: string) => {
      const stockResult = await checkStock(tenantId, [
        { productId, variantId, quantity },
      ]);
      return stockResult.items?.[0];
    },
    [productId, variantId, quantity]
  );

  const handleAddToCart = useCallback(async () => {
    await cart.addItem(productId, variantId, quantity);
    if (!cart.isOpen) {
      cart.toggleCart();
    }
  }, [cart, productId, variantId, quantity]);

  const handleClick = useCallback(
    async (localMinOrderQty: number) => {
      if (isAdding || isChecking) return false;

      setIsChecking(true);

      try {
        const tenantId = await extractTenantFromHost();
        const stockInfo = await handleStockCheck(tenantId);
        const error = validateStockInfo(stockInfo, localMinOrderQty, quantity);

        if (error) {
          toast.error(error);
          setIsChecking(false);
          return false;
        }

        setIsChecking(false);
        setIsAdding(true);

        await handleAddToCart();
        toast.success('Added to cart!', { duration: 2000, icon: '🛒' });
        return true;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Failed to add to cart';
        toast.error(message);
        return false;
      } finally {
        setIsChecking(false);
        setIsAdding(false);
      }
    },
    [isAdding, isChecking, quantity, handleStockCheck, handleAddToCart]
  );

  return { isChecking, isAdding, handleClick };
}

/**
 * ── ADD TO CART BUTTON (OPTIMISTIC UI) ──
 */
export function AddToCartButton({
  productId,
  variantId = null,
  quantity = 1,
  minOrderQty = 1,
  disabled = false,
  className = '',
}: AddToCartButtonProps) {
  const { isChecking, isAdding, handleClick } = useAddToCart(
    productId,
    variantId,
    quantity
  );

  const handleButtonClick = () => {
    handleClick(minOrderQty);
  };

  const isDisabled = disabled || isChecking || isAdding;

  let buttonContent = 'Add to Cart';
  if (isChecking) buttonContent = 'Checking...';
  else if (isAdding) buttonContent = 'Adding...';

  return (
    <button
      type="button"
      onClick={handleButtonClick}
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
