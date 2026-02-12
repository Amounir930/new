'use client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ShoppingBag, MapPin, Heart } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

export default function AccountDashboardPage() {
  const { language } = useSettings();
  // Mock user data
  const user = {
    name: 'Jana',
    email: 'jana@example.com',
    recentOrders: 2,
    loyaltyPoints: 150,
  };

  const t = {
    en: {
      welcome: `Welcome, ${user.name}!`,
      subtitle: "Here's a summary of your account.",
      recentOrders: 'Recent Orders',
      recentOrdersDesc: 'orders placed this month',
      viewOrders: 'View Orders',
      loyaltyPoints: 'Loyalty Points',
      loyaltyPointsDesc: 'points available to redeem',
      viewRewards: 'View Rewards',
      quickActions: 'Quick Actions',
      myOrders: 'My Orders',
      manageAddresses: 'Manage Addresses',
      myWishlist: 'My Wishlist',
    },
    ar: {
      welcome: `مرحباً، ${user.name}!`,
      subtitle: 'إليك ملخص لحسابك.',
      recentOrders: 'الطلبات الأخيرة',
      recentOrdersDesc: 'طلبات هذا الشهر',
      viewOrders: 'عرض الطلبات',
      loyaltyPoints: 'نقاط الولاء',
      loyaltyPointsDesc: 'نقاط متاحة للاستبدال',
      viewRewards: 'عرض المكافآت',
      quickActions: 'إجراءات سريعة',
      myOrders: 'طلباتي',
      manageAddresses: 'إدارة العناوين',
      myWishlist: 'قائمة أمنياتي',
    },
  };

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">
          {t[language].welcome}
        </h1>
        <p className="mt-1 text-muted-foreground">{t[language].subtitle}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t[language].recentOrders}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{user.recentOrders}</p>
            <p className="text-sm text-muted-foreground">
              {t[language].recentOrdersDesc}
            </p>
            <Button asChild variant="link" className="px-0">
              <Link href="/account/orders">{t[language].viewOrders}</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t[language].loyaltyPoints}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{user.loyaltyPoints}</p>
            <p className="text-sm text-muted-foreground">
              {t[language].loyaltyPointsDesc}
            </p>
            <Button asChild variant="link" className="px-0">
              <Link href="/account/loyalty">{t[language].viewRewards}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">{t[language].quickActions}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <Button
            asChild
            variant="outline"
            className="justify-start h-16 text-base"
          >
            <Link href="/account/orders">
              <ShoppingBag className="mr-3 h-6 w-6" />
              {t[language].myOrders}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-start h-16 text-base"
          >
            <Link href="/account/addresses">
              <MapPin className="mr-3 h-6 w-6" />
              {t[language].manageAddresses}
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="justify-start h-16 text-base"
          >
            <Link href="/account/wishlist">
              <Heart className="mr-3 h-6 w-6" />
              {t[language].myWishlist}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
