'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

const mockPaymentMethods = [
  { id: 1, type: 'Visa', last4: '4242', expiry: '12/26', isDefault: true },
  {
    id: 2,
    type: 'Mastercard',
    last4: '5555',
    expiry: '08/25',
    isDefault: false,
  },
];

export default function PaymentMethodsPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Payment Methods',
      subtitle: 'Manage your saved payment methods.',
      addNew: 'Add New Card',
      cardEnding: 'ending in',
      expires: 'Expires',
      default: 'Default',
      edit: 'Edit',
      remove: 'Remove',
      noMethods: 'No payment methods saved',
      noMethodsDesc: 'Add a payment method for faster checkout.',
    },
    ar: {
      title: 'طرق الدفع',
      subtitle: 'إدارة طرق الدفع المحفوظة.',
      addNew: 'إضافة بطاقة جديدة',
      cardEnding: 'تنتهي بـ',
      expires: 'تنتهي في',
      default: 'الافتراضي',
      edit: 'تعديل',
      remove: 'إزالة',
      noMethods: 'لا توجد طرق دفع محفوظة',
      noMethodsDesc: 'أضف طريقة دفع لتسريع عملية الدفع.',
    },
  };
  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t[language].title}
          </h1>
          <p className="mt-1 text-muted-foreground">{t[language].subtitle}</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> {t[language].addNew}
        </Button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockPaymentMethods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>
                  {method.type} {t[language].cardEnding} {method.last4}
                </span>
                {method.isDefault && (
                  <span className="text-xs font-normal bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {t[language].default}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {t[language].expires} {method.expiry}
              </p>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button variant="outline">{t[language].edit}</Button>
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive"
              >
                {t[language].remove}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {mockPaymentMethods.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">{t[language].noMethods}</h3>
          <p className="text-muted-foreground mt-2">
            {t[language].noMethodsDesc}
          </p>
        </div>
      )}
    </div>
  );
}
