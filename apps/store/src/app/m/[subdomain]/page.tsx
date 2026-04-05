// S12 HOTFIX: Per-tenant ISR via subdomain URL rewrite
// Middleware rewrites store1.60sec.shop/ → /m/store1/ internally
// Next.js caches each [subdomain] as a separate page — no poisoning
export const revalidate = 60;

import Image from 'next/image';
import Link from 'next/link';
import { NewsletterSection } from '@/components/NewsletterSection';
import { ProductCard } from '@/components/ProductCard';
import { getStoreBootstrap } from '@/lib/api';

interface TenantPageProps {
  params: Promise<{ subdomain: string }>;
}

export default async function TenantHome({ params }: TenantPageProps) {
  const { subdomain } = await params;

  // S12 FIX 12B: Use single aggregated bootstrap call (BFF Pattern)
  // This prevents connection pool exhaustion by consolidating 2 requests into 1.
  const storeData = await getStoreBootstrap(subdomain);

  // S5: Strict error handling for bootstrap failure (The "White Screen" prevention)
  if (!storeData || !storeData.config) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 p-4">
        <div className="text-center space-y-4">
          <p className="text-gray-500 font-medium">Store temporarily offline</p>
          <p className="text-gray-400 text-sm italic">
            Verification Status: BFF Aggregation Active
          </p>
        </div>
      </div>
    );
  }

  const { homeData, config } = storeData;

  const bestSellers = homeData?.bestSellers || [];
  const storeName = config?.storeName || 'APEX STORE';
  const heroBanner = config?.heroBanner;

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section */}
      <section className="relative h-[500px] w-full overflow-hidden bg-gray-900 lg:h-[600px]">
        {heroBanner?.imageUrl ? (
          <Image
            src={heroBanner.imageUrl}
            alt={heroBanner.title || storeName}
            fill
            className="object-cover opacity-80 transition-transform duration-1000 hover:scale-105"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-black opacity-50" />
        )}

        <div className="absolute inset-0 flex flex-col items-center justify-center px-4 text-center">
          <div className="max-w-3xl space-y-6">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl">
              {heroBanner?.title || storeName}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-200 sm:text-xl">
              {heroBanner?.subtitle ||
                'Experience the future of shopping with our curated collection of premium products.'}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                href="/products"
                className="rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-xl ring-1 ring-black/5 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
              >
                {heroBanner?.ctaText || 'Shop Collection'}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-20">
        {/* Best Sellers */}
        <section>
          <div className="flex flex-col gap-2 mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">
                Customer Favorites
              </span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                {homeData?.sectionTitle || 'Best Sellers'}
              </h2>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-2 font-bold text-black transition-colors hover:text-blue-600"
            >
              See everything
              <svg
                className="w-4 h-4 transition-transform group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <title>See more</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {bestSellers.length > 0 ? (
              bestSellers.map((p: Record<string, unknown>) => {
                // JSONB resolver: name can be {ar, en} object or string
                const rawName = p.name ?? p.title ?? '';
                const resolvedName =
                  rawName && typeof rawName === 'object'
                    ? (rawName as Record<string, string>).en ||
                    (rawName as Record<string, string>).ar ||
                    'Product'
                    : String(rawName);

                const product = {
                  id: String(p.id ?? ''),
                  slug: String(p.slug ?? ''),
                  name: resolvedName,
                  price: Number(p.price ?? p.basePrice ?? 0),
                  compareAtPrice: p.compareAtPrice
                    ? Number(p.compareAtPrice)
                    : undefined,
                  imageUrl: String(p.imageUrl ?? p.mainImage ?? ''),
                  rating: Number(p.rating ?? p.avgRating ?? 0),
                };
                return <ProductCard key={product.id} product={product} />;
              })
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">
                  No products found in this collection.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter */}
        <NewsletterSection />
      </div>
    </div>
  );
}
