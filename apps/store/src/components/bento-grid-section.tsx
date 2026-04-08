import Image from 'next/image';
import Link from 'next/link';

export interface BentoGridSlot {
  type: 'product' | 'category' | 'link';
  referenceId?: string;
  customImage?: string;
  customText?: string;
  link?: string;
  // Extended fields from homeData
  productName?: string;
  productSlug?: string;
  productPrice?: number;
  productImageUrl?: string;
  categoryName?: string;
  categorySlug?: string;
}

export interface BentoGridData {
  layoutId: string;
  slots: Record<string, BentoGridSlot>;
}

interface BentoGridSectionProps {
  data: BentoGridData;
}

/**
 * ── BENTO GRID SECTION ──
 * Responsive asymmetric grid layout for featured content
 * Supports products, categories, and custom links
 */
export function BentoGridSection({ data }: BentoGridSectionProps) {
  if (!data?.slots || Object.keys(data.slots).length === 0) return null;

  const slots = Object.entries(data.slots);
  const totalSlots = slots.length;

  // Determine grid layout based on slot count
  const getLayoutClass = (index: number) => {
    if (totalSlots === 3) {
      return index === 0
        ? 'md:col-span-2 md:row-span-2'
        : 'md:col-span-1 md:row-span-1';
    }
    if (totalSlots === 5) {
      if (index === 0) return 'md:col-span-2 md:row-span-2';
      if (index === 1 || index === 2) return 'md:col-span-1 md:row-span-1';
      return 'md:col-span-1 md:row-span-1';
    }
    return 'md:col-span-1 md:row-span-1';
  };

  return (
    <section>
      <div className="mb-8">
        <span className="text-blue-600 font-bold text-xs uppercase tracking-widest">
          Featured
        </span>
        <h2 className="text-3xl font-black tracking-tight text-gray-900 sm:text-4xl">
          Discover More
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4 md:auto-rows-[180px]">
        {slots.map(([key, slot], index) => {
          const layoutClass = getLayoutClass(index);
          const href =
            slot.type === 'product' && slot.productSlug
              ? `/products/${slot.productSlug}`
              : slot.type === 'category' && slot.categorySlug
                ? `/categories/${slot.categorySlug}`
                : slot.link || '#';

          return (
            <Link
              key={key}
              href={href}
              className={`group relative overflow-hidden rounded-2xl bg-gray-100 transition-all hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] ${layoutClass}`}
            >
              {/* Background Image */}
              {slot.customImage || slot.productImageUrl ? (
                <Image
                  src={slot.customImage || slot.productImageUrl || ''}
                  alt={
                    slot.customText ||
                    slot.productName ||
                    slot.categoryName ||
                    'Featured'
                  }
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes={
                    totalSlots === 3 && index === 0
                      ? '66vw'
                      : totalSlots === 5 && index === 0
                        ? '50vw'
                        : '25vw'
                  }
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-600 opacity-80" />
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                {slot.type === 'product' && (
                  <>
                    <h3 className="text-lg font-bold text-white md:text-xl">
                      {slot.productName || slot.customText || 'Product'}
                    </h3>
                    {slot.productPrice && (
                      <p className="mt-1 text-sm font-semibold text-yellow-300">
                        From ${slot.productPrice.toFixed(2)}
                      </p>
                    )}
                  </>
                )}

                {slot.type === 'category' && (
                  <>
                    <h3 className="text-lg font-bold text-white md:text-xl">
                      {slot.categoryName || slot.customText || 'Category'}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      Shop now →
                    </p>
                  </>
                )}

                {slot.type === 'link' && (
                  <>
                    <h3 className="text-lg font-bold text-white md:text-xl">
                      {slot.customText || 'Explore'}
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      Learn more →
                    </p>
                  </>
                )}
              </div>

              {/* Hover Icon */}
              <div className="absolute right-4 top-4 rounded-full bg-white/20 p-2 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
