/**
 * Product Detail Page
 *
 * Dynamic route for individual product pages.
 *
 * @route /products/[slug]
 */

import { AddToCartButton } from '@/components/product/AddToCartButton';
import { ProductGallery } from '@/components/product/ProductGallery';
import { formatPrice } from '@/lib/formatters';
import { notFound } from 'next/navigation';

interface PageProps {
  params: { slug: string };
}

async function getProduct(_slug: string) {
  // TODO: Fetch from API
  // const response = await endpoints.products.getBySlug(slug);
  // return response.data;

  // Return null for now (will show 404)
  return null as any;
}

export default async function ProductDetailPage({ params }: PageProps) {
  const product: any = await getProduct(params.slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Product Gallery */}
        <div>
          <ProductGallery images={product.images || []} />
        </div>

        {/* Right: Product Info */}
        <div className="space-y-6">
          {/* Title & Price */}
          <div>
            <h1 className="text-3xl font-bold mb-2">{product.name}</h1>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-primary">
                {formatPrice(product.price, product.currency)}
              </span>
              {product.compareAtPrice && (
                <span className="text-xl text-gray-500 line-through">
                  {formatPrice(product.compareAtPrice, product.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Description */}
          {product.description && (
            <div>
              <h2 className="font-semibold mb-2">Description</h2>
              <p className="text-gray-700">{product.description}</p>
            </div>
          )}

          {/* Add to Cart */}
          <AddToCartButton product={product} />

          {/* Additional Info */}
          <div className="border-t pt-6 space-y-3">
            {product.brand && (
              <div>
                <span className="font-medium">Brand: </span>
                <span className="text-gray-700">{product.brand}</span>
              </div>
            )}
            {product.category && (
              <div>
                <span className="font-medium">Category: </span>
                <span className="text-gray-700">{product.category.name}</span>
              </div>
            )}
            <div>
              <span className="font-medium">Availability: </span>
              <span
                className={product.inStock ? 'text-green-600' : 'text-red-600'}
              >
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
