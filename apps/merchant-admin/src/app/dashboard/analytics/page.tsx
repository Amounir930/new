'use client';

import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col h-[80vh] items-center justify-center p-8 text-center space-y-4 font-sans">
      <div className="bg-blue-500/10 p-6 rounded-2xl border border-blue-500/20">
        <BarChart3 className="h-12 w-12 text-blue-600" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">
          Node <span className="text-blue-600">Intelligence</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Telemetry data processing in progress. The analytics engine is
          aggregating cross-cluster metrics for real-time visualization.
        </p>
      </div>
    </div>
  );
}
