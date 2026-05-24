'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/store';
import { LayoutDashboard, Receipt, List, XCircle, LogOut, Store } from 'lucide-react';

export function MerchantSidebar() {
  const pathname = usePathname();
  const { user, logout } = useStore();

  if (!user) return null;

  return (
    <aside className="w-64 bg-white border-r border-zinc-200/80 flex flex-col h-screen sticky top-0 text-zinc-600 select-none overflow-y-auto">
      <div className="h-16 flex items-center px-6 border-b border-zinc-150 gap-3 bg-emerald-50/40">
        <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-600/10">
          <Store size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-zinc-900 leading-none">Merchant Portal</span>
          <span className="text-[9px] text-zinc-400 font-bold tracking-wider uppercase mt-0.5">QRIS PAY</span>
        </div>
      </div>

      <div className="p-4 border-b border-zinc-150 bg-zinc-50/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-200 flex items-center justify-center font-bold text-emerald-800 shadow-2xs">
            {user.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-zinc-800 truncate leading-snug">{user.name}</p>
            <p className="text-[10px] text-zinc-400 font-medium truncate leading-none mt-0.5">{user.email}</p>
            {user.merchantName && (
              <span className="inline-block px-1.5 py-0.5 text-[8px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-sm mt-1.5 uppercase tracking-wide truncate max-w-full">
                {user.merchantName}
              </span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 py-5 px-3 space-y-1">
        <Link
          href="/merchant"
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
            pathname === '/merchant'
              ? 'bg-emerald-50/60 text-emerald-700 border-l-2 border-emerald-600 pl-2.5'
              : 'hover:bg-zinc-50 hover:text-zinc-900 text-zinc-500 font-semibold'
          }`}
        >
          <LayoutDashboard size={15} />
          <span>Overview</span>
        </Link>

        <div className="pt-4 pb-1 px-3 text-[9px] font-extrabold text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
          <Receipt size={11} />
          <span>Transactions</span>
        </div>

        <Link
          href="/merchant/transactions"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname.startsWith('/merchant/transactions') && !pathname.includes('/dlq')
              ? 'bg-emerald-50/40 text-emerald-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <List size={14} />
          <span>All Transactions</span>
        </Link>

        <Link
          href="/merchant/dlq"
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
            pathname === '/merchant/dlq'
              ? 'bg-emerald-50/40 text-emerald-700 font-bold'
              : 'text-zinc-500 hover:bg-zinc-50/60 hover:text-zinc-900'
          }`}
        >
          <XCircle size={14} />
          <span>Failed / DLQ</span>
        </Link>
      </nav>

      <div className="p-4 border-t border-zinc-150 bg-zinc-50/40">
        <button
          onClick={() => {
            logout();
            window.location.href = '/';
          }}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-white hover:bg-rose-50 hover:text-rose-600 text-zinc-500 border border-zinc-200 hover:border-rose-100 transition-all text-xs font-bold cursor-pointer"
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
