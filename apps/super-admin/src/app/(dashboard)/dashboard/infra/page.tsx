'use client';

import { Card } from '@/components/ui/card';
import { Server, Settings, ShieldCheck } from 'lucide-react';

export default function InfraPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-white">Infrastructure</h1>
        <p className="text-slate-500 mt-2">
          Monitor physical nodes, clusters, and network stability.
        </p>
      </div>
      <Card className="bg-slate-900/40 border-white/5 p-20 backdrop-blur-md flex flex-col items-center justify-center text-center">
        <Server className="w-12 h-12 text-slate-700 mb-4" />
        <h2 className="text-xl font-bold text-white">Node Monitoring</h2>
        <p className="text-slate-500 max-w-sm mt-2">
          Real-time infrastructure health and Prometheus metrics integration
          coming soon.
        </p>
      </Card>
    </div>
  );
}
