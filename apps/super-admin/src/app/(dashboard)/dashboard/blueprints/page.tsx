'use client';

import {
  Box,
  Camera,
  Cpu,
  Globe,
  Layout,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { apiFetch } from '@/lib/api';

interface Blueprint {
  id: string;
  name: string;
  description: string;
  nicheType: string;
  version: string;
  createdAt: string;
}

export default function BlueprintsPage() {
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBlueprints = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch<Blueprint[]>('/blueprints');
      setBlueprints(Array.isArray(data) ? data : []);
    } catch (_e) {
      /* fetch error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBlueprints();
  }, [fetchBlueprints]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlueprints();
    setRefreshing(false);
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        'Are you absolutely sure you want to delete this blueprint? This is IRREVERSIBLE.'
      )
    )
      return;
    try {
      await apiFetch(`/blueprints/${id}`, { method: 'DELETE' });
      fetchBlueprints();
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-black text-white">Blueprint Registry</h1>
          <p className="text-slate-500 mt-2">
            Manage the definitive store templates and niche deployments.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="border-white/5 bg-slate-900/50 rounded-xl px-4"
            disabled={refreshing}
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`}
            />
          </Button>
          <Button
            onClick={() => (window.location.href = '/dashboard/blueprints/new')}
            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 px-6 font-bold"
          >
            <Plus className="w-4 h-4 mr-2" />
            Registry Manual Entry
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-48 rounded-2xl bg-white/5 animate-pulse"
            />
          ))
        ) : blueprints.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center gap-4 bg-slate-900/40 rounded-3xl border border-white/5 border-dashed">
            <Box className="w-12 h-12 text-slate-800" />
            <p className="text-slate-500 font-medium tracking-tight text-lg">
              No blueprints authenticated in registry.
            </p>
          </div>
        ) : (
          blueprints.map((bp) => (
            <Card
              key={bp.id}
              className="group bg-slate-900/40 border-white/5 overflow-hidden backdrop-blur-md hover:border-indigo-500/30 transition-all hover:translate-y-[-4px]"
            >
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/10 text-indigo-400">
                    <Layout className="w-6 h-6" />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 rounded-lg"
                      onClick={() => handleDelete(bp.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    {bp.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2 mt-1 min-h-[40px]">
                    {bp.description || 'No system description provided.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Niche
                    </span>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-indigo-400" />
                      <span className="text-xs font-semibold text-slate-300 capitalize">
                        {bp.nicheType}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                      Core Version
                    </span>
                    <div className="flex items-center gap-2">
                      <Cpu className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-semibold text-slate-300">
                        v{bp.version || '1.0'}
                      </span>
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-slate-800 hover:bg-indigo-600 text-white rounded-xl h-10 transition-colors">
                  <Camera className="w-4 h-4 mr-2" />
                  Apply Physical Snapshot
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
