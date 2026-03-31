import Link from 'next/link';

/**
 * ── PRODUCT NOT FOUND PAGE ──
 * Displayed when product doesn't exist or is inactive
 */
export default function ProductNotFound() {
  return (
    <div className="container mx-auto px-4 py-20">
      <div className="max-w-md mx-auto text-center">
        {/* 404 Icon */}
        <div
          className="mb-8 flex justify-center"
          role="img"
          aria-label="Product not found"
        >
          <svg
            className="w-32 h-32 text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-black text-gray-900 mb-4">
          Product Not Found
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Sorry, the product you&apos;re looking for doesn&apos;t exist or has
          been removed.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl bg-black text-white font-bold hover:bg-gray-800 transition-colors"
          >
            Back to Home
          </Link>
          <Link
            href="/shop"
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-900 font-bold hover:bg-gray-50 transition-colors"
          >
            Browse Shop
          </Link>
        </div>

        {/* Helpful Links */}
        <div className="mt-12 pt-8 border-t border-gray-100">
          <p className="text-sm text-gray-500 mb-4">
            You might be interested in:
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <Link
              href="/shop?sort=newest"
              className="text-blue-600 hover:underline"
            >
              New Arrivals
            </Link>
            <Link
              href="/shop?featured=true"
              className="text-blue-600 hover:underline"
            >
              Featured Products
            </Link>
            <Link href="/categories" className="text-blue-600 hover:underline">
              All Categories
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
