'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useSettings } from '@/contexts/SettingsProvider';
import {
  User,
  ShoppingBag,
  MapPin,
  Heart,
  CreditCard,
  Star,
  Bell,
  LogOut,
  Wallet,
  Award,
  Gift,
  Undo2,
} from 'lucide-react';

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { language } = useSettings();

  const t = {
    en: {
      dashboard: 'Dashboard',
      orders: 'My Orders',
      addresses: 'Addresses',
      wishlist: 'Wishlist',
      paymentMethods: 'Payment Methods',
      myReviews: 'My Reviews',
      notifications: 'Notifications',
      wallet: 'Wallet',
      loyalty: 'Loyalty Program',
      referral: 'Refer a Friend',
      returns: 'Returns',
      logout: 'Logout',
    },
    ar: {
      dashboard: 'لوحة التحكم',
      orders: 'طلباتي',
      addresses: 'عناويني',
      wishlist: 'قائمة الرغبات',
      paymentMethods: 'طرق الدفع',
      myReviews: 'تقييماتي',
      notifications: 'الإشعارات',
      wallet: 'المحفظة',
      loyalty: 'برنامج الولاء',
      referral: 'دعوة صديق',
      returns: 'المرتجعات',
      logout: 'تسجيل الخروج',
    },
  };

  const navItems = [
    { href: '/account', label: t[language].dashboard, icon: User },
    { href: '/account/orders', label: t[language].orders, icon: ShoppingBag },
    { href: '/account/addresses', label: t[language].addresses, icon: MapPin },
    { href: '/account/wishlist', label: t[language].wishlist, icon: Heart },
    {
      href: '/account/payment-methods',
      label: t[language].paymentMethods,
      icon: CreditCard,
    },
    { href: '/account/wallet', label: t[language].wallet, icon: Wallet },
    { href: '/account/loyalty', label: t[language].loyalty, icon: Award },
    { href: '/account/referral', label: t[language].referral, icon: Gift },
    { href: '/account/reviews', label: t[language].myReviews, icon: Star },
    { href: '/account/returns', label: t[language].returns, icon: Undo2 },
    {
      href: '/account/notifications',
      label: t[language].notifications,
      icon: Bell,
    },
  ];

  return (
    <div className="container py-12 md:py-16">
      <div className="flex flex-col md:flex-row gap-12">
        <aside className="md:w-64 shrink-0">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
                  pathname.startsWith(item.href) &&
                    (item.href !== '/account' || pathname === '/account')
                    ? 'bg-muted text-foreground font-medium'
                    : ''
                )}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            ))}
            <Link
              href="/login" // Should handle logout logic
              className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-5 w-5" />
              <span>{t[language].logout}</span>
            </Link>
          </nav>
        </aside>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
