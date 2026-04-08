import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductInfoClient } from '@/components/pdp/product-info-client';
import { RelatedProducts } from '@/components/pdp/related-products';
import type {
  Review,
  ReviewsPagination,
} from '@/components/pdp/reviews-section';
import { ReviewsSection } from '@/components/pdp/reviews-section';
import { SafeHtmlContent } from '@/components/pdp/safe-html-content';
import {
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from '@/lib/api';

interface LocalizedField {
  en?: string;
  ar?: string;
}

// ═══════════════════════════════════════════════════════════════
// ISR CONFIGURATION — per-tenant safe caching via subdomain path
// ═══════════════════════════════════════════════════════════════
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

interface TenantProductPageProps {
  params: Promise<{ subdomain: string; slug: string }>;
}

// ═══════════════════════════════════════════════════════════════
// HELPERS: Localized field resolution
// ═══════════════════════════════════════════════════════════════
function resolveLocalized(field: unknown, fallback = ''): string {
  if (typeof field !== 'object' || !field)
    return field ? String(field) : fallback;
  const obj = field as LocalizedField;
  return obj.en || obj.ar || fallback;
}

function resolveLocalizedAr(field: unknown, fallback = ''): string {
  if (typeof field !== 'object' || !field)
    return field ? String(field) : fallback;
  const obj = field as LocalizedField;
  return obj.ar || obj.en || fallback;
}

// Module-level constant — no need to recreate on every render
const EMPTY_REVIEWS: {
  reviews: import('@/components/pdp/reviews-section').Review[];
  pagination: import('@/components/pdp/reviews-section').ReviewsPagination;
} = {
  reviews: [],
  pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
};

function getProductInfoProps(product: any) {
  return {
    id: product.id,
    basePrice: product.basePrice,
    salePrice: product.salePrice,
    variants: (product.variants ??
      []) as import('@/hooks/useProductOptions').ProductVariant[],
    trackInventory: product.trackInventory ?? true,
    minOrderQty: product.minOrderQty ?? 1,
    isReturnable: product.isReturnable ?? true,
  };
}

// ═══════════════════════════════════════════════════════════════
// SEO METADATA
// ═══════════════════════════════════════════════════════════════
export async function generateMetadata({
  params,
}: TenantProductPageProps): Promise<Metadata> {
  const { subdomain, slug } = await params;

  const product = await getProductBySlug(subdomain, slug);
  if (!product) return { title: 'Product Not Found' };

  const name = resolveLocalized(product.name);
  const desc = resolveLocalized(product.shortDescription);

  return {
    title: `${name} | ${subdomain}`,
    description: desc.slice(0, 160),
    openGraph: {
      title: name,
      description: desc.slice(0, 200),
      images: product.mainImage ? [product.mainImage] : [],
      type: 'website',
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// MAIN TENANT PDP (SERVER COMPONENT)
// ═══════════════════════════════════════════════════════════════
export default async function TenantProductPage({
  params,
}: TenantProductPageProps) {
  const { subdomain, slug } = await params;

  // fetchStorefront now throws on non-OK, so .catch() actually fires
  const [product, relatedProducts, reviews] = await Promise.all([
    getProductBySlug(subdomain, slug).catch(() => null),
    getRelatedProducts(subdomain, slug, 8).catch(() => []),
    getProductReviews(subdomain, slug, 1, 5).catch(() => EMPTY_REVIEWS),
  ]);

  if (!product) notFound();

  // Defensive: ensure relatedProducts is always an array
  const safeRelated = Array.isArray(relatedProducts) ? relatedProducts : [];

  // Defensive: ensure reviews has the expected shape
  const safeReviews =
    reviews &&
    Array.isArray((reviews as { reviews?: unknown[] })?.reviews) &&
    typeof (reviews as { pagination?: unknown })?.pagination === 'object'
      ? (reviews as { reviews: Review[]; pagination: ReviewsPagination })
      : EMPTY_REVIEWS;

  const productName = resolveLocalized(product.name);
  const shortDesc = resolveLocalizedAr(product.shortDescription);
  const longDesc = resolveLocalizedAr(product.longDescription);

  return (
    <div className="bg-white min-h-screen">
      <main className="container mx-auto px-4 py-8 lg:py-16">
        {/* Navigation Breadcrumbs */}
        <nav className="mb-12 flex items-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
          <Link href="/" className="hover:text-black transition-colors">
            Home
          </Link>
          <span className="mx-4">/</span>
          <Link href="/products" className="hover:text-black transition-colors">
            Products
          </Link>
          <span className="mx-4">/</span>
          <span className="text-black truncate">{productName}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 xl:gap-24">
          {/* LEFT: Image Gallery (Mandatory Aspect Square) */}
          <div className="lg:col-span-12 xl:col-span-7">
            <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-gray-50 ring-1 ring-gray-100 shadow-sm group">
              <Image
                src={product.mainImage || '/placeholder.png'}
                alt={productName || 'Product Image'}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            </div>

            {/* Thumbnail Loop */}
            {product.galleryImages?.length > 0 && (
              <div className="mt-8 flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                {product.galleryImages.map(
                  (img: { url: string }, _idx: number) => (
                    <div
                      key={img.url}
                      className="relative w-28 h-28 aspect-square flex-shrink-0 rounded-2xl overflow-hidden ring-1 ring-gray-100 transition-all hover:ring-black cursor-pointer"
                    >
                      <Image
                        src={img.url}
                        alt={productName || 'Product Image'}
                        fill
                        className="object-cover"
                        sizes="112px"
                      />
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          {/* RIGHT: Product Info (Client Interactive) */}
          <div className="lg:col-span-12 xl:col-span-5 flex flex-col pt-4">
            <h1 className="text-5xl md:text-6xl font-black tracking-tight text-gray-900 leading-[1.05] mb-6">
              {productName}
            </h1>

            <div className="flex items-center gap-4 mb-8">
              <div className="flex text-amber-400 text-sm">
                {'★'.repeat(Math.round(Number(product.avgRating) || 5))}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                {product.reviewCount || 0} Authenticated Reviews
              </span>
            </div>

            {shortDesc && (
              <p className="text-xl text-gray-500 leading-relaxed font-medium mb-10 max-w-xl">
                {shortDesc}
              </p>
            )}

            <ProductInfoClient product={getProductInfoProps(product)} />
          </div>
        </div>

        {/* Bottom Sections: Details, Specs, Related, Reviews */}
        <section className="mt-24 lg:mt-32 grid grid-cols-1 lg:grid-cols-2 gap-24 border-t border-gray-100 pt-24">
          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 mb-8 underline decoration-blue-500 decoration-4 underline-offset-8">
              Description
            </h2>
            <div className="prose prose-xl prose-slate max-w-none prose-headings:font-black prose-p:leading-loose text-gray-600">
              <SafeHtmlContent
                html={(longDesc || '').replace(/\n/g, '<br />')}
              />
            </div>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.3em] text-gray-400 mb-8 underline decoration-amber-400 decoration-4 underline-offset-8">
              Specifications
            </h2>
            <dl className="grid grid-cols-1 gap-4">
              {Object.entries(product.specifications || {}).map(
                ([key, val]) => (
                  <div
                    key={key}
                    className="flex items-baseline justify-between p-6 bg-gray-50 rounded-3xl"
                  >
                    <dt className="text-xs font-black uppercase tracking-widest text-gray-400">
                      {key}
                    </dt>
                    <dd className="text-sm font-bold text-gray-900">
                      {String(val)}
                    </dd>
                  </div>
                )
              )}
            </dl>
          </div>
        </section>

        <RelatedProducts
          tenantId={subdomain}
          productId={product.id}
          initialRelated={safeRelated}
        />

        <ReviewsSection
          tenantId={subdomain}
          productId={product.id}
          initialReviews={safeReviews}
          avgRating={Number(product.avgRating) || 0}
          reviewCount={product.reviewCount || 0}
        />
      </main>
    </div>
  );
}
