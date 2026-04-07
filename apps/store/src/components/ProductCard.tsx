import Image from 'next/image';
import Link from 'next/link';
import { ProductCardActions } from './product-card-actions';

interface Product {
  id: string;
  slug: string;
  name: string | { en?: string; ar?: string };
  price: number | string;
  compareAtPrice?: number | string;
  imageUrl: string;
  rating: number;
  reviewCount?: number;
}

function getProductName(name: string | { en?: string; ar?: string }): string {
  if (typeof name === 'string') return name;
  return name?.en || name?.ar || 'Product';
}

function getProductPrice(price: number | string): number {
  return typeof price === 'string' ? Number.parseFloat(price) : price;
}

export function ProductCard({ product }: { product: Product }) {
  const productName = getProductName(product.name);
  const productPrice = getProductPrice(product.price);
  const compareAtPrice = product.compareAtPrice
    ? getProductPrice(product.compareAtPrice)
    : undefined;
  const hasSale = compareAtPrice && compareAtPrice > productPrice;

  return (
    <div className="group block h-full">
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200 transition-all duration-300 group-hover:shadow-lg group-hover:ring-black/5">
          <Image
            src={product.imageUrl || '/placeholder.png'}
            alt={productName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-110"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
          />
          {hasSale && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 text-xs font-bold rounded-full shadow-sm">
              Sale
            </div>
          )}
        </div>
        <div className="mt-4 space-y-1">
          <div className="flex items-center gap-1 text-amber-400">
            {'★'.repeat(Math.round(product.rating || 0))}
            <span className="text-xs text-gray-400 ml-1">
              ({product.reviewCount || product.rating || 0})
            </span>
          </div>
          <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
            {productName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-base font-black text-gray-900">
              ${productPrice.toFixed(2)}
            </span>
            {hasSale && (
              <span className="text-sm text-gray-400 line-through font-medium">
                ${compareAtPrice.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>

      {/* Action bar: quantity + add button */}
      <ProductCardActions productId={product.id} productSlug={product.slug} />
    </div>
  );
}
