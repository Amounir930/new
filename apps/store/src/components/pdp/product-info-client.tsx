'use client';

import { useMemo } from 'react';
import {
  AddToCartButton,
  StockBadge,
} from '@/components/pdp/add-to-cart-button';
import { VariantSelector } from '@/components/pdp/variant-selector';
import {
  type ProductVariant,
  useProductOptions,
} from '@/hooks/useProductOptions';

interface ProductInfoClientProps {
  product: {
    id: string;
    basePrice: string;
    salePrice?: string | null;
    variants: ProductVariant[];
    trackInventory: boolean;
    minOrderQty: number;
    isReturnable: boolean;
  };
}

export function ProductInfoClient({ product }: ProductInfoClientProps) {
  const {
    options,
    selectedOptions,
    selectedVariant,
    updateOption,
    isSelectionComplete,
  } = useProductOptions(product.variants);

  const displayPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.price;
    return product.salePrice || product.basePrice;
  }, [selectedVariant, product]);

  const hasSale = useMemo(() => {
    if (selectedVariant) {
      return (
        selectedVariant.compareAtPrice &&
        Number(selectedVariant.compareAtPrice) > Number(selectedVariant.price)
      );
    }
    return (
      product.salePrice && Number(product.salePrice) < Number(product.basePrice)
    );
  }, [selectedVariant, product]);

  const compareAtPrice = useMemo(() => {
    if (selectedVariant) return selectedVariant.compareAtPrice;
    return product.basePrice;
  }, [selectedVariant, product]);

  const availableStock = useMemo(() => {
    if (selectedVariant) {
      return (
        (selectedVariant.inventory?.available || 0) -
        (selectedVariant.inventory?.reserved || 0)
      );
    }
    // Aggregate stock for all variants if none selected?
    return product.variants.reduce(
      (acc, v) =>
        acc + (v.inventory?.available || 0) - (v.inventory?.reserved || 0),
      0
    );
  }, [selectedVariant, product.variants]);

  return (
    <div className="flex flex-col h-full">
      {/* Price & Stock Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col">
          <div className="flex items-baseline gap-4">
            <span className="text-4xl md:text-5xl font-black tracking-tighter text-black">
              ${displayPrice}
            </span>
            {hasSale && (
              <span className="text-xl md:text-2xl text-gray-300 line-through font-bold">
                ${compareAtPrice}
              </span>
            )}
          </div>
          {hasSale && (
            <span className="mt-1 text-xs font-black uppercase text-red-500 tracking-widest">
              Limited Time Offer
            </span>
          )}
        </div>

        <StockBadge
          availableStock={availableStock}
          trackInventory={product.trackInventory}
          className="bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-gray-100"
        />
      </div>

      {/* Variants (Intelligent Grid) */}
      <VariantSelector
        options={options}
        selectedOptions={selectedOptions}
        onOptionSelect={updateOption}
        className="mb-10"
      />

      {/* CTA Section */}
      <div className="mt-auto pt-10 border-t border-gray-100 space-y-6">
        <AddToCartButton
          productId={product.id}
          variantId={selectedVariant?.id}
          isSelectionComplete={isSelectionComplete}
          minOrderQty={product.minOrderQty}
          className="w-full"
        />

        {/* Trust Messaging */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Secure Assets
            </span>
          </div>
          {product.isReturnable && (
            <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Free Returns
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
