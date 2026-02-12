'use client';

import { products } from '@/lib/data';
import { ProductCard } from '@/components/products/ProductCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

export default function DealsPage() {
  const dealProducts = products.filter(
    (p) => p.originalPrice && p.originalPrice > p.price
  );
  const { language } = useSettings();

  const t = {
    en: {
      title: 'Flash Deals',
      subtitle: "Don't miss out on these limited-time offers.",
      noDeals: 'No Deals Available Right Now',
      noDealsDesc: 'Check back later for exciting offers!',
      continueShopping: 'Continue Shopping',
    },
    ar: {
      title: 'عروض فلاش',
      subtitle: 'لا تفوت هذه العروض محدودة الوقت.',
      noDeals: 'لا توجد عروض متاحة حاليًا',
      noDealsDesc: 'تحقق مرة أخرى لاحقًا للحصول على عروض مثيرة!',
      continueShopping: 'متابعة التسوق',
    },
  };

  return (
    <div className="container py-8 md:py-12">
      <header className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      {dealProducts.length > 0 ? (
        <div className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dealProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <h3 className="text-2xl font-semibold">{t[language].noDeals}</h3>
          <p className="mt-2 text-muted-foreground">
            {t[language].noDealsDesc}
          </p>
          <Button asChild className="mt-4">
            <Link href="/shop">{t[language].continueShopping}</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
