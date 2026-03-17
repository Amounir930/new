'use client';

import { Users } from 'lucide-react';

export default function CustomersPage() {
  return (
    <div className="flex flex-col h-[80vh] items-center justify-center p-8 text-center space-y-4 font-sans">
      <div className="bg-indigo-500/10 p-6 rounded-2xl border border-indigo-500/20">
        <Users className="h-12 w-12 text-indigo-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">
          Identity <span className="text-indigo-600">Registry</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          The Merchant Node is currently synchronizing historical customer
          records. Deployment of the full registry interface is pending cluster
          stabilization.
        </p>
      </div>
    </div>
  );
}
