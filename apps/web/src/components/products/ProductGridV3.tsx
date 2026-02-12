'use client';

import React from 'react';
import { ProductCard } from '@/components/products/ProductCard';
import { trendingProducts } from '@/lib/data';
import { cn } from '@/lib/utils';

interface ProductGridV3Props {
  title?: string;
  algorithm?: 'latest' | 'top_rated' | 'on_sale';
  limit?: number;
  columns?: {
    mobile: number;
    desktop: number;
  };
  isRTL?: boolean;
}

export default function ProductGridV3({
  title,
  algorithm = 'latest',
  limit = 8,
  columns = { mobile: 2, desktop: 4 },
  isRTL,
}: ProductGridV3Props) {
  // Mock data filtering based on algorithm
  const products = trendingProducts.slice(0, limit);

  return (
    <div className={cn('space-y-8', isRTL ? 'text-right' : 'text-left')}>
      {title && <h2 className="text-3xl font-bold tracking-tight">{title}</h2>}
      <div
        className={cn(
          'grid gap-6 md:gap-8',
          `grid-cols-${columns.mobile}`,
          `md:grid-cols-${columns.desktop}`
        )}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
