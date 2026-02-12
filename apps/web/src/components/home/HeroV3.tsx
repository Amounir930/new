'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';

interface HeroV3Props {
    headline: string;
    subheadline?: string;
    ctaText?: string;
    backgroundImage?: string;
    isRTL?: boolean;
}

export default function HeroV3({
    headline,
    subheadline,
    ctaText = 'Shop Now',
    backgroundImage,
    isRTL
}: HeroV3Props) {
    // Use a default placeholder if no image provided
    const heroImage = backgroundImage || PlaceHolderImages.find(img => img.id === 'hero-1')?.imageUrl;

    return (
        <div className="relative h-[60vh] w-full md:h-[80vh] overflow-hidden">
            {heroImage && (
                <Image
                    src={heroImage}
                    alt={headline}
                    fill
                    className="object-cover"
                    priority
                />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
                <div className={cn(
                    "container text-center text-white",
                    isRTL ? "rtl" : "ltr"
                )}>
                    <h1 className="text-4xl font-bold tracking-tighter drop-shadow-lg md:text-6xl lg:text-7xl">
                        {headline}
                    </h1>
                    {subheadline && (
                        <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200 drop-shadow md:text-xl">
                            {subheadline}
                        </p>
                    )}
                    <div className="mt-8 flex justify-center gap-4">
                        <Button asChild size="lg">
                            <Link href="/shop">{ctaText}</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
