import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import {
  AddToCartButton,
  StockBadge,
} from '@/components/pdp/add-to-cart-button';
import { RelatedProducts } from '@/components/pdp/related-products';
import { ReviewsSection } from '@/components/pdp/reviews-section';
import type { ProductVariant } from '@/components/pdp/variant-selector';
import {
  extractTenantFromHost,
  getProductBySlug,
  getProductReviews,
  getRelatedProducts,
} from '@/lib/api';

// ═══════════════════════════════════════════════════════════════
// ISR CONFIGURATION
// ═══════════════════════════════════════════════════════════════
export const revalidate = 60;

export async function generateStaticParams() {
  return [];
}

// ═══════════════════════════════════════════════════════════════
// SEO METADATA
// ═══════════════════════════════════════════════════════════════
interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const tenantId = await extractTenantFromHost();

  const product = await getProductBySlug(tenantId, slug);

  if (!product) {
    return { title: 'Product Not Found' };
  }

  const productName =
    typeof product.name === 'object'
      ? product.name.en || product.name.ar || 'Product'
      : product.name;

  const description = product.shortDescription
    ? typeof product.shortDescription === 'object'
      ? product.shortDescription.en || product.shortDescription.ar || ''
      : product.shortDescription
    : '';

  return {
    title: `${productName} | Store`,
    description: description.slice(0, 160),
    openGraph: {
      title: productName,
      description: description.slice(0, 200),
      images: product.mainImage ? [product.mainImage] : [],
      type: 'product',
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: PRODUCT GALLERY
// ═══════════════════════════════════════════════════════════════
interface ProductGalleryProps {
  images: string[];
  productName: string;
}

function ProductGallery({ images, productName }: ProductGalleryProps) {
  const mainImage = images[0];
  const thumbnailImages = images.slice(1);

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-50 ring-1 ring-gray-100 shadow-sm">
        <Image
          src={mainImage || '/placeholder.png'}
          alt={productName}
          fill
          className="object-cover"
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>

      {/* Thumbnail Gallery */}
      {thumbnailImages.length > 0 && (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {thumbnailImages.map((imgUrl, index) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: Static gallery order defined by merchant
              key={`thumbnail-${index}`}
              className="relative w-24 aspect-square flex-shrink-0 rounded-xl overflow-hidden ring-1 ring-gray-100 transition-opacity hover:opacity-80 cursor-pointer flex-shrink-0"
            >
              <Image
                src={imgUrl}
                alt={`${productName} view ${index + 2}`}
                fill
                className="object-cover"
                sizes="96px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: PRODUCT ACTIONS
// ═══════════════════════════════════════════════════════════════
interface ProductActionsProps {
  productId: string;
  minOrderQty: number;
  isReturnable: boolean;
  variants?: ProductVariant[];
}

function ProductActions({
  productId,
  minOrderQty,
  isReturnable,
}: ProductActionsProps) {
  return (
    <div className="mt-8 space-y-4">
      <AddToCartButton
        productId={productId}
        variantId={null}
        quantity={1}
        minOrderQty={minOrderQty}
        className="w-full"
      />

      <TrustBadges isReturnable={isReturnable} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: TRUST BADGES
// ═══════════════════════════════════════════════════════════════
interface TrustBadgesProps {
  isReturnable: boolean;
}

function TrustBadges({ isReturnable }: TrustBadgesProps) {
  return (
    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
      <TrustBadge
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        }
        label="Secure Payment"
      />
      <TrustBadge
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M20 12H4"
          />
        }
        label="Free Shipping"
      />
      {isReturnable && (
        <TrustBadge
          icon={
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          }
          label="Free Returns"
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: TRUST BADGE
// ═══════════════════════════════════════════════════════════════
interface TrustBadgeProps {
  icon: React.ReactNode;
  label: string;
}

function TrustBadge({ icon, label }: TrustBadgeProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          {icon}
        </svg>
      </div>
      <span className="text-sm font-bold text-gray-900">{label}</span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: VARIANT SELECTORS
// ═══════════════════════════════════════════════════════════════
interface VariantSelectorsProps {
  variants: ProductVariant[];
}

function VariantSelectors({ variants }: VariantSelectorsProps) {
  const variantTypes =
    variants.length > 0 ? Object.keys(variants[0]?.options || {}) : [];

  if (variantTypes.length === 0) return null;

  return (
    <div className="space-y-6 mb-8">
      {variantTypes.map((variantType) => (
        <VariantSelectorWrapper
          key={variantType}
          variantType={variantType}
          variants={variants}
        />
      ))}
    </div>
  );
}

function VariantSelectorWrapper({
  variantType,
  variants,
}: {
  variantType: string;
  variants: ProductVariant[];
}) {
  const { VariantSelector, parseVariantOptions } =
    require('@/components/pdp/variant-selector') as {
      VariantSelector: React.ComponentType<{
        variantType: string;
        options: { id: string; name: string }[];
        selectedOption: string | null;
        onOptionSelect: (id: string) => void;
      }>;
      parseVariantOptions: (
        variants: ProductVariant[],
        type: string
      ) => { id: string; name: string }[];
    };

  const options = parseVariantOptions(variants, variantType);

  return (
    <VariantSelector
      variantType={variantType}
      options={options}
      selectedOption={null}
      onOptionSelect={(variantId: string) => {
        console.log('Selected variant:', variantId);
      }}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: PRODUCT META
// ═══════════════════════════════════════════════════════════════
interface ProductMetaProps {
  sku?: string | null;
  brandId?: string | null;
  categoryId?: string | null;
}

function ProductMeta({ sku, brandId, categoryId }: ProductMetaProps) {
  return (
    <div className="mt-8 pt-8 border-t border-gray-100 space-y-2 text-sm text-gray-500">
      {sku && (
        <div className="flex gap-2">
          <span className="font-semibold">SKU:</span>
          <span>{sku}</span>
        </div>
      )}
      {brandId && (
        <div className="flex gap-2">
          <span className="font-semibold">Brand:</span>
          <span>Brand ID: {brandId}</span>
        </div>
      )}
      {categoryId && (
        <div className="flex gap-2">
          <span className="font-semibold">Category:</span>
          <span>Category ID: {categoryId}</span>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// EXTRACTED COMPONENT: SPECIFICATIONS
// ═══════════════════════════════════════════════════════════════
interface SpecificationsProps {
  specifications: Record<string, unknown>;
}

function Specifications({ specifications }: SpecificationsProps) {
  if (!specifications || Object.keys(specifications).length === 0) return null;

  return (
    <section className="mt-20 max-w-4xl">
      <h2 className="text-2xl font-bold mb-6">Specifications</h2>
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(specifications).map(([key, value]) => (
          <div key={key} className="flex gap-2 p-4 bg-gray-50 rounded-lg">
            <dt className="font-semibold text-gray-700 capitalize">
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </dt>
            <dd className="text-gray-600">{String(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN PDP COMPONENT (SERVER COMPONENT)
// ═══════════════════════════════════════════════════════════════
export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const tenantId = await extractTenantFromHost();

  const [product, relatedProducts, reviews] = await Promise.all([
    getProductBySlug(tenantId, slug),
    getRelatedProducts(tenantId, 'placeholder', 8).catch(() => []),
    getProductReviews(tenantId, 'placeholder', 1, 5).catch(() => ({
      reviews: [],
      pagination: { page: 1, limit: 10, total: 0, totalPages: 0 },
    })),
  ]);

  if (!product) {
    notFound();
  }

  const productName =
    typeof product.name === 'object'
      ? product.name.en || product.name.ar || 'Product'
      : product.name;

  const shortDescription = product.shortDescription
    ? typeof product.shortDescription === 'object'
      ? product.shortDescription.en || product.shortDescription.ar || ''
      : product.shortDescription
    : '';

  const longDescription = product.longDescription
    ? typeof product.longDescription === 'object'
      ? product.longDescription.en || product.longDescription.ar || ''
      : product.longDescription
    : '';

  const galleryImages = product.galleryImages || [];
  const mainImage = product.mainImage;
  const allImages = [
    mainImage,
    ...galleryImages.map((img: { url: string }) => img.url),
  ].filter(Boolean);

  const displayPrice = product.salePrice || product.basePrice;
  const hasSale =
    product.salePrice && Number(product.salePrice) < Number(product.basePrice);

  const availableStock = product.inventory?.available
    ? product.inventory.available - (product.inventory.reserved || 0)
    : undefined;

  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Breadcrumb */}
      <nav className="mb-8 flex items-center text-sm font-medium text-gray-500">
        <a href="/" className="hover:text-black transition-colors">
          Home
        </a>
        <span className="mx-2 text-gray-300">/</span>
        <a href="/shop" className="hover:text-black transition-colors">
          Shop
        </a>
        <span className="mx-2 text-gray-300">/</span>
        <span className="text-black truncate">{productName}</span>
      </nav>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Gallery */}
        <ProductGallery images={allImages} productName={productName} />

        {/* Product Info */}
        <div className="flex flex-col">
          <div className="space-y-4 mb-6">
            <h1 className="text-4xl font-black tracking-tight text-gray-900 md:text-5xl">
              {productName}
            </h1>

            <div className="flex items-center gap-3">
              <div className="flex text-amber-400">
                {'★'.repeat(Math.round(Number(product.avgRating) || 4))}
              </div>
              <span className="text-sm font-bold text-gray-400">
                ({product.reviewCount || 0} customer reviews)
              </span>
            </div>

            {product.trackInventory && (
              <StockBadge
                availableStock={availableStock}
                trackInventory={product.trackInventory}
              />
            )}
          </div>

          <div className="flex items-center gap-4 mb-6">
            <span className="text-3xl font-black text-blue-600">
              ${displayPrice}
            </span>
            {hasSale && (
              <span className="text-xl text-gray-400 line-through font-bold">
                ${product.basePrice}
              </span>
            )}
          </div>

          {shortDescription && (
            <p className="text-lg text-gray-600 leading-relaxed mb-6">
              {shortDescription}
            </p>
          )}

          <VariantSelectors variants={product.variants || []} />

          <ProductActions
            productId={product.id}
            minOrderQty={product.minOrderQty || 1}
            isReturnable={product.isReturnable || false}
            variants={product.variants}
          />

          <ProductMeta
            sku={product.sku}
            brandId={product.brandId}
            categoryId={product.categoryId}
          />
        </div>
      </div>

      {/* Long Description */}
      {longDescription && (
        <section className="mt-20 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Product Details</h2>
          <div
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Content is from trusted database source (sanitized on input by merchant)
            className="prose prose-lg max-w-none text-gray-600"
            dangerouslySetInnerHTML={{
              __html: longDescription.replace(/\n/g, '<br />'),
            }}
          />
        </section>
      )}

      {/* Specifications */}
      <Specifications specifications={product.specifications} />

      {/* Related Products */}
      <RelatedProducts
        tenantId={tenantId}
        productId={product.id}
        initialRelated={relatedProducts}
      />

      {/* Reviews Section */}
      <ReviewsSection
        tenantId={tenantId}
        productId={product.id}
        initialReviews={reviews}
        avgRating={Number(product.avgRating) || 0}
        reviewCount={product.reviewCount || 0}
      />
    </div>
  );
}
