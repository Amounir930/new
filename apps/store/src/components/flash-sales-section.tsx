'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

export interface FlashSaleProduct {
  id: string;
  slug: string;
  name: string;
  price: number;
  compareAtPrice: number;
  imageUrl: string;
  discountPercentage: number;
  quantityLimit: number;
}

interface FlashSalesSectionProps {
  products: FlashSaleProduct[];
  endTime: string; // ISO datetime string
}

/**
 * ── FLASH SALES SECTION ──
 * Countdown timer + discounted product grid with urgency badges
 */
export function FlashSalesSection({
  products,
  endTime,
}: FlashSalesSectionProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = new Date().getTime();
      const difference = Math.max(0, end - now);

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor(
        (difference % (1000 * 60 * 60)) / (1000 * 60)
      );
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ days, hours, minutes, seconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [endTime]);

  if (!products || products.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-600 via-rose-600 to-pink-600 p-6 text-white md:p-10">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-white blur-3xl animate-pulse" />
        <div className="absolute -bottom-24 -left-24 h-64 w-64 rounded-full bg-white blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Header */}
      <div className="relative mb-8 flex flex-col items-center justify-between gap-6 md:flex-row">
        <div className="text-center md:text-left">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            <span className="inline-block h-2 w-2 animate-ping rounded-full bg-yellow-300" />
            Limited Time Offer
          </div>
          <h2 className="text-3xl font-black tracking-tight md:text-4xl">
            🔥 Flash Sale
          </h2>
          <p className="mt-2 text-sm text-white/80">
            Grab these deals before they&apos;re gone!
          </p>
        </div>

        {/* Countdown Timer */}
        <div className="flex gap-3">
          {[
            { label: 'Days', value: timeLeft.days },
            { label: 'Hrs', value: timeLeft.hours },
            { label: 'Min', value: timeLeft.minutes },
            { label: 'Sec', value: timeLeft.seconds },
          ].map((unit) => (
            <div
              key={unit.label}
              className="flex h-16 w-16 flex-col items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm md:h-20 md:w-20"
            >
              <span className="text-xl font-black md:text-2xl">
                {String(unit.value).padStart(2, '0')}
              </span>
              <span className="text-[10px] font-medium uppercase text-white/70">
                {unit.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      <div className="relative grid grid-cols-2 gap-4 md:grid-cols-4">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/products/${product.slug}`}
            className="group relative overflow-hidden rounded-2xl bg-white/10 backdrop-blur-sm transition-all hover:bg-white/20 hover:scale-[1.02] active:scale-[0.98]"
          >
            {/* Discount Badge */}
            <div className="absolute left-3 top-3 z-10 rounded-full bg-yellow-400 px-2 py-1 text-xs font-black text-red-900 shadow-lg">
              -{product.discountPercentage}%
            </div>

            {/* Product Image */}
            <div className="relative aspect-square w-full overflow-hidden bg-white/5">
              {product.imageUrl ? (
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 50vw, 25vw"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-white/30 text-4xl">
                  🛍️
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-4 space-y-2">
              <h3 className="line-clamp-2 text-sm font-bold leading-tight text-white">
                {product.name}
              </h3>

              {/* Price */}
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-black text-yellow-300">
                  ${product.price.toFixed(2)}
                </span>
                {product.compareAtPrice > product.price && (
                  <span className="text-xs text-white/60 line-through">
                    ${product.compareAtPrice.toFixed(2)}
                  </span>
                )}
              </div>

              {/* Stock Limit */}
              {product.quantityLimit && (
                <div className="rounded-lg bg-white/10 px-3 py-1.5 text-center text-[10px] font-bold uppercase tracking-wider">
                  Limit {product.quantityLimit} per customer
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      {/* Footer CTA */}
      <div className="relative mt-8 text-center">
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-bold text-red-600 shadow-xl transition-all hover:scale-105 active:scale-95"
        >
          View All Deals
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M14 5l7 7m0 0l-7 7m7-7H3"
            />
          </svg>
        </Link>
      </div>
    </section>
  );
}
