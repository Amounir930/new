import { getProductBySlug } from '@/lib/api';
import Image from 'next/image';
import { notFound } from 'next/navigation';

export default async function ProductPage({
  params,
}: {
  params: Promise<{ subdomain: string; slug: string }>;
}) {
  const { subdomain, slug } = await params;
  // S2 FIX 24A: Pass tenantId (subdomain) to ensure isolation and fix build error
  const product = await getProductBySlug(subdomain, slug);

  if (!product) {
    return notFound();
  }

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Gallery */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-gray-100 shadow-sm">
            <Image
              src={product.images?.[0]?.url || '/placeholder.png'}
              alt={product.name}
              fill
              className="object-cover"
              priority
            />
          </div>
          {product.images?.length > 1 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {product.images.map((img: any) => (
                <div
                  key={img.id}
                  className="relative w-24 aspect-square flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-gray-100 transition-opacity hover:opacity-80 cursor-pointer"
                >
                  <Image
                    src={img.url}
                    alt={img.altText || ''}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex flex-col">
          <nav className="mb-6 flex items-center text-sm font-medium text-gray-500">
            <a href="/" className="hover:text-black transition-colors">
              Home
            </a>
            <span className="mx-2 text-gray-300">/</span>
            <span className="text-black">Product Details</span>
          </nav>

          <div className="space-y-2 mb-6">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              {product.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex text-amber-400">
                {'★'.repeat(Math.round(product.rating))}
              </div>
              <span className="text-sm font-bold text-gray-400">
                ({product.reviewCount} customer reviews)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-8">
            <span className="text-3xl font-black text-blue-600">
              ${product.price}
            </span>
            {product.compareAtPrice &&
              Number(product.compareAtPrice) > Number(product.price) && (
                <span className="text-xl text-gray-400 line-through font-bold">
                  ${product.compareAtPrice}
                </span>
              )}
          </div>

          <p className="text-lg text-gray-600 leading-relaxed mb-8">
            {product.description || 'No description provided for this item.'}
          </p>

          {/* Variants (Simplified for now) */}
          {product.variants?.length > 0 && (
            <div className="mb-8 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">
                Available Options
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.variants.map((v: any) => (
                  <button
                    key={v.id}
                    type="button"
                    className="px-5 py-2.5 rounded-xl border-2 border-gray-100 text-sm font-bold transition-all hover:border-black active:scale-95"
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 mt-auto sm:flex-row">
            <button
              type="button"
              className="flex-1 rounded-2xl bg-black px-8 py-5 text-base font-black text-white shadow-2xl transition-all hover:bg-gray-800 hover:scale-[1.02] active:scale-95"
            >
              Add to Bag
            </button>
            <button
              type="button"
              className="rounded-2xl border-2 border-gray-100 px-8 py-5 text-base font-bold text-gray-900 transition-all hover:bg-gray-50 active:scale-95"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>Add to Wishlist</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
            </button>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-6 mt-12 py-8 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Secure Payment</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">
                Secure Payment
              </span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-green-600">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <title>Free Shipping</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-900">
                Free Shipping
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
