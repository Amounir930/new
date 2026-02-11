/**
 * Search Page
 *
 * Product search with filters.
 *
 * @route /search
 */

'use client';

import { ProductCard } from '@/components/product/ProductCard';
import { useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';

function SearchContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);

  // TODO: Implement actual search
  const results: any[] = [];

  return (
    <>
      {/* Search Bar */}
      <div className="mb-8">
        <div className="flex gap-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            type="button"
            className="bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div>

      {/* Results */}
      {query && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Search results for "{query}"</h1>
          <p className="text-gray-600 mt-1">
            {results.length} {results.length === 1 ? 'result' : 'results'} found
          </p>
        </div>
      )}

      {/* Products Grid */}
      {results.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {results.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : query ? (
        <div className="text-center py-16">
          <p className="text-gray-600 mb-4">
            No products found matching "{query}"
          </p>
          <p className="text-sm text-gray-500">
            Try different keywords or browse our categories
          </p>
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-600">Enter a search term to find products</p>
        </div>
      )}
    </>
  );
}

export default function SearchPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Suspense fallback={<div>Loading search...</div>}>
        <SearchContent />
      </Suspense>
    </div>
  );
}
