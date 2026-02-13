'use client';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { products } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Download, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

// Mock order data - in a real app this would be fetched
const mockOrders = [
  {
    id: 'ORD-12345',
    date: '2024-07-20',
    status: 'Delivered',
    total: 114.98,
    subtotal: 100.49,
    shipping: 5.0,
    tax: 9.49,
    items: [
      {
        productId: 'prod_4',
        quantity: 1,
        name: 'Floral Sundress',
        price: 75.5,
        variant: { Size: 'M' },
      },
      {
        productId: 'prod_2',
        quantity: 1,
        name: 'Organic Cotton T-Shirt',
        price: 24.99,
        variant: { Size: 'L', Color: 'White' },
      },
    ],
    shippingAddress: '123 Fashion Ave, New York, NY 10001',
    paymentMethod: 'Visa **** 4242',
  },
  {
    id: 'ORD-12344',
    date: '2024-07-15',
    status: 'Shipped',
    total: 65.0,
    subtotal: 65.0,
    shipping: 0,
    tax: 0,
    items: [
      {
        productId: 'prod_3',
        quantity: 1,
        name: 'Slim-Fit Chinos',
        price: 65.0,
        variant: { Size: '32', Color: 'Khaki' },
      },
    ],
    shippingAddress: '123 Fashion Ave, New York, NY 10001',
    paymentMethod: 'Visa **** 4242',
  },
  {
    id: 'ORD-12342',
    date: '2024-07-10',
    status: 'Processing',
    total: 220.0,
    subtotal: 220.0,
    shipping: 0,
    tax: 0,
    items: [
      {
        productId: 'prod_8',
        quantity: 1,
        name: 'Classic Trench Coat',
        price: 220.0,
        variant: { Size: 'M', Color: 'Beige' },
      },
    ],
    shippingAddress: '456 Style St, Los Angeles, CA 90001',
    paymentMethod: 'Mastercard **** 5555',
  },
  {
    id: 'ORD-12341',
    date: '2024-06-28',
    status: 'Delivered',
    total: 75.5,
    subtotal: 75.5,
    shipping: 0,
    tax: 0,
    items: [
      {
        productId: 'prod_4',
        quantity: 1,
        name: 'Floral Sundress',
        price: 75.5,
        variant: { Size: 'S', Color: 'Yellow' },
      },
    ],
    shippingAddress: '123 Fashion Ave, New York, NY 10001',
    paymentMethod: 'Visa **** 4242',
  },
];

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = mockOrders.find((o) => o.id === id);
  const { language } = useSettings();

  const t = {
    en: {
      backToOrders: 'Back to orders',
      title: 'Order Details',
      orderId: 'Order ID',
      summaryTitle: 'Order Summary',
      placedOn: 'Placed on',
      quantity: 'Qty',
      subtotal: 'Subtotal',
      shipping: 'Shipping',
      taxes: 'Taxes',
      total: 'Total',
      downloadInvoice: 'Download Invoice',
      reorder: 'Reorder',
      shippingAddress: 'Shipping Address',
      paymentMethod: 'Payment Method',
      status_delivered: 'Delivered',
      status_shipped: 'Shipped',
      status_processing: 'Processing',
    },
    ar: {
      backToOrders: 'العودة إلى الطلبات',
      title: 'تفاصيل الطلب',
      orderId: 'رقم الطلب',
      summaryTitle: 'ملخص الطلب',
      placedOn: 'تم الطلب في',
      quantity: 'الكمية',
      subtotal: 'المجموع الفرعي',
      shipping: 'الشحن',
      taxes: 'الضرائب',
      total: 'الإجمالي',
      downloadInvoice: 'تنزيل الفاتورة',
      reorder: 'إعادة الطلب',
      shippingAddress: 'عنوان الشحن',
      paymentMethod: 'طريقة الدفع',
      status_delivered: 'تم التوصيل',
      status_shipped: 'تم الشحن',
      status_processing: 'قيد المعالجة',
    },
  };

  if (!order) {
    notFound();
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'default';
      case 'Shipped':
        return 'secondary';
      case 'Processing':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const getStatusTranslation = (status: string) => {
    if (language === 'ar') {
      switch (status) {
        case 'Delivered':
          return t.ar.status_delivered;
        case 'Shipped':
          return t.ar.status_shipped;
        case 'Processing':
          return t.ar.status_processing;
      }
    }
    return status;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="icon">
          <Link href="/account/orders">
            <ArrowLeft className="h-4 w-4" />
            <span className="sr-only">{t[language].backToOrders}</span>
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {t[language].title}
          </h1>
          <p className="text-muted-foreground">
            {t[language].orderId}: {order.id}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t[language].summaryTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {t[language].placedOn} {order.date}
            </p>
          </div>
          <Badge variant={getStatusVariant(order.status) as any}>
            {getStatusTranslation(order.status)}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {order.items.map((item) => {
              const product = products.find((p) => p.id === item.productId);
              const image = product
                ? PlaceHolderImages.find((img) => img.id === product.images[0])
                : null;
              return (
                <div key={item.productId} className="flex items-center gap-4">
                  <div className="relative h-16 w-16 rounded-md overflow-hidden bg-muted">
                    {image && (
                      <Image
                        src={image.imageUrl}
                        alt={item.name}
                        fill
                        className="object-cover"
                        data-ai-hint={image.imageHint || 'product image'}
                      />
                    )}
                  </div>
                  <div className="flex-grow">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {t[language].quantity}: {item.quantity}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t[language].subtotal}
              </span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">
                {t[language].shipping}
              </span>
              <span>{formatCurrency(order.shipping)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t[language].taxes}</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-base">
              <span>{t[language].total}</span>
              <span>{formatCurrency(order.total)}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            {t[language].downloadInvoice}
          </Button>
          <Button>
            <RefreshCw className="mr-2 h-4 w-4" />
            {t[language].reorder}
          </Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t[language].shippingAddress}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.shippingAddress}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t[language].paymentMethod}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{order.paymentMethod}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
