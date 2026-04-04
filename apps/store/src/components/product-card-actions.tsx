'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { checkStock, extractTenantFromHost } from '@/lib/api';
import { useMountedCart } from '@/lib/cart-store';
import { useMountedAuth } from '@/lib/auth-store';

interface ProductCardActionsProps {
  productId: string;
  productSlug: string;
  hasVariants?: boolean;
  minOrderQty?: number;
}

/**
 * Bottom action bar for ProductCard — handles add-to-cart or PDP navigation.
 */
export function ProductCardActions({
  productId,
  productSlug,
  hasVariants = false,
  minOrderQty = 1,
}: ProductCardActionsProps) {
  const router = useRouter();
  const cart = useMountedCart();
  const { isAuthenticated, openLoginModal } = useMountedAuth();
  const [quantity, setQuantity] = useState(minOrderQty);
  const [isAdding, setIsAdding] = useState(false);

  const handleAdd = async () => {
    if (hasVariants) {
      router.push(`/products/${productSlug}`);
      return;
    }

    const hasAuthCookie =
      typeof window !== 'undefined' && document.cookie.includes('cst_tkn=');
    if (!hasAuthCookie && !isAuthenticated) {
      openLoginModal();
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

      // Stock pre-flight
      const stockResult = await checkStock(tenantId, [
        { productId, variantId: null, quantity },
      ]);
      const status = stockResult.items?.[0];

      if (!status?.available) {
        toast.error('Product is currently out of stock.');
        setIsAdding(false);
        return;
      }

      await cart.addItem(productId, null, quantity);
      toast.success('Added to your bag!');

      if (!cart.isOpen) {
        setTimeout(() => cart.toggleCart(), 300);
      }
    } catch (error) {
      console.warn('[ProductCardActions] Error adding item:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsAdding(false);
    }
  };

  const handleDisabledClick = () => {
    router.push(`/products/${productSlug}`);
    toast('Select options on the product page');
  };

  return (
    <div className="mt-3 flex items-center gap-2">
      {/* Quantity selector */}
      <div className="flex items-center bg-gray-100 rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setQuantity((q) => Math.max(minOrderQty, q - 1))}
          disabled={quantity <= minOrderQty}
          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-600 disabled:opacity-30 hover:bg-gray-200 transition-colors"
        >
          −
        </button>
        <span className="w-7 text-center text-xs font-black text-gray-900 tabular-nums">
          {quantity}
        </span>
        <button
          type="button"
          onClick={() => setQuantity((q) => q + 1)}
          className="w-7 h-7 flex items-center justify-center text-sm font-bold text-gray-600 hover:bg-gray-200 transition-colors"
        >
          +
        </button>
      </div>

      {/* Add button */}
      <button
        type="button"
        onClick={hasVariants ? handleDisabledClick : handleAdd}
        disabled={isAdding}
        className={`
          flex-1 h-8 rounded-lg text-xs font-black uppercase tracking-wider
          transition-all duration-200 active:scale-95
          ${hasVariants
            ? 'bg-gray-900 text-white hover:bg-gray-800'
            : isAdding
              ? 'bg-gray-300 text-gray-500 cursor-wait'
              : 'bg-black text-white hover:bg-gray-800 hover:shadow-md'
          }
        `}
      >
        {isAdding ? (
          <span className="inline-flex items-center justify-center">
            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          </span>
        ) : hasVariants ? (
          'View Options'
        ) : (
          'Add'
        )}
      </button>
    </div>
  );
}
