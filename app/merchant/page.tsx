'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { ArrowRight } from 'lucide-react';

export default function MerchantOverviewPage() {
  const { transactions, refreshTransactions, transactionsLoading, user } = useStore();

  useEffect(() => {
    refreshTransactions();
  }, [refreshTransactions]);

  const recent = transactions.slice(0, 5);
  const totalVolume = transactions.reduce((acc, t) => acc + t.amount, 0);
  const formattedVolume = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0
  }).format(totalVolume);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${user?.merchantName ?? user?.name ?? 'Merchant'}`}
        description="View your QRIS transactions and settlement status from the orchestrator."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Total Transactions</p>
          <p className="text-2xl font-extrabold text-zinc-900 mt-1">{transactions.length}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Listed Volume</p>
          <p className="text-2xl font-extrabold text-zinc-900 mt-1">{formattedVolume}</p>
        </div>
        <div className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm">
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Data Source</p>
          <p className="text-sm font-bold text-emerald-700 mt-2">Live API /transactions</p>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-zinc-800 uppercase tracking-wider">Recent Transactions</h3>
          <Link
            href="/merchant/transactions"
            className="text-[10px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>
        {transactionsLoading ? (
          <p className="p-8 text-center text-xs text-zinc-400 font-semibold uppercase tracking-widest animate-pulse">
            Loading...
          </p>
        ) : recent.length === 0 ? (
          <p className="p-8 text-center text-xs text-zinc-400">No transactions yet.</p>
        ) : (
          <ul className="divide-y divide-zinc-100">
            {recent.map((tx) => (
              <li key={tx.referenceId}>
                <Link
                  href={`/merchant/transactions/${encodeURIComponent(tx.referenceId)}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-zinc-50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-900 font-mono">{tx.referenceId}</p>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{tx.paymentMethod}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={tx.status} />
                    <span className="text-xs font-bold text-zinc-800">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(tx.amount)}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
