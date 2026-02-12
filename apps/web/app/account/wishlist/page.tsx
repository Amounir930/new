'use client';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import { products } from '@/lib/data';
import { Heart } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

export default function WishlistPage() {
  const { language } = useSettings();
  // Mock wishlist data - in a real app, this would come from user data
  const wishlistProducts = products.slice(0, 3);

  const t = {
    en: {
      title: 'Your Wishlist',
      subtitle: 'Your favorite items, all in one place.',
      emptyTitle: 'Your Wishlist is Empty',
      emptyDesc: 'Add items you love to your wishlist to save them for later.',
      explore: 'Explore Products',
    },
    ar: {
      title: 'قائمة أمنياتك',
      subtitle: 'منتجاتك المفضلة، كلها في مكان واحد.',
      emptyTitle: 'قائمة أمنياتك فارغة',
      emptyDesc: 'أضف المنتجات التي تحبها إلى قائمة أمنياتك لحفظها لوقت لاحق.',
      explore: 'استكشف المنتجات',
    },
  };

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      {wishlistProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {wishlistProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/30 py-20 text-center">
          <Heart className="h-16 w-16 text-muted-foreground/50" />
          <h3 className="mt-4 text-2xl font-semibold">
            {t[language].emptyTitle}
          </h3>
          <p className="mt-2 text-muted-foreground">{t[language].emptyDesc}</p>
          <Button asChild className="mt-6">
            <Link href="/shop">{t[language].explore}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
