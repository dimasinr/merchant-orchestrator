'use client';

import { Suspense } from 'react';
import { TransactionsListView } from '@/components/transactions/TransactionsListView';

export default function MerchantTransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[400px] flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
          Loading transactions...
        </div>
      }
    >
      <TransactionsListView basePath="/merchant" />
    </Suspense>
  );
}
