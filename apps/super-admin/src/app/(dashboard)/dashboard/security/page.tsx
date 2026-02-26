'use client';

import { ShieldCheck } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SecurityPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Security Audit</h1>
        <p className="text-slate-500 mt-2">
          S1-S15 protocol compliance and immutable audit logs.
        </p>
      </div>
      <Card className="bg-slate-900/40 border-white/5 p-20 backdrop-blur-md flex flex-col items-center justify-center text-center">
        <ShieldCheck className="w-12 h-12 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-white">Audit Trail</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          The security audit dashboard with GlitchTip and AuditLog integration
          is coming soon.
        </p>
      </Card>
    </div>
  );
}
