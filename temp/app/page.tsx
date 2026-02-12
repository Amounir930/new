'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { categories, trendingProducts } from '@/lib/data';
import { ProductCard } from '@/components/products/ProductCard';
import { ArrowLeft, ArrowRight, RefreshCw, Shield, Truck } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';
import { PersonalizedRecommendations } from '@/components/products/PersonalizedRecommendations';

export default function Home() {
  const heroImage = PlaceHolderImages.find((img) => img.id === 'hero-1');
  const { language } = useSettings();

  const t = {
    en: {
      defineYourStyle: 'Define Your Style',
      discoverLatest:
        'Discover the latest trends and timeless pieces. High-quality fashion for every occasion.',
      shopNow: 'Shop Now',
      exploreDeals: 'Explore Deals',
      shopByCategory: 'Shop by Category',
      men: 'Men',
      women: 'Women',
      kids: 'Kids',
      trendingNow: 'Trending Now',
      viewAll: 'View All',
      freeShipping: 'Free Shipping',
      freeShippingDesc: 'On all orders over $50',
      easyReturns: 'Easy Returns',
      easyReturnsDesc: '30-day return policy',
      securePayment: 'Secure Payment',
      securePaymentDesc: 'All transactions are secure',
    },
    ar: {
      defineYourStyle: 'حدد أسلوبك',
      discoverLatest:
        'اكتشف أحدث الصيحات والقطع الخالدة. أزياء عالية الجودة لكل مناسبة.',
      shopNow: 'تسوق الآن',
      exploreDeals: 'اكتشف العروض',
      shopByCategory: 'تسوق حسب الفئة',
      men: 'رجال',
      women: 'نساء',
      kids: 'أطفال',
      trendingNow: 'المنتجات الرائجة الآن',
      viewAll: 'عرض الكل',
      freeShipping: 'شحن مجاني',
      freeShippingDesc: 'على جميع الطلبات فوق 50 دولارًا',
      easyReturns: 'إرجاع سهل',
      easyReturnsDesc: 'سياسة إرجاع لمدة 30 يومًا',
      securePayment: 'دفع آمن',
      securePaymentDesc: 'جميع المعاملات آمنة',
    },
  };

  const Arrow = language === 'ar' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-16 md:space-y-24 pb-24">
      {/* Hero Section */}
      <section className="relative h-[60vh] w-full md:h-[80vh]">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container text-center text-primary-foreground">
            <h1 className="text-4xl font-bold tracking-tighter drop-shadow-lg md:text-6xl lg:text-7xl">
              {t[language].defineYourStyle}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-200 drop-shadow md:text-xl">
              {t[language].discoverLatest}
            </p>
            <div className="mt-8 flex justify-center gap-4">
              <Button asChild size="lg">
                <Link href="/shop">{t[language].shopNow}</Link>
              </Button>
              <Button asChild size="lg" variant="secondary">
                <Link href="/deals">{t[language].exploreDeals}</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Categories */}
      <section className="container">
        <h2 className="text-center text-3xl font-bold tracking-tight">
          {t[language].shopByCategory}
        </h2>
        <div className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
          {categories.map((category) => {
            const categoryImage = PlaceHolderImages.find(
              (img) => img.id === category.image
            );
            return (
              <Link
                href={`/shop/category/${category.slug}`}
                key={category.id}
                className="group relative block overflow-hidden rounded-lg"
              >
                <div className="h-64 md:h-80">
                  {categoryImage && (
                    <Image
                      src={categoryImage.imageUrl}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      data-ai-hint={categoryImage.imageHint}
                    />
                  )}
                </div>
                <div className="absolute inset-0 bg-black/40" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl font-semibold text-white drop-shadow-md">
                    {category.name === 'Men'
                      ? t[language].men
                      : category.name === 'Women'
                        ? t[language].women
                        : t[language].kids}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trending Products */}
      <section className="container">
        <div className="mb-8 flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">
            {t[language].trendingNow}
          </h2>
          <Button variant="ghost" asChild>
            <Link href="/shop">
              {t[language].viewAll} <Arrow className="ms-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* Personalized Recommendations */}
      <PersonalizedRecommendations />

      {/* Features Section */}
      <section className="bg-muted">
        <div className="container grid grid-cols-1 gap-8 py-12 text-center md:grid-cols-3">
          <div className="flex flex-col items-center gap-2">
            <Truck className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">{t[language].freeShipping}</h3>
            <p className="text-sm text-muted-foreground">
              {t[language].freeShippingDesc}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">{t[language].easyReturns}</h3>
            <p className="text-sm text-muted-foreground">
              {t[language].easyReturnsDesc}
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <h3 className="font-semibold">{t[language].securePayment}</h3>
            <p className="text-sm text-muted-foreground">
              {t[language].securePaymentDesc}
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
