import { ProductCard } from '@/components/ProductCard';
import { getHomeData, getTenantConfig } from '@/lib/api';
import { headers } from 'next/headers';
import Image from 'next/image';

export default async function Home() {
  // S2: Tenant Context from headers (Middleware injected)
  await headers();

  // S12: Parallel data fetching for performance
  const [homeData, config] = await Promise.all([
    getHomeData(),
    getTenantConfig(),
  ]);

  const _banners = homeData?.banners || [];
  const bestSellers = homeData?.bestSellers || [];
  const storeName = config?.storeName || 'APEX STORE';
  const heroBanner = config?.heroBanner;

  return (
    <div className="space-y-16 pb-24">
      {/* Hero Section (S12: High priority image) */}
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
              <a
                href={heroBanner?.ctaLink || '/shop'}
                className="rounded-full bg-white px-8 py-4 text-sm font-bold text-black shadow-xl ring-1 ring-black/5 transition-all hover:bg-gray-100 hover:scale-105 active:scale-95"
              >
                {heroBanner?.ctaText || 'Shop Collection'}
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 space-y-20">
        {/* Best Sellers Section */}
        <section>
          <div className="flex flex-col gap-2 mb-10 md:flex-row md:items-end md:justify-between">
            <div>
              <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">
                Customer Favorites
              </span>
              <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
                Best Sellers
              </h2>
            </div>
            <a
              href="/shop?sort=bestsellers"
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
            </a>
          </div>

          <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
            {bestSellers.length > 0 ? (
              bestSellers.map((product: any) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                <p className="text-gray-400 font-medium">
                  No products found in this collection.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Promotional Grid (Static placeholder for now) */}
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-blue-600 group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <h3 className="text-2xl font-bold">Summer Gadgets</h3>
              <p className="text-gray-200">Up to 40% off on all accessories</p>
              <button
                type="button"
                className="mt-2 font-bold underline underline-offset-4 decoration-2"
              >
                Shop Now
              </button>
            </div>
          </div>
          <div className="relative aspect-[16/9] overflow-hidden rounded-3xl bg-amber-500 group">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000')] bg-cover bg-center transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/30 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-10 left-10 text-white space-y-2">
              <h3 className="text-2xl font-bold">New Arrivals</h3>
              <p className="text-gray-200">Check out the latest tech stack</p>
              <button
                type="button"
                className="mt-2 font-bold underline underline-offset-4 decoration-2"
              >
                Explore
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
