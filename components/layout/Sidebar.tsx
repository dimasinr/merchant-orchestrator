'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '../../store';
import {
  LayoutDashboard,
  Receipt,
  List,
  XCircle,
  Network,
  Settings,
  Activity,
  LogOut,
  QrCode,
  Terminal
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const { user, logout, transactions } = useStore();

  if (!user) return null;

  // Compute live badge counts for the simplified dashboard menus
  const failedQueueCount = transactions.filter(
    (t) => ['ACCEPT_FAILED', 'MANUAL_REVIEW', 'FAILED'].includes(t.status)
  ).length;

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen sticky top-0 text-zinc-600 select-none overflow-y-auto">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-zinc-150 gap-3 bg-zinc-50/40">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white shadow-md shadow-indigo-600/10">
          <QrCode size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-zinc-900 leading-none">QRIS PAY</span>
          <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase mt-0.5">ORCHESTRATOR</span>
        </div>
      </div>

      {/* User Session Info */}
      <div className="p-4 border-b border-zinc-150 bg-zinc-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-700 shadow-2xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-800 truncate leading-snug">{user.name}</p>
            <p className="text-[10px] text-zinc-400 font-medium truncate leading-none mt-0.5">{user.email}</p>
            <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-sm mt-1.5 uppercase tracking-wide">
              {user.role.replace('_', ' ')}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-5 px-3 space-y-1">
        {/* Dashboard Overview */}
        <Link
          href="/dashboard"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            pathname === '/dashboard'
              ? 'bg-indigo-50/60 text-indigo-700 border-l-2 border-indigo-600 pl-2.5 font-bold shadow-3xs'
              : 'hover:bg-zinc-50 hover:text-zinc-900 text-zinc-500 font-semibold'
          }`}
        >
          <LayoutDashboard size={15} className={pathname === '/dashboard' ? 'text-indigo-600' : 'opacity-70'} />
          <span>Dashboard</span>
        </Link>

        {/* Playground / Simulator */}
        <Link
          href="/dashboard/simulator"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            pathname === '/dashboard/simulator'
              ? 'bg-indigo-50/60 text-indigo-700 border-l-2 border-indigo-600 pl-2.5 font-bold shadow-3xs'
              : 'hover:bg-zinc-50 hover:text-zinc-900 text-zinc-500 font-semibold'
          }`}
        >
          <Terminal size={15} className={pathname === '/dashboard/simulator' ? 'text-indigo-600' : 'opacity-70'} />
          <span>SDK Playground</span>
        </Link>

        {/* Transactions Group title */}
        <div className="pt-4 pb-1 px-3 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Receipt size={11} className="opacity-70" />
          <span>Transactions</span>
        </div>

        {/* All Transactions */}
        <Link
          href="/dashboard/transactions"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard/transactions'
              ? 'bg-indigo-50/40 text-indigo-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <List size={14} className={pathname === '/dashboard/transactions' ? 'text-indigo-600' : 'opacity-75'} />
            <span>All Transactions</span>
          </div>
        </Link>

        {/* Failed / DLQ */}
        <Link
          href="/dashboard/dlq"
          className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard/dlq'
              ? 'bg-indigo-50/40 text-indigo-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} className={pathname === '/dashboard/dlq' ? 'text-rose-600' : 'opacity-75'} />
            <span>Failed / DLQ</span>
          </div>
          {failedQueueCount > 0 && (
            <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-rose-50 text-rose-600 border border-rose-100">
              {failedQueueCount}
            </span>
          )}
        </Link>

        {/* Merchants */}
        <div className="pt-4 pb-1 px-3 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Network size={11} className="opacity-70" />
          <span>Merchants</span>
        </div>

        <Link
          href="/dashboard/merchants"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard/merchants'
              ? 'bg-indigo-50/40 text-indigo-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <List size={14} className={pathname === '/dashboard/merchants' ? 'text-indigo-600' : 'opacity-75'} />
          <span>Merchant Registry</span>
        </Link>

        {/* Monitoring & Settings */}
        <div className="pt-4 pb-1 px-3 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Settings size={11} className="opacity-70" />
          <span>Management</span>
        </div>

        {/* Monitoring */}
        <Link
          href="/dashboard/monitoring"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard/monitoring'
              ? 'bg-indigo-50/40 text-indigo-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <Activity size={14} className={pathname === '/dashboard/monitoring' ? 'text-indigo-600' : 'opacity-75'} />
          <span>Monitoring</span>
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/dashboard/settings'
              ? 'bg-indigo-50/40 text-indigo-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <Settings size={14} className={pathname === '/dashboard/settings' ? 'text-indigo-600' : 'opacity-75'} />
          <span>Settings</span>
        </Link>
      </nav>

      {/* Logout Footer */}
      <div className="p-4 border-t border-zinc-150 bg-zinc-50/40">
        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-zinc-500 border border-zinc-200 hover:border-rose-100 transition-all text-xs font-bold cursor-pointer shadow-3xs"
        >
          <LogOut size={14} />
          <span>Disconnect Session</span>
        </button>
      </div>
    </aside>
  );
}
