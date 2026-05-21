'use client';

import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { DataTable } from '@/components/ui/DataTable';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { Transaction } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

function TransactionsListContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { transactions } = useStore();

  const statusFilter = searchParams.get('status');

  // Filter transactions based on active status filter
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

  // Dynamic Page Header Details
  const getHeaderDetails = () => {
    if (!statusFilter) {
      return {
        title: 'All Transactions Registry',
        desc: 'Audit log of all payments processed through the Orchestrator gateways.'
      };
    }
    return {
      title: `${statusFilter.replace('_', ' ')} Transactions`,
      desc: `Filtered log of currently ${statusFilter.toLowerCase()} transactions awaiting clearing or terminated.`
    };
  };

  const header = getHeaderDetails();

  // Column definitions for TanStack Table
  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'referenceId',
        header: 'Reference ID',
        cell: ({ row }) => (
          <span className="font-bold text-zinc-900 font-mono text-xs select-all">
            {row.original.referenceId}
          </span>
        )
      },
      {
        accessorKey: 'merchantName',
        header: 'Merchant Client',
        cell: ({ row }) => (
          <span className="text-zinc-600 font-semibold">{row.original.merchantName}</span>
        )
      },
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
        cell: ({ row }) => {
          const formatted = new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0
          }).format(row.original.amount);
          return <span className="font-extrabold text-zinc-900 font-mono text-right block">{formatted}</span>;
        }
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
            href={`/dashboard/transactions/${row.original.id}`}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-650 hover:text-indigo-500 transition-all uppercase tracking-wider hover:underline cursor-pointer"
            onClick={(e) => e.stopPropagation()} // avoid double trigger with row onClick
          >
            <span>Details</span>
            <ArrowRight size={12} />
          </Link>
        )
      }
    ],
    []
  );

  const handleRowClick = (tx: Transaction) => {
    router.push(`/dashboard/transactions/${tx.id}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader title={header.title} description={header.desc} />

      <DataTable
        columns={columns}
        data={filteredData}
        searchKey="referenceId"
        searchPlaceholder="Filter by Reference ID..."
        onRowClick={handleRowClick}
      />
    </div>
  );
}

export default function TransactionsListPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
        Synchronizing Transactions Log...
      </div>
    }>
      <TransactionsListContent />
    </Suspense>
  );
}
