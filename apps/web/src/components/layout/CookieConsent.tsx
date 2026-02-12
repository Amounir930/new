'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Cookie } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const COOKIE_CONSENT_KEY = 'stylegrove-cookie-consent';

export function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const { language } = useSettings();

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (consent !== 'true') {
      setIsVisible(true);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, 'true');
    setIsVisible(false);
  };

  const t = {
    en: {
      title: 'We Use Cookies',
      description:
        'This website uses cookies to ensure you get the best experience on our website. ',
      learnMore: 'Learn more',
      accept: 'Accept',
    },
    ar: {
      title: 'نحن نستخدم ملفات تعريف الارتباط',
      description:
        'يستخدم هذا الموقع ملفات تعريف الارتباط لضمان حصولك على أفضل تجربة على موقعنا. ',
      learnMore: 'اعرف المزيد',
      accept: 'قبول',
    },
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 p-4 transition-transform duration-500',
        isVisible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <Card className="container mx-auto max-w-4xl p-4 shadow-2xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Cookie className="h-6 w-6 text-primary mt-1 shrink-0" />
            <div>
              <h3 className="font-semibold">{t[language].title}</h3>
              <p className="text-sm text-muted-foreground">
                {t[language].description}
                <Link href="/privacy-policy" className="underline text-primary">
                  {t[language].learnMore}
                </Link>
                .
              </p>
            </div>
          </div>
          <Button onClick={handleAccept} className="shrink-0 w-full sm:w-auto">
            {t[language].accept}
          </Button>
        </div>
      </Card>
    </div>
  );
}
