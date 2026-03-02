'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useState } from 'react';

interface Banner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  link: string;
}

export default function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
  }, [banners.length]);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (!banners.length) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [nextSlide, banners.length]);

  if (!banners.length) return null;

  return (
    <div className="relative w-full h-[350px] md:h-[500px] overflow-hidden bg-gray-900 group">
      {/* Slides */}
      <div
        className="flex h-full transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {banners.map((banner) => (
          <div key={banner.id} className="relative w-full h-full flex-shrink-0">
            <Image
              src={banner.imageUrl}
              alt={banner.title}
              fill
              className="object-cover opacity-60 scale-105"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white p-6">
              <h2 className="text-4xl md:text-6xl font-black mb-4 drop-shadow-2xl tracking-tight animate-fade-in-up">
                {banner.title}
              </h2>
              <p className="text-xl md:text-2xl font-medium mb-10 opacity-90 max-w-3xl drop-shadow-lg">
                {banner.subtitle}
              </p>
              <a
                href={banner.link}
                className="px-10 py-4 bg-white text-gray-900 font-black rounded-full hover:bg-blue-600 hover:text-white transition-all transform hover:scale-110 shadow-2xl uppercase tracking-widest text-sm"
              >
                Discover Collection
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Particles/Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Previous slide"
        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-gray-900"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        aria-label="Next slide"
        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-black/20 backdrop-blur-md text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white hover:text-gray-900"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      {/* Dynamic Indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
        {banners.map((_banner, i) => (
          <button
            key={_banner.id}
            type="button"
            onClick={() => setCurrentIndex(i)}
            className={`transition-all duration-300 rounded-full ${i === currentIndex
              ? 'w-8 h-2 bg-white'
              : 'w-2 h-2 bg-white/40 hover:bg-white/60'
              }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
