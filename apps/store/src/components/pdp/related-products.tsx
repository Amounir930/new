'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getRelatedProducts } from '@/lib/api';

interface RelatedProduct {
  id: string;
  slug: string;
  name: Record<string, string>;
  price: string;
  imageUrl: string;
  similarity?: number;
}

interface RelatedProductsProps {
  tenantId: string;
  productId: string;
  initialRelated?: RelatedProduct[];
}

// Static skeleton items
const RELATED_SKELETONS = [
  'related-sk-1',
  'related-sk-2',
  'related-sk-3',
  'related-sk-4',
] as const;

/**
 * ── RELATED PRODUCTS CAROUSEL ──
 */
export function RelatedProducts({
  tenantId,
  productId,
  initialRelated = [],
}: RelatedProductsProps) {
  const [products, setProducts] = useState<RelatedProduct[]>(initialRelated);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialRelated.length === 0) {
      setIsLoading(true);
      getRelatedProducts(tenantId, productId, 8)
        .then((data) => {
          if (data) setProducts(data);
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    }
  }, [tenantId, productId, initialRelated.length]);

  if (products.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="mt-20">
      <h2 className="text-2xl font-bold mb-8">Related Products</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RELATED_SKELETONS.map((id) => (
            <div key={id} className="animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-2xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {products.map((product) => {
            const productName =
              typeof product.name === 'object'
                ? product.name.en || product.name.ar || 'Product'
                : product.name;

            return (
              <Link
                key={product.id}
                href={`/products/${product.slug}`}
                className="group"
              >
                <div className="relative aspect-square overflow-hidden rounded-2xl bg-gray-50 ring-1 ring-gray-100 transition-all group-hover:shadow-lg">
                  <Image
                    src={product.imageUrl || '/placeholder.png'}
                    alt={productName}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                </div>
                <h3 className="mt-4 text-sm font-medium text-gray-900 line-clamp-2">
                  {productName}
                </h3>
                <p className="mt-1 text-base font-bold text-blue-600">
                  ${product.price}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}
