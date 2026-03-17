'use client';

import {
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { apiFetch } from '@/lib/api';

interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
}

export default function MerchantDashboard() {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        const stats = await apiFetch<DashboardStats>('/tenants/stats');
        setData(stats);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'System synchronization failure');
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (error) {
    return (
      <div className="flex flex-col h-[80vh] items-center justify-center p-8 text-center space-y-4">
        <div className="bg-red-950/20 p-4 rounded-full border border-red-900/50">
          <AlertCircle className="h-12 w-12 text-red-500" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-slate-900">Connection Interrupted</h2>
          <p className="text-slate-500 max-w-md mx-auto">
            We encountered a protocol error while synchronizing with the Merchant Cluster. 
            Please verify your credentials or network status.
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
          className="font-bold uppercase tracking-widest border-slate-300"
        >
          Initialize Retry
        </Button>
      </div>
    );
  }

  const statConfig = [
    {
      name: 'Gross Revenue',
      value: data ? `$${data.totalRevenue.toLocaleString()}` : '$0.00',
      icon: TrendingUp,
      color: 'bg-emerald-500/10 text-emerald-600',
      label: 'Financial Output',
    },
    {
      name: 'Active Orders',
      value: data?.totalOrders.toString() || '0',
      icon: ShoppingCart,
      color: 'bg-blue-500/10 text-blue-600',
      label: 'Transaction Queue',
    },
    {
      name: 'Catalog Inventory',
      value: data?.totalProducts.toString() || '0',
      icon: Package,
      color: 'bg-indigo-500/10 text-indigo-600',
      label: 'Asset Management',
    },
    {
      name: 'Consumer Base',
      value: data?.totalCustomers.toString() || '0',
      icon: Users,
      color: 'bg-purple-500/10 text-purple-600',
      label: 'Identity Registry',
    },
  ];

  return (
    <div className="p-8 space-y-10 animate-in fade-in duration-500 font-sans">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2 py-0.5 bg-indigo-600 text-[10px] font-black text-white uppercase tracking-tighter rounded">
              Merchant Node
            </span>
            <div className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
              Standardized Operation
            </span>
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
            Command <span className="text-indigo-600">Center</span>
          </h1>
          <p className="text-slate-500 font-medium">
            Real-time synchronization with the Apex Sovereign Cluster.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Status</span>
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
              <span className="text-sm font-bold text-slate-900">Synchronized</span>
            </div>
          </div>
          <Button className="font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-xl shadow-slate-200">
            <Zap className="mr-2 h-4 w-4 fill-white" /> Deploy Update
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={`skeleton-${i}`} className="border-slate-100 shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-10 w-10 rounded-xl" />
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-8 w-32" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))
          : statConfig.map((stat) => (
              <Card
                key={stat.name}
                className="group border-none shadow-xl shadow-slate-200/40 hover:translate-y-[-4px] transition-all duration-300 bg-white ring-1 ring-slate-100"
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    {stat.label}
                  </CardTitle>
                  <div className={`p-2.5 rounded-xl ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                </CardHeader>
                <CardContent className="pt-2">
                  <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
                    {stat.value}
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    {stat.name}
                  </p>
                </CardContent>
              </Card>
            ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-200/40 bg-white ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="border-b border-slate-50 bg-slate-50/30">
            <CardTitle className="text-lg font-black text-slate-900 uppercase italic">Operational Dynamics</CardTitle>
            <CardDescription className="text-slate-500 font-medium">
              Real-time transaction and engagement monitoring.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {!loading && (!data || data.totalOrders === 0) ? (
              <div className="flex flex-col items-center justify-center py-24 px-8 text-center space-y-6">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse" />
                  <PlusCircle className="h-16 w-16 text-indigo-200 relative" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Ready for Deployment</h3>
                  <p className="text-slate-500 max-w-sm mx-auto font-medium">
                    Your Merchant Node is active but no transactions have been detected. 
                    Initialize your storefront catalog to begin operations.
                  </p>
                </div>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest px-8 shadow-lg shadow-indigo-600/20">
                  Add First Product <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="py-24 text-center text-slate-400 font-medium italic">
                {loading ? <Skeleton className="h-40 w-full" /> : "Data visualization engine initialization..."}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl shadow-slate-200/40 bg-slate-900 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Zap className="h-32 w-32 fill-white" />
          </div>
          <CardHeader>
            <CardTitle className="text-lg font-black uppercase tracking-widest italic">Node Intelligence</CardTitle>
            <CardDescription className="text-slate-400 font-medium">
              Automated insights from your cluster telemetry.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-slate-500 uppercase">Operational Efficiency</span>
              <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-[94%]" />
              </div>
              <div className="flex justify-between text-[10px] font-black">
                <span className="text-indigo-400">OPTIMIZED</span>
                <span className="text-slate-400">94%</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
              <p className="text-xs font-bold leading-relaxed">
                Strategic Recommendation: <span className="text-indigo-400">Increase product metadata density</span> to improve search indexing by approximately 18% in the Meilisearch cluster.
              </p>
            </div>

            <Button variant="outline" className="w-full border-slate-700 hover:bg-slate-800 text-white font-black uppercase tracking-widest text-[10px] h-10">
              View Analytics Terminal
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
