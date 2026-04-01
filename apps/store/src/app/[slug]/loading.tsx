/**
 * ── PDP LOADING SKELETON ──
 * Provides visual feedback during ISR revalidation and initial load
 */

// Static skeleton items - order never changes, safe to use index-based keys
const THUMBNAIL_SKELETONS = [
  'sk-thumb-1',
  'sk-thumb-2',
  'sk-thumb-3',
  'sk-thumb-4',
] as const;
const VARIANT_SKELETONS = [
  'sk-variant-1',
  'sk-variant-2',
  'sk-variant-3',
  'sk-variant-4',
] as const;
const BADGE_SKELETONS = ['sk-badge-1', 'sk-badge-2', 'sk-badge-3'] as const;
const RELATED_SKELETONS = [
  'sk-related-1',
  'sk-related-2',
  'sk-related-3',
  'sk-related-4',
] as const;

export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-12 md:py-20">
      {/* Breadcrumb Skeleton */}
      <div className="mb-8 flex items-center gap-2">
        <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
        <span className="text-gray-300">/</span>
        <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
        <span className="text-gray-300">/</span>
        <div className="h-4 w-48 bg-gray-200 rounded animate-pulse" />
      </div>

      {/* Main Product Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-20">
        {/* Image Gallery Skeleton */}
        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-3xl bg-gray-200 animate-pulse" />
          <div className="flex gap-4 overflow-x-auto">
            {THUMBNAIL_SKELETONS.map((id) => (
              <div
                key={id}
                className="w-24 aspect-square bg-gray-200 rounded-xl animate-pulse flex-shrink-0"
              />
            ))}
          </div>
        </div>

        {/* Product Info Skeleton */}
        <div className="space-y-6">
          {/* Title */}
          <div className="h-12 w-3/4 bg-gray-200 rounded animate-pulse" />

          {/* Rating */}
          <div className="flex items-center gap-2">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Price */}
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />

          {/* Description */}
          <div className="space-y-2">
            <div className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-5/6 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-4/6 bg-gray-200 rounded animate-pulse" />
          </div>

          {/* Variant Selector Skeleton */}
          <div className="space-y-3">
            <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
            <div className="flex gap-3">
              {VARIANT_SKELETONS.map((id) => (
                <div
                  key={id}
                  className="w-20 h-10 bg-gray-200 rounded-xl animate-pulse"
                />
              ))}
            </div>
          </div>

          {/* Add to Cart Button */}
          <div className="h-16 w-full bg-gray-200 rounded-2xl animate-pulse" />

          {/* Trust Badges */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-100">
            {BADGE_SKELETONS.map((id) => (
              <div key={id} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-xl animate-pulse" />
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Related Products Skeleton */}
      <div className="mt-20">
        <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-8" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {RELATED_SKELETONS.map((id) => (
            <div key={id}>
              <div className="aspect-square bg-gray-200 rounded-2xl mb-4 animate-pulse" />
              <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 w-1/2 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
