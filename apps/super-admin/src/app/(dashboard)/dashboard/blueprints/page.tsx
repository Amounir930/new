'use client';

import {
  CheckCircle2,
  Clock,
  Edit3,
  LayoutGrid,
  Plus,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface Blueprint {
  id: string;
  name: string;
  description: string;
  plan: string;
  nicheType: string;
  status: 'active' | 'paused';
  isDefault: boolean;
  createdAt: string;
}

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBlueprints = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiFetch<Blueprint[]>('/v1/admin/blueprints');
      setBlueprints(data);
    } catch (_error) {
      /* 'Failed to fetch blueprints:', error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white italic">Blueprints</h1>
          <p className="text-slate-500 mt-2">
            Manage sector-specific store templates and default configurations.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Search templates..."
              className="bg-slate-900/50 border border-white/5 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all w-64"
            />
          </div>
          <Button
            asChild
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6 font-bold"
          >
            <Link href="/dashboard/blueprints/new">
              <Plus className="w-4 h-4 mr-2" />
              New Blueprint
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            'bp-sk-1',
            'bp-sk-2',
            'bp-sk-3',
            'bp-sk-4',
            'bp-sk-5',
            'bp-sk-6',
          ].map((id) => (
            <Card
              key={id}
              className="bg-slate-900/40 border-white/5 p-6 animate-pulse h-48"
            />
          ))}
        </div>
      ) : blueprints.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blueprints.map((bp) => (
            <Card
              key={bp.id}
              className="bg-slate-900/40 border-white/5 p-6 backdrop-blur-md hover:border-indigo-500/30 transition-all group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4">
                <span
                  className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${
                    bp.status === 'active'
                      ? 'bg-emerald-500/10 text-emerald-400'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}
                >
                  {bp.status}
                </span>
              </div>

              <div className="flex items-start gap-4 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                  <LayoutGrid className="w-6 h-6 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white truncate">
                    {bp.name}
                  </h3>
                  <p className="text-slate-500 text-xs mt-1 line-clamp-2">
                    {bp.description || 'No description provided.'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                    Plan
                  </p>
                  <p className="text-xs text-slate-300 font-bold capitalize">
                    {bp.plan}
                  </p>
                </div>
                <div className="bg-white/5 rounded-xl p-2 border border-white/5">
                  <p className="text-[9px] text-slate-500 uppercase font-bold tracking-widest mb-1">
                    Niche
                  </p>
                  <p className="text-xs text-slate-300 font-bold capitalize">
                    {bp.nicheType || 'General'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-2 text-slate-500">
                  {bp.isDefault ? (
                    <div className="flex items-center gap-1 text-indigo-400">
                      <CheckCircle2 className="w-3 h-3" />
                      <span className="text-[10px] font-bold">Default</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {new Date(bp.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    asChild
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-slate-500 hover:text-indigo-400 rounded-lg"
                  >
                    <Link href={`/dashboard/blueprints/${bp.id}`}>
                      <Edit3 className="w-4 h-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-slate-900/40 border-white/5 p-20 backdrop-blur-md flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center border border-white/5 mb-6">
            <LayoutGrid className="w-8 h-8 text-slate-500" />
          </div>
          <h2 className="text-xl font-bold text-white">No Blueprints Found</h2>
          <p className="text-slate-500 max-w-sm mt-2 font-medium">
            Create your first store template to start provisioning tenants with
            pre-configured settings.
          </p>
          <Button
            asChild
            className="mt-8 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 rounded-xl px-8 font-bold"
          >
            <Link href="/dashboard/blueprints/new">
              Create Initial Blueprint
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
}
