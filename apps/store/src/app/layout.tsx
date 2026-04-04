import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Image from 'next/image';
import './globals.css';
import { CartButton, ToastProvider } from '@/components/layout/toast-provider';
import { UserMenu } from '@/components/layout/user-menu';
import { LoginModal } from '@/components/auth/login-modal';
import { getStoreBootstrap } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Apex Storefront',
  description: 'High performance e-commerce by Apex v2',
};


export const dynamic = 'force-dynamic';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const tenantId = headersList.get('x-tenant-id') || 'public';

  // 🛡️ ARCHITECTURAL ISOLATION (Protocol S2/S12)
  // CASE 1: Apex Marketing Domain (60sec.shop)
  if (tenantId === 'public') {
    return (
      <html lang="en">
        <body className="antialiased font-sans bg-[#0A0A0A] text-white">
          {/* 🚀 Pure Marketing Tree: Zero Providers, Zero E-commerce Bloat */}
          {children}
        </body>
      </html>
    );
  }

  // CASE 2: Tenant Storefront Domain (*.60sec.shop)
  // Fetch config for branding ONLY in the storefront branch.
  const bootstrap = await getStoreBootstrap(tenantId);
  const config = bootstrap?.config;

  const storeName =
    config?.storeName ||
    tenantId.charAt(0).toUpperCase() + tenantId.slice(1);
  const logoUrl = config?.logoUrl;

  return (
    <html lang="en">
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        <ToastProvider>
          <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {logoUrl && (
                  <div className="relative h-8 w-32">
                    <Image
                      src={logoUrl}
                      alt={storeName}
                      fill
                      className="object-contain object-left"
                      sizes="128px"
                    />
                  </div>
                )}
                <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {storeName}
                </div>
              </div>
              <nav className="hidden md:flex items-center gap-8">
                <a href="/" className="text-sm font-medium hover:text-blue-600 transition-colors">Home</a>
                <a href="/products" className="text-sm font-medium hover:text-blue-600 transition-colors">Shop</a>
                <a href="/categories" className="text-sm font-medium hover:text-blue-600 transition-colors">Categories</a>
              </nav>
              <div className="flex items-center gap-4">
                <button type="button" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <title>Search</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <UserMenu />
                <CartButton />
              </div>
            </div>
          </header>
          <main>{children}</main>
          <footer className="bg-white border-t py-12">
            <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
              © 2026 {storeName} | Apex v2. Secure & High Performance.
            </div>
          </footer>
        </ToastProvider>
        <LoginModal />
      </body>
    </html>
  );
}
