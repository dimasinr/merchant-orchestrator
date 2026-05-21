'use client';

import React, { useMemo, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useStore } from '@/store';
import { PageHeader } from '@/components/ui/PageHeader';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { DataTable } from '@/components/ui/DataTable';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Transaction } from '@/types';
import { ColumnDef } from '@tanstack/react-table';
import {
  RotateCw,
  CheckCircle,
  XCircle,
  ArrowRight,
  Database
} from 'lucide-react';
import Link from 'next/link';

function DeadLetterQueueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const {
    transactions,
    user,
    retryTransaction,
    forceCompleteTransaction,
    forceFailTransaction
  } = useStore();

  const isRetryingTab = searchParams.get('type') === 'retrying';

  // State for Override dialog
  const [dialogConfig, setDialogConfig] = useState<{
    isOpen: boolean;
    type: 'danger' | 'warning' | 'info';
    title: string;
    desc: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'warning',
    title: '',
    desc: '',
    onConfirm: () => {}
  });

  const handleActionClick = (
    type: 'danger' | 'warning' | 'info',
    title: string,
    desc: string,
    actionFn: () => void
  ) => {
    setDialogConfig({
      isOpen: true,
      type,
      title,
      desc,
      onConfirm: actionFn
    });
  };

  // Filter queue data
  const queueData = useMemo(() => {
    if (isRetryingTab) {
      // Currently scheduled for automated/manual adapter retrying
      return transactions.filter((t) => t.status === 'ACCEPT_SUBMITTING' && t.retryCount > 0);
    } else {
      // Unresolved adapter failures and manual review blocks
      return transactions.filter((t) =>
        ['ACCEPT_FAILED', 'MANUAL_REVIEW', 'FAILED'].includes(t.status)
      );
    }
  }, [transactions, isRetryingTab]);

  // TanStack columns
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
        cell: ({ row }) => <span className="text-zinc-600 font-semibold">{row.original.merchantName}</span>
      },
      {
        accessorKey: 'errorMessage',
        header: 'DLQ Error Reason / Exception',
        cell: ({ row }) => (
          <div className="max-w-xs truncate text-[11px] text-rose-600 font-semibold select-all" title={row.original.errorMessage || ''}>
            {row.original.errorMessage || 'No specific adapter details reported.'}
          </div>
        )
      },
      {
        accessorKey: 'retryCount',
        header: 'Retry Progress',
        cell: ({ row }) => (
          <span className="font-mono text-xs text-zinc-600 font-semibold">
            {row.original.retryCount} / {row.original.maxRetries}
          </span>
        )
      },
      {
        accessorKey: 'status',
        header: 'Queue Status',
        cell: ({ row }) => <StatusBadge status={row.original.status} />
      },
      {
        id: 'operations',
        header: 'Operator Overrides',
        cell: ({ row }) => {
          const tx = row.original;
          if (user?.role === 'VIEWER') return null;

          return (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              {/* Retry */}
              {['ACCEPT_FAILED', 'MANUAL_REVIEW'].includes(tx.status) && (
                <button
                  onClick={() =>
                    handleActionClick(
                      'info',
                      'Submit Adapter Call?',
                      `This will immediately dispatch retry credentials to the adapter handler for REF: ${tx.referenceId}.`,
                      () => retryTransaction(tx.id)
                    )
                  }
                  className="p-1 rounded bg-white border border-zinc-200 text-indigo-650 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
                  title="Retry adapter invocation"
                >
                  <RotateCw size={13} />
                </button>
              )}

              {/* Force Complete */}
              {user?.role === 'SUPER_ADMIN' && ['ACCEPT_FAILED', 'MANUAL_REVIEW'].includes(tx.status) && (
                <button
                  onClick={() =>
                    handleActionClick(
                      'warning',
                      'Force Settle Completed?',
                      `This will force settle the order in the main ledger as COMPLETED (Bypasses adapter errors for REF: ${tx.referenceId}).`,
                      () => forceCompleteTransaction(tx.id)
                    )
                  }
                  className="p-1 rounded bg-white border border-zinc-200 text-emerald-600 hover:bg-zinc-50 hover:border-zinc-300 transition-all cursor-pointer"
                  title="Force complete"
                >
                  <CheckCircle size={13} />
                </button>
              )}

              {/* Force Fail */}
              {user?.role === 'SUPER_ADMIN' && ['ACCEPT_FAILED', 'MANUAL_REVIEW'].includes(tx.status) && (
                <button
                  onClick={() =>
                    handleActionClick(
                      'danger',
                      'Force Abort Failure?',
                      `This will irrevocably drop the transaction from active retry schedule and flag as FAILED. REF: ${tx.referenceId}.`,
                      () => forceFailTransaction(tx.id)
                    )
                  }
                  className="p-1 rounded bg-white border border-zinc-200 text-rose-600 hover:bg-zinc-50 hover:border-rose-300 transition-all cursor-pointer"
                  title="Force abort"
                >
                  <XCircle size={13} />
                </button>
              )}

              <Link
                href={`/dashboard/transactions/${tx.id}`}
                className="p-1 rounded bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50 hover:text-zinc-800 transition-all ml-1.5 cursor-pointer"
                title="View full trace logs"
              >
                <ArrowRight size={13} />
              </Link>
            </div>
          );
        }
      }
    ],
    [user, retryTransaction, forceCompleteTransaction, forceFailTransaction]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dead Letter Queue Operations"
        description="Review transaction failures, manage automated retries and perform manual gateway settling bypasses."
      />

      {/* QUEUE TABS */}
      <div className="flex border-b border-zinc-200 mb-5 text-xs font-bold text-zinc-400 uppercase select-none">
        <Link
          href="/dashboard/dlq"
          className={`px-4 py-2.5 border-b-2 transition-all ${
            !isRetryingTab
              ? 'border-rose-600 text-rose-600 font-extrabold bg-rose-50/30'
              : 'border-transparent hover:text-zinc-600'
          }`}
        >
          Unresolved Anomalies (DLQ Listing)
        </Link>
        <Link
          href="/dashboard/dlq?type=retrying"
          className={`px-4 py-2.5 border-b-2 transition-all ${
            isRetryingTab
              ? 'border-indigo-650 text-indigo-650 font-extrabold bg-indigo-50/30'
              : 'border-transparent hover:text-zinc-600'
          }`}
        >
          Active Retry Queue
        </Link>
      </div>

      <DataTable
        columns={columns}
        data={queueData}
        searchKey="referenceId"
        searchPlaceholder="Filter queue by reference ID..."
        onRowClick={(tx) => router.push(`/dashboard/transactions/${tx.id}`)}
      />

      {/* SECURITY OVERRIDE WARNING */}
      {!isRetryingTab && (
        <div className="bg-white border border-zinc-200 rounded-xl p-4 flex gap-3 shadow-xs">
          <Database className="text-zinc-400 shrink-0 mt-0.5" size={16} />
          <div className="space-y-1">
            <h4 className="text-[10px] font-bold text-zinc-800 uppercase tracking-wide">Ledger Consistency Notice</h4>
            <p className="text-xs text-zinc-500 leading-relaxed font-medium">
              Overriding transaction queues shifts the internal ledger state directly. Ensure proper authorization protocols
              and corresponding merchant ticketing logs are documented in accordance with your organization's fintech compliance policies.
            </p>
          </div>
        </div>
      )}

      {/* CONFIRMATION POPUP DIALOG */}
      <ConfirmDialog
        isOpen={dialogConfig.isOpen}
        onClose={() => setDialogConfig((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={dialogConfig.onConfirm}
        title={dialogConfig.title}
        description={dialogConfig.desc}
        type={dialogConfig.type}
        confirmLabel="Execute Settle Override"
      />
    </div>
  );
}

export default function DeadLetterQueuePage() {
  return (
    <Suspense fallback={
      <div className="min-h-[400px] flex items-center justify-center text-xs font-bold text-zinc-400 uppercase tracking-widest animate-pulse">
        Synchronizing Dead-Letter Queues...
      </div>
    }>
      <DeadLetterQueueContent />
    </Suspense>
  );
}
