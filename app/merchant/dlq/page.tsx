'use client';

import React, { useEffect, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import type { Transaction } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function MerchantDlqContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transactions, refreshDlq, transactionsLoading, transactionsError } = useStore();

  const isRetryingTab = searchParams.get('type') === 'retrying';

  useEffect(() => {
    refreshDlq(isRetryingTab ? 'retry' : 'dlq');
  }, [isRetryingTab, refreshDlq]);

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'referenceId',
        header: 'Reference ID',
        cell: ({ row }) => (
          <span className="font-bold text-zinc-900 font-mono text-xs">{row.original.referenceId}</span>
        )
      },
      {
        accessorKey: 'errorMessage',
        header: 'Error Reason',
        cell: ({ row }) => (
          <span className="text-xs text-rose-700 font-medium line-clamp-2">{row.original.errorMessage ?? '—'}</span>
        )
      },
      {
        accessorKey: 'retryProgress',
        header: 'Retry Progress',
        cell: ({ row }) => (
          <span className="text-xs text-zinc-600">{row.original.retryProgress ?? '—'}</span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Queue Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Link
            href={`/merchant/transactions/${encodeURIComponent(row.original.referenceId)}`}
            className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 uppercase"
          >
            View <ArrowRight size={12} />
          </Link>
        )
      }
    ],
    []
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title={isRetryingTab ? 'Retry Queue' : 'Failed / DLQ'}
        description="Unresolved anomalies for your merchant account (read-only)."
      />
      <div className="flex gap-2">
        <Link
          href="/merchant/dlq"
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
            !isRetryingTab ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          DLQ
        </Link>
        <Link
          href="/merchant/dlq?type=retrying"
          className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${
            isRetryingTab ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          Retrying
        </Link>
      </div>
      {transactionsError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
          {transactionsError}
        </div>
      )}
      {transactionsLoading ? (
        <p className="text-xs text-zinc-400 text-center py-12 animate-pulse uppercase font-bold">Loading queue...</p>
      ) : (
        <DataTable
          columns={columns}
          data={transactions}
          searchKey="referenceId"
          searchPlaceholder="Search reference..."
          onRowClick={(tx) => router.push(`/merchant/transactions/${encodeURIComponent(tx.referenceId)}`)}
        />
      )}
    </div>
  );
}

export default function MerchantDlqPage() {
  return (
    <Suspense fallback={<div className="py-12 text-center text-xs text-zinc-400">Loading...</div>}>
      <MerchantDlqContent />
    </Suspense>
  );
}
