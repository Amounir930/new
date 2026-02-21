import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Apex Storefront',
  description: 'High performance e-commerce by Apex v2',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased font-sans bg-gray-50 text-gray-900">
        <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between">
            <div className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              APEX STORE
            </div>
            <nav className="hidden md:flex items-center gap-8">
              <a
                href="/"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Home
              </a>
              <a
                href="/shop"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Shop
              </a>
              <a
                href="/categories"
                className="text-sm font-medium hover:text-blue-600 transition-colors"
              >
                Categories
              </a>
            </nav>
            <div className="flex items-center gap-4">
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Search</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </button>
              <button
                type="button"
                className="p-2 hover:bg-gray-100 rounded-full transition-colors relative"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <title>Cart</title>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                <span className="absolute top-0 right-0 w-4 h-4 bg-blue-600 text-white text-[10px] flex items-center justify-center rounded-full">
                  0
                </span>
              </button>
            </div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-white border-t py-12">
          <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
            © 2026 Apex v2 Storefront. Secure & High Performance.
          </div>
        </footer>
      </body>
    </html>
  );
}
