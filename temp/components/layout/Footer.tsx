'use client';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/icons/Logo';
import { Github, Twitter, Instagram } from 'lucide-react';
import { useSettings } from '@/contexts/SettingsProvider';

export function Footer() {
  const { language } = useSettings();

  const t = {
    en: {
      description:
        'Your destination for modern fashion, curated with style and delivered with love.',
      enterEmail: 'Enter your email',
      subscribe: 'Subscribe',
      shop: 'Shop',
      men: 'Men',
      women: 'Women',
      kids: 'Kids',
      deals: 'Deals',
      support: 'Support',
      about: 'About Us',
      faq: 'FAQ',
      contact: 'Contact Us',
      helpCenter: 'Help Center',
      trackOrder: 'Track Order',
      returns: 'Returns',
      stores: 'Store Locator',
      legal: 'Legal',
      privacy: 'Privacy Policy',
      terms: 'Terms of Service',
      refund: 'Refund Policy',
      copyright: `© ${new Date().getFullYear()} StyleGrove. All rights reserved.`,
    },
    ar: {
      description: 'وجهتك للأزياء العصرية، منسقة بأناقة وتسليمها بالحب.',
      enterEmail: 'أدخل بريدك الإلكتروني',
      subscribe: 'اشترك',
      shop: 'تسوق',
      men: 'رجال',
      women: 'نساء',
      kids: 'أطفال',
      deals: 'عروض',
      support: 'الدعم',
      about: 'من نحن',
      faq: 'الأسئلة الشائعة',
      contact: 'اتصل بنا',
      helpCenter: 'مركز المساعدة',
      trackOrder: 'تتبع الطلب',
      returns: 'المرتجعات',
      stores: 'مواقع المتاجر',
      legal: 'قانوني',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط الخدمة',
      refund: 'سياسة الاسترداد',
      copyright: `© ${new Date().getFullYear()} StyleGrove. كل الحقوق محفوظة.`,
    },
  };

  return (
    <footer className="bg-muted text-muted-foreground">
      <div className="container py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="flex flex-col gap-4 lg:col-span-2">
            <Link
              href="/"
              className="flex items-center gap-2 text-xl font-bold text-foreground"
            >
              <Logo className="h-8 w-auto" />
              <span>StyleGrove</span>
            </Link>
            <p className="max-w-sm">{t[language].description}</p>
            <div className="flex items-center space-x-2">
              <Input
                type="email"
                placeholder={t[language].enterEmail}
                className="max-w-xs bg-background"
              />
              <Button type="submit">{t[language].subscribe}</Button>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">
              {t[language].shop}
            </h4>
            <div className="flex flex-col gap-2">
              <Link href="/shop/category/men" className="hover:text-foreground">
                {t[language].men}
              </Link>
              <Link
                href="/shop/category/women"
                className="hover:text-foreground"
              >
                {t[language].women}
              </Link>
              <Link
                href="/shop/category/kids"
                className="hover:text-foreground"
              >
                {t[language].kids}
              </Link>
              <Link href="/deals" className="hover:text-foreground">
                {t[language].deals}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">
              {t[language].support}
            </h4>
            <div className="flex flex-col gap-2">
              <Link href="/about" className="hover:text-foreground">
                {t[language].about}
              </Link>
              <Link href="/contact" className="hover:text-foreground">
                {t[language].contact}
              </Link>
              <Link href="/faq" className="hover:text-foreground">
                {t[language].faq}
              </Link>
              <Link href="/help" className="hover:text-foreground">
                {t[language].helpCenter}
              </Link>
              <Link href="/track-order" className="hover:text-foreground">
                {t[language].trackOrder}
              </Link>
              <Link href="/returns" className="hover:text-foreground">
                {t[language].returns}
              </Link>
              <Link href="/stores" className="hover:text-foreground">
                {t[language].stores}
              </Link>
            </div>
          </div>

          <div>
            <h4 className="mb-4 font-semibold text-foreground">
              {t[language].legal}
            </h4>
            <div className="flex flex-col gap-2">
              <Link href="/privacy-policy" className="hover:text-foreground">
                {t[language].privacy}
              </Link>
              <Link href="/terms-of-service" className="hover:text-foreground">
                {t[language].terms}
              </Link>
              <Link href="/refund-policy" className="hover:text-foreground">
                {t[language].refund}
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t pt-8 md:flex-row">
          <p className="text-sm">{t[language].copyright}</p>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:text-foreground">
              <Instagram size={20} />
            </Link>
            <Link href="#" className="hover:text-foreground">
              <Twitter size={20} />
            </Link>
            <Link href="#" className="hover:text-foreground">
              <Github size={20} />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
