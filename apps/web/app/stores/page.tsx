'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, MapPin, Clock } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

const stores = [
  {
    id: 1,
    name: 'New York Flagship',
    name_ar: 'فرع نيويورك الرئيسي',
    address: '123 Fashion Ave, New York, NY 10001',
    phone: '+1 (212) 555-0199',
    hours: { en: '10:00 AM - 9:00 PM', ar: '10:00 ص - 9:00 م' },
  },
  {
    id: 2,
    name: 'Los Angeles Boutique',
    name_ar: 'بوتيك لوس أنجلوس',
    address: '456 Style St, Los Angeles, CA 90001',
    phone: '+1 (310) 555-0188',
    hours: { en: '11:00 AM - 8:00 PM', ar: '11:00 ص - 8:00 م' },
  },
  {
    id: 3,
    name: 'London Store',
    name_ar: 'متجر لندن',
    address: '789 Vogue Rd, London W1F 9DB, UK',
    phone: '+44 20 7946 0999',
    hours: { en: '10:00 AM - 7:00 PM', ar: '10:00 ص - 7:00 م' },
  },
  {
    id: 4,
    name: 'Dubai Mall',
    name_ar: 'دبي مول',
    address: 'Financial Center Street, Along Sheikh Zayed Road, Dubai, UAE',
    phone: '+971 4 555 0177',
    hours: { en: '10:00 AM - 12:00 AM', ar: '10:00 ص - 12:00 ص' },
  },
];

export default function StoresPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Our Stores',
      subtitle: 'Find a StyleGrove location near you.',
      getDirections: 'Get Directions',
      callStore: 'Call Store',
    },
    ar: {
      title: 'متاجرنا',
      subtitle: 'ابحث عن موقع ستايل جروف بالقرب منك.',
      getDirections: 'الحصول على الاتجاهات',
      callStore: 'اتصل بالمتجر',
    },
  };

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          {t[language].title}
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      {/* Placeholder for a map component */}
      <div className="w-full h-96 bg-muted rounded-lg mb-12 flex items-center justify-center">
        <MapPin className="h-12 w-12 text-muted-foreground" />
        <span className="ms-4 text-muted-foreground">Map Placeholder</span>
      </div>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
        {stores.map((store) => (
          <Card key={store.id}>
            <CardHeader>
              <CardTitle>
                {language === 'ar' ? store.name_ar : store.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground mt-1" />
                <span className="text-muted-foreground">{store.address}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">{store.phone}</span>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {store.hours[language]}
                </span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline">{t[language].getDirections}</Button>
                <Button variant="ghost" asChild>
                  <a href={`tel:${store.phone}`}>{t[language].callStore}</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
