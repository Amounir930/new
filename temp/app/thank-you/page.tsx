'use client';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

export default function ThankYouPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Thank You!',
      subtitle: 'Your order has been placed successfully.',
      description: "We've sent a confirmation email to your address.",
      continueShopping: 'Continue Shopping',
      trackOrder: 'Track Your Order',
    },
    ar: {
      title: 'شكرًا لك!',
      subtitle: 'تم تقديم طلبك بنجاح.',
      description: 'لقد أرسلنا رسالة تأكيد بالبريد الإلكتروني إلى عنوانك.',
      continueShopping: 'متابعة التسوق',
      trackOrder: 'تتبع طلبك',
    },
  };

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <CheckCircle className="h-16 w-16 text-green-500" />
      <h1 className="mt-4 text-4xl font-bold tracking-tight">
        {t[language].title}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t[language].subtitle}
      </p>
      <p className="mt-1 text-muted-foreground">{t[language].description}</p>
      <div className="mt-6 flex gap-4">
        <Button asChild>
          <Link href="/shop">{t[language].continueShopping}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/track-order">{t[language].trackOrder}</Link>
        </Button>
      </div>
    </div>
  );
}
