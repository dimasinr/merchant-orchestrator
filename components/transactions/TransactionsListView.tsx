'use client';

import React, { useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import type { Transaction } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

type TransactionsListViewProps = {
  basePath: '/dashboard' | '/merchant';
};

const STATUS_FILTER_MAP: Record<string, string | undefined> = {
  PENDING: undefined,
  COMPLETED: 'completed',
  FAILED: 'failed',
  MANUAL_REVIEW: undefined
};

export function TransactionsListView({ basePath }: TransactionsListViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transactions, refreshTransactions, transactionsLoading, transactionsError } = useStore();

  const statusFilter = searchParams.get('status');

  useEffect(() => {
    const apiStatus = statusFilter ? STATUS_FILTER_MAP[statusFilter.toUpperCase()] : undefined;
    refreshTransactions(apiStatus ? { status: apiStatus } : undefined);
  }, [statusFilter, refreshTransactions]);

  const filteredData = useMemo(() => {
    if (!statusFilter) return transactions;

    switch (statusFilter.toUpperCase()) {
      case 'PENDING':
        return transactions.filter((t) =>
          ['RECEIVED', 'AWAITING_PAYMENT', 'PAYMENT_CONFIRMED', 'ACCEPT_SUBMITTING'].includes(t.status)
        );
      case 'COMPLETED':
        return transactions.filter((t) => t.status === 'COMPLETED');
      case 'FAILED':
        return transactions.filter((t) =>
          ['FAILED', 'ACCEPT_FAILED', 'QRIS_EXPIRED'].includes(t.status)
        );
      case 'MANUAL_REVIEW':
        return transactions.filter((t) => t.status === 'MANUAL_REVIEW');
      default:
        return transactions;
    }
  }, [transactions, statusFilter]);

  const header = !statusFilter
    ? {
        title: 'All Transactions',
        desc: 'Payments processed through the orchestrator (scoped to your account).'
      }
    : {
        title: `${statusFilter.replace('_', ' ')} Transactions`,
        desc: `Filtered by ${statusFilter.toLowerCase()}.`
      };

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'referenceId',
        header: 'Reference ID',
        cell: ({ row }) => (
          <span className="font-bold text-zinc-900 font-mono text-xs select-all">{row.original.referenceId}</span>
        )
      },
      ...(basePath === '/dashboard'
        ? [
            {
              accessorKey: 'merchantName',
              header: 'Merchant Client',
              cell: ({ row }: { row: { original: Transaction } }) => (
                <span className="text-zinc-600 font-semibold">{row.original.merchantName}</span>
              )
            } as ColumnDef<Transaction>
          ]
        : []),
      {
        accessorKey: 'paymentMethod',
        header: 'Method',
        cell: ({ row }) => (
          <span className="font-mono text-[9px] font-extrabold text-zinc-500 bg-zinc-100 border border-zinc-200 px-2 py-0.5 rounded uppercase tracking-wide">
            {row.original.paymentMethod}
          </span>
        )
      },
      {
        accessorKey: 'amount',
        header: 'Amount',
        cell: ({ row }) => (
          <span className="font-extrabold text-zinc-900 font-mono text-right block">
            {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
              row.original.amount
            )}
          </span>
        )
      },
      {
        accessorKey: 'createdAt',
        header: 'Timestamp',
        cell: ({ row }) => {
          const date = new Date(row.original.createdAt);
          return (
            <span className="text-zinc-400 font-mono text-[11px]">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        }
      },
      {
        accessorKey: 'status',
        header: 'Settlement Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Link
            href={`${basePath}/transactions/${encodeURIComponent(row.original.referenceId)}`}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-500 transition-all uppercase tracking-wider hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            <span>Details</span>
            <ArrowRight size={12} />
          </Link>
        )
      }
    ],
    [basePath]
  );

  return (
    <div className="space-y-6">
      <PageHeader title={header.title} description={header.desc} />
      {transactionsError && (
        <div className="bg-rose-50 border border-rose-100 text-rose-700 p-3 rounded-lg text-xs font-semibold">
          {transactionsError}
        </div>
      )}
      {transactionsLoading ? (
        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse py-12 text-center">
          Loading transactions...
        </p>
      ) : (
        <DataTable
          columns={columns}
          data={filteredData}
          searchKey="referenceId"
          searchPlaceholder="Filter by Reference ID..."
          onRowClick={(tx) => router.push(`${basePath}/transactions/${encodeURIComponent(tx.referenceId)}`)}
        />
      )}
    </div>
  );
}
