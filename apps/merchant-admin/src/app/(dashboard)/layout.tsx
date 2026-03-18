import { redirect } from 'next/navigation';
import { MerchantSidebar } from '@/components/layout/MerchantSidebar';
import { getSession } from '@/lib/session';

export default async function MerchantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <MerchantSidebar />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  );
}
