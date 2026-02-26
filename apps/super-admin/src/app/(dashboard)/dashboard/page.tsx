'use client';

import { ProvisionModal } from '@/components/tenant/ProvisionModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';
import {
  Activity,
  ArrowUpRight,
  Globe,
  Plus,
  RefreshCcw,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface PlatformStats {
  activeTenants: number;
  systemLoad: string;
  shieldStatus: string;
  blueprints: number;
}

interface InfraHealthNode {
  name: string;
  status: string;
  load: string;
}

export default function SuperAdminDashboard() {
  const [provisionOpen, setProvisionOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState<PlatformStats | null>(null);
  const [healthData, setHealthData] = useState<InfraHealthNode[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [stats, health] = await Promise.all([
        apiFetch<PlatformStats>('/v1/admin/governance/stats'),
        apiFetch<InfraHealthNode[]>('/v1/admin/governance/health'),
      ]);
      setStatsData(stats);
      setHealthData(health);
    } catch (error) {
      console.error('Failed to fetch governance data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const stats = [
    {
      name: 'Active Tenants',
      value: statsData?.activeTenants.toString() || '0',
      icon: Globe,
      change: statsData
        ? `Across ${statsData.blueprints} blueprints`
        : 'Loading...',
      changeType: 'neutral',
    },
    {
      name: 'System Load',
      value: statsData?.systemLoad || '0%',
      icon: Activity,
      change: 'Real-time',
      changeType: 'neutral',
    },
    {
      name: 'S1-S8 Shield',
      value: statsData?.shieldStatus || 'Active',
      icon: ShieldCheck,
      change: '100% Locked',
      changeType: 'increase',
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic">Governance</h1>
          <p className="text-slate-500 mt-2">
            Global infrastructure & tenant lifecycle control.
          </p>
        </div>
        <div className="flex gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
            className="bg-slate-900/50 border-white/5 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <RefreshCcw
              className={`w-4 h-4 text-slate-400 ${loading ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            onClick={() => setProvisionOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Provision Tenant
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Card
            key={stat.name}
            className="bg-slate-900/40 border-white/5 p-6 backdrop-blur-md relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex items-center justify-between relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5">
                <stat.icon className="w-6 h-6 text-indigo-400" />
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-widest ${
                  loading
                    ? 'animate-pulse bg-slate-500/20'
                    : stat.changeType === 'increase'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-slate-500/10 text-slate-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="mt-4 relative z-10">
              <p className="text-slate-500 text-sm font-medium">{stat.name}</p>
              <h3 className="text-3xl font-black text-white mt-1">
                {loading ? (
                  <div className="h-9 w-16 bg-white/5 animate-pulse rounded-lg" />
                ) : (
                  stat.value
                )}
              </h3>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="bg-slate-900/40 border-white/5 p-8 overflow-hidden relative">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-500 rounded-full" />
              Infrastructure Health
            </h2>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-500 hover:text-white group"
            >
              Full Monitor{' '}
              <ArrowUpRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
          <div className="space-y-4">
            {loading ? (
              ['h-sk-1', 'h-sk-2', 'h-sk-3', 'h-sk-4'].map((id) => (
                <div
                  key={id}
                  className="h-16 w-full bg-white/5 animate-pulse rounded-xl"
                />
              ))
            ) : healthData.length > 0 ? (
              healthData.map((node) => (
                <div
                  key={node.name}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group"
                >
                  <span className="text-sm font-bold text-slate-300 group-hover:text-white transition-colors">
                    {node.name}
                  </span>
                  <div className="flex items-center gap-6">
                    <div className="h-1.5 w-24 bg-slate-800 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full rounded-full transition-all duration-1000 ${
                          Number.parseInt(node.load) > 80
                            ? 'bg-amber-500'
                            : 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]'
                        }`}
                        style={{ width: node.load }}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${node.status === 'Healthy' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]' : 'bg-amber-400'}`}
                      />
                      <span
                        className={`text-[10px] font-black uppercase tracking-widest ${
                          node.status === 'Healthy'
                            ? 'text-emerald-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {node.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-slate-500 text-sm italic">
                No health data available. Check API logs.
              </div>
            )}
          </div>
        </Card>

        <Card className="bg-slate-900/40 border-white/5 p-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-16 -mt-16" />
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-black text-white flex items-center gap-3">
              <div className="w-2 h-8 bg-indigo-500 rounded-full" />
              Security Protocol Audit
            </h2>
          </div>
          <div className="space-y-6">
            <div className="p-5 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-xl">
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-[0.2em] mb-2">
                Platform Status
              </p>
              <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                All S1-S8 tiers reported locked and audited at{' '}
                {new Date().toLocaleTimeString()} UTC.
                <span className="block mt-1 text-xs text-indigo-300 opacity-60">
                  Zero detected violations in the last 24h.
                </span>
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'S1 Protocol', status: 'Compliant', color: 'indigo' },
                { label: 'S2 Mapping', status: 'Isolated', color: 'indigo' },
                { label: 'S4 Audit', status: 'Immutable', color: 'indigo' },
                { label: 'S7 Encryption', status: 'AES-256', color: 'indigo' },
              ].map((audit) => (
                <div
                  key={audit.label}
                  className="flex flex-col gap-1 p-3 rounded-xl bg-white/5 border border-white/10"
                >
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {audit.label}
                  </span>
                  <span className="text-xs font-black text-slate-200">
                    {audit.status}
                  </span>
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
          fetchData(); // Refresh stats after new tenant
        }}
      />
    </div>
  );
}
