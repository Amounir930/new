'use client';

import {
  Calendar,
  CheckCircle2,
  ExternalLink,
  Filter,
  MoreVertical,
  Plus,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { ProvisionModal } from '@/components/tenant/ProvisionModal';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface Tenant {
  id: string;
  storeName: string;
  subdomain: string;
  plan: string;
  isActive: boolean;
  createdAt: string;
  adminEmail: string;
}

export default function TenantsPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [provisionOpen, setProvisionOpen] = useState(false);

  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/v1/admin/tenants');
      setTenants(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error('Failed to fetch tenants:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const filteredTenants = tenants.filter(
    (t) =>
      t.storeName.toLowerCase().includes(search.toLowerCase()) ||
      t.subdomain.toLowerCase().includes(search.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Tenants</h1>
          <p className="text-slate-500 mt-2">
            Manage all active store environments across the platform.
          </p>
        </div>
        <Button
          onClick={() => setProvisionOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6"
        >
          <Plus className="w-4 h-4 mr-2" />
          Provision Tenant
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            type="text"
            placeholder="Search by store name, subdomain, or admin email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-slate-900/50 border border-white/5 rounded-2xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-full"
          />
        </div>
        <Button
          variant="outline"
          className="border-white/5 bg-slate-900/50 rounded-2xl px-6"
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </Button>
      </div>

      <Card className="bg-slate-900/40 border-white/5 overflow-hidden backdrop-blur-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Store
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Subdomain
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Plan
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Status
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Joined
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                [1, 2, 3].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-white/5 rounded-lg" />
                    </td>
                  </tr>
                ))
              ) : filteredTenants.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Users className="w-12 h-12 text-slate-800" />
                      <p className="text-slate-500 font-medium">
                        No tenants found
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTenants.map((tenant) => (
                  <tr
                    key={tenant.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <p className="text-sm font-bold text-white">
                          {tenant.storeName}
                        </p>
                        <p className="text-xs text-slate-500">
                          {tenant.adminEmail}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-300">
                          {tenant.subdomain}
                        </span>
                        <a
                          href={`https://${tenant.subdomain}.60sec.shop`}
                          target="_blank"
                          rel="noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-indigo-400"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest ${
                          tenant.plan === 'enterprise'
                            ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                            : tenant.plan === 'pro'
                              ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                              : 'bg-slate-500/10 text-slate-400 border border-white/5'
                        }`}
                      >
                        {tenant.plan}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {tenant.isActive ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                            <span className="text-xs font-bold text-emerald-500">
                              Active
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-xs font-bold text-rose-500">
                              Suspended
                            </span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Calendar className="w-3 h-3" />
                        <span className="text-xs font-medium">
                          {new Date(tenant.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        type="button"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-500 hover:text-white"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ProvisionModal
        open={provisionOpen}
        onOpenChange={setProvisionOpen}
        onSuccess={() => {
          fetchTenants();
        }}
      />
    </div>
  );
}
