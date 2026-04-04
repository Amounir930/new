import { ProductCard } from '@/components/ProductCard';
import { getProducts } from '@/lib/api';
import { SortSelect } from './sort-select';

// ═══════════════════════════════════════════════════════════════
// ISR CONFIGURATION — per-tenant safe caching via subdomain path
// ═══════════════════════════════════════════════════════════════
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

interface ProductsPageProps {
  params: Promise<{ subdomain: string }>;
  searchParams: Promise<{
    sort?: string;
    featured?: string;
    category?: string;
    limit?: string;
  }>;
}

const SORT_LABELS: Record<string, string> = {
  newest: 'Newest First',
  price_asc: 'Price: Low to High',
  price_desc: 'Price: High to Low',
};

function getProductName(
  name: string | { en?: string; ar?: string } | null
): string {
  if (typeof name === 'string') return name;
  if (name && typeof name === 'object') return name.en || name.ar || 'Product';
  return 'Product';
}

export default async function ProductsPage({
  params,
  searchParams,
}: ProductsPageProps) {
  const { subdomain } = await params;
  const resolvedSearchParams = await searchParams;

  const sort =
    resolvedSearchParams.sort === 'price_asc' ||
      resolvedSearchParams.sort === 'price_desc'
      ? resolvedSearchParams.sort
      : 'newest';

  const isFeatured = resolvedSearchParams.featured === 'true';
  const limit = resolvedSearchParams.limit
    ? Math.min(parseInt(resolvedSearchParams.limit, 10), 100)
    : 40;

  let products: unknown;
  try {
    products = await getProducts(subdomain, {
      sort,
      featured: isFeatured,
      limit,
    });
  } catch (err) {
    console.error('PLP: getProducts failed, falling back to empty array:', err);
    products = [];
  }

  const productList = Array.isArray(products) ? products : [];
  if (!Array.isArray(products) && products) {
    console.error('PLP: getProducts returned non-array:', products);
  }
  const activeSortLabel = SORT_LABELS[sort] || 'Newest First';

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Header */}
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
              {isFeatured ? 'Featured Products' : 'All Products'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {productList.length} product{productList.length !== 1 ? 's' : ''}{' '}
              — Sorted by {activeSortLabel}
            </p>
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs font-bold uppercase tracking-wider text-gray-500"
            >
              Sort
            </label>
            <SortSelect currentSort={sort} />
          </div>
        </div>

        {/* Product Grid */}
        {productList.length > 0 ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-8">
            {productList.map((p: Record<string, unknown>) => {
              const product = {
                id: String(p.id ?? ''),
                slug: String(p.slug ?? ''),
                name: p.name ?? 'Product',
                price: Number(p.price ?? p.basePrice ?? 0),
                compareAtPrice: p.compareAtPrice
                  ? Number(p.compareAtPrice)
                  : undefined,
                imageUrl: String(p.imageUrl ?? p.mainImage ?? ''),
                rating: Number(p.rating ?? 0),
                reviewCount: Number(p.reviewCount ?? 0),
              };
              return <ProductCard key={product.id} product={product} />;
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
              <svg
                className="h-10 w-10 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>No products</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              No products found
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              This store hasn&apos;t added any products yet.
            </p>
            <a
              href="/"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              ← Back to Home
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
