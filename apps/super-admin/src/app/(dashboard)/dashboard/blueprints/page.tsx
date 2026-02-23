'use client';

import { LayoutGrid, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function BlueprintsPage() {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">Blueprints</h1>
                    <p className="text-slate-500 mt-2">Manage sector-specific store templates and default configurations.</p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6">
                    <Plus className="w-4 h-4 mr-2" />
                    New Blueprint
                </Button>
            </div>

            <Card className="bg-slate-900/40 border-white/5 p-20 backdrop-blur-md flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 mb-6">
                    <LayoutGrid className="w-8 h-8 text-slate-500" />
                </div>
                <h2 className="text-xl font-bold text-white">Template Management</h2>
                <p className="text-slate-500 max-w-sm mt-2">This module is coming soon. You will be able to manage sector blueprints and provisioning defaults here.</p>
            </Card>
        </div>
    );
}
