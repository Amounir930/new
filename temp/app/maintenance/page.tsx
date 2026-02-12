'use client';
import { HardHat } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

export default function MaintenancePage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Under Maintenance',
      subtitle: 'We are currently performing scheduled maintenance.',
      description: "We'll be back online shortly. Thank you for your patience!",
    },
    ar: {
      title: 'تحت الصيانة',
      subtitle: 'نقوم حاليًا بإجراء صيانة مجدولة.',
      description: 'سنعود للعمل قريبًا. شكرا لصبرك!',
    },
  };

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center text-center">
      <HardHat className="h-16 w-16 text-primary" />
      <h1 className="mt-4 text-4xl font-bold tracking-tight">
        {t[language].title}
      </h1>
      <p className="mt-2 text-lg text-muted-foreground">
        {t[language].subtitle}
      </p>
      <p className="mt-1 text-muted-foreground">{t[language].description}</p>
    </div>
  );
}
