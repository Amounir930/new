import { SuperAdminSidebar } from '@/components/layout/SuperAdminSidebar';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500/30">
      <SuperAdminSidebar />
      <main className="flex-1 overflow-y-auto relative">
        {/* Subtle backgrounds or decorations could go here */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(99,102,241,0.05),transparent)] pointer-events-none" />
        <div className="relative p-10 max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
