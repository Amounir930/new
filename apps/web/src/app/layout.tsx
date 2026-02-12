import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { CartProvider } from '@/contexts/CartContext';
import { SettingsProvider } from '@/contexts/SettingsProvider';
import { NewsletterPopup } from '@/components/layout/NewsletterPopup';
import { BackToTop } from '@/components/layout/BackToTop';
import { CookieConsent } from '@/components/layout/CookieConsent';

export const metadata: Metadata = {
  title: 'StyleGrove',
  description: 'Your destination for modern fashion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Tajawal:wght@300;400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body antialiased">
        <SettingsProvider>
          <CartProvider>
            <div className="flex min-h-screen flex-col">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
            <Toaster />
            <NewsletterPopup />
            <BackToTop />
            <CookieConsent />
          </CartProvider>
        </SettingsProvider>
      </body>
    </html>
  );
}
