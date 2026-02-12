'use client';

import Link from 'next/link';

// S8 FIX: Robust 404 logic that doesn't rely on Context during static build
// We hardcode the 'ar' translation here to ensure it *always* works during build.
// This prevents Minified React Error #31 when Providers are missing in static generation.

const content = {
  title: 'الصفحة غير موجودة',
  subtitle: 'عفوًا! الصفحة التي تبحث عنها غير موجودة.',
  description: 'ربما تم نقلها أو حذفها.',
  returnHome: 'العودة إلى الصفحة الرئيسية',
};

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-8xl font-bold text-primary">404</div>
      <h1 className="text-4xl font-bold tracking-tight">{content.title}</h1>
      <p className="mt-2 text-lg text-muted-foreground">{content.subtitle}</p>
      <p className="mt-1 text-muted-foreground">{content.description}</p>
      <div className="mt-8 flex items-center gap-4">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          {content.returnHome}
        </Link>
      </div>
    </div>
  );
}
