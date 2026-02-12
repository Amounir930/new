'use client';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

export default function NotFound() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Page Not Found',
      subtitle: 'Oops! The page you are looking for does not exist.',
      description: 'It might have been moved or deleted.',
      returnHome: 'Return to Homepage',
      contactSupport: 'Contact Support',
    },
    ar: {
      title: 'الصفحة غير موجودة',
      subtitle: 'عفوًا! الصفحة التي تبحث عنها غير موجودة.',
      description: 'ربما تم نقلها أو حذفها.',
      returnHome: 'العودة إلى الصفحة الرئيسية',
      contactSupport: 'اتصل بالدعم',
    },
  };

  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-8xl font-bold text-primary">404</div>
      <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t[language].subtitle}
      </p>
      <p className="mt-1 text-muted-foreground">{t[language].description}</p>
      <div className="mt-8 flex items-center gap-4">
        <Button asChild>
          <Link href="/">{t[language].returnHome}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/contact">{t[language].contactSupport}</Link>
        </Button>
      </div>
    </div>
  );
}
