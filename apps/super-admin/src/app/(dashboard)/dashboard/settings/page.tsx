'use client';

import { Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';

export default function SettingsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-black text-white">Global Settings</h1>
                <p className="text-slate-500 mt-2">Configure system-wide variables, API keys, and maintenance modes.</p>
            </div>
            <Card className="bg-slate-900/40 border-white/5 p-20 backdrop-blur-md flex flex-col items-center justify-center text-center">
                <Settings className="w-12 h-12 text-slate-700 mb-4" />
                <h2 className="text-xl font-bold text-white">System Config</h2>
                <p className="text-slate-500 max-w-sm mt-2">Global settings management module is coming soon.</p>
            </Card>
        </div>
    );
}
