'use client';

import { useEffect, useState } from 'react';
import { personalizedProductRecommendations } from '@/ai/flows/personalized-product-recommendations';
import { products } from '@/lib/data';
import { ProductCard } from './ProductCard';
import { Loader2 } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { useSettings } from '@/contexts/SettingsProvider';

export function PersonalizedRecommendations() {
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
  const [reasoning, setReasoning] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { language } = useSettings();

  const t = {
    en: {
        loading: "Loading your personalized picks...",
        error: "Could not load personalized recommendations.",
        fallbackReasoning: "We couldn't load your recommendations right now, but you might like these popular items.",
        title: "Just For You",
        defaultReasoning: "While we get to know your style, check out some of our best-sellers!"
    },
    ar: {
        loading: "جارٍ تحميل اختياراتك المخصصة...",
        error: "تعذر تحميل توصياتك المخصصة.",
        fallbackReasoning: "لم نتمكن من تحميل توصياتك الآن، ولكن قد تعجبك هذه العناصر الشائعة.",
        title: "خصيصًا لك",
        defaultReasoning: "بينما نتعرف على أسلوبك، تحقق من بعض أفضل مبيعاتنا!"
    }
  }

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Mock data for demonstration purposes
        const mockBrowsingHistory = ['Classic Denim Jacket', 'Leather Ankle Boots'];
        const mockPurchaseHistory = ['Organic Cotton T-Shirt'];
        const productCatalog = products.map(p => p.name);

        const result = await personalizedProductRecommendations({
          browsingHistory: mockBrowsingHistory,
          purchaseHistory: mockPurchaseHistory,
          productCatalog,
        });

        if (result.recommendations && result.recommendations.length > 0) {
          const foundProducts = products.filter(p => result.recommendations.includes(p.name));
          setRecommendedProducts(foundProducts);
          setReasoning(result.reasoning);
        } else {
            // Fallback to showing some trending products if no recommendations
            setRecommendedProducts(products.filter(p => p.tags?.includes('best-seller')).slice(0, 4));
            setReasoning(t[language].defaultReasoning);
        }

      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError(t[language].error);
        // Fallback to showing some trending products on error
        setRecommendedProducts(products.filter(p => p.tags?.includes('best-seller')).slice(0, 4));
        setReasoning(t[language].fallbackReasoning);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [language]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ms-4 text-muted-foreground">{t[language].loading}</p>
      </div>
    );
  }
  
  if (error) {
    // Already showing fallback products, so we can just show the error message and the fallbacks.
    // The component will render the products set in the catch block.
  }

  if (recommendedProducts.length === 0) {
    return null; // Or some other fallback UI
  }

  return (
    <section className="container">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">{t[language].title}</CardTitle>
          <CardDescription>{reasoning}</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {recommendedProducts.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </CardContent>
      </Card>
    </section>
  );
}
