"use client";

import Link from 'next/link';
import { Search, User, Heart, ShoppingBag, Menu, Sun, Moon, Languages, Paintbrush, Bell, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useCart } from '@/contexts/CartContext';
import { CartSheet } from '@/components/cart/CartSheet';
import { Logo } from '@/components/icons/Logo';
import { useSettings } from '@/contexts/SettingsProvider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Header() {
  const { getCartItemCount } = useCart();
  const { theme, setTheme, language, setLanguage } = useSettings();
  const cartItemCount = getCartItemCount();

  const t = {
    en: {
      shop: 'Shop',
      men: 'Men',
      women: 'Women',
      deals: 'Deals',
      blog: 'Blog',
      toggleMenu: 'Toggle menu',
      searchPlaceholder: 'Search products...',
      search: 'Search',
      wishlist: 'Wishlist',
      account: 'Account',
      cart: 'Shopping Cart',
      notifications: 'Notifications',
      lightMode: 'Light',
      darkMode: 'Dark',
      designMode: 'Design',
      language: 'Language',
      theme: 'Theme',
      visualSearch: 'Visual Search',
    },
    ar: {
      shop: 'المتجر',
      men: 'رجال',
      women: 'نساء',
      deals: 'عروض',
      blog: 'المدونة',
      toggleMenu: 'تبديل القائمة',
      searchPlaceholder: 'ابحث عن منتجات...',
      search: 'بحث',
      wishlist: 'قائمة الرغبات',
      account: 'الحساب',
      cart: 'عربة التسوق',
      notifications: 'الإشعارات',
      lightMode: 'فاتح',
      darkMode: 'داكن',
      designMode: 'تصميم',
      language: 'اللغة',
      theme: 'السمة',
      visualSearch: 'البحث بالصور',
    }
  };

  const navLinks = [
    { href: '/shop', label: t[language].shop },
    { href: '/shop/category/men', label: t[language].men },
    { href: '/shop/category/women', label: t[language].women },
    { href: '/deals', label: t[language].deals },
    { href: '/blog', label: t[language].blog },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Mobile Menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">{t[language].toggleMenu}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={language === 'ar' ? 'right' : 'left'}>
              <nav className="mt-8 grid gap-6 text-lg font-medium">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                  <Logo className="h-8 w-auto" />
                </Link>
                {navLinks.map(({ href, label }) => (
                  <Link key={href} href={href} className="text-muted-foreground hover:text-foreground">
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Desktop Logo & Nav */}
        <div className="hidden items-center gap-6 md:flex">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold">
            <Logo className="h-8 w-auto" />
            <span className="sr-only">StyleGrove</span>
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium">
            {navLinks.map(({ href, label }) => (
              <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                {label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Logo (centered) */}
        <div className="flex flex-1 justify-center md:hidden">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold">
                <Logo className="h-8 w-auto" />
                <span className="sr-only">StyleGrove</span>
            </Link>
        </div>

        {/* Search and Actions */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <div className="relative hidden w-full max-w-xs lg:block">
            <Input type="search" placeholder={t[language].searchPlaceholder} className="pe-10" />
            <Search className="absolute end-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          </div>
          <Button variant="ghost" size="icon" className="lg:hidden">
            <Search />
            <span className="sr-only">{t[language].search}</span>
          </Button>

          <Button asChild variant="ghost" size="icon">
            <Link href="/visual-search">
              <Camera />
              <span className="sr-only">{t[language].visualSearch}</span>
            </Link>
          </Button>

          {/* Language Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Languages />
                <span className="sr-only">{t[language].language}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('ar')}>العربية</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Theme Switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                 <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                 <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                 <span className="sr-only">{t[language].theme}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme('light')}>
                <Sun className="me-2 h-4 w-4" />
                {t[language].lightMode}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('dark')}>
                <Moon className="me-2 h-4 w-4" />
                {t[language].darkMode}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme('design')}>
                <Paintbrush className="me-2 h-4 w-4" />
                {t[language].designMode}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button asChild variant="ghost" size="icon">
            <Link href="/account/notifications">
              <Bell />
              <span className="sr-only">{t[language].notifications}</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon">
            <Link href="/account/wishlist">
              <Heart />
              <span className="sr-only">{t[language].wishlist}</span>
            </Link>
          </Button>

          <Button asChild variant="ghost" size="icon">
            <Link href="/account">
              <User />
              <span className="sr-only">{t[language].account}</span>
            </Link>
          </Button>
          
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingBag />
                {cartItemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                    {cartItemCount}
                  </span>
                )}
                <span className="sr-only">{t[language].cart}</span>
              </Button>
            </SheetTrigger>
            <CartSheet />
          </Sheet>
        </div>
      </div>
    </header>
  );
}
