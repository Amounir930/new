/**
 * ProductCard Component
 *
 * Displays product in grid/list view with quick actions.
 *
 * @module components/product/ProductCard
 */

import Image from 'next/image';
import Link from 'next/link';
import { calculateDiscount, formatPrice } from '@/lib/formatters';

// Inline Product type (avoiding workspace dependency)
interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  currency: string;
  compareAtPrice?: number | null;
  inStock: boolean;
  images: Array<{ url: string; alt: string; isPrimary?: boolean }>;
  tags?: string[];
  brand?: string;
  reviewCount?: number;
  averageRating?: number;
}

export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
  onQuickView?: (product: Product) => void;
  showQuickView?: boolean;
}

export function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  showQuickView = true,
}: ProductCardProps) {
  const discount = calculateDiscount(
    product.price,
    product.compareAtPrice || null
  );
  const primaryImage =
    product.images.find((img) => img.isPrimary) || product.images[0];

  return (
    <div className="group relative bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
      {/* Product Image */}
      <Link
        href={`/products/${product.slug}`}
        className="block relative aspect-square overflow-hidden rounded-t-lg"
      >
        {primaryImage && (
          <Image
            src={primaryImage.url}
            alt={primaryImage.alt || product.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        )}

        {/* Badges */}
        {discount > 0 && (
          <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
            -{discount}%
          </div>
        )}
        {product.tags?.includes('new') && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white text-xs font-bold px-2 py-1 rounded">
            NEW
          </div>
        )}

        {/* Quick View Button */}
        {showQuickView && onQuickView && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              onQuickView(product);
            }}
            className="absolute inset-x-0 bottom-0 bg-black/80 text-white py-2 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Quick View
          </button>
        )}
      </Link>

      {/* Product Info */}
      <div className="p-4">
        {/* Brand */}
        {product.brand && (
          <p className="text-xs text-gray-500 uppercase mb-1">
            {product.brand}
          </p>
        )}

        {/* Name */}
        <Link href={`/products/${product.slug}`}>
          <h3 className="text-sm font-medium text-gray-900 hover:text-primary transition-colors line-clamp-2">
            {product.name}
          </h3>
        </Link>

        {/* Price */}
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg font-bold text-gray-900">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.compareAtPrice && (
            <span className="text-sm text-gray-500 line-through">
              {formatPrice(product.compareAtPrice, product.currency)}
            </span>
          )}
        </div>

        {/* Rating */}
        {product.reviewCount && product.reviewCount > 0 && (
          <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
            <span className="text-yellow-400">★</span>
            <span>{product.averageRating?.toFixed(1)}</span>
            <span>({product.reviewCount})</span>
          </div>
        )}

        {/* Add to Cart */}
        {onAddToCart && (
          <button
            type="button"
            onClick={() => onAddToCart(product)}
            disabled={!product.inStock}
            className="mt-3 w-full bg-primary text-white py-2 rounded-md hover:bg-primary-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed text-sm font-medium"
          >
            {product.inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>
        )}
      </div>
    </div>
  );
}
