'use client';

import {
  BadgeDollarSign,
  Headphones,
  Package,
  RefreshCcw,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export interface TrustIcon {
  iconName: string;
  title: string;
  description: string;
}

export interface TrustMarqueeData {
  marqueeTexts: string[];
  serviceIcons: TrustIcon[];
}

interface TrustMarqueeSectionProps {
  data: TrustMarqueeData;
}

/**
 * Map of Lucide icon names to actual components
 */
const ICON_MAP: Record<string, LucideIcon> = {
  Package,
  RefreshCcw,
  Headphones,
  ShieldCheck,
  BadgeDollarSign,
};

/**
 * ── TRUST MARQUEE SECTION ──
 * Infinite-scroll marquee + service trust icons
 * Builds confidence in shipping, returns, support, and security
 */
export function TrustMarqueeSection({ data }: TrustMarqueeSectionProps) {
  if (!data) {
    // Default fallback
    data = {
      marqueeTexts: [
        'Free Shipping on Orders Over $50',
        '30-Day Hassle-Free Returns',
        '24/7 Customer Support',
        '100% Secure Checkout',
      ],
      serviceIcons: [
        {
          iconName: 'Package',
          title: 'Free Shipping',
          description: 'On orders over $50',
        },
        {
          iconName: 'RefreshCcw',
          title: 'Easy Returns',
          description: '30-day return policy',
        },
        {
          iconName: 'Headphones',
          title: '24/7 Support',
          description: 'Always here to help',
        },
        {
          iconName: 'ShieldCheck',
          title: 'Secure Payment',
          description: '100% protected checkout',
        },
      ],
    };
  }

  const marqueeRef = useRef<HTMLDivElement>(null);
  const [marqueeWidth, setMarqueeWidth] = useState(0);

  // Calculate marquee width for smooth animation
  useEffect(() => {
    const updateWidth = () => {
      if (marqueeRef.current) {
        setMarqueeWidth(marqueeRef.current.scrollWidth / 2);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [data.marqueeTexts]);

  const { marqueeTexts, serviceIcons } = data;

  return (
    <section className="space-y-8 py-12">
      {/* Marquee Banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 py-3">
        <div className="relative flex whitespace-nowrap">
          {/* Duplicate for seamless loop */}
          <div
            ref={marqueeRef}
            className="flex animate-marquee"
            style={{
              animationDuration: `${Math.max(20, marqueeWidth / 50)}s`,
            }}
          >
            {[...marqueeTexts, ...marqueeTexts].map((text, i) => (
              <span
                key={i}
                className="mx-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white"
              >
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                {text}
              </span>
            ))}
          </div>
          <div
            className="flex animate-marquee"
            style={{
              animationDuration: `${Math.max(20, marqueeWidth / 50)}s`,
            }}
            aria-hidden="true"
          >
            {[...marqueeTexts, ...marqueeTexts].map((text, i) => (
              <span
                key={`dup-${i}`}
                className="mx-8 flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-white"
              >
                <span className="h-2 w-2 rounded-full bg-yellow-400" />
                {text}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Service Icons */}
      {serviceIcons && serviceIcons.length > 0 && (
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4">
          {serviceIcons.map((icon, index) => {
            const IconComponent =
              ICON_MAP[icon.iconName] || BadgeDollarSign;

            return (
              <div
                key={index}
                className="group flex flex-col items-center text-center space-y-3 rounded-2xl bg-gray-50 p-6 transition-all hover:bg-blue-50 hover:shadow-md"
              >
                <div className="rounded-full bg-blue-100 p-4 text-blue-600 transition-transform group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white">
                  <IconComponent className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{icon.title}</h3>
                  <p className="mt-1 text-xs text-gray-500">
                    {icon.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSS for marquee animation */}
      <style jsx>{`
        @keyframes marquee {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        .animate-marquee {
          animation: marquee linear infinite;
        }
      `}</style>
    </section>
  );
}
