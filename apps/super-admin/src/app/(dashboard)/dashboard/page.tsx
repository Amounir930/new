'use client';

import {
    Activity,
    Globe,
    ShieldCheck,
    Plus,
    ArrowUpRight,
    Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { ProvisionModal } from '@/components/tenant/ProvisionModal';

export default function SuperAdminDashboard() {
    const [provisionOpen, setProvisionOpen] = useState(false);

    const stats = [
        { name: 'Active Tenants', value: '12', icon: Globe, change: '+2 this week', changeType: 'increase' },
        { name: 'System Load', value: '14%', icon: Activity, change: 'Stable', changeType: 'neutral' },
        { name: 'S1-S8 Shield', value: 'Active', icon: ShieldCheck, change: '100% Locked', changeType: 'neutral' },
    ];

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-end justify-between">
                <div>
                    <h1 className="text-3xl font-black text-white">System Governance</h1>
                    <p className="text-slate-500 mt-2">Global overview of APEX infrastructure and tenant life cycle.</p>
                </div>
                <div className="flex gap-4">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                        <input
                            type="text"
                            placeholder="Search tenants..."
                            className="bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
                        />
                    </div>
                    <Button
                        onClick={() => setProvisionOpen(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Provision Tenant
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {stats.map((stat) => (
                    <Card key={stat.name} className="bg-slate-900/40 border-white/5 p-6 backdrop-blur-md">
                        <div className="flex items-center justify-between">
                            <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5">
                                <stat.icon className="w-6 h-6 text-indigo-400" />
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${stat.changeType === 'increase' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'
                                }`}>
                                {stat.change}
                            </span>
                        </div>
                        <div className="mt-4">
                            <p className="text-slate-500 text-sm font-medium">{stat.name}</p>
                            <h3 className="text-3xl font-black text-white mt-1">{stat.value}</h3>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-slate-900/40 border-white/5 p-8 overflow-hidden">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Activity className="w-5 h-5 text-indigo-400" />
                            Infrastructure Health
                        </h2>
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-white">
                            View Monitor <ArrowUpRight className="w-4 h-4 ml-1" />
                        </Button>
                    </div>
                    <div className="space-y-4">
                        {[
                            { name: 'PostgreSQL Primary', status: 'Healthy', load: '12%' },
                            { name: 'Redis Cache (Cluster)', status: 'Healthy', load: '8%' },
                            { name: 'MinIO Storage S3', status: 'Warning', load: '89%' },
                            { name: 'Deployment Webhook', status: 'Healthy', load: '1%' },
                        ].map((node) => (
                            <div key={node.name} className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
                                <span className="text-sm font-medium text-slate-300">{node.name}</span>
                                <div className="flex items-center gap-4">
                                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-1000 ${parseInt(node.load) > 80 ? 'bg-amber-500' : 'bg-indigo-500'
                                                }`}
                                            style={{ width: node.load }}
                                        />
                                    </div>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest ${node.status === 'Healthy' ? 'text-emerald-400' : 'text-amber-400'
                                        }`}>{node.status}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="bg-slate-900/40 border-white/5 p-8">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <ShieldCheck className="w-5 h-5 text-indigo-400" />
                            Security Protocol Audit
                        </h2>
                    </div>
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
                            <p className="text-xs text-indigo-300 font-bold uppercase tracking-widest mb-1">Status</p>
                            <p className="text-sm text-indigo-100 font-medium">All S1-S8 tiers reported locked and audited at 11:24:32 AM UTC.</p>
                        </div>
                        <div className="space-y-3">
                            {[
                                'S1: Config Isolation Active',
                                'S2: Tenant Schema Mapping Verified',
                                'S4: Immutable Audit Trail Live',
                                'S15: Read-only Webhook Fortress Upgrade Done',
                            ].map((audit) => (
                                <div key={audit} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-lg shadow-indigo-500/50" />
                                    <span className="text-xs text-slate-400 font-medium">{audit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </Card>
            </div>

            <ProvisionModal
                open={provisionOpen}
                onOpenChange={setProvisionOpen}
                onSuccess={() => {
                    // Show toast or notification
                }}
            />
        </div>
    );
}
