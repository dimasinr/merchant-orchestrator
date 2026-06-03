'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store';
import { MerchantSidebar } from '@/components/layout/MerchantSidebar';
import { RefreshCw } from 'lucide-react';

export default function MerchantLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated, authReady, accountType } = useStore();

  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    if (accountType === 'admin') {
      router.push('/dashboard');
    }
  }, [authReady, isAuthenticated, accountType, router]);

  if (!authReady || !isAuthenticated || !user || accountType !== 'merchant') {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50 text-zinc-600 select-none">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw size={24} className="animate-spin text-emerald-600" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Loading merchant portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 font-sans overflow-hidden">
      <MerchantSidebar />
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-zinc-200 bg-white px-8 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider">Merchant Dashboard</span>
          <span className="text-xs text-zinc-500 font-medium">{user.merchantName ?? 'Your merchant account'}</span>
        </header>
        <main className="flex-1 overflow-y-auto p-8 scrollbar-thin">{children}</main>
      </div>
    </div>
  );
}
