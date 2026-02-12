'use client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSettings } from '@/contexts/SettingsProvider';

const mockOrders = [
  { id: 'ORD-12345', date: '2024-07-20', status: 'Delivered', total: 114.98 },
  { id: 'ORD-12344', date: '2024-07-15', status: 'Shipped', total: 65.0 },
  { id: 'ORD-12342', date: '2024-07-10', status: 'Processing', total: 220.0 },
  { id: 'ORD-12341', date: '2024-06-28', status: 'Delivered', total: 75.5 },
];

export default function MyOrdersPage() {
  const { language } = useSettings();
  const t = {
    en: {
      title: 'My Orders',
      orderId: 'Order ID',
      date: 'Date',
      status: 'Status',
      total: 'Total',
      viewDetails: 'View Details',
      noOrders: 'No orders yet',
      noOrdersDesc: "You haven't placed any orders with us.",
      startShopping: 'Start Shopping',
      status_delivered: 'Delivered',
      status_shipped: 'Shipped',
      status_processing: 'Processing',
    },
    ar: {
      title: 'طلباتي',
      orderId: 'رقم الطلب',
      date: 'التاريخ',
      status: 'الحالة',
      total: 'الإجمالي',
      viewDetails: 'عرض التفاصيل',
      noOrders: 'لا توجد طلبات بعد',
      noOrdersDesc: 'لم تقم بوضع أي طلبات معنا.',
      startShopping: 'ابدأ التسوق',
      status_delivered: 'تم التوصيل',
      status_shipped: 'تم الشحن',
      status_processing: 'قيد المعالجة',
    },
  };

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
    <Card>
      <CardHeader>
        <CardTitle>{t[language].title}</CardTitle>
      </CardHeader>
      <CardContent>
        {mockOrders.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t[language].orderId}</TableHead>
                <TableHead>{t[language].date}</TableHead>
                <TableHead>{t[language].status}</TableHead>
                <TableHead className="text-right">
                  {t[language].total}
                </TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.id}</TableCell>
                  <TableCell>{order.date}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusVariant(order.status) as any}>
                      {getStatusTranslation(order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    ${order.total.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/account/orders/${order.id}`}>
                        {t[language].viewDetails}
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold">{t[language].noOrders}</h3>
            <p className="text-muted-foreground mt-2">
              {t[language].noOrdersDesc}
            </p>
            <Button asChild className="mt-4">
              <Link href="/shop">{t[language].startShopping}</Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
