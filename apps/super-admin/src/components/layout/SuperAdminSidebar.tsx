'use client';

import {
  Box,
  LayoutDashboard,
  Server,
  Settings,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TokenInput } from '../auth/TokenInput';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview', href: '/dashboard' },
  { icon: Users, label: 'Tenants', href: '/dashboard/tenants' },
  { icon: Box, label: 'Blueprints', href: '/dashboard/blueprints' },
  { icon: Server, label: 'Infrastructure', href: '/dashboard/infra' },
  { icon: ShieldCheck, label: 'Security', href: '/dashboard/security' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <div className="flex flex-col w-72 bg-slate-950 text-white min-h-screen border-r border-white/5">
      <div className="p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">
              APEX <span className="text-indigo-400">CORE</span>
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">
              System Governance
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        <div className="px-4 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">
          Management
        </div>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/dashboard' && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'bg-white/10 text-white shadow-xl backdrop-blur-md border border-white/10'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500'}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-6 space-y-4">
        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <ShieldCheck className="w-4 h-4 text-indigo-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Sovereign Keys
            </span>
          </div>
          <TokenInput />
        </div>

        <div className="bg-slate-900/50 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              S1-S15 Protocols Active
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center ring-2 ring-indigo-500/20">
              <span className="text-xs font-bold text-indigo-400">SA</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-xs font-bold truncate">System Architect</p>
              <p className="text-[10px] text-slate-500 truncate">
                admin@60sec.shop
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
