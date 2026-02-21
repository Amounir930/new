import Image from 'next/image';
import Link from 'next/link';

interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  imageUrl: string;
  rating: number;
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.slug}`} className="group block h-full">
      <div className="relative aspect-square overflow-hidden rounded-xl bg-gray-50 ring-1 ring-gray-200 transition-all duration-300 group-hover:shadow-lg group-hover:ring-black/5">
        <Image
          src={product.imageUrl || '/placeholder.png'}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
        />
        {product.compareAtPrice &&
          Number(product.compareAtPrice) > Number(product.price) && (
            <div className="absolute top-3 left-3 bg-red-600 text-white px-2.5 py-1 text-xs font-bold rounded-full shadow-sm">
              Sale
            </div>
          )}
      </div>
      <div className="mt-4 space-y-1">
        <div className="flex items-center gap-1 text-amber-400">
          {'★'.repeat(Math.round(product.rating))}
          <span className="text-xs text-gray-400 ml-1">({product.rating})</span>
        </div>
        <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
          {product.name}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-base font-black text-gray-900">
            ${product.price}
          </span>
          {product.compareAtPrice &&
            Number(product.compareAtPrice) > Number(product.price) && (
              <span className="text-sm text-gray-400 line-through font-medium">
                ${product.compareAtPrice}
              </span>
            )}
        </div>
      </div>
    </Link>
  );
}
