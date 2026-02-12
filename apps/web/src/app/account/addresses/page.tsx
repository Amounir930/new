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

const mockAddresses = [
  {
    id: 1,
    type: 'Shipping',
    address: '123 Fashion Ave, New York, NY 10001',
    isDefault: true,
  },
  {
    id: 2,
    type: 'Billing',
    address: '456 Style St, Los Angeles, CA 90001',
    isDefault: false,
  },
];

export default function AddressesPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'Manage Addresses',
      subtitle: 'Add, edit, or remove your shipping and billing addresses.',
      addNew: 'Add New Address',
      shippingAddress: 'Shipping Address',
      billingAddress: 'Billing Address',
      default: 'Default',
      edit: 'Edit',
      remove: 'Remove',
      noAddresses: 'No addresses saved',
      noAddressesDesc: 'Add an address to get started.',
    },
    ar: {
      title: 'إدارة العناوين',
      subtitle: 'أضف أو عدّل أو أزل عناوين الشحن والفوترة.',
      addNew: 'إضافة عنوان جديد',
      shippingAddress: 'عنوان الشحن',
      billingAddress: 'عنوان الفوترة',
      default: 'الافتراضي',
      edit: 'تعديل',
      remove: 'إزالة',
      noAddresses: 'لا توجد عناوين محفوظة',
      noAddressesDesc: 'أضف عنوانًا للبدء.',
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
        {mockAddresses.map((address) => (
          <Card key={address.id}>
            <CardHeader>
              <CardTitle className="flex justify-between items-start">
                <span>
                  {address.type === 'Shipping'
                    ? t[language].shippingAddress
                    : t[language].billingAddress}
                </span>
                {address.isDefault && (
                  <span className="text-xs font-normal bg-primary text-primary-foreground rounded-full px-2 py-0.5">
                    {t[language].default}
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{address.address}</p>
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

      {mockAddresses.length === 0 && (
        <div className="text-center py-16 border-2 border-dashed rounded-lg">
          <h3 className="text-xl font-semibold">{t[language].noAddresses}</h3>
          <p className="text-muted-foreground mt-2">
            {t[language].noAddressesDesc}
          </p>
        </div>
      )}
    </div>
  );
}
