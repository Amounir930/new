'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Truck, PackageCheck, Package, Loader2 } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

type OrderStatus = 'processing' | 'shipped' | 'delivered' | null;

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState('');
  const [status, setStatus] = useState<OrderStatus>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { language } = useSettings();

  const t = {
    en: {
        title: "Track Your Order",
        subtitle: "Enter your order ID to see its status.",
        placeholder: "Enter Order ID",
        track: "Track",
        tracking: "Tracking...",
        searching: "Searching for your order...",
        order: "Order",
        status_processing: "Processing",
        status_shipped: "Shipped",
        status_delivered: "Delivered",
        desc_processing: "Your order is being prepared for shipment.",
        desc_shipped: "Your order is on its way to you.",
        desc_delivered: "Your order has been delivered."
    },
    ar: {
        title: "تتبع طلبك",
        subtitle: "أدخل رقم طلبك لمعرفة حالته.",
        placeholder: "أدخل رقم الطلب",
        track: "تتبع",
        tracking: "جارٍ التتبع...",
        searching: "جارٍ البحث عن طلبك...",
        order: "طلب",
        status_processing: "قيد المعالجة",
        status_shipped: "تم الشحن",
        status_delivered: "تم التوصيل",
        desc_processing: "طلبك قيد التجهيز للشحن.",
        desc_shipped: "طلبك في طريقه إليك.",
        desc_delivered: "تم توصيل طلبك."
    }
  };


  const handleTrackOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) return;

    setIsLoading(true);
    setStatus(null);

    // Simulate API call
    setTimeout(() => {
      const randomStatus: OrderStatus[] = ['processing', 'shipped', 'delivered'];
      const result = randomStatus[Math.floor(Math.random() * randomStatus.length)];
      setStatus(result);
      setIsLoading(false);
    }, 1500);
  };

  const StatusDisplay = () => {
    if (!status) return null;
    
    const statusInfo = {
        processing: { icon: <Package className="h-8 w-8 text-amber-500" />, title: t[language].status_processing, description: t[language].desc_processing },
        shipped: { icon: <Truck className="h-8 w-8 text-blue-500" />, title: t[language].status_shipped, description: t[language].desc_shipped },
        delivered: { icon: <PackageCheck className="h-8 w-8 text-green-500" />, title: t[language].status_delivered, description: t[language].desc_delivered },
    }

    return (
        <Card className="mt-8">
            <CardHeader className="text-center">
                <CardTitle>{t[language].order} #{orderId}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 text-center">
                {statusInfo[status].icon}
                <h3 className="text-2xl font-semibold">{statusInfo[status].title}</h3>
                <p className="text-muted-foreground">{statusInfo[status].description}</p>
            </CardContent>
        </Card>
    )
  }

  return (
    <div className="container py-12 md:py-16">
      <header className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight">{t[language].title}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t[language].subtitle}
        </p>
      </header>

      <div className="mx-auto max-w-md">
        <Card>
          <CardContent className="p-6">
            <form onSubmit={handleTrackOrder} className="flex gap-2">
              <Input
                placeholder={t[language].placeholder}
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
              />
              <Button type="submit" disabled={isLoading}>
                {isLoading ? t[language].tracking : t[language].track}
              </Button>
            </form>
          </CardContent>
        </Card>
        {isLoading && (
            <div className="flex justify-center items-center text-muted-foreground mt-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin"/>
                {t[language].searching}
            </div>
        )}
        <StatusDisplay />
      </div>
    </div>
  );
}
