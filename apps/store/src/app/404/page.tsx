import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0a0a0a] text-white p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative inline-block">
          <h1 className="text-9xl font-bold opacity-10">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 bg-blue-600 rounded-full blur-2xl opacity-50 animate-pulse" />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">
            المتجر غير موجود
          </h2>
          <p className="text-gray-400 text-lg leading-relaxed">
            عذراً، المتجر الذي تحاول الوصول إليه غير مسجل في نظامنا أو قد تم
            حذفه.
          </p>
        </div>

        <div className="pt-8">
          <Link
            href="https://60sec.shop"
            className="inline-flex items-center justify-center px-8 py-3 rounded-full bg-white text-black font-semibold hover:bg-gray-200 transition-colors duration-200 shadow-lg shadow-white/5"
          >
            العودة للمنصة الرئيسية
          </Link>
        </div>

        <div className="pt-12 border-t border-white/5">
          <p className="text-sm text-gray-500 uppercase tracking-widest font-mono">
            Protocol S11: Ghost Tenant Neutralized
          </p>
        </div>
      </div>
    </div>
  );
}
