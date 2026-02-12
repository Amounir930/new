'use client';

// S8 FIX: Robust 404 logic that is strictly dependency-free.
// Using raw <a> tags and inline styles/classes to guarantee build success.
// Prevents "Minified React Error #31" by avoiding all context/hooks.

export default function NotFound() {
  return (
    <div className="container flex min-h-[70vh] flex-col items-center justify-center text-center">
      <div className="mb-4 text-8xl font-bold text-primary">404</div>
      <h1 className="text-4xl font-bold tracking-tight">الصفحة غير موجودة</h1>
      <p className="mt-2 text-lg text-muted-foreground">
        عفوًا! الصفحة التي تبحث عنها غير موجودة.
      </p>
      <p className="mt-1 text-muted-foreground">
        ربما تم نقلها أو حذفها.
      </p>
      <div className="mt-8 flex items-center gap-4">
        <a
          href="/"
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
        >
          العودة إلى الصفحة الرئيسية
        </a>
      </div>
    </div>
  );
}
