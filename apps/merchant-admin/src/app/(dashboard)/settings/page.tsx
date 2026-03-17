'use client';

import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-[80vh] items-center justify-center p-8 text-center space-y-4 font-sans">
      <div className="bg-slate-900/10 p-6 rounded-2xl border border-slate-900/20">
        <Settings className="h-12 w-12 text-slate-900" />
      </div>
      <div className="space-y-2">
        <h1 className="text-3xl font-black text-slate-900 uppercase italic">
          Operational <span className="text-slate-600">Governance</span>
        </h1>
        <p className="text-slate-500 font-medium max-w-md mx-auto">
          Node-level configuration interface is being audited for S1-S15
          protocol compliance. Manual overrides are temporarily restricted.
        </p>
      </div>
    </div>
  );
}
